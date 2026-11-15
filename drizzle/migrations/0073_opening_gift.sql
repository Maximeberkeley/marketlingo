-- Shop opening gift (founder Nov 14): every learner can claim 750 XP to spend in the shop, once, from
-- December 17, 2026 (the shop launch) to January 31, 2027. The phone claims it when the learner opens the app in
-- that window. Gifts raise the spendable balance only; XP earned, races, the crown and levels never move.
-- shop_balance() gains a fourth column, `gifted`; older app versions read the first three and still work.
-- Lovable: run 0073a_*_schema.sql then 0073b_*_data.sql instead of this file (same statements, split by kind).
-- Safe to run again.

-- ── Gifts are a kind of shop row ─────────────────────────────────────────────
ALTER TABLE public.shop_items DROP CONSTRAINT IF EXISTS shop_items_kind_check;
ALTER TABLE public.shop_items ADD CONSTRAINT shop_items_kind_check
  CHECK (kind IN ('cosmetic', 'freeze', 'powerup', 'perk', 'bundle', 'gift'));

-- ── Balance: gifts add spendable XP, never XP earned and never "spent" ──────
-- A gift is a negative spend_ledger row (reason 'gift'). It raises the balance only: races, the crown, levels
-- and milestones read XP earned, which a gift never touches. Same three columns as before plus `gifted`.
DROP FUNCTION IF EXISTS public.shop_balance();
CREATE FUNCTION public.shop_balance()
RETURNS TABLE(earned integer, spent integer, balance integer, gifted integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH e AS (SELECT public.shop_xp_earned(auth.uid()) AS v),
       s AS (SELECT COALESCE(SUM(amount) FILTER (WHERE reason <> 'gift'), 0)::integer AS v,
                    COALESCE(-SUM(amount) FILTER (WHERE reason = 'gift'), 0)::integer AS g
             FROM public.spend_ledger WHERE user_id = auth.uid())
  SELECT e.v, s.v, GREATEST(0, e.v + s.g - s.v), s.g FROM e, s WHERE auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.shop_balance() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shop_balance() TO authenticated;

-- ── Claim a gift once, inside its window ─────────────────────────────────────
-- The window is the gift row's meta: starts / ends are calendar dates, open from the first moment that date
-- exists anywhere (UTC+14) to the last (UTC-12), so no learner is early or late because of their time zone.
-- One claim per learner per gift: the idem key is derived from the gift and the learner.
CREATE OR REPLACE FUNCTION public.shop_claim_gift(p_gift text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_item public.shop_items%ROWTYPE;
  v_amount integer;
  v_key uuid;
  v_starts date;
  v_ends date;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  SELECT * INTO v_item FROM public.shop_items WHERE id = p_gift AND kind = 'gift';
  IF NOT FOUND OR v_item.status <> 'live' THEN RETURN jsonb_build_object('ok', false, 'error', 'unavailable'); END IF;
  v_amount := COALESCE((v_item.meta->>'amount')::integer, 0);
  v_starts := (v_item.meta->>'starts')::date;
  v_ends := (v_item.meta->>'ends')::date;
  IF v_amount <= 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'unavailable'); END IF;
  IF v_starts IS NOT NULL AND now() < (v_starts::timestamp AT TIME ZONE 'Etc/GMT-14') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_yet', 'starts', v_starts);
  END IF;
  IF v_ends IS NOT NULL AND now() >= ((v_ends + 1)::timestamp AT TIME ZONE 'Etc/GMT+12') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ended');
  END IF;
  v_key := md5('gift:' || p_gift || ':' || v_user::text)::uuid;
  IF EXISTS (SELECT 1 FROM public.spend_ledger WHERE user_id = v_user AND idem_key = v_key) THEN
    RETURN jsonb_build_object('ok', true, 'claimed', false, 'amount', v_amount);
  END IF;
  INSERT INTO public.spend_ledger (user_id, item_id, amount, idem_key, reason)
  VALUES (v_user, p_gift, -v_amount, v_key, 'gift')
  ON CONFLICT (user_id, idem_key) DO NOTHING;
  RETURN jsonb_build_object('ok', true, 'claimed', FOUND, 'amount', v_amount);
END $$;
REVOKE ALL ON FUNCTION public.shop_claim_gift(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.shop_claim_gift(text) TO authenticated;

-- Let the API see the new shop_balance column and shop_claim_gift right away.
NOTIFY pgrst, 'reload schema';

-- ── The opening gift: 750 XP to spend, from Dec 17, 2026 to Jan 31, 2027 ────
INSERT INTO public.shop_items (id, kind, slot, rarity, name, price, acquisition, requirements, meta, status, art_ready, hidden) VALUES
  ('opening-gift-2026', 'gift', NULL, NULL, 'Shop opening gift', NULL, 'reward', '{}'::jsonb,
   '{"amount":750,"starts":"2026-12-17","ends":"2027-01-31"}'::jsonb, 'live', true, true)
ON CONFLICT (id) DO UPDATE SET kind = EXCLUDED.kind, name = EXCLUDED.name, meta = EXCLUDED.meta, status = EXCLUDED.status, hidden = EXCLUDED.hidden;
