CREATE TABLE public.friendship_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id uuid NOT NULL REFERENCES public.friendships(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('request','accepted','invite')),
  sent_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (friendship_id, kind)
);
GRANT ALL ON public.friendship_notifications TO service_role;
ALTER TABLE public.friendship_notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.safe_tz(p_tz text) RETURNS text
LANGUAGE plpgsql STABLE SET search_path TO 'public' AS $$
BEGIN
  IF p_tz IS NULL OR p_tz = '' THEN RETURN 'UTC'; END IF;
  PERFORM now() AT TIME ZONE p_tz;
  RETURN p_tz;
EXCEPTION WHEN others THEN RETURN 'UTC';
END $$;

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
         EXISTS (SELECT 1 FROM public.daily_completions dc WHERE dc.user_id = f.fid AND dc.lesson_completed
                  AND dc.completion_date = (now() AT TIME ZONE public.safe_tz(p.timezone))::date),
         EXISTS (SELECT 1 FROM public.friend_nudges n WHERE n.sender_id = auth.uid() AND n.receiver_id = f.fid
                  AND n.created_on = (now() AT TIME ZONE public.safe_tz(p.timezone))::date)
  FROM f
  JOIN public.profiles p ON p.id = f.fid
  LEFT JOIN LATERAL (SELECT MAX(up.last_activity_at) AS last_at FROM public.user_progress up WHERE up.user_id = f.fid) la ON true
  WHERE auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.get_friends_overview() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_friends_overview() TO authenticated;