-- Weekly Case: one short business problem a week, written answers, AI-assisted scoring that is released
-- when the week closes, and standings among friends.
--
-- Shape follows scripts/weekly/lib/mapping.mjs (the content pipeline):
--   weekly_cases          what learners read. Readable once open.
--   weekly_case_scoring   rubric, model answer, traps, fact ledger. Service role only; the model answer reaches
--                         learners only through get_weekly_case_reveal, and only after closes_at.
-- Submissions are written only through submit_weekly_case, and the scoring columns are not granted to learners at
-- all (get_weekly_case_result serves them once released). Cases are loaded by the load-weekly-cases function.

-- ── The case ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_cases (
  id uuid PRIMARY KEY,
  week_start date NOT NULL UNIQUE CHECK (extract(isodow FROM week_start) = 1),
  -- the industry the case is about; every learner sees every week's case
  market_id text REFERENCES public.markets(id),
  kind text NOT NULL DEFAULT 'original' CHECK (kind IN ('original', 'startup')),
  presented_by text NOT NULL DEFAULT 'MarketLingo',
  title text NOT NULL,
  topic text NOT NULL,
  -- scheduled and published are both live from opens_at; archived is the veto
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  opens_at timestamptz NOT NULL,
  closes_at timestamptz NOT NULL,
  -- hook, tension, disclosure, as_of, brief[], exhibits[], question, response.parts[], sources[]
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (closes_at > opens_at)
);
CREATE INDEX IF NOT EXISTS weekly_cases_opens ON public.weekly_cases (opens_at DESC) WHERE status IN ('scheduled', 'published');

ALTER TABLE public.weekly_cases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.weekly_cases FROM anon, authenticated;
GRANT SELECT ON public.weekly_cases TO authenticated;
GRANT ALL ON public.weekly_cases TO service_role;
DROP POLICY IF EXISTS "Live weekly cases are readable once open" ON public.weekly_cases;
CREATE POLICY "Live weekly cases are readable once open" ON public.weekly_cases
  FOR SELECT TO authenticated USING (status IN ('scheduled', 'published') AND opens_at <= now());

-- ── The grader key: private ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_case_scoring (
  case_id uuid PRIMARY KEY REFERENCES public.weekly_cases(id) ON DELETE CASCADE,
  -- [{ id, name, weight, part_ids[], measures, excellent, weak }], weights add to 100
  rubric jsonb NOT NULL,
  model_answer jsonb NOT NULL,
  common_traps jsonb NOT NULL DEFAULT '[]'::jsonb,
  facts jsonb NOT NULL DEFAULT '[]'::jsonb,
  time_sensitive jsonb NOT NULL DEFAULT '[]'::jsonb,
  stale_after date
);
ALTER TABLE public.weekly_case_scoring ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.weekly_case_scoring FROM anon, authenticated;
GRANT ALL ON public.weekly_case_scoring TO service_role;

-- ── Submissions ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_case_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.weekly_cases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- the shop economy counts rows with status = 'submitted'; scoring and release never change it
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'withdrawn')),
  -- { "<part id>": "text" }
  answers jsonb NOT NULL,
  word_count integer NOT NULL,
  seconds_spent integer,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  -- scoring (server only)
  scoring_started_at timestamptz,
  scored_at timestamptz,
  score smallint CHECK (score BETWEEN 0 AND 100),
  breakdown jsonb,
  strongest_move text,
  sharpen text,
  score_attempts smallint NOT NULL DEFAULT 0,
  score_error text,
  -- release (server only): scores become visible to the learner
  released_at timestamptz,
  -- top answers worth expert feedback or a founder Q&A; a flag only, nothing is sent
  expert_flag boolean NOT NULL DEFAULT false,
  UNIQUE (case_id, user_id)
);
CREATE INDEX IF NOT EXISTS weekly_case_submissions_case ON public.weekly_case_submissions (case_id);
CREATE INDEX IF NOT EXISTS weekly_case_submissions_unscored ON public.weekly_case_submissions (case_id) WHERE scored_at IS NULL;
CREATE INDEX IF NOT EXISTS weekly_case_submissions_user ON public.weekly_case_submissions (user_id, status);

ALTER TABLE public.weekly_case_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.weekly_case_submissions FROM anon, authenticated;
GRANT SELECT (id, case_id, user_id, status, answers, word_count, submitted_at, released_at) ON public.weekly_case_submissions TO authenticated;
GRANT ALL ON public.weekly_case_submissions TO service_role;
DROP POLICY IF EXISTS "Learners read their own weekly submission" ON public.weekly_case_submissions;
CREATE POLICY "Learners read their own weekly submission" ON public.weekly_case_submissions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ── Submit once, inside the window ───────────────────────────────────────────
-- Every part the case defines must be answered. The cap is twice the part's max_words, because the phone shows
-- max_words as guidance rather than a wall.
CREATE OR REPLACE FUNCTION public.submit_weekly_case(p_case_id uuid, p_answers jsonb, p_seconds integer DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  c public.weekly_cases%ROWTYPE;
  v_part jsonb;
  v_id text;
  v_text text;
  v_cap int;
  v_n int;
  v_words int := 0;
  v_clean jsonb := '{}'::jsonb;
  v_row uuid;
  v_created boolean := false;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_signed_in'; END IF;
  SELECT * INTO c FROM public.weekly_cases WHERE id = p_case_id AND status IN ('scheduled', 'published');
  IF NOT FOUND OR now() < c.opens_at THEN RAISE EXCEPTION 'case_not_available'; END IF;
  IF now() >= c.closes_at THEN RAISE EXCEPTION 'case_closed'; END IF;
  IF jsonb_typeof(p_answers) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'bad_answers'; END IF;
  IF jsonb_typeof(c.content -> 'response' -> 'parts') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'case_has_no_parts'; END IF;

  FOR v_part IN SELECT * FROM jsonb_array_elements(c.content -> 'response' -> 'parts') LOOP
    v_id := v_part ->> 'id';
    v_text := btrim(COALESCE(p_answers ->> v_id, ''));
    v_n := COALESCE(array_length(regexp_split_to_array(v_text, '\s+'), 1), 0);
    IF v_text = '' OR v_n < 3 THEN RAISE EXCEPTION 'too_short:%', v_id; END IF;
    v_cap := COALESCE((v_part ->> 'max_words')::int, 150) * 2;
    IF v_n > v_cap THEN RAISE EXCEPTION 'too_long:%', v_id; END IF;
    v_words := v_words + v_n;
    v_clean := v_clean || jsonb_build_object(v_id, v_text);
  END LOOP;

  INSERT INTO public.weekly_case_submissions (case_id, user_id, answers, word_count, seconds_spent)
  VALUES (p_case_id, v_uid, v_clean, v_words, LEAST(GREATEST(p_seconds, 0), 7200))
  ON CONFLICT (case_id, user_id) DO NOTHING
  RETURNING id INTO v_row;

  IF v_row IS NOT NULL THEN
    v_created := true;
  ELSE
    SELECT id INTO v_row FROM public.weekly_case_submissions WHERE case_id = p_case_id AND user_id = v_uid;
  END IF;
  RETURN jsonb_build_object('id', v_row, 'created', v_created);
END $$;
REVOKE ALL ON FUNCTION public.submit_weekly_case(uuid, jsonb, integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.submit_weekly_case(uuid, jsonb, integer) TO authenticated;

-- ── My result: only once released ────────────────────────────────────────────
-- state: 'none' (no submission), 'waiting' (submitted, results not out), 'ready'
CREATE OR REPLACE FUNCTION public.get_weekly_case_result(p_case_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  s public.weekly_case_submissions%ROWTYPE;
  v_total int;
  v_below int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_signed_in'; END IF;
  SELECT * INTO s FROM public.weekly_case_submissions WHERE case_id = p_case_id AND user_id = v_uid AND status = 'submitted';
  IF NOT FOUND THEN RETURN jsonb_build_object('state', 'none'); END IF;
  IF s.released_at IS NULL THEN RETURN jsonb_build_object('state', 'waiting', 'submitted_at', s.submitted_at); END IF;
  SELECT count(*), count(*) FILTER (WHERE score < s.score)
    INTO v_total, v_below
    FROM public.weekly_case_submissions
   WHERE case_id = p_case_id AND status = 'submitted' AND released_at IS NOT NULL AND scored_at IS NOT NULL;
  RETURN jsonb_build_object(
    'state', 'ready',
    'score', s.score,
    'breakdown', COALESCE(s.breakdown, '[]'::jsonb),
    'strongest_move', s.strongest_move,
    'sharpen', s.sharpen,
    'expert_flag', s.expert_flag,
    'released_at', s.released_at,
    'participants', v_total,
    -- share of the other players this score beat; hidden while the field is small
    'beat_pct', CASE WHEN v_total >= 6 THEN round(100.0 * v_below / (v_total - 1))::int ELSE NULL END
  );
END $$;
REVOKE ALL ON FUNCTION public.get_weekly_case_result(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_weekly_case_result(uuid) TO authenticated;

-- ── The model answer: only after the week closes ─────────────────────────────
-- The model answer and the common traps are the teaching half of the case. They stay private while it is open,
-- so nobody can read the answer and then submit it.
CREATE OR REPLACE FUNCTION public.get_weekly_case_reveal(p_case_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_closes timestamptz;
  v_out jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_signed_in'; END IF;
  SELECT closes_at INTO v_closes FROM public.weekly_cases WHERE id = p_case_id AND status IN ('scheduled', 'published');
  IF v_closes IS NULL OR v_closes > now() THEN RETURN NULL; END IF;
  SELECT jsonb_build_object('model_answer', k.model_answer, 'common_traps', k.common_traps)
    INTO v_out FROM public.weekly_case_scoring k WHERE k.case_id = p_case_id;
  RETURN v_out;
END $$;
REVOKE ALL ON FUNCTION public.get_weekly_case_reveal(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_weekly_case_reveal(uuid) TO authenticated;

-- ── Standings among friends: display name and friend code only ───────────────
-- Friends who have submitted are listed before release (score null); scores and ranks appear once released.
CREATE OR REPLACE FUNCTION public.get_weekly_case_board(p_case_id uuid)
RETURNS TABLE(user_id uuid, display_name text, friend_code text, is_me boolean, score smallint, rank integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH me AS (SELECT auth.uid() AS id),
  circle AS (
    SELECT id FROM me WHERE id IS NOT NULL
    UNION
    SELECT CASE WHEN fs.user_id = me.id THEN fs.friend_id ELSE fs.user_id END
    FROM public.friendships fs, me
    WHERE me.id IS NOT NULL AND fs.status = 'accepted' AND (fs.user_id = me.id OR fs.friend_id = me.id)
  ),
  rows AS (
    SELECT s.user_id, p.display_name, p.friend_code, (s.user_id = (SELECT id FROM me)) AS is_me,
           CASE WHEN s.released_at IS NOT NULL THEN s.score END AS score, s.submitted_at
    FROM public.weekly_case_submissions s
    JOIN circle ON circle.id = s.user_id
    JOIN public.profiles p ON p.id = s.user_id
    WHERE s.case_id = p_case_id AND s.status = 'submitted'
  )
  SELECT r.user_id, COALESCE(NULLIF(btrim(r.display_name), ''), 'Analyst'), r.friend_code, r.is_me, r.score,
         CASE WHEN r.score IS NULL THEN NULL ELSE (rank() OVER (ORDER BY r.score DESC NULLS LAST))::int END
  FROM rows r
  ORDER BY r.score DESC NULLS LAST, r.submitted_at;
$$;
REVOKE ALL ON FUNCTION public.get_weekly_case_board(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_weekly_case_board(uuid) TO authenticated;

-- ── Release: server only, safe to repeat ─────────────────────────────────────
-- Makes every scored submission of a case visible once the case has closed, and flags the best answers
-- (score 80 or more, at most the top 3) for expert feedback. Returns how many it released.
CREATE OR REPLACE FUNCTION public.finalize_weekly_case(p_case_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_closes timestamptz;
  v_n integer;
BEGIN
  SELECT closes_at INTO v_closes FROM public.weekly_cases WHERE id = p_case_id AND status IN ('scheduled', 'published');
  IF v_closes IS NULL OR v_closes > now() THEN RETURN 0; END IF;
  UPDATE public.weekly_case_submissions
     SET released_at = now()
   WHERE case_id = p_case_id AND status = 'submitted' AND scored_at IS NOT NULL AND released_at IS NULL;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  UPDATE public.weekly_case_submissions s
     SET expert_flag = true
    FROM (SELECT id FROM public.weekly_case_submissions
           WHERE case_id = p_case_id AND status = 'submitted' AND released_at IS NOT NULL AND score >= 80
           ORDER BY score DESC, submitted_at LIMIT 3) top
   WHERE s.id = top.id AND NOT s.expert_flag;
  RETURN v_n;
END $$;
REVOKE ALL ON FUNCTION public.finalize_weekly_case(uuid) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.finalize_weekly_case(uuid) TO service_role;

-- ── Scheduled calls, if pg_cron and pg_net are available ─────────────────────
-- weekly-case-release (hourly): grades anything left and releases the scores of closed weeks. The weekly-case
--   function also releases lazily when a learner opens their results, so a missed run only delays.
-- weekly-case-load (every 6 hours): POSTs load-weekly-cases, which writes only weeks whose bundled content differs.
--   Merging a case PR therefore puts the case in the database without anyone running SQL.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-case-load') THEN
      PERFORM cron.unschedule('weekly-case-load');
    END IF;
    PERFORM cron.schedule(
      'weekly-case-load',
      '23 */6 * * *',
      $cron$
      SELECT net.http_post(
        url := 'https://wahrcgvzarcgmktjleyr.supabase.co/functions/v1/load-weekly-cases',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
      ) AS request_id;
      $cron$
    );
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-case-release') THEN
      PERFORM cron.unschedule('weekly-case-release');
    END IF;
    PERFORM cron.schedule(
      'weekly-case-release',
      '7 * * * *',
      $cron$
      SELECT net.http_post(
        url := 'https://wahrcgvzarcgmktjleyr.supabase.co/functions/v1/weekly-case',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{"action": "release"}'::jsonb
      ) AS request_id;
      $cron$
    );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
