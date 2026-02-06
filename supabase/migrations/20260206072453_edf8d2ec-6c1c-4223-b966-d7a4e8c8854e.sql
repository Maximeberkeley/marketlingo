-- Add Pro subscription columns to profiles table
-- This ensures Pro status is user-specific and synced with the database

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_pro_user BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS pro_plan_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pro_trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pro_trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pro_subscription_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.is_pro_user IS 'Whether user has active Pro subscription or trial';
COMMENT ON COLUMN public.profiles.pro_plan_type IS 'Type of plan: monthly, annual, or trial';
COMMENT ON COLUMN public.profiles.pro_trial_start_date IS 'When trial started (if applicable)';
COMMENT ON COLUMN public.profiles.pro_trial_end_date IS 'When trial ends (if applicable)';
COMMENT ON COLUMN public.profiles.pro_subscription_date IS 'When paid subscription started';