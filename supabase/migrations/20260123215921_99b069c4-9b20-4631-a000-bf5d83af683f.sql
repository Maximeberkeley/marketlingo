-- Add push_token column to profiles for storing device push tokens
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_token text,
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"dailyReminder": true, "reminderTime": "09:00", "newsAlerts": true, "streakReminders": true}'::jsonb;

-- Add index for push tokens (for sending broadcast notifications)
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON public.profiles(push_token) WHERE push_token IS NOT NULL;