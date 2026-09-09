-- ============================================================
-- Weekly leagues, co-op friend quests, and smart-timing patterns
-- ============================================================

-- ---------- 1. LEAGUES ----------
CREATE TABLE public.league_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id text NOT NULL REFERENCES public.markets(id),
  week_of date NOT NULL,
  tier text NOT NULL DEFAULT 'bronze',
  weekly_xp integer NOT NULL DEFAULT 0,
  final_rank integer,
  result text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, market_id, week_of)
);

CREATE INDEX idx_league_memberships_group ON public.league_memberships (market_id, week_of, tier, weekly_xp DESC);
CREATE INDEX idx_league_memberships_user ON public.league_memberships (user_id, week_of DESC);

GRANT SELECT ON public.league_memberships TO authenticated;
GRANT ALL ON public.league_memberships TO service_role;

ALTER TABLE public.league_memberships ENABLE ROW LEVEL SECURITY;

-- Competitive standings are intentionally readable by signed-in users
-- (only user_id + xp + tier; names come from public_profiles).
CREATE POLICY "Signed-in users can read league standings"
ON public.league_memberships FOR SELECT TO authenticated USING (true);

-- ---------- 2. FRIEND QUESTS ----------
CREATE TABLE public.friend_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id text NOT NULL REFERENCES public.markets(id),
  week_of date NOT NULL,
  initiator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_key text NOT NULL,
  title text NOT NULL,
  target integer NOT NULL,
  initiator_progress integer NOT NULL DEFAULT 0,
  partner_progress integer NOT NULL DEFAULT 0,
  xp_reward integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE UNIQUE INDEX idx_friend_quests_pair_week
  ON public.friend_quests (least(initiator_id, partner_id), greatest(initiator_id, partner_id), week_of)
  WHERE status IN ('pending', 'active');

CREATE INDEX idx_friend_quests_participants ON public.friend_quests (initiator_id, partner_id, week_of DESC);

GRANT SELECT, INSERT, UPDATE ON public.friend_quests TO authenticated;
GRANT ALL ON public.friend_quests TO service_role;

ALTER TABLE public.friend_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read their quests"
ON public.friend_quests FOR SELECT TO authenticated
USING (auth.uid() = initiator_id OR auth.uid() = partner_id);

CREATE POLICY "Users can create quests they initiate"
ON public.friend_quests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = initiator_id AND initiator_id <> partner_id);

CREATE POLICY "Partner can accept or decline"
ON public.friend_quests FOR UPDATE TO authenticated
USING (auth.uid() = partner_id OR auth.uid() = initiator_id)
WITH CHECK (auth.uid() = partner_id OR auth.uid() = initiator_id);

-- ---------- 3. ACTIVITY PATTERNS (smart push timing) ----------
CREATE TABLE public.user_activity_patterns (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hour_counts integer[] NOT NULL DEFAULT array_fill(0, ARRAY[24]),
  utc_offset_minutes integer NOT NULL DEFAULT 0,
  preferred_hour integer,
  sample_count integer NOT NULL DEFAULT 0,
  last_open_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_activity_patterns TO authenticated;
GRANT ALL ON public.user_activity_patterns TO service_role;

ALTER TABLE public.user_activity_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own activity pattern"
ON public.user_activity_patterns FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- ---------- 4. FUNCTIONS ----------

-- Monday-based week start
CREATE OR REPLACE FUNCTION public.current_week_start()
RETURNS date LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT (date_trunc('week', now() AT TIME ZONE 'UTC'))::date
$$;

-- Sync the caller's league row for the current week from xp_transactions
CREATE OR REPLACE FUNCTION public.sync_my_league(p_market_id text)
RETURNS public.league_memberships
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_week date := public.current_week_start();
  v_xp integer;
  v_tier text;
  v_row public.league_memberships;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT COALESCE(SUM(xp_amount), 0) INTO v_xp
  FROM xp_transactions
  WHERE user_id = v_user AND market_id = p_market_id
    AND created_at >= v_week::timestamptz;

  SELECT tier INTO v_tier FROM league_memberships
   WHERE user_id = v_user AND market_id = p_market_id AND week_of = v_week;

  IF v_tier IS NULL THEN
    SELECT CASE
             WHEN result = 'promoted' THEN public.next_league_tier(tier, 1)
             WHEN result = 'demoted' THEN public.next_league_tier(tier, -1)
             ELSE tier
           END
      INTO v_tier
    FROM league_memberships
    WHERE user_id = v_user AND market_id = p_market_id AND week_of < v_week
    ORDER BY week_of DESC LIMIT 1;
  END IF;

  INSERT INTO league_memberships (user_id, market_id, week_of, tier, weekly_xp)
  VALUES (v_user, p_market_id, v_week, COALESCE(v_tier, 'bronze'), v_xp)
  ON CONFLICT (user_id, market_id, week_of)
  DO UPDATE SET weekly_xp = EXCLUDED.weekly_xp, updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.next_league_tier(p_tier text, p_direction integer)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT COALESCE(
    (ARRAY['bronze','silver','gold','platinum','diamond'])[
      GREATEST(1, LEAST(5,
        COALESCE(array_position(ARRAY['bronze','silver','gold','platinum','diamond'], p_tier), 1) + p_direction
      ))
    ], 'bronze')
$$;

-- Weekly promotion / relegation pass over the finished week
CREATE OR REPLACE FUNCTION public.run_league_rollover()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_week date := public.current_week_start() - 7;
  v_count integer := 0;
BEGIN
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY market_id, tier ORDER BY weekly_xp DESC, updated_at ASC) AS rnk,
           COUNT(*) OVER (PARTITION BY market_id, tier) AS group_size,
           tier, weekly_xp
    FROM league_memberships
    WHERE week_of = v_week
  )
  UPDATE league_memberships lm
     SET final_rank = r.rnk,
         result = CASE
           WHEN r.weekly_xp <= 0 THEN 'demoted'
           WHEN r.rnk <= GREATEST(1, CEIL(r.group_size * 0.3)) AND r.tier <> 'diamond' THEN 'promoted'
           WHEN r.group_size >= 5 AND r.rnk > r.group_size - FLOOR(r.group_size * 0.2) THEN 'demoted'
           ELSE 'held'
         END,
         updated_at = now()
    FROM ranked r
   WHERE lm.id = r.id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Deterministic co-op quest progress + payout
CREATE OR REPLACE FUNCTION public.sync_friend_quests(p_market_id text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_week date := public.current_week_start();
  v_q RECORD;
  v_ip integer;
  v_pp integer;
  v_updated integer := 0;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- expire stale quests
  UPDATE friend_quests SET status = 'expired', updated_at = now()
   WHERE week_of < v_week AND status IN ('pending', 'active')
     AND (initiator_id = v_user OR partner_id = v_user);

  FOR v_q IN
    SELECT * FROM friend_quests
     WHERE status = 'active' AND week_of = v_week AND market_id = p_market_id
       AND (initiator_id = v_user OR partner_id = v_user)
  LOOP
    v_ip := public.friend_quest_progress(v_q.initiator_id, p_market_id, v_q.quest_key, v_week);
    v_pp := public.friend_quest_progress(v_q.partner_id, p_market_id, v_q.quest_key, v_week);

    IF (v_ip + v_pp) >= v_q.target THEN
      UPDATE friend_quests
         SET initiator_progress = v_ip, partner_progress = v_pp,
             status = 'completed', completed_at = now(), updated_at = now()
       WHERE id = v_q.id AND status = 'active';

      IF FOUND THEN
        PERFORM public.increment_user_xp(v_q.initiator_id, p_market_id, v_q.xp_reward);
        PERFORM public.increment_user_xp(v_q.partner_id, p_market_id, v_q.xp_reward);
        INSERT INTO xp_transactions (user_id, market_id, xp_amount, source_type, description)
        VALUES (v_q.initiator_id, p_market_id, v_q.xp_reward, 'friend_quest', v_q.title),
               (v_q.partner_id, p_market_id, v_q.xp_reward, 'friend_quest', v_q.title);
      END IF;
    ELSE
      UPDATE friend_quests
         SET initiator_progress = v_ip, partner_progress = v_pp, updated_at = now()
       WHERE id = v_q.id;
    END IF;

    v_updated := v_updated + 1;
  END LOOP;

  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.friend_quest_progress(p_user uuid, p_market text, p_key text, p_week date)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    CASE p_key
      WHEN 'lessons' THEN (SELECT COUNT(*) FROM daily_completions
                            WHERE user_id = p_user AND market_id = p_market
                              AND completion_date >= p_week AND lesson_completed)
      WHEN 'drills'  THEN (SELECT SUM(drills_completed) FROM daily_completions
                            WHERE user_id = p_user AND market_id = p_market
                              AND completion_date >= p_week)
      WHEN 'games'   THEN (SELECT SUM(games_completed) FROM daily_completions
                            WHERE user_id = p_user AND market_id = p_market
                              AND completion_date >= p_week)
      ELSE 0
    END, 0)::integer
$$;

-- Record an app open to learn each user's habitual study hour (local time)
CREATE OR REPLACE FUNCTION public.record_app_open(p_local_hour integer, p_utc_offset_minutes integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_counts integer[];
  v_best integer := 0;
  v_best_score integer := -1;
  v_score integer;
  i integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_local_hour < 0 OR p_local_hour > 23 THEN RAISE EXCEPTION 'Invalid hour'; END IF;

  INSERT INTO user_activity_patterns (user_id, utc_offset_minutes, last_open_at)
  VALUES (v_user, p_utc_offset_minutes, now())
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE user_activity_patterns
     SET hour_counts = hour_counts[1:p_local_hour]
                       || ARRAY[hour_counts[p_local_hour + 1] + 1]
                       || hour_counts[p_local_hour + 2:24],
         sample_count = sample_count + 1,
         utc_offset_minutes = p_utc_offset_minutes,
         last_open_at = now(),
         updated_at = now()
   WHERE user_id = v_user
  RETURNING hour_counts INTO v_counts;

  -- smoothed argmax (hour + neighbours) so the reminder lands just before habit time
  FOR i IN 0..23 LOOP
    v_score := v_counts[i + 1] * 2
             + v_counts[((i + 23) % 24) + 1]
             + v_counts[((i + 1) % 24) + 1];
    IF v_score > v_best_score THEN
      v_best_score := v_score;
      v_best := i;
    END IF;
  END LOOP;

  UPDATE user_activity_patterns SET preferred_hour = v_best WHERE user_id = v_user;
  RETURN v_best;
END;
$$;
