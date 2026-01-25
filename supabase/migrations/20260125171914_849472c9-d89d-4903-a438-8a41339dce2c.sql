-- Create XP and leveling system

-- User XP table
CREATE TABLE public.user_xp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  market_id TEXT NOT NULL REFERENCES public.markets(id),
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  xp_to_next_level INTEGER NOT NULL DEFAULT 100,
  startup_stage INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, market_id)
);

-- XP transaction log for tracking all XP earned
CREATE TABLE public.xp_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  market_id TEXT NOT NULL REFERENCES public.markets(id),
  xp_amount INTEGER NOT NULL,
  source_type TEXT NOT NULL, -- 'lesson', 'game', 'drill', 'trainer', 'streak_bonus'
  source_id UUID, -- Reference to the completed item
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily completion tracking to manage "done for the day" logic
CREATE TABLE public.daily_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  market_id TEXT NOT NULL REFERENCES public.markets(id),
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  lesson_completed BOOLEAN NOT NULL DEFAULT false,
  completed_stack_id UUID,
  games_completed INTEGER NOT NULL DEFAULT 0,
  drills_completed INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, market_id, completion_date)
);

-- Enable RLS on all tables
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_xp
CREATE POLICY "Users can view their own XP"
  ON public.user_xp FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP"
  ON public.user_xp FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own XP"
  ON public.user_xp FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for xp_transactions
CREATE POLICY "Users can view their own XP transactions"
  ON public.xp_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP transactions"
  ON public.xp_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for daily_completions
CREATE POLICY "Users can view their own daily completions"
  ON public.daily_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily completions"
  ON public.daily_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily completions"
  ON public.daily_completions FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Level formula: Level = floor(sqrt(xp / 50)) + 1
  -- Level 1: 0-49 XP, Level 2: 50-199 XP, Level 3: 200-449 XP, etc.
  RETURN FLOOR(SQRT(xp::float / 50)) + 1;
END;
$$;

-- Function to calculate startup stage from XP
CREATE OR REPLACE FUNCTION public.calculate_startup_stage(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- 6 stages over 180 days, roughly 1000 XP per stage
  IF xp < 500 THEN RETURN 1; -- Ideation
  ELSIF xp < 1500 THEN RETURN 2; -- Validation
  ELSIF xp < 3000 THEN RETURN 3; -- MVP
  ELSIF xp < 5000 THEN RETURN 4; -- Traction
  ELSIF xp < 8000 THEN RETURN 5; -- Scaling
  ELSE RETURN 6; -- Established
  END IF;
END;
$$;

-- Trigger to update level and startup stage on XP change
CREATE OR REPLACE FUNCTION public.update_xp_levels()
RETURNS TRIGGER AS $$
BEGIN
  NEW.current_level := public.calculate_level(NEW.total_xp);
  NEW.startup_stage := public.calculate_startup_stage(NEW.total_xp);
  NEW.xp_to_next_level := (NEW.current_level * NEW.current_level * 50) - NEW.total_xp;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_xp_levels
  BEFORE UPDATE ON public.user_xp
  FOR EACH ROW
  EXECUTE FUNCTION public.update_xp_levels();

-- Trigger for daily_completions updated_at
CREATE TRIGGER update_daily_completions_updated_at
  BEFORE UPDATE ON public.daily_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();