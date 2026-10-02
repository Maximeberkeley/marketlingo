DROP POLICY IF EXISTS "Signed-in users can read league standings" ON public.league_memberships;
CREATE POLICY "Users read own league memberships" ON public.league_memberships FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Likes readable by authenticated" ON public.seminar_message_likes;
CREATE POLICY "Users read own likes" ON public.seminar_message_likes FOR SELECT TO authenticated USING (auth.uid() = user_id);