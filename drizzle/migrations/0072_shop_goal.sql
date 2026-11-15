-- Shop goal (schema only, founder Nov 14): the one item a learner is saving for. The item page pins it and Home
-- shows how close they are after each lesson. One row per learner; they read and write only their own.
-- Safe to run again.
CREATE TABLE IF NOT EXISTS public.user_shop_goal (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  set_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_shop_goal ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_shop_goal TO authenticated;
GRANT ALL ON public.user_shop_goal TO service_role;

DROP POLICY IF EXISTS "Own goal is readable" ON public.user_shop_goal;
CREATE POLICY "Own goal is readable" ON public.user_shop_goal FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Own goal can be set" ON public.user_shop_goal;
CREATE POLICY "Own goal can be set" ON public.user_shop_goal FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Own goal can be changed" ON public.user_shop_goal;
CREATE POLICY "Own goal can be changed" ON public.user_shop_goal FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Own goal can be cleared" ON public.user_shop_goal;
CREATE POLICY "Own goal can be cleared" ON public.user_shop_goal FOR DELETE TO authenticated USING (user_id = auth.uid());
