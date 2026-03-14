
-- Behavioral Stories (STAR method story bank)
CREATE TABLE public.behavioral_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id text NOT NULL REFERENCES public.markets(id),
  title text NOT NULL,
  situation text,
  task text,
  action text,
  result text,
  tags text[] DEFAULT '{}',
  quality_score integer DEFAULT 0,
  ai_feedback jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.behavioral_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stories" ON public.behavioral_stories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stories" ON public.behavioral_stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stories" ON public.behavioral_stories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories" ON public.behavioral_stories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Interview Analytics (performance tracking over time)
CREATE TABLE public.interview_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id text NOT NULL REFERENCES public.markets(id),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  path text NOT NULL,
  total_mocks integer DEFAULT 0,
  avg_score real DEFAULT 0,
  avg_structure_score real DEFAULT 0,
  avg_content_score real DEFAULT 0,
  avg_persona_score real DEFAULT 0,
  mcqs_attempted integer DEFAULT 0,
  mcqs_correct integer DEFAULT 0,
  cases_completed integer DEFAULT 0,
  weak_areas text[] DEFAULT '{}',
  strong_areas text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, market_id, session_date, path)
);

ALTER TABLE public.interview_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics" ON public.interview_analytics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics" ON public.interview_analytics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analytics" ON public.interview_analytics FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Interview Leaderboard (weekly scores — readable by all for ranking)
CREATE TABLE public.interview_leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id text NOT NULL REFERENCES public.markets(id),
  week_of date NOT NULL DEFAULT (date_trunc('week', CURRENT_DATE))::date,
  total_score integer DEFAULT 0,
  mocks_completed integer DEFAULT 0,
  avg_score real DEFAULT 0,
  best_score integer DEFAULT 0,
  rank_percentile real,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, market_id, week_of)
);

ALTER TABLE public.interview_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard" ON public.interview_leaderboard FOR SELECT USING (true);
CREATE POLICY "Users can insert own leaderboard" ON public.interview_leaderboard FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leaderboard" ON public.interview_leaderboard FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Add interview daily usage tracking to content access
-- Add 'interview' as a trackable type in the daily limit system
-- (handled in code via useContentAccess hook)
