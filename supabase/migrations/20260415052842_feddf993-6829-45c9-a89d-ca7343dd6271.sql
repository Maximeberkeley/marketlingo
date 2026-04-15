
-- Seminars table
CREATE TABLE public.seminars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id text NOT NULL REFERENCES public.markets(id),
  title text NOT NULL,
  description text,
  speaker_name text,
  speaker_title text,
  speaker_avatar_url text,
  video_url text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'upcoming',
  prep_start_at timestamptz,
  post_content_at timestamptz,
  key_takeaways jsonb DEFAULT '[]'::jsonb,
  mini_case text,
  tags text[] DEFAULT '{}'::text[],
  is_pro_only boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seminars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seminars readable by authenticated" ON public.seminars
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role manages seminars" ON public.seminars
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins manage seminars" ON public.seminars
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seminar prep modules
CREATE TABLE public.seminar_prep_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seminar_id uuid NOT NULL REFERENCES public.seminars(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  quiz_question text,
  quiz_options jsonb DEFAULT '[]'::jsonb,
  correct_index integer,
  sort_order integer NOT NULL DEFAULT 0,
  xp_reward integer NOT NULL DEFAULT 25,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seminar_prep_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prep modules readable by authenticated" ON public.seminar_prep_modules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role manages prep modules" ON public.seminar_prep_modules
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins manage prep modules" ON public.seminar_prep_modules
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seminar registrations
CREATE TABLE public.seminar_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  seminar_id uuid NOT NULL REFERENCES public.seminars(id) ON DELETE CASCADE,
  registered_at timestamptz NOT NULL DEFAULT now(),
  attended boolean NOT NULL DEFAULT false,
  prep_completed boolean NOT NULL DEFAULT false,
  prep_modules_done integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, seminar_id)
);

ALTER TABLE public.seminar_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own registrations" ON public.seminar_registrations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own registrations" ON public.seminar_registrations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own registrations" ON public.seminar_registrations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Seminar chat messages
CREATE TABLE public.seminar_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seminar_id uuid NOT NULL REFERENCES public.seminars(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seminar_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat messages readable by authenticated" ON public.seminar_chat_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users insert own chat messages" ON public.seminar_chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.seminar_chat_messages;

-- Indexes
CREATE INDEX idx_seminars_market_status ON public.seminars(market_id, status);
CREATE INDEX idx_seminars_scheduled ON public.seminars(scheduled_at);
CREATE INDEX idx_seminar_prep_seminar_id ON public.seminar_prep_modules(seminar_id);
CREATE INDEX idx_seminar_registrations_user ON public.seminar_registrations(user_id);
CREATE INDEX idx_seminar_chat_seminar ON public.seminar_chat_messages(seminar_id, created_at);

-- Seed test seminar
INSERT INTO public.seminars (market_id, title, description, speaker_name, speaker_title, video_url, scheduled_at, duration_minutes, status, prep_start_at, post_content_at, key_takeaways, mini_case, tags)
VALUES (
  'aerospace',
  'SpaceX Starship: The Economics of Reusability',
  'Deep dive into how SpaceX''s Starship program is reshaping launch economics, supply chains, and the competitive landscape. We''ll analyze cost-per-kg trends, manufacturing innovations, and what this means for investors and industry professionals.',
  'Dr. Sarah Chen',
  'Former SpaceX Propulsion Engineer & Aerospace Analyst',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  NOW() + INTERVAL '5 days',
  60,
  'upcoming',
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '6 days',
  '[{"text": "Starship reduces cost-per-kg to orbit by 10x vs Falcon 9"}, {"text": "Full reusability changes the entire supply chain calculus"}, {"text": "Traditional launch providers face existential competitive pressure"}]'::jsonb,
  'You are an analyst at a space-focused PE fund. SpaceX announces Starship operational readiness 6 months early. How does this affect your portfolio thesis on ULA and Arianespace partnerships?',
  ARRAY['launch-economics', 'reusability', 'spacex']
);

-- Seed prep modules for the test seminar
INSERT INTO public.seminar_prep_modules (seminar_id, title, content, quiz_question, quiz_options, correct_index, sort_order, xp_reward)
SELECT 
  s.id,
  'Understanding Launch Economics',
  E'## Launch Cost Fundamentals\n\nThe cost of putting payload into orbit is measured in **cost per kilogram ($/kg)**. This single metric drives the entire commercial space industry.\n\n### Key Numbers\n- **Space Shuttle**: ~$54,500/kg\n- **Falcon 9 (expendable)**: ~$2,720/kg\n- **Falcon 9 (reusable)**: ~$1,500/kg\n- **Starship (projected)**: ~$100-200/kg\n\nThis 10-100x reduction fundamentally changes what''s economically viable in space.',
  'What is the approximate cost per kg to orbit for a reusable Falcon 9?',
  '["$15,000/kg", "$1,500/kg", "$500/kg", "$5,000/kg"]'::jsonb,
  1,
  0,
  25
FROM public.seminars s WHERE s.title = 'SpaceX Starship: The Economics of Reusability'
UNION ALL
SELECT
  s.id,
  'Reusability Impact on Supply Chains',
  E'## How Reusability Reshapes Manufacturing\n\nTraditional rockets are built once and destroyed. Reusable rockets flip the manufacturing model:\n\n### Old Model (Expendable)\n- High-volume component production\n- Single-use quality standards\n- Linear supply chain\n\n### New Model (Reusable)\n- Low-volume, high-durability manufacturing\n- Maintenance and refurbishment focus\n- Circular supply chain with inspection cycles\n\nThis shift affects every supplier from engine manufacturers to avionics providers.',
  'How does reusability change the manufacturing model for rocket components?',
  '["More components needed per launch", "Shift toward high-durability, low-volume production", "No change in manufacturing", "Only affects engine production"]'::jsonb,
  1,
  1,
  25
FROM public.seminars s WHERE s.title = 'SpaceX Starship: The Economics of Reusability';
