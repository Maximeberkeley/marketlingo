CREATE TABLE public.lesson_deep_dives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stack_id UUID NOT NULL REFERENCES public.stacks(id) ON DELETE CASCADE,
  market_id TEXT NOT NULL REFERENCES public.markets(id),
  goal_key TEXT NOT NULL DEFAULT 'explore',
  concept TEXT NOT NULL,
  summary TEXT NOT NULL,
  mechanism JSONB NOT NULL DEFAULT '[]'::jsonb,
  case_study JSONB NOT NULL DEFAULT '{}'::jsonb,
  key_terms JSONB NOT NULL DEFAULT '[]'::jsonb,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (stack_id, goal_key)
);

GRANT SELECT ON public.lesson_deep_dives TO authenticated;
GRANT ALL ON public.lesson_deep_dives TO service_role;

ALTER TABLE public.lesson_deep_dives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deep dives readable by signed-in learners"
ON public.lesson_deep_dives
FOR SELECT
TO authenticated
USING (true);

CREATE INDEX idx_lesson_deep_dives_market ON public.lesson_deep_dives(market_id, goal_key);

CREATE TRIGGER set_lesson_deep_dives_updated_at
BEFORE UPDATE ON public.lesson_deep_dives
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();