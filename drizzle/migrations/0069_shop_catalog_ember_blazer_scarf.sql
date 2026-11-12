-- Shop catalog (data only, founder Nov 12): art arrived for the Ember headband, Case-cracker blazer and Golden scarf,
-- so they can be earned and worn. Their rows now say art_ready, and every drawn item is marked art_ready. Safe to run again.
INSERT INTO public.shop_items (id, kind, slot, rarity, name, price, acquisition, requirements, meta, status, art_ready, hidden) VALUES
  ('ember-band', 'cosmetic', 'hat', 'uncommon', 'Ember headband', NULL, 'reward', '{"min_streak_days":7}'::jsonb, '{}'::jsonb, 'live', true, false),
  ('case-blazer', 'cosmetic', 'outfit', 'epic', 'Case-cracker blazer', NULL, 'reward', '{"weekly_case_submitted_count":10}'::jsonb, '{}'::jsonb, 'live', true, false),
  ('golden-scarf', 'cosmetic', 'outfit', 'epic', 'Golden scarf', NULL, 'reward', '{"min_streak_days":100}'::jsonb, '{}'::jsonb, 'live', true, false)
ON CONFLICT (id) DO UPDATE SET art_ready = EXCLUDED.art_ready;

UPDATE public.shop_items SET art_ready = (id = ANY (ARRAY['astro-helmet', 'beanie-startup', 'captain-hat', 'ember-band', 'eternal-flame-halo', 'flower-crown', 'grad-cap', 'halo', 'holiday-antlers', 'monthly-crown', 'phoenix-feather', 'raven-crown', 'sapphire-tiara', 'top-hat', 'trader-visor', 'aviators', 'reindeer-nose', 'sunglasses', 'case-blazer', 'commander-coat', 'crow-cape', 'ermine-cape', 'golden-scarf', 'holiday-collar', 'holly-wreath', 'royal-mantle', 'royal-mantle-blue', 'royal-mantle-green', 'stethoscope', 'sun-diamond-necklace', 'angel-wings', 'medal-bronze', 'medal-gold', 'medal-silver']::text[])) WHERE kind = 'cosmetic';
