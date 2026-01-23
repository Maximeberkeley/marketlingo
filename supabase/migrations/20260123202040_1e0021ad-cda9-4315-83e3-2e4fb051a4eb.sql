-- Create news_items table for future news ingestion
CREATE TABLE public.news_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL,
  title TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  category_tag TEXT,
  stack_id UUID REFERENCES public.stacks(id),
  summary TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;

-- News items are publicly readable (no auth required for reading news)
CREATE POLICY "News items are publicly readable"
  ON public.news_items
  FOR SELECT
  USING (true);

-- Create index for efficient querying by market and date
CREATE INDEX idx_news_items_market_published ON public.news_items(market_id, published_at DESC);
CREATE INDEX idx_news_items_category ON public.news_items(category_tag);