
-- 1. Remove blanket public read policies
DROP POLICY IF EXISTS "All users can view profiles for leaderboard" ON public.profiles;
DROP POLICY IF EXISTS "All users can view XP for leaderboard" ON public.user_xp;
DROP POLICY IF EXISTS "All users can view progress for leaderboard" ON public.user_progress;
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.interview_leaderboard;

CREATE POLICY "Signed-in users can view interview leaderboard"
ON public.interview_leaderboard FOR SELECT TO authenticated USING (true);

-- 2. Safe, minimal-column views for social/leaderboard features
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, username, avatar_url FROM public.profiles;

CREATE OR REPLACE VIEW public.leaderboard_xp AS
SELECT user_id, market_id, total_xp, current_level FROM public.user_xp;

CREATE OR REPLACE VIEW public.leaderboard_progress AS
SELECT user_id, market_id, current_streak, last_activity_at FROM public.user_progress;

REVOKE ALL ON public.public_profiles FROM anon, authenticated;
REVOKE ALL ON public.leaderboard_xp FROM anon, authenticated;
REVOKE ALL ON public.leaderboard_progress FROM anon, authenticated;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.leaderboard_xp TO authenticated;
GRANT SELECT ON public.leaderboard_progress TO authenticated;
GRANT ALL ON public.public_profiles TO service_role;
GRANT ALL ON public.leaderboard_xp TO service_role;
GRANT ALL ON public.leaderboard_progress TO service_role;
