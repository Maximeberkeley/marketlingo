
CREATE TABLE public.streak_freezes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  market_id TEXT NOT NULL REFERENCES public.markets(id),
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  week_of DATE NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.streak_freezes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own freezes" ON public.streak_freezes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own freezes" ON public.streak_freezes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_streak_freeze_user_week ON public.streak_freezes(user_id, market_id, week_of);
