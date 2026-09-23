ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS demo_onboarding_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_display_name_length
  CHECK (display_name IS NULL OR char_length(btrim(display_name)) BETWEEN 1 AND 40),
  ADD CONSTRAINT profiles_demo_onboarding_status_check
  CHECK (demo_onboarding_status IN ('pending', 'completed', 'skipped'));

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

COMMENT ON COLUMN public.profiles.display_name IS 'Private learner-facing display name used for personalized coaching copy.';
COMMENT ON COLUMN public.profiles.demo_onboarding_status IS 'Tracks whether the universal onboarding demo is pending, completed, or skipped.';