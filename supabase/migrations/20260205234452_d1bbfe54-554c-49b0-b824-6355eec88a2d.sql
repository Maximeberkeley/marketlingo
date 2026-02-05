-- Add start_date to track when user began their learning journey
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;

-- Update existing rows to set start_date based on created_at
UPDATE public.user_progress 
SET start_date = created_at::date 
WHERE start_date IS NULL;

-- Make it NOT NULL after population
ALTER TABLE public.user_progress 
ALTER COLUMN start_date SET NOT NULL;

-- Create a function to calculate the available day based on calendar time
CREATE OR REPLACE FUNCTION public.get_available_day(p_start_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Day 1 on start_date, Day 2 after midnight, etc.
  -- Cap at 180 (6-month program)
  RETURN LEAST(180, GREATEST(1, (CURRENT_DATE - p_start_date) + 1));
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_available_day(DATE) TO authenticated;