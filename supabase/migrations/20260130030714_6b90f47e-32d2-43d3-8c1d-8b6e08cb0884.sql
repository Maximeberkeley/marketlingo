-- Investment Lab Progress Table
-- Tracks user progress through the optional investment readiness modules
CREATE TABLE public.investment_lab_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  market_id TEXT NOT NULL,
  -- Investment modules completion
  valuation_score INTEGER DEFAULT 0,
  due_diligence_score INTEGER DEFAULT 0,
  risk_assessment_score INTEGER DEFAULT 0,
  portfolio_construction_score INTEGER DEFAULT 0,
  -- Simulation progress
  paper_trades_completed INTEGER DEFAULT 0,
  simulation_accuracy REAL DEFAULT 0,
  -- Watchlist
  watchlist_companies JSONB DEFAULT '[]'::jsonb,
  -- Investment thesis submissions
  thesis_submissions INTEGER DEFAULT 0,
  -- Certification status
  investment_certified BOOLEAN DEFAULT false,
  certified_at TIMESTAMP WITH TIME ZONE,
  -- Total investment XP (separate from main XP)
  investment_xp INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_lab_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own investment progress"
  ON public.investment_lab_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investment progress"
  ON public.investment_lab_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment progress"
  ON public.investment_lab_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Investment scenarios table (like trainer but investment-focused)
CREATE TABLE public.investment_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL,
  scenario_type TEXT NOT NULL CHECK (scenario_type IN ('valuation', 'due_diligence', 'risk', 'portfolio', 'thesis')),
  title TEXT NOT NULL,
  scenario TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option_index INTEGER NOT NULL,
  explanation TEXT,
  real_world_example TEXT,
  valuation_model TEXT, -- DCF, Comps, etc.
  difficulty TEXT CHECK (difficulty IN ('intermediate', 'advanced', 'expert')) DEFAULT 'intermediate',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_scenarios ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Investment scenarios are publicly readable"
  ON public.investment_scenarios
  FOR SELECT
  USING (true);

-- Investment scenario attempts
CREATE TABLE public.investment_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scenario_id UUID NOT NULL REFERENCES public.investment_scenarios(id),
  selected_option INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own investment attempts"
  ON public.investment_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investment attempts"
  ON public.investment_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Updated at trigger for investment_lab_progress
CREATE TRIGGER update_investment_lab_progress_updated_at
  BEFORE UPDATE ON public.investment_lab_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();