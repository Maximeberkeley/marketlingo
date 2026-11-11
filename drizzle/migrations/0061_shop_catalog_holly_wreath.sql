-- Shop catalog:
--   Holly wreath (outfit: a candy-cane braid ring around the neck with holly berries on the chest; Seasonal,
--   uncommon 500 XP), suggested with the holiday antlers.
--   Sun diamond necklace (outfit, Royal, rare 800 XP), suggested with the Sapphire tiara.
-- Also marks the earn-only Case champion medal (held, top 3 among friends in a Weekly Case) as drawn.
-- Safe to run again.
INSERT INTO public.shop_items (id, kind, slot, rarity, name, price, acquisition, requirements, meta, status, art_ready, hidden) VALUES
  ('holly-wreath', 'cosmetic', 'outfit', 'uncommon', 'Holly wreath', 500, 'purchase', '{}'::jsonb, '{"collection":"seasonal"}'::jsonb, 'live', true, false),
  ('sun-diamond-necklace', 'cosmetic', 'outfit', 'rare', 'Sun diamond necklace', 800, 'purchase', '{}'::jsonb, '{"collection":"royal"}'::jsonb, 'live', true, false),
  ('medal-champion', 'cosmetic', 'held', 'legendary', 'Case champion medal', NULL, 'reward', '{"weekly_case_top3":true}'::jsonb, '{}'::jsonb, 'live', true, false)
ON CONFLICT (id) DO UPDATE SET
  kind = EXCLUDED.kind, slot = EXCLUDED.slot, rarity = EXCLUDED.rarity, name = EXCLUDED.name, price = EXCLUDED.price,
  acquisition = EXCLUDED.acquisition, requirements = EXCLUDED.requirements, meta = EXCLUDED.meta, status = EXCLUDED.status,
  art_ready = EXCLUDED.art_ready, hidden = EXCLUDED.hidden;

-- Which cosmetics the phone has art for (scripts/shop/art_ready.sql); daily deals only pick these.
UPDATE public.shop_items SET art_ready = (id = ANY (ARRAY['astro-helmet', 'beanie-startup', 'eternal-flame-halo', 'flower-crown', 'grad-cap', 'holiday-antlers', 'monthly-crown', 'phoenix-feather', 'raven-crown', 'sapphire-tiara', 'top-hat', 'trader-visor', 'aviators', 'reindeer-nose', 'sunglasses', 'commander-coat', 'crow-cape', 'ermine-cape', 'holiday-collar', 'holly-wreath', 'royal-mantle', 'royal-mantle-blue', 'royal-mantle-green', 'sun-diamond-necklace', 'medal-champion']::text[])) WHERE kind = 'cosmetic';

NOTIFY pgrst, 'reload schema';
