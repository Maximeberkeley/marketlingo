
-- Create generation progress tracking table
CREATE TABLE IF NOT EXISTS public.curriculum_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  days_target INTEGER NOT NULL DEFAULT 180,
  days_completed INTEGER NOT NULL DEFAULT 0,
  days_failed INTEGER NOT NULL DEFAULT 0,
  current_day INTEGER,
  error_log JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.curriculum_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage jobs
CREATE POLICY "Admins can manage generation jobs"
ON public.curriculum_generation_jobs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role can manage jobs"
ON public.curriculum_generation_jobs
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Add index for status queries
CREATE INDEX idx_generation_jobs_status ON public.curriculum_generation_jobs(status);
CREATE INDEX idx_generation_jobs_market ON public.curriculum_generation_jobs(market_id);
