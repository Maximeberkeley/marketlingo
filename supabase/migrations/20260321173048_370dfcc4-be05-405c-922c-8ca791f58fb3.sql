
-- Portfolio snapshots for strategy evolution tracking
CREATE TABLE public.portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  market_id TEXT NOT NULL,
  snapshot_name TEXT NOT NULL DEFAULT 'Untitled Strategy',
  positions JSONB NOT NULL DEFAULT '[]',
  total_allocation NUMERIC DEFAULT 0,
  strategy_notes TEXT,
  category_breakdown JSONB DEFAULT '{"core":0,"growth":0,"speculative":0}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own snapshots"
  ON public.portfolio_snapshots FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Watchlist thesis tracking
CREATE TABLE public.watchlist_theses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  market_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  ticker TEXT,
  thesis TEXT NOT NULL,
  review_due_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  last_reviewed_at TIMESTAMPTZ,
  review_count INT DEFAULT 0,
  still_valid BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, market_id, company_id)
);

ALTER TABLE public.watchlist_theses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own theses"
  ON public.watchlist_theses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
