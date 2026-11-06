CREATE OR REPLACE FUNCTION public.generate_friend_code()
RETURNS text LANGUAGE plpgsql VOLATILE SET search_path TO 'public' AS $$
DECLARE
  v_alpha constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  i int;
BEGIN
  LOOP
    v_code := '';
    FOR i IN 1..6 LOOP
      v_code := v_code || substr(v_alpha, 1 + floor(random() * 32)::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE friend_code = v_code);
  END LOOP;
  RETURN v_code;
END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS friend_code text;
UPDATE public.profiles SET friend_code = public.generate_friend_code() WHERE friend_code IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_friend_code_key ON public.profiles (friend_code);

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_display_name text;
BEGIN
  v_display_name := nullif(btrim(COALESCE(NEW.raw_user_meta_data ->> 'display_name', '')), '');
  INSERT INTO public.profiles (id, username, display_name, friend_code)
  VALUES (NEW.id, NEW.email, CASE WHEN char_length(v_display_name) BETWEEN 1 AND 40 THEN v_display_name ELSE NULL END, public.generate_friend_code())
  ON CONFLICT (id) DO UPDATE
  SET username = COALESCE(public.profiles.username, EXCLUDED.username),
      display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
      friend_code = COALESCE(public.profiles.friend_code, EXCLUDED.friend_code),
      updated_at = now();
  RETURN NEW;
END;
$function$;

DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
  SELECT id, display_name, friend_code, avatar_url FROM public.profiles;
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO service_role;
REVOKE ALL ON public.public_profiles FROM anon;

DROP FUNCTION IF EXISTS public.search_public_profiles(text);
CREATE FUNCTION public.search_public_profiles(p_query text)
 RETURNS TABLE(id uuid, display_name text, friend_code text, avatar_url text, selected_market text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH q AS (SELECT trim(COALESCE(p_query, '')) AS t)
  SELECT p.id, p.display_name, p.friend_code, p.avatar_url, p.selected_market
  FROM public.profiles p, q
  WHERE auth.uid() IS NOT NULL
    AND p.id <> auth.uid()
    AND length(q.t) >= 2
    AND (
      (p.display_name IS NOT NULL AND position('@' in q.t) = 0 AND p.display_name ILIKE '%' || replace(replace(q.t, '%', ''), '_', '') || '%')
      OR upper(p.friend_code) = upper(q.t)
      OR (position('@' in q.t) > 0 AND lower(p.username) = lower(q.t))
    )
  ORDER BY CASE WHEN upper(p.friend_code) = upper(q.t) THEN 0
                WHEN lower(COALESCE(p.display_name, '')) = lower(q.t) THEN 1 ELSE 2 END,
           COALESCE(p.display_name, '')
  LIMIT 20;
$$;
REVOKE ALL ON FUNCTION public.search_public_profiles(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.search_public_profiles(text) TO authenticated;

DROP FUNCTION IF EXISTS public.get_monthly_standings(text, date);
CREATE FUNCTION public.get_monthly_standings(p_market_id text, p_season_start date)
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, monthly_xp integer, current_level integer, current_streak integer, last_activity_at timestamp with time zone, tier text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    ux.user_id, p.display_name, p.avatar_url,
    COALESCE(period.monthly_xp, 0)::integer,
    COALESCE(ux.current_level, 1)::integer,
    COALESCE(up.current_streak, 0)::integer,
    up.last_activity_at,
    COALESCE(lm.tier, 'bronze')::text
  FROM public.user_xp ux
  JOIN public.profiles p ON p.id = ux.user_id
  LEFT JOIN public.user_progress up ON up.user_id = ux.user_id AND up.market_id = ux.market_id
  LEFT JOIN public.league_memberships lm ON lm.user_id = ux.user_id AND lm.market_id = ux.market_id
   AND lm.week_of = date_trunc('month', p_season_start)::date
  LEFT JOIN LATERAL (
    SELECT SUM(xt.xp_amount)::integer AS monthly_xp
    FROM public.xp_transactions xt
    WHERE xt.user_id = ux.user_id AND xt.market_id = ux.market_id
      AND xt.created_at >= date_trunc('month', p_season_start)::date::timestamptz
      AND xt.created_at < (date_trunc('month', p_season_start)::date + interval '1 month')::timestamptz
  ) period ON true
  WHERE auth.uid() IS NOT NULL AND ux.market_id = p_market_id
  ORDER BY COALESCE(period.monthly_xp, 0) DESC, ux.user_id;
$function$;
REVOKE ALL ON FUNCTION public.get_monthly_standings(text, date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_monthly_standings(text, date) TO authenticated;

-- friendships: recipient-only accept, no self or duplicate pairs
DROP POLICY IF EXISTS "Users can update friendships they're part of" ON public.friendships;
CREATE POLICY "Recipient can accept friend requests" ON public.friendships
  FOR UPDATE TO authenticated
  USING (auth.uid() = friend_id AND status = 'pending')
  WITH CHECK (auth.uid() = friend_id AND status = 'accepted');
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
CREATE POLICY "Users can send friend requests" ON public.friendships
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND user_id <> friend_id AND status = 'pending');
ALTER TABLE public.friendships ADD CONSTRAINT friendships_no_self CHECK (user_id <> friend_id);
CREATE UNIQUE INDEX IF NOT EXISTS friendships_pair_key ON public.friendships (least(user_id, friend_id), greatest(user_id, friend_id));

CREATE TABLE public.friend_nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  created_on date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  UNIQUE (sender_id, receiver_id, created_on),
  CHECK (sender_id <> receiver_id)
);
GRANT SELECT, UPDATE ON public.friend_nudges TO authenticated;
GRANT ALL ON public.friend_nudges TO service_role;
ALTER TABLE public.friend_nudges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Receiver or sender can view nudges" ON public.friend_nudges
  FOR SELECT TO authenticated USING (auth.uid() = receiver_id OR auth.uid() = sender_id);
CREATE POLICY "Receiver can mark nudges read" ON public.friend_nudges
  FOR UPDATE TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);
REVOKE UPDATE ON public.friend_nudges FROM authenticated;
GRANT UPDATE (read_at) ON public.friend_nudges TO authenticated;

CREATE OR REPLACE FUNCTION public.get_friends_overview()
 RETURNS TABLE(friend_id uuid, friendship_id uuid, display_name text, friend_code text, avatar_url text, selected_market text, current_streak integer, month_xp integer, current_level integer, last_activity_at timestamptz, lesson_done_today boolean, nudged_today boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH f AS (
    SELECT fs.id AS friendship_id,
           CASE WHEN fs.user_id = auth.uid() THEN fs.friend_id ELSE fs.user_id END AS fid
    FROM public.friendships fs
    WHERE fs.status = 'accepted' AND auth.uid() IN (fs.user_id, fs.friend_id)
  )
  SELECT f.fid, f.friendship_id, p.display_name, p.friend_code, p.avatar_url, p.selected_market,
         COALESCE((SELECT MAX(up.current_streak) FROM public.user_progress up WHERE up.user_id = f.fid), 0)::integer,
         COALESCE((SELECT SUM(xt.xp_amount) FROM public.xp_transactions xt WHERE xt.user_id = f.fid
                    AND xt.created_at >= date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'), 0)::integer,
         COALESCE((SELECT MAX(ux.current_level) FROM public.user_xp ux WHERE ux.user_id = f.fid), 1)::integer,
         la.last_at,
         COALESCE((la.last_at AT TIME ZONE 'UTC')::date = (now() AT TIME ZONE 'UTC')::date, false),
         EXISTS (SELECT 1 FROM public.friend_nudges n WHERE n.sender_id = auth.uid() AND n.receiver_id = f.fid
                  AND n.created_on = (now() AT TIME ZONE 'UTC')::date)
  FROM f
  JOIN public.profiles p ON p.id = f.fid
  LEFT JOIN LATERAL (SELECT MAX(up.last_activity_at) AS last_at FROM public.user_progress up WHERE up.user_id = f.fid) la ON true
  WHERE auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.get_friends_overview() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_friends_overview() TO authenticated;