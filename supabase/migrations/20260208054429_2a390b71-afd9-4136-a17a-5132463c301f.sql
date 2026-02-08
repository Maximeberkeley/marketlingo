-- Add familiarity_level column to user_progress table (per-market storage)
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS familiarity_level TEXT;

-- Add a comment explaining the field
COMMENT ON COLUMN public.user_progress.familiarity_level IS 'User familiarity level for this specific market: beginner, intermediate, or advanced';