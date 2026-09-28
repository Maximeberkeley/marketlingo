ALTER TABLE public.streak_freezes ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'rescue';
DROP INDEX IF EXISTS public.idx_streak_freeze_user_week;
CREATE UNIQUE INDEX idx_streak_freeze_user_week ON public.streak_freezes (user_id, market_id, week_of, kind);

CREATE OR REPLACE FUNCTION public.leo_streak_gift(p_market_id text, p_today date, p_claim boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_week date := (p_today - ((EXTRACT(ISODOW FROM p_today)::int) - 1));
  v_missed date := p_today - 1;
  v_prior integer := 0;
  v_cursor date := p_today - 2;
  v_row public.user_progress;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_today < CURRENT_DATE - 1 OR p_today > CURRENT_DATE + 1 THEN RAISE EXCEPTION 'invalid day'; END IF;

  IF EXISTS (SELECT 1 FROM streak_freezes WHERE user_id=v_user AND market_id=p_market_id AND week_of=v_week AND kind='leo_gift') THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'used_this_week');
  END IF;
  -- yesterday must be a genuine miss
  IF EXISTS (SELECT 1 FROM daily_completions WHERE user_id=v_user AND market_id=p_market_id AND completion_date=v_missed AND (lesson_completed OR demo_completed))
     OR EXISTS (SELECT 1 FROM streak_freezes WHERE user_id=v_user AND market_id=p_market_id AND (used_at AT TIME ZONE 'UTC')::date = v_missed) THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'no_gap');
  END IF;
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM daily_completions WHERE user_id=v_user AND market_id=p_market_id AND completion_date=v_cursor AND (lesson_completed OR demo_completed))
      AND NOT EXISTS (SELECT 1 FROM streak_freezes WHERE user_id=v_user AND market_id=p_market_id AND (used_at AT TIME ZONE 'UTC')::date = v_cursor);
    v_prior := v_prior + 1; v_cursor := v_cursor - 1;
    EXIT WHEN v_prior >= 400;
  END LOOP;
  IF v_prior < 1 THEN RETURN jsonb_build_object('eligible', false, 'reason', 'no_streak'); END IF;
  IF NOT p_claim THEN RETURN jsonb_build_object('eligible', true, 'lost_streak', v_prior); END IF;

  INSERT INTO streak_freezes (user_id, market_id, week_of, kind, used_at)
  VALUES (v_user, p_market_id, v_week, 'leo_gift', (v_missed::timestamp + interval '12 hours') AT TIME ZONE 'UTC')
  ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN jsonb_build_object('eligible', false, 'reason', 'used_this_week'); END IF;
  v_row := public.sync_local_streak(p_market_id, p_today);
  RETURN jsonb_build_object('eligible', true, 'claimed', true, 'streak', COALESCE(v_row.current_streak, v_prior + 1));
END $$;
GRANT EXECUTE ON FUNCTION public.leo_streak_gift(text, date, boolean) TO authenticated;