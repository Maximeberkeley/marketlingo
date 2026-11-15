-- Data half of 0073 (run after 0073a_opening_gift_schema.sql). Only an INSERT. Safe to run again.

-- ── The opening gift: 750 XP to spend, from Dec 17, 2026 to Jan 31, 2027 ────
INSERT INTO public.shop_items (id, kind, slot, rarity, name, price, acquisition, requirements, meta, status, art_ready, hidden) VALUES
  ('opening-gift-2026', 'gift', NULL, NULL, 'Shop opening gift', NULL, 'reward', '{}'::jsonb,
   '{"amount":750,"starts":"2026-12-17","ends":"2027-01-31"}'::jsonb, 'live', true, true)
ON CONFLICT (id) DO UPDATE SET kind = EXCLUDED.kind, name = EXCLUDED.name, meta = EXCLUDED.meta, status = EXCLUDED.status, hidden = EXCLUDED.hidden;
