-- Add familiarity_level column to profiles table
-- Stores user's self-assessed knowledge level for their selected market
-- Values: 'beginner', 'intermediate', 'advanced'
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS familiarity_level TEXT DEFAULT NULL;

-- Add a check constraint to ensure valid values
ALTER TABLE public.profiles
ADD CONSTRAINT valid_familiarity_level 
CHECK (familiarity_level IS NULL OR familiarity_level IN ('beginner', 'intermediate', 'advanced'));

-- Comment for documentation
COMMENT ON COLUMN public.profiles.familiarity_level IS 'User self-assessed knowledge level: beginner, intermediate, or advanced. Used to adjust content complexity.';
