ALTER TABLE public.daily_completions
  ADD COLUMN IF NOT EXISTS demo_completed BOOLEAN NOT NULL DEFAULT false;

GRANT SELECT, INSERT, UPDATE ON public.daily_completions TO authenticated;
GRANT ALL ON public.daily_completions TO service_role;

COMMENT ON COLUMN public.daily_completions.demo_completed IS 'True when the universal onboarding demo earned the local-day streak without completing a curriculum lesson.';

CREATE OR REPLACE FUNCTION public.sync_local_streak(p_market_id text, p_today date)
RETURNS public.user_progress
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_cursor date;
  v_streak integer := 0;
  v_row public.user_progress;
  v_done boolean;
  v_frozen boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.daily_completions
    WHERE user_id = v_user AND market_id = p_market_id
      AND completion_date = p_today AND (lesson_completed OR demo_completed)
  ) INTO v_done;

  v_cursor := CASE WHEN v_done THEN p_today ELSE p_today - 1 END;

  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.daily_completions
      WHERE user_id = v_user AND market_id = p_market_id
        AND completion_date = v_cursor AND (lesson_completed OR demo_completed)
    ) INTO v_done;

    IF NOT v_done THEN
      SELECT EXISTS (
        SELECT 1 FROM public.streak_freezes
        WHERE user_id = v_user AND market_id = p_market_id
          AND (used_at AT TIME ZONE 'UTC')::date = v_cursor
      ) INTO v_frozen;
      IF NOT v_frozen THEN EXIT; END IF;
    END IF;

    v_streak := v_streak + 1;
    v_cursor := v_cursor - 1;
    IF v_streak >= 400 THEN EXIT; END IF;
  END LOOP;

  PERFORM set_config('marketlingo.streak_authoritative', 'on', true);
  UPDATE public.user_progress
  SET current_streak = v_streak,
      longest_streak = GREATEST(COALESCE(longest_streak, 0), v_streak),
      streak_expires_at = ((p_today + 2)::timestamp AT TIME ZONE 'UTC'),
      last_activity_at = NOW()
  WHERE user_id = v_user AND market_id = p_market_id
  RETURNING * INTO v_row;
  PERFORM set_config('marketlingo.streak_authoritative', 'off', true);
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_demo_onboarding_reward(p_market_id text, p_today date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_reward constant integer := 20;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.xp_transactions
    WHERE user_id = v_user AND source_type = 'demo_bridge'
  ) THEN
    RETURN 0;
  END IF;

  INSERT INTO public.user_xp (user_id, market_id, total_xp, current_level, xp_to_next_level, startup_stage)
  VALUES (v_user, p_market_id, 0, 1, 100, 1)
  ON CONFLICT (user_id, market_id) DO NOTHING;

  INSERT INTO public.xp_transactions (user_id, market_id, xp_amount, source_type, description)
  VALUES (v_user, p_market_id, v_reward, 'demo_bridge', 'Universal AI demo starting reward');

  PERFORM public.increment_user_xp(v_user, p_market_id, v_reward);

  INSERT INTO public.daily_completions (
    user_id, market_id, completion_date, lesson_completed, demo_completed, xp_earned
  ) VALUES (
    v_user, p_market_id, p_today, false, true, v_reward
  )
  ON CONFLICT (user_id, market_id, completion_date) DO UPDATE
  SET demo_completed = true,
      xp_earned = public.daily_completions.xp_earned + v_reward;

  UPDATE public.profiles
  SET demo_onboarding_status = 'completed', updated_at = now()
  WHERE id = v_user;

  PERFORM public.sync_local_streak(p_market_id, p_today);
  RETURN v_reward;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_demo_onboarding_reward(text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_demo_onboarding_reward(text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_demo_onboarding_reward(text, date) TO service_role;