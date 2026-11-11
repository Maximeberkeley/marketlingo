-- Leo looks on the Global standings: people there are usually not friends, so get_equipped_looks (friends only)
-- cannot draw them. get_public_looks answers only for people who are on that market's standings (they have a
-- user_xp row there, the same rule get_monthly_standings uses), at most 100 at a time, and returns nothing but
-- cosmetic equip data: the item id worn in each slot and whether the monthly crown is worn. No names, no XP,
-- no inventory, no other personal data. Safe to run again.
CREATE OR REPLACE FUNCTION public.get_public_looks(p_market_id text, p_user_ids uuid[])
RETURNS TABLE(user_id uuid, look jsonb, wears_crown boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH shown AS (
    SELECT DISTINCT u AS uid FROM unnest(p_user_ids[1:100]) u
    WHERE EXISTS (SELECT 1 FROM public.user_xp ux WHERE ux.user_id = u AND ux.market_id = p_market_id)
  )
  SELECT s.uid,
         COALESCE((SELECT jsonb_object_agg(ue.slot, ue.item_id) FROM public.user_equipped ue WHERE ue.user_id = s.uid), '{}'::jsonb),
         public.shop_wears_crown(s.uid)
  FROM shown s WHERE auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.get_public_looks(text, uuid[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_public_looks(text, uuid[]) TO authenticated;

NOTIFY pgrst, 'reload schema';
