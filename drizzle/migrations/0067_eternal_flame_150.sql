-- Data only (founder, Nov 11): the Eternal flame halo now unlocks at a 150-day streak instead of 365.
-- It still reads the best streak ever (longest_streak), and anyone already past 150 gets it at the next reward check.
-- Safe to run again.
UPDATE public.shop_items SET requirements = '{"min_streak_days":150}'::jsonb WHERE id = 'eternal-flame-halo';
