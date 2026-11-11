-- ALREADY APPLIED (Nov 11, 2026): the full 0062/0063 files ran on the live database. Do not run this file again.
-- Data half of 0062 (run after 0062a_weekly_medals_schema.sql). Only INSERT and UPDATE statements. Safe to run again.

-- Backfill placements for Weekly Cases already released (once per learner per case; a re-run changes nothing).
INSERT INTO public.weekly_case_placements (user_id, case_id, rank, board_size, score)
SELECT s.user_id, s.case_id, p.rank, p.board_size, p.score
FROM public.weekly_case_submissions s
CROSS JOIN LATERAL public.shop_weekly_case_placement(s.user_id, s.case_id) p
WHERE s.status = 'submitted' AND s.released_at IS NOT NULL AND s.score IS NOT NULL
ON CONFLICT (user_id, case_id) DO NOTHING;

-- ── Catalog ──────────────────────────────────────────────────────────────────
INSERT INTO public.shop_items (id, kind, slot, rarity, name, price, acquisition, requirements, meta, status, art_ready, hidden) VALUES
  ('medal-bronze', 'cosmetic', 'held', 'rare', 'Bronze medal', NULL, 'reward', '{"weekly_podium_third_count":3}'::jsonb, '{}'::jsonb, 'live', true, false),
  ('medal-silver', 'cosmetic', 'held', 'epic', 'Silver medal', NULL, 'reward', '{"weekly_podium_second_count":5}'::jsonb, '{}'::jsonb, 'live', true, false),
  ('medal-gold', 'cosmetic', 'held', 'legendary', 'Gold medal', NULL, 'reward', '{"weekly_podium_first_count":7}'::jsonb, '{}'::jsonb, 'live', true, false),
  ('angel-wings', 'cosmetic', 'cape', 'rare', 'Angel wings', 800, 'purchase', '{}'::jsonb, '{"collection":"seasonal"}'::jsonb, 'live', true, false),
  ('halo', 'cosmetic', 'hat', 'rare', 'Halo', 800, 'purchase', '{}'::jsonb, '{"collection":"seasonal"}'::jsonb, 'live', true, false),
  ('captain-hat', 'cosmetic', 'hat', 'rare', 'Captain hat', 800, 'purchase', '{}'::jsonb, '{"collection":"aerospace"}'::jsonb, 'live', true, false),
  ('bundle-angel', 'bundle', NULL, NULL, 'Angel of my Dreams', 1500, 'purchase', '{}'::jsonb, '{"items":["angel-wings","halo","sun-diamond-necklace"],"collection":"seasonal"}'::jsonb, 'live', true, false)
ON CONFLICT (id) DO UPDATE SET
  kind = EXCLUDED.kind, slot = EXCLUDED.slot, rarity = EXCLUDED.rarity, name = EXCLUDED.name, price = EXCLUDED.price,
  acquisition = EXCLUDED.acquisition, requirements = EXCLUDED.requirements, meta = EXCLUDED.meta, status = EXCLUDED.status,
  art_ready = EXCLUDED.art_ready, hidden = EXCLUDED.hidden;
UPDATE public.shop_items SET status = 'ended', hidden = true, art_ready = false WHERE id = 'medal-champion';

-- Which cosmetics the phone has art for (scripts/shop/art_ready.sql); daily deals only pick these.
UPDATE public.shop_items SET art_ready = (id = ANY (ARRAY['astro-helmet', 'beanie-startup', 'captain-hat', 'eternal-flame-halo', 'flower-crown', 'grad-cap', 'halo', 'holiday-antlers', 'monthly-crown', 'phoenix-feather', 'raven-crown', 'sapphire-tiara', 'top-hat', 'trader-visor', 'aviators', 'reindeer-nose', 'sunglasses', 'commander-coat', 'crow-cape', 'ermine-cape', 'holiday-collar', 'holly-wreath', 'royal-mantle', 'royal-mantle-blue', 'royal-mantle-green', 'sun-diamond-necklace', 'angel-wings', 'medal-bronze', 'medal-gold', 'medal-silver']::text[])) WHERE kind = 'cosmetic';
