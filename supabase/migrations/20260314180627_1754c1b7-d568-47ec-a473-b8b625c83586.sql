
-- Issue #14: Create interview_lab_attempts table for persisting MCQ and Mock Lab progress
CREATE TABLE public.interview_lab_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  market_id TEXT NOT NULL REFERENCES public.markets(id),
  path TEXT NOT NULL CHECK (path IN ('consulting', 'academic')),
  stage INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 4),
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('mcq', 'mock')),
  score INTEGER DEFAULT 0,
  structure_score INTEGER,
  content_score INTEGER,
  persona_score INTEGER,
  persona TEXT,
  scenario_question TEXT,
  user_response TEXT,
  feedback JSONB,
  buzzwords_used TEXT[] DEFAULT '{}',
  buzzwords_missed TEXT[] DEFAULT '{}',
  time_spent_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interview_lab_attempts ENABLE ROW LEVEL SECURITY;

-- Users can insert their own attempts
CREATE POLICY "Users can insert their own interview attempts"
  ON public.interview_lab_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own attempts
CREATE POLICY "Users can view their own interview attempts"
  ON public.interview_lab_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
