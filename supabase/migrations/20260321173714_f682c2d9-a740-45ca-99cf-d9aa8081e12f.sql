
-- Add module_progress JSONB to track mid-session resume state per module
ALTER TABLE public.investment_lab_progress 
  ADD COLUMN IF NOT EXISTS module_progress JSONB DEFAULT '{}'::jsonb;

-- Add learned_concepts to track cross-pollination
ALTER TABLE public.investment_lab_progress
  ADD COLUMN IF NOT EXISTS learned_concepts TEXT[] DEFAULT '{}'::text[];
