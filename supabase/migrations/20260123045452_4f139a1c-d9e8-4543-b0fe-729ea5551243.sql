-- MarketLingo Database Schema
-- All user-specific data protected by RLS

-- =====================
-- MARKETS TABLE (public read)
-- =====================
CREATE TABLE public.markets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'cpu',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Markets are publicly readable" 
ON public.markets FOR SELECT 
USING (true);

-- Insert default markets
INSERT INTO public.markets (id, name, icon, description) VALUES
  ('ai', 'AI Industry', 'cpu', 'Artificial intelligence and machine learning'),
  ('fintech', 'Fintech', 'banknote', 'Financial technology and digital banking'),
  ('ev', 'Electric Vehicles', 'zap', 'Electric vehicles and clean transportation'),
  ('biotech', 'Biotech', 'pill', 'Biotechnology and pharmaceuticals'),
  ('energy', 'Clean Energy', 'sun', 'Renewable energy and sustainability'),
  ('mobile', 'Mobile Tech', 'smartphone', 'Mobile technology and apps'),
  ('agtech', 'AgTech', 'leaf', 'Agricultural technology'),
  ('aerospace', 'Aerospace', 'rocket', 'Space and aviation technology'),
  ('creator', 'Creator Economy', 'palette', 'Content creation and social media'),
  ('ecommerce', 'E-commerce', 'shopping-cart', 'Online retail and marketplaces'),
  ('gaming', 'Gaming', 'gamepad-2', 'Video games and interactive entertainment');

-- =====================
-- PROFILES TABLE
-- =====================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  selected_market TEXT REFERENCES public.markets(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- =====================
-- STACKS TABLE (content - public read)
-- =====================
CREATE TABLE public.stacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id TEXT NOT NULL REFERENCES public.markets(id),
  title TEXT NOT NULL,
  stack_type TEXT NOT NULL CHECK (stack_type IN ('NEWS', 'HISTORY', 'LESSON', 'GAME', 'DRILL', 'SUMMARY')),
  duration_minutes INTEGER DEFAULT 5,
  tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stacks are publicly readable" 
ON public.stacks FOR SELECT 
USING (published_at IS NOT NULL);

-- =====================
-- SLIDES TABLE (content - public read)
-- =====================
CREATE TABLE public.slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stack_id UUID NOT NULL REFERENCES public.stacks(id) ON DELETE CASCADE,
  slide_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(stack_id, slide_number)
);

ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Slides are publicly readable" 
ON public.slides FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.stacks 
  WHERE stacks.id = slides.stack_id AND stacks.published_at IS NOT NULL
));

-- =====================
-- USER PROGRESS TABLE
-- =====================
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id TEXT NOT NULL REFERENCES public.markets(id),
  current_day INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  streak_expires_at TIMESTAMPTZ,
  completed_stacks UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, market_id)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" 
ON public.user_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.user_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- =====================
-- NOTES TABLE
-- =====================
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slide_id UUID REFERENCES public.slides(id) ON DELETE SET NULL,
  stack_id UUID REFERENCES public.stacks(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  linked_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes" 
ON public.notes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" 
ON public.notes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON public.notes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.notes FOR DELETE 
USING (auth.uid() = user_id);

-- =====================
-- SAVED INSIGHTS TABLE
-- =====================
CREATE TABLE public.saved_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slide_id UUID REFERENCES public.slides(id) ON DELETE SET NULL,
  stack_id UUID REFERENCES public.stacks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights" 
ON public.saved_insights FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights" 
ON public.saved_insights FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights" 
ON public.saved_insights FOR DELETE 
USING (auth.uid() = user_id);

-- =====================
-- TRAINER SCENARIOS TABLE
-- =====================
CREATE TABLE public.trainer_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id TEXT NOT NULL REFERENCES public.markets(id),
  scenario TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_option_index INTEGER NOT NULL,
  feedback_pro_reasoning TEXT,
  feedback_common_mistake TEXT,
  feedback_mental_model TEXT,
  follow_up_question TEXT,
  tags TEXT[] DEFAULT '{}',
  sources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trainer_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainer scenarios are publicly readable" 
ON public.trainer_scenarios FOR SELECT 
USING (true);

-- =====================
-- TRAINER ATTEMPTS TABLE
-- =====================
CREATE TABLE public.trainer_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES public.trainer_scenarios(id) ON DELETE CASCADE,
  selected_option INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trainer_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempts" 
ON public.trainer_attempts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts" 
ON public.trainer_attempts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- =====================
-- GAMES PROGRESS TABLE
-- =====================
CREATE TABLE public.games_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  market_id TEXT NOT NULL REFERENCES public.markets(id),
  score INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  completed_at TIMESTAMPTZ,
  progress_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_type, market_id)
);

ALTER TABLE public.games_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own games progress" 
ON public.games_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own games progress" 
ON public.games_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own games progress" 
ON public.games_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- =====================
-- DRILLS PROGRESS TABLE
-- =====================
CREATE TABLE public.drills_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drill_type TEXT NOT NULL,
  market_id TEXT NOT NULL REFERENCES public.markets(id),
  completed_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  average_time_seconds REAL,
  last_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, drill_type, market_id)
);

ALTER TABLE public.drills_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drills progress" 
ON public.drills_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drills progress" 
ON public.drills_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drills progress" 
ON public.drills_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- =====================
-- SUMMARIES TABLE
-- =====================
CREATE TABLE public.summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id TEXT NOT NULL REFERENCES public.markets(id),
  title TEXT NOT NULL,
  summary_type TEXT NOT NULL CHECK (summary_type IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  content TEXT NOT NULL,
  key_takeaways JSONB DEFAULT '[]',
  for_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Summaries are publicly readable" 
ON public.summaries FOR SELECT 
USING (true);

-- =====================
-- HELPER FUNCTIONS
-- =====================

-- Function to update user streak
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if streak has expired (48h rule)
  IF OLD.streak_expires_at IS NOT NULL AND OLD.streak_expires_at < NOW() THEN
    NEW.current_streak := 1;
  ELSE
    -- Only increment if this is a new day
    IF OLD.last_activity_at IS NULL OR 
       DATE(OLD.last_activity_at AT TIME ZONE 'UTC') < DATE(NOW() AT TIME ZONE 'UTC') THEN
      NEW.current_streak := COALESCE(OLD.current_streak, 0) + 1;
    END IF;
  END IF;
  
  -- Update longest streak
  IF NEW.current_streak > COALESCE(OLD.longest_streak, 0) THEN
    NEW.longest_streak := NEW.current_streak;
  END IF;
  
  -- Set new expiration (48 hours from now)
  NEW.streak_expires_at := NOW() + INTERVAL '48 hours';
  NEW.last_activity_at := NOW();
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_user_progress_update
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_streak();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_games_progress_updated_at
  BEFORE UPDATE ON public.games_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drills_progress_updated_at
  BEFORE UPDATE ON public.drills_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();