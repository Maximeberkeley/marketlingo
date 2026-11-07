-- Friend streaks and friend races.
--
-- Friend streak: two friends share a flame that grows each day both finish a
-- daily lesson (any industry, each on their own local day). Up to 5 per learner.
-- Milestones (7 / 14 / 30 / 50 days) pay XP to each friend once per streak.
--
-- Friend race: a 7-day head-to-head on XP earned in any industry. Winner +100,
-- tie +60 each, runner-up +25 if they earned at least 50 XP in the race.
--
-- Tables are only reachable through the SECURITY DEFINER functions below, so
-- every rule (friends only, caps, one open item per pair, one reward per
-- person) is enforced on the server and rewards can never be claimed twice.
--
-- Safe to run again: it creates only what is missing, refuses to touch friend
-- tables that do not match this design, and refreshes the API schema at the end.

-- Stop if another kind of object (index, view, type...) already holds one of
-- the table names, and say which, rather than failing with "already exists".
DO $$
DECLARE clash text;
BEGIN
  SELECT string_agg(x.what, ', ') INTO clash FROM (
    SELECT format('public.%I is %s', c.relname, CASE c.relkind WHEN 'i' THEN 'an index' WHEN 'I' THEN 'an index' WHEN 'S' THEN 'a sequence'
      WHEN 'v' THEN 'a view' WHEN 'm' THEN 'a materialized view' WHEN 'c' THEN 'a composite type' WHEN 'f' THEN 'a foreign table'
      ELSE 'another object (' || c.relkind::text || ')' END) AS what
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind NOT IN ('r', 'p')
      AND c.relname IN ('friend_streaks', 'friend_streak_rewards', 'friend_races', 'friend_race_rewards')
    UNION ALL
    SELECT format('public.%I is a type', t.typname)
    FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typrelid = 0
      AND t.typname IN ('friend_streaks', 'friend_streak_rewards', 'friend_races', 'friend_race_rewards')
  ) x;
  IF clash IS NOT NULL THEN
    RAISE EXCEPTION 'Names this migration needs are already taken (%). Nothing was changed.', clash;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.friend_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended', 'declined')),
  started_on date,
  best_length integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  ended_at timestamptz,
  CHECK (user_a < user_b),
  CHECK (invited_by IN (user_a, user_b))
);

CREATE TABLE IF NOT EXISTS public.friend_streak_rewards (
  streak_id uuid NOT NULL REFERENCES public.friend_streaks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  milestone integer NOT NULL,
  xp integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (streak_id, user_id, milestone)
);

CREATE TABLE IF NOT EXISTS public.friend_races (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger uuid NOT NULL,
  opponent uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'finished', 'declined', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  starts_at timestamptz,
  ends_at timestamptz,
  CHECK (challenger <> opponent)
);

CREATE TABLE IF NOT EXISTS public.friend_race_rewards (
  race_id uuid NOT NULL REFERENCES public.friend_races(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('won', 'tied', 'lost')),
  xp integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (race_id, user_id)
);

-- If friend tables already exist from an earlier attempt, they must match this
-- design; otherwise stop here and change nothing.
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(t.tbl || '.' || t.col, ', ') INTO missing
  FROM (VALUES
    ('friend_streaks', 'id'), ('friend_streaks', 'user_a'), ('friend_streaks', 'user_b'), ('friend_streaks', 'invited_by'),
    ('friend_streaks', 'status'), ('friend_streaks', 'started_on'), ('friend_streaks', 'best_length'), ('friend_streaks', 'created_at'),
    ('friend_streaks', 'responded_at'), ('friend_streaks', 'ended_at'),
    ('friend_streak_rewards', 'streak_id'), ('friend_streak_rewards', 'user_id'), ('friend_streak_rewards', 'milestone'),
    ('friend_streak_rewards', 'xp'), ('friend_streak_rewards', 'created_at'),
    ('friend_races', 'id'), ('friend_races', 'challenger'), ('friend_races', 'opponent'), ('friend_races', 'status'),
    ('friend_races', 'created_at'), ('friend_races', 'starts_at'), ('friend_races', 'ends_at'),
    ('friend_race_rewards', 'race_id'), ('friend_race_rewards', 'user_id'), ('friend_race_rewards', 'outcome'),
    ('friend_race_rewards', 'xp'), ('friend_race_rewards', 'created_at')
  ) AS t(tbl, col)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = t.tbl AND c.column_name = t.col
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Friend tables already exist with a different shape (missing columns: %). Nothing was changed.', missing;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS friend_streaks_open_pair ON public.friend_streaks (user_a, user_b) WHERE status IN ('pending', 'active');
CREATE INDEX IF NOT EXISTS friend_streaks_user_a ON public.friend_streaks (user_a) WHERE status IN ('pending', 'active');
CREATE INDEX IF NOT EXISTS friend_streaks_user_b ON public.friend_streaks (user_b) WHERE status IN ('pending', 'active');
CREATE UNIQUE INDEX IF NOT EXISTS friend_races_open_pair ON public.friend_races (least(challenger, opponent), greatest(challenger, opponent))
  WHERE status IN ('pending', 'active');
CREATE INDEX IF NOT EXISTS friend_races_challenger ON public.friend_races (challenger);
CREATE INDEX IF NOT EXISTS friend_races_opponent ON public.friend_races (opponent);

ALTER TABLE public.friend_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_streak_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_race_rewards ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.friend_streaks, public.friend_streak_rewards, public.friend_races, public.friend_race_rewards TO service_role;

-- ── Helpers ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public._are_friends(p_a uuid, p_b uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships fs
    WHERE fs.status = 'accepted'
      AND ((fs.user_id = p_a AND fs.friend_id = p_b) OR (fs.user_id = p_b AND fs.friend_id = p_a))
  );
$$;

CREATE OR REPLACE FUNCTION public._local_today(p_user uuid) RETURNS date
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT (now() AT TIME ZONE public.safe_tz((SELECT p.timezone FROM public.profiles p WHERE p.id = p_user)))::date;
$$;

CREATE OR REPLACE FUNCTION public._did_lesson(p_user uuid, p_day date) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.daily_completions dc
    WHERE dc.user_id = p_user AND dc.lesson_completed AND dc.completion_date = p_day
  );
$$;

-- Days in a row both friends finished a lesson, on or after started_on. It ends
-- on the earlier of the two local "todays" if both are done that day, otherwise
-- on the day before; a fully missed day brings it back to 0.
CREATE OR REPLACE FUNCTION public._friend_streak_length(p_a uuid, p_b uuid, p_started date) RETURNS integer
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  d date := LEAST(public._local_today(p_a), public._local_today(p_b));
  n integer := 0;
BEGIN
  IF p_started IS NULL THEN RETURN 0; END IF;
  IF NOT (public._did_lesson(p_a, d) AND public._did_lesson(p_b, d)) THEN d := d - 1; END IF;
  WHILE d >= p_started AND n < 1000 AND public._did_lesson(p_a, d) AND public._did_lesson(p_b, d) LOOP
    n := n + 1;
    d := d - 1;
  END LOOP;
  RETURN n;
END $$;

-- XP a learner earned in a race window, leaving out social rewards so a
-- reward from one race never counts in another.
CREATE OR REPLACE FUNCTION public._race_xp(p_user uuid, p_from timestamptz, p_to timestamptz) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(SUM(xt.xp_amount), 0)::integer
  FROM public.xp_transactions xt
  WHERE xt.user_id = p_user
    AND xt.created_at >= p_from AND xt.created_at < p_to
    AND xt.source_type NOT IN ('friend_race', 'friend_streak');
$$;

-- Gives XP in the learner's current industry (or any industry they have XP in).
CREATE OR REPLACE FUNCTION public._award_social_xp(p_user uuid, p_amount integer, p_source text, p_source_id uuid, p_description text)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_market text;
BEGIN
  IF p_amount <= 0 THEN RETURN; END IF;
  SELECT p.selected_market INTO v_market FROM public.profiles p WHERE p.id = p_user;
  IF v_market IS NULL OR NOT EXISTS (SELECT 1 FROM public.markets m WHERE m.id = v_market) THEN
    SELECT ux.market_id INTO v_market FROM public.user_xp ux WHERE ux.user_id = p_user ORDER BY ux.updated_at DESC LIMIT 1;
  END IF;
  IF v_market IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_xp (user_id, market_id) VALUES (p_user, v_market) ON CONFLICT (user_id, market_id) DO NOTHING;
  INSERT INTO public.xp_transactions (user_id, market_id, xp_amount, source_type, source_id, description)
    VALUES (p_user, v_market, p_amount, p_source, p_source_id, p_description);
  PERFORM public.increment_user_xp(p_user, v_market, p_amount);
END $$;

CREATE OR REPLACE FUNCTION public._friend_streak_milestones() RETURNS TABLE (milestone integer, xp integer)
LANGUAGE sql IMMUTABLE AS $$
  VALUES (7, 25), (14, 50), (30, 100), (50, 200);
$$;

-- ── Read everything the Friends screen needs ───────────────────────────

CREATE OR REPLACE FUNCTION public.get_friend_social() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  me uuid := auth.uid();
  my_today date;
  s record;
  r record;
  friend uuid;
  len integer;
  streaks jsonb := '[]'::jsonb;
  races jsonb := '[]'::jsonb;
  my_xp integer;
  friend_xp integer;
  claimable integer;
  v_status text;
  claimed record;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  my_today := public._local_today(me);

  FOR s IN
    SELECT fs.* FROM public.friend_streaks fs
    WHERE me IN (fs.user_a, fs.user_b) AND fs.status IN ('pending', 'active')
    ORDER BY fs.created_at
  LOOP
    friend := CASE WHEN s.user_a = me THEN s.user_b ELSE s.user_a END;
    len := CASE WHEN s.status = 'active' THEN public._friend_streak_length(s.user_a, s.user_b, s.started_on) ELSE 0 END;
    IF len > s.best_length THEN
      UPDATE public.friend_streaks SET best_length = len WHERE id = s.id;
    END IF;
    SELECT COALESCE(SUM(m.xp), 0)::integer INTO claimable
    FROM public._friend_streak_milestones() m
    WHERE m.milestone <= len
      AND NOT EXISTS (SELECT 1 FROM public.friend_streak_rewards rw WHERE rw.streak_id = s.id AND rw.user_id = me AND rw.milestone = m.milestone);
    streaks := streaks || jsonb_build_object(
      'id', s.id,
      'friend_id', friend,
      'display_name', (SELECT p.display_name FROM public.profiles p WHERE p.id = friend),
      'friend_code', (SELECT p.friend_code FROM public.profiles p WHERE p.id = friend),
      'status', s.status,
      'invited_by_me', s.invited_by = me,
      'started_on', s.started_on,
      'length', len,
      'best_length', GREATEST(s.best_length, len),
      'me_done_today', public._did_lesson(me, my_today),
      'friend_done_today', public._did_lesson(friend, public._local_today(friend)),
      'nudged_today', EXISTS (SELECT 1 FROM public.friend_nudges n WHERE n.sender_id = me AND n.receiver_id = friend
                               AND n.created_on = public._local_today(friend)),
      'claimable_xp', claimable,
      'claimed_milestones', COALESCE((SELECT jsonb_agg(rw.milestone ORDER BY rw.milestone) FROM public.friend_streak_rewards rw
                                       WHERE rw.streak_id = s.id AND rw.user_id = me), '[]'::jsonb)
    );
  END LOOP;

  FOR r IN
    SELECT fr.* FROM public.friend_races fr
    WHERE me IN (fr.challenger, fr.opponent)
      AND (fr.status IN ('pending', 'active')
           OR (fr.status = 'finished' AND NOT EXISTS (SELECT 1 FROM public.friend_race_rewards rw WHERE rw.race_id = fr.id AND rw.user_id = me))
           OR (fr.status = 'finished' AND fr.ends_at > now() - interval '2 days'))
    ORDER BY fr.created_at DESC
    LIMIT 10
  LOOP
    friend := CASE WHEN r.challenger = me THEN r.opponent ELSE r.challenger END;
    v_status := r.status;
    IF v_status = 'active' AND r.ends_at <= now() THEN
      UPDATE public.friend_races SET status = 'finished' WHERE id = r.id;
      v_status := 'finished';
    END IF;
    my_xp := CASE WHEN r.starts_at IS NULL THEN 0 ELSE public._race_xp(me, r.starts_at, LEAST(r.ends_at, now())) END;
    friend_xp := CASE WHEN r.starts_at IS NULL THEN 0 ELSE public._race_xp(friend, r.starts_at, LEAST(r.ends_at, now())) END;
    SELECT rw.outcome, rw.xp INTO claimed FROM public.friend_race_rewards rw WHERE rw.race_id = r.id AND rw.user_id = me;
    races := races || jsonb_build_object(
      'id', r.id,
      'friend_id', friend,
      'display_name', (SELECT p.display_name FROM public.profiles p WHERE p.id = friend),
      'status', v_status,
      'challenged_by_me', r.challenger = me,
      'starts_at', r.starts_at,
      'ends_at', r.ends_at,
      'my_xp', my_xp,
      'friend_xp', friend_xp,
      'claimed', claimed.outcome IS NOT NULL,
      'claimed_xp', COALESCE(claimed.xp, 0),
      'nudged_today', EXISTS (SELECT 1 FROM public.friend_nudges n WHERE n.sender_id = me AND n.receiver_id = friend
                               AND n.created_on = public._local_today(friend))
    );
    claimed := NULL;
  END LOOP;

  RETURN jsonb_build_object('streaks', streaks, 'races', races, 'today', my_today, 'server_now', now());
END $$;

-- ── Friend streak actions ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.start_friend_streak(p_friend uuid) RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  me uuid := auth.uid();
  v_id uuid;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF p_friend IS NULL OR p_friend = me OR NOT public._are_friends(me, p_friend) THEN RAISE EXCEPTION 'Not friends'; END IF;
  IF (SELECT count(*) FROM public.friend_streaks fs WHERE me IN (fs.user_a, fs.user_b) AND fs.status IN ('pending', 'active')) >= 5 THEN
    RAISE EXCEPTION 'You already have 5 friend streaks';
  END IF;
  IF (SELECT count(*) FROM public.friend_streaks fs WHERE p_friend IN (fs.user_a, fs.user_b) AND fs.status IN ('pending', 'active')) >= 5 THEN
    RAISE EXCEPTION 'Your friend already has 5 friend streaks';
  END IF;
  SELECT fs.id INTO v_id FROM public.friend_streaks fs
  WHERE fs.user_a = LEAST(me, p_friend) AND fs.user_b = GREATEST(me, p_friend) AND fs.status IN ('pending', 'active');
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  INSERT INTO public.friend_streaks (user_a, user_b, invited_by) VALUES (LEAST(me, p_friend), GREATEST(me, p_friend), me)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.respond_friend_streak(p_streak uuid, p_accept boolean) RETURNS text
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  me uuid := auth.uid();
  s public.friend_streaks;
BEGIN
  SELECT * INTO s FROM public.friend_streaks WHERE id = p_streak FOR UPDATE;
  IF s.id IS NULL OR me NOT IN (s.user_a, s.user_b) OR s.invited_by = me OR s.status <> 'pending' THEN
    RAISE EXCEPTION 'No invite to answer';
  END IF;
  IF p_accept THEN
    -- Today counts already if both of you finish a lesson today.
    UPDATE public.friend_streaks
    SET status = 'active', responded_at = now(), started_on = LEAST(public._local_today(s.user_a), public._local_today(s.user_b))
    WHERE id = s.id;
    RETURN 'active';
  END IF;
  UPDATE public.friend_streaks SET status = 'declined', responded_at = now() WHERE id = s.id;
  RETURN 'declined';
END $$;

CREATE OR REPLACE FUNCTION public.end_friend_streak(p_streak uuid) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  me uuid := auth.uid();
BEGIN
  UPDATE public.friend_streaks SET status = 'ended', ended_at = now()
  WHERE id = p_streak AND me IN (user_a, user_b) AND status IN ('pending', 'active');
END $$;

CREATE OR REPLACE FUNCTION public.claim_friend_streak_rewards(p_streak uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  me uuid := auth.uid();
  s public.friend_streaks;
  len integer;
  m record;
  total integer := 0;
  reached integer[] := '{}';
  inserted integer;
BEGIN
  SELECT * INTO s FROM public.friend_streaks WHERE id = p_streak;
  IF s.id IS NULL OR me NOT IN (s.user_a, s.user_b) OR s.status <> 'active' THEN RAISE EXCEPTION 'No streak to claim'; END IF;
  len := public._friend_streak_length(s.user_a, s.user_b, s.started_on);
  FOR m IN SELECT * FROM public._friend_streak_milestones() ORDER BY milestone LOOP
    CONTINUE WHEN m.milestone > len;
    INSERT INTO public.friend_streak_rewards (streak_id, user_id, milestone, xp) VALUES (s.id, me, m.milestone, m.xp)
    ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS inserted = ROW_COUNT;
    IF inserted > 0 THEN
      total := total + m.xp;
      reached := reached || m.milestone;
      PERFORM public._award_social_xp(me, m.xp, 'friend_streak', s.id, m.milestone || '-day friend streak');
    END IF;
  END LOOP;
  RETURN jsonb_build_object('xp', total, 'milestones', to_jsonb(reached), 'length', len);
END $$;

-- ── Friend race actions ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.challenge_friend_race(p_friend uuid) RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  me uuid := auth.uid();
  v_id uuid;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF p_friend IS NULL OR p_friend = me OR NOT public._are_friends(me, p_friend) THEN RAISE EXCEPTION 'Not friends'; END IF;
  -- Close any race between you two whose week is over before checking for an open one.
  UPDATE public.friend_races SET status = 'finished'
  WHERE status = 'active' AND ends_at <= now() AND me IN (challenger, opponent) AND p_friend IN (challenger, opponent);
  SELECT fr.id INTO v_id FROM public.friend_races fr
  WHERE least(fr.challenger, fr.opponent) = LEAST(me, p_friend) AND greatest(fr.challenger, fr.opponent) = GREATEST(me, p_friend)
    AND fr.status IN ('pending', 'active');
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  IF (SELECT count(*) FROM public.friend_races fr WHERE me IN (fr.challenger, fr.opponent) AND fr.status IN ('pending', 'active') AND (fr.ends_at IS NULL OR fr.ends_at > now())) >= 3 THEN
    RAISE EXCEPTION 'You already have 3 races going';
  END IF;
  INSERT INTO public.friend_races (challenger, opponent) VALUES (me, p_friend) RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.respond_friend_race(p_race uuid, p_accept boolean) RETURNS text
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  me uuid := auth.uid();
  r public.friend_races;
BEGIN
  SELECT * INTO r FROM public.friend_races WHERE id = p_race FOR UPDATE;
  IF r.id IS NULL OR r.opponent <> me OR r.status <> 'pending' THEN RAISE EXCEPTION 'No challenge to answer'; END IF;
  IF p_accept THEN
    UPDATE public.friend_races SET status = 'active', starts_at = now(), ends_at = now() + interval '7 days' WHERE id = r.id;
    RETURN 'active';
  END IF;
  UPDATE public.friend_races SET status = 'declined' WHERE id = r.id;
  RETURN 'declined';
END $$;

CREATE OR REPLACE FUNCTION public.cancel_friend_race(p_race uuid) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.friend_races SET status = 'cancelled'
  WHERE id = p_race AND challenger = auth.uid() AND status = 'pending';
END $$;

CREATE OR REPLACE FUNCTION public.claim_friend_race_reward(p_race uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  me uuid := auth.uid();
  r public.friend_races;
  friend uuid;
  my_xp integer;
  friend_xp integer;
  v_outcome text;
  v_xp integer;
  inserted integer;
BEGIN
  SELECT * INTO r FROM public.friend_races WHERE id = p_race;
  IF r.id IS NULL OR me NOT IN (r.challenger, r.opponent) OR r.status NOT IN ('active', 'finished') OR r.ends_at > now() THEN
    RAISE EXCEPTION 'This race is not over yet';
  END IF;
  IF r.status = 'active' THEN UPDATE public.friend_races SET status = 'finished' WHERE id = r.id; END IF;
  friend := CASE WHEN r.challenger = me THEN r.opponent ELSE r.challenger END;
  my_xp := public._race_xp(me, r.starts_at, r.ends_at);
  friend_xp := public._race_xp(friend, r.starts_at, r.ends_at);
  v_outcome := CASE WHEN my_xp > friend_xp THEN 'won' WHEN my_xp = friend_xp THEN 'tied' ELSE 'lost' END;
  v_xp := CASE v_outcome WHEN 'won' THEN 100 WHEN 'tied' THEN 60 ELSE CASE WHEN my_xp >= 50 THEN 25 ELSE 0 END END;
  INSERT INTO public.friend_race_rewards (race_id, user_id, outcome, xp) VALUES (r.id, me, v_outcome, v_xp) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF inserted = 0 THEN
    SELECT rw.outcome, rw.xp INTO v_outcome, v_xp FROM public.friend_race_rewards rw WHERE rw.race_id = r.id AND rw.user_id = me;
    RETURN jsonb_build_object('outcome', v_outcome, 'xp', 0, 'already_claimed', true, 'my_xp', my_xp, 'friend_xp', friend_xp);
  END IF;
  PERFORM public._award_social_xp(me, v_xp, 'friend_race', r.id,
    CASE v_outcome WHEN 'won' THEN 'Won a friend race' WHEN 'tied' THEN 'Tied a friend race' ELSE 'Finished a friend race' END);
  RETURN jsonb_build_object('outcome', v_outcome, 'xp', v_xp, 'already_claimed', false, 'my_xp', my_xp, 'friend_xp', friend_xp);
END $$;

-- Only signed-in learners can call the public functions; helpers stay internal.
REVOKE ALL ON FUNCTION public._are_friends(uuid, uuid), public._local_today(uuid), public._did_lesson(uuid, date),
  public._friend_streak_length(uuid, uuid, date), public._race_xp(uuid, timestamptz, timestamptz),
  public._award_social_xp(uuid, integer, text, uuid, text), public._friend_streak_milestones() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.get_friend_social(), public.start_friend_streak(uuid), public.respond_friend_streak(uuid, boolean),
  public.end_friend_streak(uuid), public.claim_friend_streak_rewards(uuid), public.challenge_friend_race(uuid),
  public.respond_friend_race(uuid, boolean), public.cancel_friend_race(uuid), public.claim_friend_race_reward(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_friend_social(), public.start_friend_streak(uuid), public.respond_friend_streak(uuid, boolean),
  public.end_friend_streak(uuid), public.claim_friend_streak_rewards(uuid), public.challenge_friend_race(uuid),
  public.respond_friend_race(uuid, boolean), public.cancel_friend_race(uuid), public.claim_friend_race_reward(uuid) TO authenticated;

-- Let the API see the new functions right away.
NOTIFY pgrst, 'reload schema';
