
DO $$
DECLARE r record; new_check text;
BEGIN
  FOR r IN
    SELECT tablename, policyname, qual, roles
    FROM pg_policies
    WHERE schemaname='public' AND cmd='UPDATE' AND with_check IS NULL
  LOOP
    new_check := r.qual;
    EXECUTE format(
      'ALTER POLICY %I ON public.%I USING (%s) WITH CHECK (%s)',
      r.policyname, r.tablename, r.qual, new_check
    );
  END LOOP;
END $$;

-- Friendships: a party may edit the row but must not reassign either side
DROP POLICY IF EXISTS "Users can update friendships they're part of" ON public.friendships;
CREATE POLICY "Users can update friendships they're part of"
ON public.friendships FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);
