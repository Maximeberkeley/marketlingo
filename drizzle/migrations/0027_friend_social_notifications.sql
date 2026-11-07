-- One push per friend streak or race and kind (invite, challenge, accepted),
-- written only by the friend-social-notify function (service role), so a
-- learner can't spam a friend by asking for the same push again.
-- Safe to run again.

CREATE TABLE IF NOT EXISTS public.friend_social_notifications (
  subject_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('streak_invite', 'streak_accepted', 'race_challenge', 'race_accepted')),
  sent_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subject_id, kind)
);

ALTER TABLE public.friend_social_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.friend_social_notifications FROM anon, authenticated;
GRANT ALL ON public.friend_social_notifications TO service_role;
