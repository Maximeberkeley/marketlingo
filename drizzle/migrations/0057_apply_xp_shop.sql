-- XP Shop: one user-facing balance called XP, Leo cosmetics, streak freezes, perks on a waitlist, earn-only rewards.
--
-- XP earned stays exactly as today (user_xp.total_xp and xp_transactions, append-only) and keeps driving friend
-- races, the crown, levels and milestones. Spending is a separate ledger: balance = earned - spent, computed by
-- shop_balance(), with no second counter to drift. Nothing here lowers XP earned.
-- The phone never writes these tables: every change goes through the security-definer functions below.

-- ── Catalog ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shop_items (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('cosmetic', 'freeze', 'powerup', 'perk', 'bundle')),
  slot text CHECK (slot IN ('background', 'cape', 'outfit', 'glasses', 'hat', 'held', 'frame')),
  rarity text CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  name text NOT NULL,
  -- null for earn-only and free items
  price integer CHECK (price IS NULL OR price > 0),
  acquisition text NOT NULL DEFAULT 'purchase' CHECK (acquisition IN ('purchase', 'reward', 'default')),
  -- {"min_streak_days": 30}, {"requires_weekly_case_submission": true} ... checked here, never on the phone
  requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- bundles: {"items": [...]}; cosmetics: {"collection": "..."}
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'coming_soon', 'ended')),
  -- the phone only sells items whose art it ships; daily deals only pick these
  art_ready boolean NOT NULL DEFAULT false,
  hidden boolean NOT NULL DEFAULT false,
  stock_total integer,
  stock_left integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shop_items FROM anon, authenticated;
GRANT SELECT ON public.shop_items TO authenticated;
GRANT ALL ON public.shop_items TO service_role;
DROP POLICY IF EXISTS "Shop items are readable" ON public.shop_items;
CREATE POLICY "Shop items are readable" ON public.shop_items FOR SELECT TO authenticated USING (true);

-- ── What each learner owns, wears, spent, and asked for ─────────────────────
CREATE TABLE IF NOT EXISTS public.user_inventory (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL REFERENCES public.shop_items(id),
  qty integer NOT NULL DEFAULT 1 CHECK (qty >= 0),
  source text NOT NULL CHECK (source IN ('purchase', 'reward', 'default', 'gift')),
  acquired_at timestamptz NOT NULL DEFAULT now(),
  -- null until the phone has celebrated it (drives the "New" dot and the one-time rewards row)
  seen_at timestamptz,
  PRIMARY KEY (user_id, item_id)
);
CREATE TABLE IF NOT EXISTS public.user_equipped (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot text NOT NULL CHECK (slot IN ('background', 'cape', 'outfit', 'glasses', 'hat', 'held', 'frame')),
  -- null = this slot left empty on purpose (a bare head instead of the default cap)
  item_id text REFERENCES public.shop_items(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, slot)
);
CREATE TABLE IF NOT EXISTS public.spend_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL REFERENCES public.shop_items(id),
  -- positive = spent; a refund is a new negative row pointing at the original
  amount integer NOT NULL,
  idem_key uuid NOT NULL,
  ref_id uuid REFERENCES public.spend_ledger(id),
  reason text NOT NULL DEFAULT 'purchase',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idem_key)
);
CREATE INDEX IF NOT EXISTS spend_ledger_user ON public.spend_ledger (user_id);
CREATE TABLE IF NOT EXISTS public.perk_waitlist (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL REFERENCES public.shop_items(id),
  consent_email boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE TABLE IF NOT EXISTS public.user_milestones (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone integer NOT NULL,
  reached_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, milestone)
);
-- Months a learner topped their friend board at close; the keepsake's quantity is their count.
CREATE TABLE IF NOT EXISTS public.crown_wins (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month date NOT NULL,
  monthly_xp integer NOT NULL,
  PRIMARY KEY (user_id, month)
);
-- The day's three deals: written once per date by shop_daily_deals, then the only discounts shop_purchase honours.
CREATE TABLE IF NOT EXISTS public.shop_deals (
  deal_date date NOT NULL,
  item_id text NOT NULL REFERENCES public.shop_items(id),
  price integer NOT NULL CHECK (price > 0),
  PRIMARY KEY (deal_date, item_id)
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['user_inventory', 'user_equipped', 'spend_ledger', 'perk_waitlist', 'user_milestones', 'crown_wins'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('DROP POLICY IF EXISTS "Own rows are readable" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Own rows are readable" ON public.%I FOR SELECT TO authenticated USING (user_id = auth.uid())', t);
  END LOOP;
END $$;
ALTER TABLE public.shop_deals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shop_deals FROM anon, authenticated;
GRANT SELECT ON public.shop_deals TO authenticated;
GRANT ALL ON public.shop_deals TO service_role;
DROP POLICY IF EXISTS "Deals are readable" ON public.shop_deals;
CREATE POLICY "Deals are readable" ON public.shop_deals FOR SELECT TO authenticated USING (true);

-- ── Streak freezes: one free a week, plus bought ones ───────────────────────
-- A bought freeze is keyed by the local day it covers, so two can be used in one week.
ALTER TABLE public.streak_freezes ADD COLUMN IF NOT EXISTS freeze_date date;
DROP INDEX IF EXISTS public.idx_streak_freeze_user_week;
CREATE UNIQUE INDEX IF NOT EXISTS idx_streak_freeze_user_week ON public.streak_freezes (user_id, market_id, week_of, kind) WHERE kind <> 'shop';
CREATE UNIQUE INDEX IF NOT EXISTS idx_streak_freeze_shop_day ON public.streak_freezes (user_id, market_id, freeze_date) WHERE kind = 'shop';


-- ── XP earned and the balance ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.shop_xp_earned(p_user uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(SUM(total_xp), 0)::integer FROM public.user_xp WHERE user_id = p_user;
$$;
REVOKE ALL ON FUNCTION public.shop_xp_earned(uuid) FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.shop_balance()
RETURNS TABLE(earned integer, spent integer, balance integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH e AS (SELECT public.shop_xp_earned(auth.uid()) AS v),
       s AS (SELECT COALESCE(SUM(amount), 0)::integer AS v FROM public.spend_ledger WHERE user_id = auth.uid())
  SELECT e.v, s.v, GREATEST(0, e.v - s.v) FROM e, s WHERE auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.shop_balance() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shop_balance() TO authenticated;

-- ── Requirements (one mechanism for gates and earn-only rewards) ────────────
-- Best streak ever, never the current one: a freeze or a missed day must not revoke a reward.
CREATE OR REPLACE FUNCTION public.shop_weekly_case_top3(p_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH circle AS (
    SELECT p_user AS uid
    UNION
    SELECT CASE WHEN fs.user_id = p_user THEN fs.friend_id ELSE fs.user_id END
    FROM public.friendships fs WHERE fs.status = 'accepted' AND p_user IN (fs.user_id, fs.friend_id)
  ), mine AS (
    SELECT case_id, score FROM public.weekly_case_submissions
    WHERE user_id = p_user AND status = 'submitted' AND released_at IS NOT NULL AND score IS NOT NULL
  )
  SELECT EXISTS (
    SELECT 1 FROM mine m
    WHERE (SELECT count(*) FROM public.weekly_case_submissions s JOIN circle c ON c.uid = s.user_id
           WHERE s.case_id = m.case_id AND s.status = 'submitted' AND s.released_at IS NOT NULL AND s.score IS NOT NULL) >= 3
      AND (SELECT count(*) FROM public.weekly_case_submissions s JOIN circle c ON c.uid = s.user_id
           WHERE s.case_id = m.case_id AND s.status = 'submitted' AND s.released_at IS NOT NULL AND s.score > m.score) < 3
  );
$$;
REVOKE ALL ON FUNCTION public.shop_weekly_case_top3(uuid) FROM anon, authenticated, public;

-- Returns the first requirement key the learner has not met, or null when all are met.
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
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.shop_unmet_requirement(uuid, jsonb) FROM anon, authenticated, public;

-- ── Daily deals: three items a day, the same for everyone ───────────────────
CREATE OR REPLACE FUNCTION public.shop_daily_deals(p_date date)
RETURNS TABLE(item_id text, price integer, deal_price integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
#variable_conflict use_column
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  -- local dates run up to a day either side of the server's
  IF p_date NOT BETWEEN (now() AT TIME ZONE 'UTC')::date - 1 AND (now() AT TIME ZONE 'UTC')::date + 1 THEN
    RAISE EXCEPTION 'deal date out of range';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.shop_deals d WHERE d.deal_date = p_date) THEN
    INSERT INTO public.shop_deals (deal_date, item_id, price)
    SELECT p_date, si.id, GREATEST(10, (round(si.price * 0.7 / 10.0) * 10)::integer)
    FROM public.shop_items si
    WHERE si.kind = 'cosmetic' AND si.acquisition = 'purchase' AND si.status = 'live' AND si.art_ready AND NOT si.hidden
    ORDER BY md5(p_date::text || '|' || si.id)
    LIMIT 3
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN QUERY
    SELECT d.item_id, si.price, d.price FROM public.shop_deals d JOIN public.shop_items si ON si.id = d.item_id
    WHERE d.deal_date = p_date ORDER BY d.item_id;
END $$;
REVOKE ALL ON FUNCTION public.shop_daily_deals(date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shop_daily_deals(date) TO authenticated;

-- ── Buying ──────────────────────────────────────────────────────────────────
-- One lock per learner (two taps cannot both pass the balance check), an idempotency key per tap (a retry returns
-- the first result), requirements checked here, and an append-only ledger.
CREATE OR REPLACE FUNCTION public.shop_purchase(p_item_id text, p_idem_key uuid, p_deal_date date DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_item public.shop_items%ROWTYPE;
  v_price integer;
  v_deal integer;
  v_held integer;
  v_unmet text;
  v_balance integer;
  v_ledger uuid;
  v_part text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF EXISTS (SELECT 1 FROM public.spend_ledger WHERE user_id = v_user AND idem_key = p_idem_key) THEN
    SELECT balance INTO v_balance FROM public.shop_balance();
    RETURN jsonb_build_object('ok', true, 'replay', true, 'item_id', p_item_id, 'balance', v_balance);
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('shop:' || v_user::text));

  SELECT * INTO v_item FROM public.shop_items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF v_item.status <> 'live' THEN RETURN jsonb_build_object('ok', false, 'error', 'coming_soon'); END IF;
  IF v_item.acquisition <> 'purchase' OR v_item.price IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'earn_only'); END IF;
  IF v_item.kind NOT IN ('cosmetic', 'freeze', 'bundle') THEN RETURN jsonb_build_object('ok', false, 'error', 'coming_soon'); END IF;
  IF v_item.stock_left IS NOT NULL AND v_item.stock_left <= 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'sold_out'); END IF;

  IF v_item.kind = 'cosmetic' AND EXISTS (SELECT 1 FROM public.user_inventory WHERE user_id = v_user AND item_id = p_item_id AND qty > 0) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'owned');
  END IF;
  IF v_item.kind = 'bundle' AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(v_item.meta->'items') x(id)
    WHERE NOT EXISTS (SELECT 1 FROM public.user_inventory ui WHERE ui.user_id = v_user AND ui.item_id = x.id AND ui.qty > 0)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'owned');
  END IF;
  IF v_item.kind = 'freeze' THEN
    SELECT COALESCE(qty, 0) INTO v_held FROM public.user_inventory WHERE user_id = v_user AND item_id = p_item_id;
    IF COALESCE(v_held, 0) >= 2 THEN RETURN jsonb_build_object('ok', false, 'error', 'max_held'); END IF;
  END IF;

  v_unmet := public.shop_unmet_requirement(v_user, v_item.requirements);
  IF v_unmet IS NOT NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'requirement_not_met', 'requirement', v_unmet); END IF;

  v_price := v_item.price;
  IF p_deal_date IS NOT NULL AND p_deal_date BETWEEN (now() AT TIME ZONE 'UTC')::date - 1 AND (now() AT TIME ZONE 'UTC')::date + 1 THEN
    SELECT price INTO v_deal FROM public.shop_deals WHERE deal_date = p_deal_date AND item_id = p_item_id;
    IF v_deal IS NOT NULL THEN v_price := LEAST(v_price, v_deal); END IF;
  END IF;

  SELECT balance INTO v_balance FROM public.shop_balance();
  IF COALESCE(v_balance, 0) < v_price THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_enough', 'balance', COALESCE(v_balance, 0), 'price', v_price);
  END IF;

  INSERT INTO public.spend_ledger (user_id, item_id, amount, idem_key, reason)
  VALUES (v_user, p_item_id, v_price, p_idem_key, CASE WHEN v_deal IS NOT NULL THEN 'deal' ELSE 'purchase' END)
  RETURNING id INTO v_ledger;

  IF v_item.kind = 'freeze' THEN
    INSERT INTO public.user_inventory (user_id, item_id, qty, source) VALUES (v_user, p_item_id, 1, 'purchase')
    ON CONFLICT (user_id, item_id) DO UPDATE SET qty = public.user_inventory.qty + 1;
  ELSIF v_item.kind = 'bundle' THEN
    FOR v_part IN SELECT jsonb_array_elements_text(v_item.meta->'items') LOOP
      INSERT INTO public.user_inventory (user_id, item_id, qty, source, seen_at) VALUES (v_user, v_part, 1, 'purchase', now())
      ON CONFLICT (user_id, item_id) DO NOTHING;
    END LOOP;
  ELSE
    INSERT INTO public.user_inventory (user_id, item_id, qty, source, seen_at) VALUES (v_user, p_item_id, 1, 'purchase', now())
    ON CONFLICT (user_id, item_id) DO UPDATE SET qty = GREATEST(public.user_inventory.qty, 1);
  END IF;
  IF v_item.stock_left IS NOT NULL THEN UPDATE public.shop_items SET stock_left = stock_left - 1 WHERE id = p_item_id; END IF;

  RETURN jsonb_build_object('ok', true, 'item_id', p_item_id, 'price', v_price, 'balance', v_balance - v_price, 'ledger_id', v_ledger);
END $$;
REVOKE ALL ON FUNCTION public.shop_purchase(text, uuid, date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shop_purchase(text, uuid, date) TO authenticated;

-- ── Wearing ─────────────────────────────────────────────────────────────────
-- p_item_id null leaves the slot empty on purpose. The live crown is never equipped: it is worn while held.
CREATE OR REPLACE FUNCTION public.shop_equip(p_slot text, p_item_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_item public.shop_items%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF p_slot NOT IN ('background', 'cape', 'outfit', 'glasses', 'hat', 'held', 'frame') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bad_slot');
  END IF;
  IF p_item_id IS NOT NULL THEN
    SELECT * INTO v_item FROM public.shop_items WHERE id = p_item_id;
    IF NOT FOUND OR v_item.kind <> 'cosmetic' OR v_item.slot <> p_slot OR v_item.requirements ? 'crown_live' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'bad_item');
    END IF;
    IF v_item.acquisition <> 'default' AND NOT EXISTS (
      SELECT 1 FROM public.user_inventory WHERE user_id = v_user AND item_id = p_item_id AND qty > 0
    ) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_owned');
    END IF;
  END IF;
  INSERT INTO public.user_equipped (user_id, slot, item_id, updated_at) VALUES (v_user, p_slot, p_item_id, now())
  ON CONFLICT (user_id, slot) DO UPDATE SET item_id = EXCLUDED.item_id, updated_at = now();
  RETURN jsonb_build_object('ok', true, 'slot', p_slot, 'item_id', p_item_id);
END $$;
REVOKE ALL ON FUNCTION public.shop_equip(text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shop_equip(text, text) TO authenticated;

-- ── The crown: worn live by whoever tops their own friend board this month ──
-- Board = the learner and their accepted friends; monthly XP earned from xp_transactions (as get_friends_overview);
-- at least two people and more than zero XP. Ties go to whoever reached the total first.
CREATE OR REPLACE FUNCTION public.shop_wears_crown(p_user uuid, p_month date DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH bounds AS (
    SELECT COALESCE(p_month, date_trunc('month', now() AT TIME ZONE 'UTC')::date) AS m0
  ), circle AS (
    SELECT p_user AS uid
    UNION
    SELECT CASE WHEN fs.user_id = p_user THEN fs.friend_id ELSE fs.user_id END
    FROM public.friendships fs WHERE fs.status = 'accepted' AND p_user IN (fs.user_id, fs.friend_id)
  ), board AS (
    SELECT c.uid, COALESCE(SUM(xt.xp_amount), 0) AS xp, MAX(xt.created_at) AS last_at
    FROM circle c CROSS JOIN bounds b
    LEFT JOIN public.xp_transactions xt ON xt.user_id = c.uid
      AND xt.created_at >= (b.m0::timestamp AT TIME ZONE 'UTC')
      AND xt.created_at < ((b.m0 + interval '1 month')::timestamp AT TIME ZONE 'UTC')
    GROUP BY c.uid
  ), ranked AS (
    SELECT uid, xp, row_number() OVER (ORDER BY xp DESC, last_at ASC NULLS LAST, uid) AS rn FROM board
  )
  SELECT (SELECT count(*) FROM board) >= 2 AND EXISTS (SELECT 1 FROM ranked WHERE rn = 1 AND uid = p_user AND xp > 0);
$$;
REVOKE ALL ON FUNCTION public.shop_wears_crown(uuid, date) FROM anon, authenticated, public;

-- Looks for the learner and their friends only, with whether each wears the crown right now.
CREATE OR REPLACE FUNCTION public.get_equipped_looks(p_user_ids uuid[])
RETURNS TABLE(user_id uuid, look jsonb, wears_crown boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH allowed AS (
    SELECT u AS uid FROM unnest(p_user_ids[1:100]) u
    WHERE u = auth.uid() OR EXISTS (
      SELECT 1 FROM public.friendships fs WHERE fs.status = 'accepted'
        AND ((fs.user_id = auth.uid() AND fs.friend_id = u) OR (fs.friend_id = auth.uid() AND fs.user_id = u))
    )
  )
  SELECT a.uid,
         COALESCE((SELECT jsonb_object_agg(ue.slot, ue.item_id) FROM public.user_equipped ue WHERE ue.user_id = a.uid), '{}'::jsonb),
         public.shop_wears_crown(a.uid)
  FROM allowed a WHERE auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.get_equipped_looks(uuid[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_equipped_looks(uuid[]) TO authenticated;

-- Month close: each learner who topped their own board keeps a crown keepsake (quantity = months won).
CREATE OR REPLACE FUNCTION public.grant_crown_keepsakes(p_month date)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_m0 date := date_trunc('month', p_month)::date;
  v_count integer := 0;
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT xt.user_id FROM public.xp_transactions xt
    WHERE xt.created_at >= (v_m0::timestamp AT TIME ZONE 'UTC') AND xt.created_at < ((v_m0 + interval '1 month')::timestamp AT TIME ZONE 'UTC')
  LOOP
    IF public.shop_wears_crown(r.user_id, v_m0) THEN
      INSERT INTO public.crown_wins (user_id, month, monthly_xp)
      SELECT r.user_id, v_m0, COALESCE(SUM(xp_amount), 0) FROM public.xp_transactions
      WHERE user_id = r.user_id AND created_at >= (v_m0::timestamp AT TIME ZONE 'UTC') AND created_at < ((v_m0 + interval '1 month')::timestamp AT TIME ZONE 'UTC')
      ON CONFLICT (user_id, month) DO NOTHING;
      IF FOUND THEN
        INSERT INTO public.user_inventory (user_id, item_id, qty, source) VALUES (r.user_id, 'monthly-crown-keepsake', 1, 'reward')
        ON CONFLICT (user_id, item_id) DO UPDATE SET qty = (SELECT count(*) FROM public.crown_wins cw WHERE cw.user_id = r.user_id), seen_at = NULL;
        v_count := v_count + 1;
      END IF;
    END IF;
  END LOOP;
  RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION public.grant_crown_keepsakes(date) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.grant_crown_keepsakes(date) TO service_role;

-- ── Earn-only rewards and milestones ────────────────────────────────────────
-- Idempotent: the primary keys stop double grants, so this runs after lessons, cases and on app focus.
-- Returns only what was granted by this call, so the phone celebrates exactly that. Rewards are never revoked.
CREATE OR REPLACE FUNCTION public.shop_check_rewards()
RETURNS TABLE(item_id text, name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
#variable_conflict use_column
DECLARE
  v_user uuid := auth.uid();
  v_earned integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  v_earned := public.shop_xp_earned(v_user);
  INSERT INTO public.user_milestones (user_id, milestone)
  SELECT v_user, m FROM unnest(ARRAY[1000, 2500, 5000, 10000, 25000, 50000, 100000]) m WHERE m <= v_earned
  ON CONFLICT DO NOTHING;
  RETURN QUERY
    WITH due AS (
      SELECT si.id, si.name FROM public.shop_items si
      WHERE si.kind = 'cosmetic' AND si.acquisition = 'reward' AND si.status = 'live'
        AND NOT (si.requirements ? 'crown_live') AND NOT (si.requirements ? 'crown_keepsake')
        AND NOT EXISTS (SELECT 1 FROM public.user_inventory ui WHERE ui.user_id = v_user AND ui.item_id = si.id)
        AND public.shop_unmet_requirement(v_user, si.requirements) IS NULL
    ), granted AS (
      INSERT INTO public.user_inventory (user_id, item_id, qty, source)
      SELECT v_user, due.id, 1, 'reward' FROM due
      ON CONFLICT (user_id, item_id) DO NOTHING
      RETURNING user_inventory.item_id
    )
    SELECT g.item_id, si.name FROM granted g JOIN public.shop_items si ON si.id = g.item_id;
END $$;
REVOKE ALL ON FUNCTION public.shop_check_rewards() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shop_check_rewards() TO authenticated;

CREATE OR REPLACE FUNCTION public.shop_mark_seen(p_item_ids text[])
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE public.user_inventory SET seen_at = now()
  WHERE user_id = auth.uid() AND item_id = ANY (p_item_ids) AND seen_at IS NULL;
$$;
REVOKE ALL ON FUNCTION public.shop_mark_seen(text[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shop_mark_seen(text[]) TO authenticated;

-- ── Perks: Coming soon, with a waitlist per perk ────────────────────────────
CREATE OR REPLACE FUNCTION public.shop_join_waitlist(p_item_id text, p_consent boolean DEFAULT false)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.shop_items WHERE id = p_item_id AND kind = 'perk') THEN RAISE EXCEPTION 'not a perk'; END IF;
  INSERT INTO public.perk_waitlist (user_id, item_id, consent_email) VALUES (auth.uid(), p_item_id, p_consent)
  ON CONFLICT (user_id, item_id) DO UPDATE SET consent_email = public.perk_waitlist.consent_email OR EXCLUDED.consent_email;
  RETURN (SELECT count(*)::integer FROM public.perk_waitlist WHERE item_id = p_item_id);
END $$;
REVOKE ALL ON FUNCTION public.shop_join_waitlist(text, boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shop_join_waitlist(text, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.shop_perks()
RETURNS TABLE(item_id text, waitlist integer, joined boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT si.id,
         (SELECT count(*)::integer FROM public.perk_waitlist w WHERE w.item_id = si.id),
         EXISTS (SELECT 1 FROM public.perk_waitlist w WHERE w.item_id = si.id AND w.user_id = auth.uid())
  FROM public.shop_items si WHERE si.kind = 'perk' AND auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.shop_perks() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shop_perks() TO authenticated;

-- ── Using a bought freeze ───────────────────────────────────────────────────
-- Called only after the weekly free freeze is used. Writes the freeze row first, then takes one from inventory.
CREATE OR REPLACE FUNCTION public.shop_use_freeze(p_market_id text, p_local_date date)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_held integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('shop:' || v_user::text));
  SELECT qty INTO v_held FROM public.user_inventory WHERE user_id = v_user AND item_id = 'streak-freeze' FOR UPDATE;
  IF COALESCE(v_held, 0) <= 0 THEN RETURN false; END IF;
  INSERT INTO public.streak_freezes (user_id, market_id, week_of, kind, freeze_date, used_at)
  VALUES (v_user, p_market_id, date_trunc('week', p_local_date)::date, 'shop', p_local_date, now())
  ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN true; END IF;
  UPDATE public.user_inventory SET qty = qty - 1 WHERE user_id = v_user AND item_id = 'streak-freeze';
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.shop_use_freeze(text, date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shop_use_freeze(text, date) TO authenticated;

-- ── Month close for crown keepsakes, if pg_cron is available ────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'crown-keepsakes') THEN
      PERFORM cron.unschedule('crown-keepsakes');
    END IF;
    PERFORM cron.schedule('crown-keepsakes', '17 0 1 * *',
      $cron$ SELECT public.grant_crown_keepsakes(((date_trunc('month', now() AT TIME ZONE 'UTC') - interval '1 month'))::date); $cron$);
  END IF;
END $$;

-- ── Seed: every catalog item (scripts/shop/gen-seed.mjs from mobile/lib/shopCatalog.ts) ──
-- GENERATED by scripts/shop/gen-seed.mjs from mobile/lib/shopCatalog.ts. Re-run after catalog changes.
INSERT INTO public.shop_items (id, kind, slot, rarity, name, price, acquisition, requirements, meta, status, art_ready, hidden) VALUES
  ('grad-cap', 'cosmetic', 'hat', 'common', 'Graduation cap', NULL, 'default', '{}'::jsonb, '{}'::jsonb, 'live', true, false),
  ('founder-cap', 'cosmetic', 'hat', 'common', 'Founder cap', 300, 'purchase', '{}'::jsonb, '{"collection":"startup"}'::jsonb, 'live', false, false),
  ('headphones', 'cosmetic', 'hat', 'common', 'Study headphones', 300, 'purchase', '{}'::jsonb, '{"collection":"startup"}'::jsonb, 'live', false, false),
  ('beanie-startup', 'cosmetic', 'hat', 'common', 'Startup beanie', 300, 'purchase', '{}'::jsonb, '{"collection":"startup"}'::jsonb, 'live', true, false),
  ('hard-hat', 'cosmetic', 'hat', 'uncommon', 'Hard hat', 500, 'purchase', '{}'::jsonb, '{"collection":"field"}'::jsonb, 'live', false, false),
  ('trader-visor', 'cosmetic', 'hat', 'uncommon', 'Trader''s visor', 500, 'purchase', '{}'::jsonb, '{"collection":"wallstreet"}'::jsonb, 'live', true, false),
  ('aero-helmet', 'cosmetic', 'hat', 'uncommon', 'Aerospace helmet', 500, 'purchase', '{}'::jsonb, '{"collection":"aerospace"}'::jsonb, 'live', false, false),
  ('top-hat', 'cosmetic', 'hat', 'rare', 'Top hat', 800, 'purchase', '{}'::jsonb, '{"collection":"wallstreet"}'::jsonb, 'live', true, false),
  ('party-hat', 'cosmetic', 'hat', 'common', 'Party hat', 300, 'purchase', '{}'::jsonb, '{"collection":"seasonal"}'::jsonb, 'live', false, false),
  ('astro-helmet', 'cosmetic', 'hat', 'epic', 'Astronaut helmet', 2000, 'purchase', '{}'::jsonb, '{"collection":"aerospace"}'::jsonb, 'live', true, false),
  ('monthly-crown', 'cosmetic', 'hat', 'legendary', 'The Crown', NULL, 'reward', '{"crown_live":true}'::jsonb, '{}'::jsonb, 'live', true, true),
  ('monthly-crown-keepsake', 'cosmetic', 'hat', 'legendary', 'Crown keepsake', NULL, 'reward', '{"crown_keepsake":true}'::jsonb, '{}'::jsonb, 'live', false, true),
  ('santa-hat', 'cosmetic', 'hat', 'uncommon', 'Winter hat', 500, 'purchase', '{}'::jsonb, '{"collection":"seasonal"}'::jsonb, 'live', false, false),
  ('flower-crown', 'cosmetic', 'hat', 'uncommon', 'Flower crown', 500, 'purchase', '{}'::jsonb, '{"collection":"seasonal"}'::jsonb, 'live', true, false),
  ('ember-band', 'cosmetic', 'hat', 'uncommon', 'Ember headband', NULL, 'reward', '{"min_streak_days":7}'::jsonb, '{}'::jsonb, 'live', false, false),
  ('phoenix-feather', 'cosmetic', 'hat', 'rare', 'Phoenix feather', NULL, 'reward', '{"min_streak_days":30}'::jsonb, '{}'::jsonb, 'live', true, false),
  ('eternal-flame-halo', 'cosmetic', 'hat', 'legendary', 'Eternal flame halo', NULL, 'reward', '{"min_streak_days":365}'::jsonb, '{}'::jsonb, 'live', true, false),
  ('round-glasses', 'cosmetic', 'glasses', 'common', 'Scholar glasses', 300, 'purchase', '{}'::jsonb, '{"collection":"lab"}'::jsonb, 'live', false, false),
  ('sunglasses', 'cosmetic', 'glasses', 'common', 'Sunglasses', 300, 'purchase', '{}'::jsonb, '{"collection":"startup"}'::jsonb, 'live', true, false),
  ('aviators', 'cosmetic', 'glasses', 'uncommon', 'Aviators', 500, 'purchase', '{}'::jsonb, '{"collection":"aerospace"}'::jsonb, 'live', true, false),
  ('safety-goggles', 'cosmetic', 'glasses', 'uncommon', 'Lab goggles', 500, 'purchase', '{}'::jsonb, '{"collection":"lab"}'::jsonb, 'live', false, false),
  ('vr-headset', 'cosmetic', 'glasses', 'rare', 'VR headset', 800, 'purchase', '{}'::jsonb, '{"collection":"tech"}'::jsonb, 'live', false, false),
  ('monocle', 'cosmetic', 'glasses', 'rare', 'Monocle', 800, 'purchase', '{}'::jsonb, '{"collection":"wallstreet"}'::jsonb, 'live', false, false),
  ('pixel-shades', 'cosmetic', 'glasses', 'epic', 'Pixel shades', 2000, 'purchase', '{}'::jsonb, '{"collection":"tech"}'::jsonb, 'live', false, false),
  ('ar-glasses', 'cosmetic', 'glasses', 'epic', 'AR glasses', 2000, 'purchase', '{}'::jsonb, '{"collection":"tech"}'::jsonb, 'live', false, false),
  ('scarf', 'cosmetic', 'outfit', 'common', 'Cozy scarf', 300, 'purchase', '{}'::jsonb, '{"collection":"seasonal"}'::jsonb, 'live', false, false),
  ('bowtie', 'cosmetic', 'outfit', 'common', 'Bow tie', 300, 'purchase', '{}'::jsonb, '{"collection":"seasonal"}'::jsonb, 'live', false, false),
  ('startup-hoodie', 'cosmetic', 'outfit', 'uncommon', 'Startup hoodie', 500, 'purchase', '{}'::jsonb, '{"collection":"startup"}'::jsonb, 'live', false, false),
  ('lab-coat', 'cosmetic', 'outfit', 'uncommon', 'Lab coat', 500, 'purchase', '{}'::jsonb, '{"collection":"lab"}'::jsonb, 'live', false, false),
  ('trader-tie', 'cosmetic', 'outfit', 'uncommon', 'Trader''s tie', 500, 'purchase', '{}'::jsonb, '{"collection":"wallstreet"}'::jsonb, 'live', false, false),
  ('hi-vis-vest', 'cosmetic', 'outfit', 'uncommon', 'Hi-vis vest', 500, 'purchase', '{}'::jsonb, '{"collection":"field"}'::jsonb, 'live', false, false),
  ('flight-jacket', 'cosmetic', 'outfit', 'rare', 'Flight jacket', 800, 'purchase', '{}'::jsonb, '{"collection":"aerospace"}'::jsonb, 'live', false, false),
  ('blazer', 'cosmetic', 'outfit', 'rare', 'Blazer', 800, 'purchase', '{}'::jsonb, '{"collection":"wallstreet"}'::jsonb, 'live', false, false),
  ('spacesuit', 'cosmetic', 'outfit', 'epic', 'Spacesuit chest', 2000, 'purchase', '{}'::jsonb, '{"collection":"aerospace"}'::jsonb, 'live', false, false),
  ('tuxedo', 'cosmetic', 'outfit', 'legendary', 'Tuxedo', 4000, 'purchase', '{}'::jsonb, '{"collection":"wallstreet"}'::jsonb, 'live', false, false),
  ('golden-scarf', 'cosmetic', 'outfit', 'epic', 'Golden scarf', NULL, 'reward', '{"min_streak_days":100}'::jsonb, '{}'::jsonb, 'live', false, false),
  ('case-blazer', 'cosmetic', 'outfit', 'epic', 'Case-cracker blazer', NULL, 'reward', '{"weekly_case_submitted_count":10}'::jsonb, '{}'::jsonb, 'live', false, false),
  ('hero-cape', 'cosmetic', 'cape', 'common', 'Hero cape', 300, 'purchase', '{}'::jsonb, '{"collection":"seasonal"}'::jsonb, 'live', false, false),
  ('rocket-pack', 'cosmetic', 'cape', 'uncommon', 'Rocket backpack', 500, 'purchase', '{}'::jsonb, '{"collection":"aerospace"}'::jsonb, 'live', false, false),
  ('angel-wings', 'cosmetic', 'cape', 'rare', 'Wings', 800, 'purchase', '{}'::jsonb, '{"collection":"seasonal"}'::jsonb, 'live', false, false),
  ('royal-mantle', 'cosmetic', 'outfit', 'legendary', 'Royal mantle', 4000, 'purchase', '{}'::jsonb, '{"collection":"royal"}'::jsonb, 'live', true, false),
  ('royal-mantle-blue', 'cosmetic', 'outfit', 'rare', 'Sapphire mantle', 800, 'purchase', '{}'::jsonb, '{"collection":"royal"}'::jsonb, 'live', true, false),
  ('royal-mantle-green', 'cosmetic', 'outfit', 'rare', 'Emerald mantle', 800, 'purchase', '{}'::jsonb, '{"collection":"royal"}'::jsonb, 'live', true, false),
  ('coffee-cup', 'cosmetic', 'held', 'common', 'Coffee cup', 300, 'purchase', '{}'::jsonb, '{"collection":"startup"}'::jsonb, 'live', false, false),
  ('magnifier', 'cosmetic', 'held', 'common', 'Magnifying glass', 300, 'purchase', '{}'::jsonb, '{"collection":"lab"}'::jsonb, 'live', false, false),
  ('test-tube', 'cosmetic', 'held', 'uncommon', 'Test tubes', 500, 'purchase', '{}'::jsonb, '{"collection":"lab"}'::jsonb, 'live', false, false),
  ('rocket-model', 'cosmetic', 'held', 'uncommon', 'Model rocket', 500, 'purchase', '{}'::jsonb, '{"collection":"aerospace"}'::jsonb, 'live', false, false),
  ('microphone', 'cosmetic', 'held', 'rare', 'Microphone', 800, 'purchase', '{}'::jsonb, '{"collection":"startup"}'::jsonb, 'live', false, false),
  ('token-coin', 'cosmetic', 'held', 'rare', 'Token coin', 800, 'purchase', '{}'::jsonb, '{"collection":"wallstreet"}'::jsonb, 'live', false, false),
  ('flag', 'cosmetic', 'held', 'epic', 'Summit flag', 2000, 'purchase', '{}'::jsonb, '{"collection":"field"}'::jsonb, 'live', false, false),
  ('trophy', 'cosmetic', 'held', 'legendary', 'Trophy', 4000, 'purchase', '{}'::jsonb, '{"collection":"royal"}'::jsonb, 'live', false, false),
  ('medal-champion', 'cosmetic', 'held', 'legendary', 'Case champion medal', NULL, 'reward', '{"weekly_case_top3":true}'::jsonb, '{}'::jsonb, 'live', false, false),
  ('bg-launchpad', 'cosmetic', 'background', 'uncommon', 'Launchpad', NULL, 'reward', '{"min_lessons_completed":30}'::jsonb, '{}'::jsonb, 'live', false, false),
  ('bg-trading-floor', 'cosmetic', 'background', 'uncommon', 'Trading floor', 500, 'purchase', '{}'::jsonb, '{"collection":"wallstreet"}'::jsonb, 'live', false, false),
  ('bg-lab', 'cosmetic', 'background', 'uncommon', 'Research lab', 500, 'purchase', '{}'::jsonb, '{"collection":"lab"}'::jsonb, 'live', false, false),
  ('bg-server-room', 'cosmetic', 'background', 'rare', 'Server room', 800, 'purchase', '{}'::jsonb, '{"collection":"tech"}'::jsonb, 'live', false, false),
  ('bg-farm', 'cosmetic', 'background', 'uncommon', 'Smart farm', 500, 'purchase', '{}'::jsonb, '{"collection":"field"}'::jsonb, 'live', false, false),
  ('bg-wind-farm', 'cosmetic', 'background', 'uncommon', 'Wind farm', 500, 'purchase', '{}'::jsonb, '{"collection":"field"}'::jsonb, 'live', false, false),
  ('bg-port', 'cosmetic', 'background', 'rare', 'Port', 800, 'purchase', '{}'::jsonb, '{"collection":"field"}'::jsonb, 'live', false, false),
  ('bg-workshop', 'cosmetic', 'background', 'rare', 'Robotics workshop', 800, 'purchase', '{}'::jsonb, '{"collection":"tech"}'::jsonb, 'live', false, false),
  ('bg-space', 'cosmetic', 'background', 'epic', 'Space station', 2000, 'purchase', '{}'::jsonb, '{"collection":"aerospace"}'::jsonb, 'live', false, false),
  ('bg-campus', 'cosmetic', 'background', 'epic', 'Campus at golden hour', 2000, 'purchase', '{}'::jsonb, '{"collection":"startup"}'::jsonb, 'live', false, false),
  ('frame-gold', 'cosmetic', 'frame', 'uncommon', 'Gold ring', 500, 'purchase', '{}'::jsonb, '{"collection":"wallstreet"}'::jsonb, 'live', false, false),
  ('frame-streak', 'cosmetic', 'frame', 'rare', 'Streak flame', 800, 'purchase', '{}'::jsonb, '{"collection":"royal"}'::jsonb, 'live', false, false),
  ('frame-circuit', 'cosmetic', 'frame', 'rare', 'Circuit ring', 800, 'purchase', '{}'::jsonb, '{"collection":"tech"}'::jsonb, 'live', false, false),
  ('frame-laurel', 'cosmetic', 'frame', 'epic', 'Laurel wreath', NULL, 'reward', '{"min_lessons_completed":30}'::jsonb, '{}'::jsonb, 'live', false, false),
  ('frame-pixel', 'cosmetic', 'frame', 'epic', 'Pixel ring', 2000, 'purchase', '{}'::jsonb, '{"collection":"tech"}'::jsonb, 'live', false, false),
  ('frame-galaxy', 'cosmetic', 'frame', 'legendary', 'Galaxy ring', NULL, 'reward', '{"min_xp_earned":50000}'::jsonb, '{}'::jsonb, 'live', false, false),
  ('frame-first-case', 'cosmetic', 'frame', 'rare', 'First case badge ring', NULL, 'reward', '{"weekly_case_submitted_count":1}'::jsonb, '{}'::jsonb, 'live', false, false),
  ('solar-wings', 'cosmetic', 'cape', 'rare', 'Solar wings', 800, 'purchase', '{}'::jsonb, '{"collection":"aerospace"}'::jsonb, 'live', false, false),
  ('frame-10k-club', 'cosmetic', 'frame', 'epic', '10K Club ring', NULL, 'reward', '{"min_xp_earned":10000}'::jsonb, '{}'::jsonb, 'live', false, false),
  ('streak-freeze', 'freeze', NULL, NULL, 'Streak Freeze', 400, 'purchase', '{}'::jsonb, '{}'::jsonb, 'live', true, false),
  ('streak-repair', 'powerup', NULL, NULL, 'Streak Repair', 1200, 'purchase', '{}'::jsonb, '{}'::jsonb, 'coming_soon', true, false),
  ('double-xp', 'powerup', NULL, NULL, 'Double XP', NULL, 'purchase', '{}'::jsonb, '{}'::jsonb, 'coming_soon', true, false),
  ('perk-founder-call', 'perk', NULL, NULL, '30-min call with a startup founder', 4000, 'purchase', '{}'::jsonb, '{"kicker":"Expert access"}'::jsonb, 'coming_soon', true, false),
  ('perk-cv-review', 'perk', NULL, NULL, 'Your CV reviewed by someone who hires', 2000, 'purchase', '{}'::jsonb, '{"kicker":"Career"}'::jsonb, 'coming_soon', true, false),
  ('perk-case-badge', 'perk', NULL, NULL, 'A verified badge for your best case', 1500, 'purchase', '{"requires_weekly_case_submission":true}'::jsonb, '{"kicker":"Skill proof"}'::jsonb, 'coming_soon', true, false),
  ('perk-hackathon', 'perk', NULL, NULL, 'Hackathon mentoring', 3000, 'purchase', '{}'::jsonb, '{"kicker":"Events"}'::jsonb, 'coming_soon', true, false),
  ('perk-tool-credits', 'perk', NULL, NULL, 'Premium tool credits', 2500, 'purchase', '{}'::jsonb, '{"kicker":"Digital perks"}'::jsonb, 'coming_soon', true, false),
  ('bundle-aero', 'bundle', NULL, NULL, 'Flight deck set', 1350, 'purchase', '{}'::jsonb, '{"items":["aero-helmet","aviators","flight-jacket"],"collection":"aerospace"}'::jsonb, 'live', false, false),
  ('bundle-wallstreet', 'bundle', NULL, NULL, 'Wall Street set', 1575, 'purchase', '{}'::jsonb, '{"items":["trader-tie","monocle","top-hat"],"collection":"wallstreet"}'::jsonb, 'live', false, false),
  ('bundle-lab', 'bundle', NULL, NULL, 'Lab set', 1200, 'purchase', '{}'::jsonb, '{"items":["safety-goggles","lab-coat","test-tube"],"collection":"lab"}'::jsonb, 'live', false, false),
  ('bundle-startup', 'bundle', NULL, NULL, 'Founder set', 850, 'purchase', '{}'::jsonb, '{"items":["founder-cap","startup-hoodie","coffee-cup"],"collection":"startup"}'::jsonb, 'live', false, false)
ON CONFLICT (id) DO UPDATE SET
  kind = EXCLUDED.kind, slot = EXCLUDED.slot, rarity = EXCLUDED.rarity, name = EXCLUDED.name, price = EXCLUDED.price,
  acquisition = EXCLUDED.acquisition, requirements = EXCLUDED.requirements, meta = EXCLUDED.meta, status = EXCLUDED.status,
  art_ready = EXCLUDED.art_ready, hidden = EXCLUDED.hidden;

NOTIFY pgrst, 'reload schema';