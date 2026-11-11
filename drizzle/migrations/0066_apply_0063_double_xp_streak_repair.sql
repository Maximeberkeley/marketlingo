-- Founder decisions (Nov 11):
--   * Weekly Case pays 200 XP (normal XP earned: counts for races and the crown). The phone pays it; nothing here.
--   * Double XP is earn-only: every submitted Weekly Case grants one 15-minute token, never sold. It counts for
--     races because everyone earns it the same way. The learner starts it when they choose.
--   * Streak Repair costs 1,200 XP: within 48 hours of the break (at most 2 missed local days), for a lost
--     streak of 7+ days, once every 30 days. It covers the missed days the way a freeze does.
-- Also: the streak recompute now reads a freeze's own local day (freeze_date) when it has one, instead of the
-- UTC day it was used on, so a bought freeze used in the evening (Pacific) covers the right day.
-- Safe to run again.

-- ── Catalog rows (power-ups are not sold through shop_purchase) ─────────────
INSERT INTO public.shop_items (id, kind, slot, rarity, name, price, acquisition, requirements, meta, status, art_ready, hidden) VALUES
  ('double-xp', 'powerup', NULL, NULL, 'Double XP', NULL, 'reward', '{}'::jsonb, '{"minutes":15,"earned_by":"weekly_case"}'::jsonb, 'live', true, true),
  ('streak-repair', 'powerup', NULL, NULL, 'Streak Repair', 1200, 'purchase', '{}'::jsonb, '{"max_missed_days":2,"min_streak":7,"cooldown_days":30}'::jsonb, 'live', true, true)
ON CONFLICT (id) DO UPDATE SET
  kind = EXCLUDED.kind, slot = EXCLUDED.slot, rarity = EXCLUDED.rarity, name = EXCLUDED.name, price = EXCLUDED.price,
  acquisition = EXCLUDED.acquisition, requirements = EXCLUDED.requirements, meta = EXCLUDED.meta, status = EXCLUDED.status,
  art_ready = EXCLUDED.art_ready, hidden = EXCLUDED.hidden;

-- ── Double XP ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_boosts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  double_xp_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_boosts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_boosts FROM anon, authenticated;
GRANT SELECT ON public.user_boosts TO authenticated;
GRANT ALL ON public.user_boosts TO service_role;
DROP POLICY IF EXISTS "Own boosts are readable" ON public.user_boosts;
CREATE POLICY "Own boosts are readable" ON public.user_boosts FOR SELECT TO authenticated USING (user_id = auth.uid());

-- One token per learner per Weekly Case, ever (a withdrawn and resubmitted answer does not earn twice).
CREATE TABLE IF NOT EXISTS public.double_xp_grants (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id uuid NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, case_id)
);
ALTER TABLE public.double_xp_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.double_xp_grants FROM anon, authenticated;
GRANT ALL ON public.double_xp_grants TO service_role;

CREATE OR REPLACE FUNCTION public.grant_double_xp_for_case()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status <> 'submitted' THEN RETURN NEW; END IF;
  INSERT INTO public.double_xp_grants (user_id, case_id) VALUES (NEW.user_id, NEW.case_id) ON CONFLICT DO NOTHING;
  IF FOUND THEN
    INSERT INTO public.user_inventory (user_id, item_id, qty, source) VALUES (NEW.user_id, 'double-xp', 1, 'reward')
    ON CONFLICT (user_id, item_id) DO UPDATE SET qty = public.user_inventory.qty + 1, seen_at = NULL;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.grant_double_xp_for_case() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS weekly_case_grants_double_xp ON public.weekly_case_submissions;
CREATE TRIGGER weekly_case_grants_double_xp
  AFTER INSERT OR UPDATE OF status ON public.weekly_case_submissions
  FOR EACH ROW EXECUTE FUNCTION public.grant_double_xp_for_case();

-- Starts a held token now: 15 minutes, one at a time.
CREATE OR REPLACE FUNCTION public.shop_use_double_xp()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_held integer;
  v_until timestamptz;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('shop:' || v_user::text));
  SELECT double_xp_until INTO v_until FROM public.user_boosts WHERE user_id = v_user;
  IF v_until IS NOT NULL AND v_until > now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'active', 'until', v_until);
  END IF;
  SELECT qty INTO v_held FROM public.user_inventory WHERE user_id = v_user AND item_id = 'double-xp' FOR UPDATE;
  IF COALESCE(v_held, 0) <= 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'none'); END IF;
  UPDATE public.user_inventory SET qty = qty - 1, seen_at = COALESCE(seen_at, now()) WHERE user_id = v_user AND item_id = 'double-xp';
  v_until := now() + interval '15 minutes';
  INSERT INTO public.user_boosts (user_id, double_xp_until, updated_at) VALUES (v_user, v_until, now())
  ON CONFLICT (user_id) DO UPDATE SET double_xp_until = EXCLUDED.double_xp_until, updated_at = now();
  RETURN jsonb_build_object('ok', true, 'until', v_until, 'held', v_held - 1);
END $$;
REVOKE ALL ON FUNCTION public.shop_use_double_xp() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shop_use_double_xp() TO authenticated;

-- ── Streak days: finished or frozen ─────────────────────────────────────────
-- Repair rows are keyed by the local day they cover, like bought freezes; the weekly-free index ignores both.
DROP INDEX IF EXISTS public.idx_streak_freeze_user_week;
CREATE UNIQUE INDEX IF NOT EXISTS idx_streak_freeze_user_week ON public.streak_freezes (user_id, market_id, week_of, kind) WHERE kind NOT IN ('shop', 'repair');
CREATE UNIQUE INDEX IF NOT EXISTS idx_streak_freeze_repair_day ON public.streak_freezes (user_id, market_id, freeze_date) WHERE kind = 'repair';

CREATE OR REPLACE FUNCTION public.streak_day_kept(p_user uuid, p_market_id text, p_day date)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.daily_completions
    WHERE user_id = p_user AND market_id = p_market_id AND completion_date = p_day AND (lesson_completed OR demo_completed)
  ) OR EXISTS (
    SELECT 1 FROM public.streak_freezes
    WHERE user_id = p_user AND market_id = p_market_id
      AND COALESCE(freeze_date, (used_at AT TIME ZONE 'UTC')::date) = p_day
  );
$$;
REVOKE ALL ON FUNCTION public.streak_day_kept(uuid, text, date) FROM anon, authenticated, public;

-- Same recompute as 0009, reading kept days through streak_day_kept.
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
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.daily_completions
    WHERE user_id = v_user AND market_id = p_market_id
      AND completion_date = p_today AND (lesson_completed OR demo_completed)
  ) INTO v_done;

  -- Start from today when today is done, otherwise from yesterday: a day is only lost after its local midnight.
  v_cursor := CASE WHEN v_done THEN p_today ELSE p_today - 1 END;

  LOOP
    EXIT WHEN NOT public.streak_day_kept(v_user, p_market_id, v_cursor);
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
GRANT EXECUTE ON FUNCTION public.sync_local_streak(text, date) TO authenticated;

-- ── Streak Repair ────────────────────────────────────────────────────────────
-- The rule, for one learner and market on their local day p_today:
--   last kept day L before today; missed = the days between L and today (none kept by definition).
--   no L in 400 days -> no_streak; 0 missed -> not_broken; more than 2 missed -> too_late (past 48 hours);
--   the run ending at L shorter than 7 -> too_short; a repair bought in the last 30 days -> used_recently.
CREATE OR REPLACE FUNCTION public.shop_repair_check(p_user uuid, p_market_id text, p_today date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_back integer := 1;
  v_lost integer := 0;
  v_missed date[] := ARRAY[]::date[];
  v_last_repair timestamptz;
  v_i integer;
BEGIN
  IF p_today NOT BETWEEN (now() AT TIME ZONE 'UTC')::date - 1 AND (now() AT TIME ZONE 'UTC')::date + 1 THEN
    RAISE EXCEPTION 'local date out of range';
  END IF;
  WHILE v_back <= 400 AND NOT public.streak_day_kept(p_user, p_market_id, p_today - v_back) LOOP
    v_back := v_back + 1;
  END LOOP;
  IF v_back > 400 THEN
    RETURN jsonb_build_object('reason', 'no_streak', 'lost_streak', 0, 'missed_days', '[]'::jsonb);
  END IF;
  IF v_back = 1 THEN
    RETURN jsonb_build_object('reason', 'not_broken', 'lost_streak', 0, 'missed_days', '[]'::jsonb);
  END IF;
  FOR v_i IN 1 .. v_back - 1 LOOP
    v_missed := v_missed || (p_today - v_back + v_i);
  END LOOP;
  WHILE v_lost < 400 AND public.streak_day_kept(p_user, p_market_id, p_today - v_back - v_lost) LOOP
    v_lost := v_lost + 1;
  END LOOP;
  IF v_back - 1 > 2 THEN
    RETURN jsonb_build_object('reason', 'too_late', 'lost_streak', v_lost, 'missed_days', to_jsonb(v_missed));
  END IF;
  IF v_lost < 7 THEN
    RETURN jsonb_build_object('reason', 'too_short', 'lost_streak', v_lost, 'missed_days', to_jsonb(v_missed));
  END IF;
  SELECT max(created_at) INTO v_last_repair FROM public.spend_ledger
  WHERE user_id = p_user AND item_id = 'streak-repair' AND amount > 0;
  IF v_last_repair IS NOT NULL AND v_last_repair > now() - interval '30 days' THEN
    RETURN jsonb_build_object('reason', 'used_recently', 'lost_streak', v_lost, 'missed_days', to_jsonb(v_missed),
      'available_again', v_last_repair + interval '30 days');
  END IF;
  RETURN jsonb_build_object('reason', 'eligible', 'lost_streak', v_lost, 'missed_days', to_jsonb(v_missed));
END $$;
REVOKE ALL ON FUNCTION public.shop_repair_check(uuid, text, date) FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.shop_repair_status(p_market_id text, p_today date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  RETURN public.shop_repair_check(auth.uid(), p_market_id, p_today) || jsonb_build_object('price', (SELECT price FROM public.shop_items WHERE id = 'streak-repair'));
END $$;
REVOKE ALL ON FUNCTION public.shop_repair_status(text, date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shop_repair_status(text, date) TO authenticated;

CREATE OR REPLACE FUNCTION public.shop_repair_streak(p_market_id text, p_today date, p_idem_key uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_item public.shop_items%ROWTYPE;
  v_check jsonb;
  v_balance integer;
  v_day date;
  v_row public.user_progress;
  v_streak integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF EXISTS (SELECT 1 FROM public.spend_ledger WHERE user_id = v_user AND idem_key = p_idem_key) THEN
    SELECT current_streak INTO v_streak FROM public.user_progress WHERE user_id = v_user AND market_id = p_market_id;
    RETURN jsonb_build_object('ok', true, 'replay', true, 'streak', COALESCE(v_streak, 0));
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('shop:' || v_user::text));

  SELECT * INTO v_item FROM public.shop_items WHERE id = 'streak-repair';
  IF NOT FOUND OR v_item.status <> 'live' OR v_item.price IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unavailable'); END IF;

  v_check := public.shop_repair_check(v_user, p_market_id, p_today);
  IF v_check->>'reason' <> 'eligible' THEN RETURN jsonb_build_object('ok', false, 'error', v_check->>'reason'); END IF;

  SELECT balance INTO v_balance FROM public.shop_balance();
  IF COALESCE(v_balance, 0) < v_item.price THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_enough', 'balance', COALESCE(v_balance, 0), 'price', v_item.price);
  END IF;

  INSERT INTO public.spend_ledger (user_id, item_id, amount, idem_key, reason)
  VALUES (v_user, 'streak-repair', v_item.price, p_idem_key, 'purchase');

  -- used_at sits at noon UTC of the covered day, so older readers of used_at agree with freeze_date.
  FOR v_day IN SELECT (d #>> '{}')::date FROM jsonb_array_elements(v_check->'missed_days') d LOOP
    INSERT INTO public.streak_freezes (user_id, market_id, week_of, kind, freeze_date, used_at)
    VALUES (v_user, p_market_id, date_trunc('week', v_day)::date, 'repair', v_day, (v_day::timestamp + interval '12 hours') AT TIME ZONE 'UTC')
    ON CONFLICT DO NOTHING;
  END LOOP;

  v_row := public.sync_local_streak(p_market_id, p_today);
  RETURN jsonb_build_object('ok', true, 'streak', v_row.current_streak, 'balance', v_balance - v_item.price,
    'lost_streak', (v_check->>'lost_streak')::integer);
END $$;
REVOKE ALL ON FUNCTION public.shop_repair_streak(text, date, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shop_repair_streak(text, date, uuid) TO authenticated;