CREATE TABLE public.deliverable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  market_id text NOT NULL REFERENCES public.markets(id),
  goal_key text NOT NULL DEFAULT 'curiosity',
  section_key text NOT NULL,
  content text NOT NULL,
  day_number integer,
  source text NOT NULL DEFAULT 'learner',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX deliverable_entries_owner_idx
  ON public.deliverable_entries (user_id, market_id, goal_key, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliverable_entries TO authenticated;
GRANT ALL ON public.deliverable_entries TO service_role;

ALTER TABLE public.deliverable_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners read their own deliverable entries"
  ON public.deliverable_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Learners write their own deliverable entries"
  ON public.deliverable_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Learners update their own deliverable entries"
  ON public.deliverable_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Learners delete their own deliverable entries"
  ON public.deliverable_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER deliverable_entries_set_updated_at
  BEFORE UPDATE ON public.deliverable_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();