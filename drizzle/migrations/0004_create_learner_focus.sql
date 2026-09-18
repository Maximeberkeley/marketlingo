CREATE TABLE public.learner_focus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id TEXT NOT NULL,
  focus_key TEXT NOT NULL,
  focus_label TEXT NOT NULL,
  chosen_day INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, market_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.learner_focus TO authenticated;
GRANT ALL ON public.learner_focus TO service_role;

ALTER TABLE public.learner_focus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners read their own focus" ON public.learner_focus
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Learners set their own focus" ON public.learner_focus
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Learners update their own focus" ON public.learner_focus
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Learners delete their own focus" ON public.learner_focus
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER learner_focus_set_updated_at
  BEFORE UPDATE ON public.learner_focus
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
