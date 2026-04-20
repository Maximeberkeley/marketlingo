
-- 1) Chat: replies, likes, deletion
ALTER TABLE public.seminar_chat_messages
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.seminar_chat_messages(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reply_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_seminar_chat_parent ON public.seminar_chat_messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_seminar_chat_seminar ON public.seminar_chat_messages(seminar_id, created_at);

-- Allow users to UPDATE own messages (for soft features) and DELETE own
DROP POLICY IF EXISTS "Users delete own chat messages" ON public.seminar_chat_messages;
CREATE POLICY "Users delete own chat messages"
ON public.seminar_chat_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own chat messages" ON public.seminar_chat_messages;
CREATE POLICY "Users update own chat messages"
ON public.seminar_chat_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 2) Likes table
CREATE TABLE IF NOT EXISTS public.seminar_message_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.seminar_chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

ALTER TABLE public.seminar_message_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes readable by authenticated" ON public.seminar_message_likes;
CREATE POLICY "Likes readable by authenticated"
ON public.seminar_message_likes
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users insert own likes" ON public.seminar_message_likes;
CREATE POLICY "Users insert own likes"
ON public.seminar_message_likes
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own likes" ON public.seminar_message_likes;
CREATE POLICY "Users delete own likes"
ON public.seminar_message_likes
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3) Counter triggers for likes
CREATE OR REPLACE FUNCTION public.update_message_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.seminar_chat_messages
      SET like_count = like_count + 1
      WHERE id = NEW.message_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.seminar_chat_messages
      SET like_count = GREATEST(0, like_count - 1)
      WHERE id = OLD.message_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_message_like_count ON public.seminar_message_likes;
CREATE TRIGGER trg_message_like_count
AFTER INSERT OR DELETE ON public.seminar_message_likes
FOR EACH ROW EXECUTE FUNCTION public.update_message_like_count();

-- 4) Counter trigger for replies
CREATE OR REPLACE FUNCTION public.update_message_reply_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.seminar_chat_messages
      SET reply_count = reply_count + 1
      WHERE id = NEW.parent_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') AND OLD.parent_id IS NOT NULL THEN
    UPDATE public.seminar_chat_messages
      SET reply_count = GREATEST(0, reply_count - 1)
      WHERE id = OLD.parent_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_message_reply_count ON public.seminar_chat_messages;
CREATE TRIGGER trg_message_reply_count
AFTER INSERT OR DELETE ON public.seminar_chat_messages
FOR EACH ROW EXECUTE FUNCTION public.update_message_reply_count();

-- 5) Realtime
ALTER TABLE public.seminar_chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.seminar_message_likes REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.seminar_chat_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.seminar_message_likes;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 6) Prep engine upgrade
ALTER TABLE public.seminar_prep_modules
  ADD COLUMN IF NOT EXISTS module_type text NOT NULL DEFAULT 'concept_quiz',
  ADD COLUMN IF NOT EXISTS key_takeaways jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reflection_prompt text,
  ADD COLUMN IF NOT EXISTS scenario_brief text,
  ADD COLUMN IF NOT EXISTS flashcards jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS estimated_minutes integer NOT NULL DEFAULT 3;

-- 7) Bump app version
-- (handled in app.json client-side)
