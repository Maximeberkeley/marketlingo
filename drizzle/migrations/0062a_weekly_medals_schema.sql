-- Split of 0062_shop_catalog_weekly_medals.sql for tools that cannot run schema and data together.
-- Run 0062a (schema) first, then 0062b (data). Both are safe to run again. Together they equal 0062.

-- Podium medals: earn-only held items granted once from WEEKLY CASE placements among friends, never sold and never
-- taken back. Bronze = 3rd place 3 times, Silver = 2nd 5 times, Gold = 1st 7 times. A case only counts for a
-- learner when at least 3 people on their friends board (them included) submitted it, so nobody farms a tiny board.
-- Placements are stored once per learner per case when scores are released (finalize_weekly_case), and backfilled
-- here for cases already released. The medals replace the old Case champion medal, which is ended and hidden.
-- Also adds the Halo and the Captain hat, renames the Wings to Angel wings, and adds the "Angel of my Dreams" pack.
-- Safe to run again.

-- ── Placements: one row per learner per Weekly Case ──────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_case_placements (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES public.weekly_cases(id) ON DELETE CASCADE,
  rank integer NOT NULL CHECK (rank >= 1),
  board_size integer NOT NULL CHECK (board_size >= 1),
  score smallint,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, case_id)
);
ALTER TABLE public.weekly_case_placements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own weekly case placements" ON public.weekly_case_placements;
CREATE POLICY "Own weekly case placements" ON public.weekly_case_placements FOR SELECT TO authenticated USING (user_id = auth.uid());
GRANT SELECT ON public.weekly_case_placements TO authenticated;
GRANT ALL ON public.weekly_case_placements TO service_role;

-- A learner's place among their friends on one case: the same ranking as get_weekly_case_board (released scores,
-- higher is better, ties share a place), over self plus accepted friends who submitted.
CREATE OR REPLACE FUNCTION public.shop_weekly_case_placement(p_user uuid, p_case_id uuid)
RETURNS TABLE(rank integer, board_size integer, score smallint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH circle AS (
    SELECT p_user AS uid
    UNION
    SELECT CASE WHEN fs.user_id = p_user THEN fs.friend_id ELSE fs.user_id END
    FROM public.friendships fs WHERE fs.status = 'accepted' AND p_user IN (fs.user_id, fs.friend_id)
  ), board AS (
    SELECT s.user_id, s.score FROM public.weekly_case_submissions s JOIN circle c ON c.uid = s.user_id
    WHERE s.case_id = p_case_id AND s.status = 'submitted' AND s.released_at IS NOT NULL AND s.score IS NOT NULL
  )
  SELECT (1 + (SELECT count(*) FROM board b WHERE b.score > m.score))::integer, (SELECT count(*) FROM board)::integer, m.score
  FROM board m WHERE m.user_id = p_user;
$$;
REVOKE ALL ON FUNCTION public.shop_weekly_case_placement(uuid, uuid) FROM anon, authenticated, public;

-- Store every released submitter's placement on a case once (a re-run changes nothing).
CREATE OR REPLACE FUNCTION public.record_weekly_case_placements(p_case_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_count integer := 0;
  r record;
BEGIN
  FOR r IN
    SELECT s.user_id FROM public.weekly_case_submissions s
    WHERE s.case_id = p_case_id AND s.status = 'submitted' AND s.released_at IS NOT NULL AND s.score IS NOT NULL
  LOOP
    INSERT INTO public.weekly_case_placements (user_id, case_id, rank, board_size, score)
    SELECT r.user_id, p_case_id, p.rank, p.board_size, p.score FROM public.shop_weekly_case_placement(r.user_id, p_case_id) p
    ON CONFLICT (user_id, case_id) DO NOTHING;
    IF FOUND THEN v_count := v_count + 1; END IF;
  END LOOP;
  RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION public.record_weekly_case_placements(uuid) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.record_weekly_case_placements(uuid) TO service_role;

-- Release now also records placements (release logic unchanged).
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
  PERFORM public.record_weekly_case_placements(p_case_id);
  RETURN v_n;
END $$;
REVOKE ALL ON FUNCTION public.finalize_weekly_case(uuid) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.finalize_weekly_case(uuid) TO service_role;

-- Requirement checks gain the Weekly Case podium counts (only cases at least 3 friends submitted count).
-- shop_check_rewards grants through this, so each medal arrives once, at the first check after its count is reached.
CREATE OR REPLACE FUNCTION public.shop_unmet_requirement(p_user uuid, p_req jsonb)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_cases integer;
BEGIN
  IF p_req IS NULL OR p_req = '{}'::jsonb THEN RETURN NULL; END IF;
  -- granted elsewhere (live standings, month close), never by a check or a purchase
  IF p_req ? 'crown_live' THEN RETURN 'crown_live'; END IF;
  IF p_req ? 'crown_keepsake' THEN RETURN 'crown_keepsake'; END IF;
  IF p_req ? 'min_streak_days' AND COALESCE((SELECT MAX(longest_streak) FROM public.user_progress WHERE user_id = p_user), 0)
       < (p_req->>'min_streak_days')::integer THEN RETURN 'min_streak_days'; END IF;
  IF p_req ? 'min_xp_earned' AND public.shop_xp_earned(p_user) < (p_req->>'min_xp_earned')::integer THEN RETURN 'min_xp_earned'; END IF;
  IF p_req ? 'min_lessons_completed' AND COALESCE((SELECT MAX(cardinality(completed_stacks)) FROM public.user_progress WHERE user_id = p_user), 0)
       < (p_req->>'min_lessons_completed')::integer THEN RETURN 'min_lessons_completed'; END IF;
  IF p_req ? 'weekly_case_submitted_count' OR p_req ? 'requires_weekly_case_submission' THEN
    SELECT count(*) INTO v_cases FROM public.weekly_case_submissions WHERE user_id = p_user AND status = 'submitted';
    IF p_req ? 'weekly_case_submitted_count' AND v_cases < (p_req->>'weekly_case_submitted_count')::integer THEN RETURN 'weekly_case_submitted_count'; END IF;
    IF (p_req->>'requires_weekly_case_submission')::boolean IS TRUE AND v_cases < 1 THEN RETURN 'requires_weekly_case_submission'; END IF;
  END IF;
  IF (p_req->>'weekly_case_top3')::boolean IS TRUE AND NOT public.shop_weekly_case_top3(p_user) THEN RETURN 'weekly_case_top3'; END IF;
  IF p_req ? 'weekly_podium_first_count' AND (SELECT count(*) FROM public.weekly_case_placements wp WHERE wp.user_id = p_user AND wp.rank = 1 AND wp.board_size >= 3)
       < (p_req->>'weekly_podium_first_count')::integer THEN RETURN 'weekly_podium_first_count'; END IF;
  IF p_req ? 'weekly_podium_second_count' AND (SELECT count(*) FROM public.weekly_case_placements wp WHERE wp.user_id = p_user AND wp.rank = 2 AND wp.board_size >= 3)
       < (p_req->>'weekly_podium_second_count')::integer THEN RETURN 'weekly_podium_second_count'; END IF;
  IF p_req ? 'weekly_podium_third_count' AND (SELECT count(*) FROM public.weekly_case_placements wp WHERE wp.user_id = p_user AND wp.rank = 3 AND wp.board_size >= 3)
       < (p_req->>'weekly_podium_third_count')::integer THEN RETURN 'weekly_podium_third_count'; END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.shop_unmet_requirement(uuid, jsonb) FROM anon, authenticated, public;

NOTIFY pgrst, 'reload schema';
