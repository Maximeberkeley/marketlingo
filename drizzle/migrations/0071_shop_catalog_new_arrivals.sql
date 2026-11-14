-- Shop catalog (data only, founder Nov 14): art arrived for 15 items the founder approved on the Nov 12 sheet:
-- AR glasses, monocle, pixel shades, blazer, tuxedo, lab coat, flight jacket, startup hoodie, hi-vis vest,
-- spacesuit chest, coffee cup, magnifying glass, test tubes, token coin and microphone. Prices, rarities and
-- collections are unchanged from 0057; only art_ready turns on. Safe to run again.
INSERT INTO public.shop_items (id, kind, slot, rarity, name, price, acquisition, requirements, meta, status, art_ready, hidden) VALUES
  ('ar-glasses', 'cosmetic', 'glasses', 'epic', 'AR glasses', 2000, 'purchase', '{}'::jsonb, '{"collection":"tech"}'::jsonb, 'live', true, false),
  ('monocle', 'cosmetic', 'glasses', 'rare', 'Monocle', 800, 'purchase', '{}'::jsonb, '{"collection":"wallstreet"}'::jsonb, 'live', true, false),
  ('pixel-shades', 'cosmetic', 'glasses', 'epic', 'Pixel shades', 2000, 'purchase', '{}'::jsonb, '{"collection":"tech"}'::jsonb, 'live', true, false),
  ('blazer', 'cosmetic', 'outfit', 'rare', 'Blazer', 800, 'purchase', '{}'::jsonb, '{"collection":"wallstreet"}'::jsonb, 'live', true, false),
  ('tuxedo', 'cosmetic', 'outfit', 'legendary', 'Tuxedo', 4000, 'purchase', '{}'::jsonb, '{"collection":"wallstreet"}'::jsonb, 'live', true, false),
  ('lab-coat', 'cosmetic', 'outfit', 'uncommon', 'Lab coat', 500, 'purchase', '{}'::jsonb, '{"collection":"lab"}'::jsonb, 'live', true, false),
  ('flight-jacket', 'cosmetic', 'outfit', 'rare', 'Flight jacket', 800, 'purchase', '{}'::jsonb, '{"collection":"aerospace"}'::jsonb, 'live', true, false),
  ('startup-hoodie', 'cosmetic', 'outfit', 'uncommon', 'Startup hoodie', 500, 'purchase', '{}'::jsonb, '{"collection":"startup"}'::jsonb, 'live', true, false),
  ('hi-vis-vest', 'cosmetic', 'outfit', 'uncommon', 'Hi-vis vest', 500, 'purchase', '{}'::jsonb, '{"collection":"field"}'::jsonb, 'live', true, false),
  ('spacesuit', 'cosmetic', 'outfit', 'epic', 'Spacesuit chest', 2000, 'purchase', '{}'::jsonb, '{"collection":"aerospace"}'::jsonb, 'live', true, false),
  ('coffee-cup', 'cosmetic', 'held', 'common', 'Coffee cup', 300, 'purchase', '{}'::jsonb, '{"collection":"startup"}'::jsonb, 'live', true, false),
  ('magnifier', 'cosmetic', 'held', 'common', 'Magnifying glass', 300, 'purchase', '{}'::jsonb, '{"collection":"lab"}'::jsonb, 'live', true, false),
  ('test-tube', 'cosmetic', 'held', 'uncommon', 'Test tubes', 500, 'purchase', '{}'::jsonb, '{"collection":"lab"}'::jsonb, 'live', true, false),
  ('token-coin', 'cosmetic', 'held', 'rare', 'Token coin', 800, 'purchase', '{}'::jsonb, '{"collection":"wallstreet"}'::jsonb, 'live', true, false),
  ('microphone', 'cosmetic', 'held', 'rare', 'Microphone', 800, 'purchase', '{}'::jsonb, '{"collection":"startup"}'::jsonb, 'live', true, false)
ON CONFLICT (id) DO UPDATE SET art_ready = EXCLUDED.art_ready;

UPDATE public.shop_items SET art_ready = (id = ANY (ARRAY['astro-helmet', 'beanie-startup', 'captain-hat', 'ember-band', 'eternal-flame-halo', 'flower-crown', 'grad-cap', 'halo', 'holiday-antlers', 'monthly-crown', 'phoenix-feather', 'raven-crown', 'sapphire-tiara', 'top-hat', 'trader-visor', 'ar-glasses', 'aviators', 'monocle', 'pixel-shades', 'reindeer-nose', 'sunglasses', 'blazer', 'case-blazer', 'commander-coat', 'crow-cape', 'ermine-cape', 'flight-jacket', 'golden-scarf', 'hi-vis-vest', 'holiday-collar', 'holly-wreath', 'lab-coat', 'royal-mantle', 'royal-mantle-blue', 'royal-mantle-green', 'spacesuit', 'startup-hoodie', 'stethoscope', 'sun-diamond-necklace', 'tuxedo', 'angel-wings', 'coffee-cup', 'magnifier', 'medal-bronze', 'medal-gold', 'medal-silver', 'microphone', 'test-tube', 'token-coin']::text[])) WHERE kind = 'cosmetic';
