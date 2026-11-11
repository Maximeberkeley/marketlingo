-- Data only (founder, Nov 11): the Stethoscope joins the Lab collection, rare, 800 XP. Safe to run again.
INSERT INTO public.shop_items (id, kind, slot, rarity, name, price, acquisition, requirements, meta, status, art_ready, hidden) VALUES
  ('stethoscope', 'cosmetic', 'outfit', 'rare', 'Stethoscope', 800, 'purchase', '{}'::jsonb, '{"collection":"lab"}'::jsonb, 'live', true, false)
ON CONFLICT (id) DO UPDATE SET kind = EXCLUDED.kind, slot = EXCLUDED.slot, rarity = EXCLUDED.rarity, name = EXCLUDED.name, price = EXCLUDED.price, acquisition = EXCLUDED.acquisition, meta = EXCLUDED.meta, status = EXCLUDED.status, art_ready = EXCLUDED.art_ready, hidden = EXCLUDED.hidden;

-- Only drawn items can be sold or offered as deals.
UPDATE public.shop_items SET art_ready = (id = ANY (ARRAY['astro-helmet', 'beanie-startup', 'captain-hat', 'eternal-flame-halo', 'flower-crown', 'grad-cap', 'halo', 'holiday-antlers', 'monthly-crown', 'phoenix-feather', 'raven-crown', 'sapphire-tiara', 'top-hat', 'trader-visor', 'aviators', 'reindeer-nose', 'sunglasses', 'commander-coat', 'crow-cape', 'ermine-cape', 'holiday-collar', 'holly-wreath', 'royal-mantle', 'royal-mantle-blue', 'royal-mantle-green', 'stethoscope', 'sun-diamond-necklace', 'angel-wings', 'medal-bronze', 'medal-gold', 'medal-silver']::text[])) WHERE kind = 'cosmetic';
