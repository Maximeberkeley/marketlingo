-- Data half of 0063 (run after 0063a_double_xp_repair_schema.sql). Only an INSERT. Safe to run again.

-- ── Catalog rows (power-ups are not sold through shop_purchase) ─────────────
INSERT INTO public.shop_items (id, kind, slot, rarity, name, price, acquisition, requirements, meta, status, art_ready, hidden) VALUES
  ('double-xp', 'powerup', NULL, NULL, 'Double XP', NULL, 'reward', '{}'::jsonb, '{"minutes":15,"earned_by":"weekly_case"}'::jsonb, 'live', true, true),
  ('streak-repair', 'powerup', NULL, NULL, 'Streak Repair', 1200, 'purchase', '{}'::jsonb, '{"max_missed_days":2,"min_streak":7,"cooldown_days":30}'::jsonb, 'live', true, true)
ON CONFLICT (id) DO UPDATE SET
  kind = EXCLUDED.kind, slot = EXCLUDED.slot, rarity = EXCLUDED.rarity, name = EXCLUDED.name, price = EXCLUDED.price,
  acquisition = EXCLUDED.acquisition, requirements = EXCLUDED.requirements, meta = EXCLUDED.meta, status = EXCLUDED.status,
  art_ready = EXCLUDED.art_ready, hidden = EXCLUDED.hidden;
