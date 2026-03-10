
-- Table for pre-generated, AI-polished drill questions
CREATE TABLE public.drill_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id text NOT NULL REFERENCES public.markets(id),
  stack_id uuid REFERENCES public.stacks(id),
  day_number integer NOT NULL,
  set_number integer NOT NULL DEFAULT 1,
  question_number integer NOT NULL DEFAULT 1,
  statement text NOT NULL,
  is_true boolean NOT NULL,
  explanation text NOT NULL,
  category text NOT NULL DEFAULT 'Market Insight',
  difficulty text NOT NULL DEFAULT 'intermediate',
  source_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by market + day
CREATE INDEX idx_drill_questions_market_day ON public.drill_questions(market_id, day_number);
CREATE INDEX idx_drill_questions_stack ON public.drill_questions(stack_id);

-- Unique constraint to prevent duplicates
ALTER TABLE public.drill_questions ADD CONSTRAINT unique_drill_question 
  UNIQUE (market_id, day_number, set_number, question_number);

-- RLS
ALTER TABLE public.drill_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drill questions are readable by authenticated users"
  ON public.drill_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role can manage drill questions"
  ON public.drill_questions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
