-- Streak becomes a LOCAL calendar-day fact, computed from daily_completions
-- (whose completion_date is already the learner's local date), instead of a
-- UTC date comparison with a rolling 48h expiry.

CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When the authoritative local-day recompute is running, do not second-guess it.
  IF current_setting('marketlingo.streak_authoritative', true) = 'on' THEN
    IF NEW.current_streak > COALESCE(OLD.longest_streak, 0) THEN
      NEW.longest_streak := NEW.current_streak;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  IF OLD.streak_expires_at IS NOT NULL AND OLD.streak_expires_at < NOW() THEN
    NEW.current_streak := 1;
  ELSE
    IF OLD.last_activity_at IS NULL OR
       DATE(OLD.last_activity_at AT TIME ZONE 'UTC') < DATE(NOW() AT TIME ZONE 'UTC') THEN
      NEW.current_streak := COALESCE(OLD.current_streak, 0) + 1;
    END IF;
  END IF;

  IF NEW.current_streak > COALESCE(OLD.longest_streak, 0) THEN
    NEW.longest_streak := NEW.current_streak;
  END IF;

  NEW.streak_expires_at := NOW() + INTERVAL '48 hours';
  NEW.last_activity_at := NOW();
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$function$;

-- Recompute the caller's streak for one market from their own local dates.
-- p_today is the learner's LOCAL calendar date, supplied by the client.
CREATE OR REPLACE FUNCTION public.sync_local_streak(p_market_id text, p_today date)
RETURNS public.user_progress
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_cursor date;
  v_streak integer := 0;
  v_row public.user_progress;
  v_done boolean;
  v_frozen boolean;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Start from today when today is done, otherwise from yesterday: the day is
  -- only lost once the learner's local midnight has passed unfinished.
  SELECT EXISTS (
    SELECT 1 FROM public.daily_completions
    WHERE user_id = v_user AND market_id = p_market_id
      AND completion_date = p_today AND lesson_completed
  ) INTO v_done;

  v_cursor := CASE WHEN v_done THEN p_today ELSE p_today - 1 END;

  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.daily_completions
      WHERE user_id = v_user AND market_id = p_market_id
        AND completion_date = v_cursor AND lesson_completed
    ) INTO v_done;

    IF NOT v_done THEN
      -- A used streak freeze keeps the chain alive for that single day.
      SELECT EXISTS (
        SELECT 1 FROM public.streak_freezes
        WHERE user_id = v_user AND market_id = p_market_id
          AND (used_at AT TIME ZONE 'UTC')::date = v_cursor
      ) INTO v_frozen;
      IF NOT v_frozen THEN
        EXIT;
      END IF;
    END IF;

    v_streak := v_streak + 1;
    v_cursor := v_cursor - 1;
    IF v_streak >= 400 THEN EXIT; END IF;
  END LOOP;

  PERFORM set_config('marketlingo.streak_authoritative', 'on', true);

  UPDATE public.user_progress
  SET current_streak = v_streak,
      longest_streak = GREATEST(COALESCE(longest_streak, 0), v_streak),
      -- Expires at the end of the learner's next local day.
      streak_expires_at = ((p_today + 2)::timestamp AT TIME ZONE 'UTC'),
      last_activity_at = NOW()
  WHERE user_id = v_user AND market_id = p_market_id
  RETURNING * INTO v_row;

  PERFORM set_config('marketlingo.streak_authoritative', 'off', true);

  RETURN v_row;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.sync_local_streak(text, date) TO authenticated;
