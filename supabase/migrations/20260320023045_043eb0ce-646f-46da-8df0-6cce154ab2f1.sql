
-- Interview questions bank: stores all questions categorized by industry, path, stage
CREATE TABLE public.interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id text NOT NULL REFERENCES public.markets(id),
  path text NOT NULL DEFAULT 'consulting', -- 'consulting' or 'academic'
  stage integer NOT NULL DEFAULT 4, -- 1=framework, 2=expectations, 3=mcq, 4=mock
  question_type text NOT NULL DEFAULT 'mock', -- 'mock', 'mcq', 'mental_math', 'market_sizing', 'framework', 'big_boss'
  
  -- Question content
  scenario text, -- context/scenario for mock questions
  question text NOT NULL,
  options jsonb DEFAULT '[]'::jsonb, -- for MCQ/mental math
  correct_index integer, -- for MCQ
  explanation text,
  buzzwords text[] DEFAULT '{}'::text[],
  sample_answer text,
  hero_problem text, -- the industry's "hero problem" from template engine
  hints jsonb DEFAULT '[]'::jsonb, -- for market sizing
  reasonable_range text, -- for market sizing
  
  -- Persona focus
  persona_focus text, -- which persona this question is best for
  difficulty text DEFAULT 'intermediate',
  
  -- Metadata
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- Questions are readable by authenticated users
CREATE POLICY "Interview questions readable by authenticated"
  ON public.interview_questions FOR SELECT TO authenticated
  USING (true);

-- Service role can manage
CREATE POLICY "Service role manages interview questions"
  ON public.interview_questions FOR ALL TO public
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Admins can manage
CREATE POLICY "Admins manage interview questions"
  ON public.interview_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for fast lookups
CREATE INDEX idx_interview_questions_market_stage ON public.interview_questions(market_id, stage, question_type);
CREATE INDEX idx_interview_questions_path ON public.interview_questions(path, is_active);
