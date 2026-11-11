-- Shop catalog: the Sapphire tiara (Royal hat, legendary) at a founder-set 10,000 XP, overriding the
-- legendary tier price (4,000). shop_items.price is already per item and shop_purchase charges it, so a custom
-- price is just this row. Safe to run again.
INSERT INTO public.shop_items (id, kind, slot, rarity, name, price, acquisition, requirements, meta, status, art_ready, hidden) VALUES
  ('sapphire-tiara', 'cosmetic', 'hat', 'legendary', 'Sapphire tiara', 10000, 'purchase', '{}'::jsonb, '{"collection":"royal"}'::jsonb, 'live', true, false)
ON CONFLICT (id) DO UPDATE SET
  kind = EXCLUDED.kind, slot = EXCLUDED.slot, rarity = EXCLUDED.rarity, name = EXCLUDED.name, price = EXCLUDED.price,
  acquisition = EXCLUDED.acquisition, requirements = EXCLUDED.requirements, meta = EXCLUDED.meta, status = EXCLUDED.status,
  art_ready = EXCLUDED.art_ready, hidden = EXCLUDED.hidden;

-- Daily deals only pick cosmetics whose art the phone ships (scripts/shop/art_ready.sql).
UPDATE public.shop_items SET art_ready = (id = ANY (ARRAY['astro-helmet', 'beanie-startup', 'eternal-flame-halo', 'flower-crown', 'grad-cap', 'monthly-crown', 'phoenix-feather', 'sapphire-tiara', 'top-hat', 'trader-visor', 'aviators', 'sunglasses', 'royal-mantle', 'royal-mantle-blue', 'royal-mantle-green']::text[])) WHERE kind = 'cosmetic';

NOTIFY pgrst, 'reload schema';
