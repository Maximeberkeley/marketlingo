-- Shop catalog: new legendary pieces.
--   Ermine cape (outfit, founder-set 7,000 XP): the "Winter royal" partner of the Sapphire tiara.
--   Crow cape (outfit, founder-set 7,000 XP): a black-feather recolour of the ermine cape with a ruby clasp.
--   Raven crown (hat, tier price 4,000 XP for now): completes the "Crow" set with the crow cape.
--   Commander coat (outfit, Aerospace, founder-set 10,000 XP).
-- Like every purchasable cosmetic with art they can appear as a 30% daily deal. Safe to run again.
INSERT INTO public.shop_items (id, kind, slot, rarity, name, price, acquisition, requirements, meta, status, art_ready, hidden) VALUES
  ('ermine-cape', 'cosmetic', 'outfit', 'legendary', 'Ermine cape', 7000, 'purchase', '{}'::jsonb, '{"collection":"royal"}'::jsonb, 'live', true, false),
  ('crow-cape', 'cosmetic', 'outfit', 'legendary', 'Crow cape', 7000, 'purchase', '{}'::jsonb, '{"collection":"royal"}'::jsonb, 'live', true, false),
  ('raven-crown', 'cosmetic', 'hat', 'legendary', 'Raven crown', 4000, 'purchase', '{}'::jsonb, '{"collection":"royal"}'::jsonb, 'live', true, false),
  ('commander-coat', 'cosmetic', 'outfit', 'legendary', 'Commander coat', 10000, 'purchase', '{}'::jsonb, '{"collection":"aerospace"}'::jsonb, 'live', true, false)
ON CONFLICT (id) DO UPDATE SET
  kind = EXCLUDED.kind, slot = EXCLUDED.slot, rarity = EXCLUDED.rarity, name = EXCLUDED.name, price = EXCLUDED.price,
  acquisition = EXCLUDED.acquisition, requirements = EXCLUDED.requirements, meta = EXCLUDED.meta, status = EXCLUDED.status,
  art_ready = EXCLUDED.art_ready, hidden = EXCLUDED.hidden;

-- Daily deals only pick cosmetics whose art the phone ships (scripts/shop/art_ready.sql).
UPDATE public.shop_items SET art_ready = (id = ANY (ARRAY['astro-helmet', 'beanie-startup', 'eternal-flame-halo', 'flower-crown', 'grad-cap', 'monthly-crown', 'phoenix-feather', 'raven-crown', 'sapphire-tiara', 'top-hat', 'trader-visor', 'aviators', 'sunglasses', 'commander-coat', 'crow-cape', 'ermine-cape', 'royal-mantle', 'royal-mantle-blue', 'royal-mantle-green']::text[])) WHERE kind = 'cosmetic';

NOTIFY pgrst, 'reload schema';
