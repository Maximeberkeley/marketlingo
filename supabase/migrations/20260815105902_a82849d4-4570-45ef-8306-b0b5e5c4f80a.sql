-- 1. Consent columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_consent_declined_at timestamptz,
  ADD COLUMN IF NOT EXISTS voice_consent_at timestamptz;

-- 2. Feature flags (remote kill switch)
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feature_flags TO anon, authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Feature flags are readable by everyone" ON public.feature_flags;
CREATE POLICY "Feature flags are readable by everyone" ON public.feature_flags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage feature flags" ON public.feature_flags;
CREATE POLICY "Admins manage feature flags" ON public.feature_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('ai_leo', true, 'Leo AI chat and explanations'),
  ('ai_voice', true, 'Voice input/output (TTS + STT)'),
  ('ai_mentor_chat', true, 'Mentor chat overlays'),
  ('decision_engine', true, 'Predict/consequence decision loop in lessons'),
  ('market_of_the_day', false, 'Daily market scenario ritual')
ON CONFLICT (key) DO NOTHING;

-- 3. Analytics events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert their own events" ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read their own events" ON public.analytics_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_time ON public.analytics_events (user_id, occurred_at DESC);

-- 4. Concept mastery (deterministic, service-written)
CREATE TABLE IF NOT EXISTS public.concept_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id text NOT NULL REFERENCES public.markets(id),
  concept_key text NOT NULL,
  concept_label text,
  state text NOT NULL DEFAULT 'unseen',
  evidence_score real NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 0,
  correct_attempts integer NOT NULL DEFAULT 0,
  confident_wrong_count integer NOT NULL DEFAULT 0,
  last_misconception text,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, market_id, concept_key)
);
GRANT SELECT ON public.concept_mastery TO authenticated;
GRANT ALL ON public.concept_mastery TO service_role;
ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own mastery" ON public.concept_mastery FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_concept_mastery_updated_at BEFORE UPDATE ON public.concept_mastery
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Decision Engine scenarios + attempts
CREATE TABLE IF NOT EXISTS public.decision_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id text NOT NULL REFERENCES public.markets(id),
  stack_id uuid REFERENCES public.stacks(id),
  day_number integer,
  concept_key text NOT NULL,
  concept_label text,
  surface text NOT NULL DEFAULT 'lesson',
  prompt text NOT NULL,
  situation text,
  options jsonb NOT NULL,
  correct_option_index integer NOT NULL,
  consequence text NOT NULL,
  mechanism text NOT NULL,
  misconception_tags jsonb,
  difficulty text NOT NULL DEFAULT 'medium',
  era_tag text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.decision_scenarios TO authenticated;
GRANT ALL ON public.decision_scenarios TO service_role;
ALTER TABLE public.decision_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active scenarios readable by signed-in users" ON public.decision_scenarios FOR SELECT TO authenticated USING (is_active);
CREATE POLICY "Admins manage scenarios" ON public.decision_scenarios FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_decision_scenarios_market_day ON public.decision_scenarios (market_id, day_number) WHERE is_active;

CREATE TABLE IF NOT EXISTS public.decision_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES public.decision_scenarios(id) ON DELETE CASCADE,
  market_id text NOT NULL REFERENCES public.markets(id),
  concept_key text NOT NULL,
  selected_option integer NOT NULL,
  confidence text NOT NULL DEFAULT 'fairly_sure',
  is_correct boolean NOT NULL,
  misconception_tag text,
  evidence_delta real NOT NULL DEFAULT 0,
  time_spent_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.decision_attempts TO authenticated;
GRANT ALL ON public.decision_attempts TO service_role;
ALTER TABLE public.decision_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own decision attempts" ON public.decision_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 6. Deterministic scoring service: the ONLY writer of concept_mastery
CREATE OR REPLACE FUNCTION public.submit_decision_answer(
  p_scenario_id uuid,
  p_selected_option integer,
  p_confidence text DEFAULT 'fairly_sure',
  p_time_spent integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_s RECORD;
  v_correct boolean;
  v_difficulty_weight real;
  v_confidence_calibration real;
  v_recency real;
  v_delta real;
  v_misconception text;
  v_m RECORD;
  v_score real;
  v_state text;
  v_days_since real;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  SELECT * INTO v_s FROM decision_scenarios WHERE id = p_scenario_id AND is_active;
  IF v_s IS NULL THEN
    RETURN json_build_object('error', 'Scenario not found');
  END IF;

  IF p_confidence NOT IN ('guessing', 'fairly_sure', 'certain') THEN
    p_confidence := 'fairly_sure';
  END IF;

  v_correct := (p_selected_option = v_s.correct_option_index);

  v_difficulty_weight := CASE v_s.difficulty
    WHEN 'easy' THEN 0.7 WHEN 'hard' THEN 1.3 ELSE 1.0 END;

  -- confidence calibration: correct+certain rewarded, wrong+certain penalised hardest
  v_confidence_calibration := CASE
    WHEN v_correct AND p_confidence = 'certain' THEN 1.5
    WHEN v_correct AND p_confidence = 'fairly_sure' THEN 1.0
    WHEN v_correct AND p_confidence = 'guessing' THEN 0.4
    WHEN NOT v_correct AND p_confidence = 'certain' THEN -1.5
    WHEN NOT v_correct AND p_confidence = 'fairly_sure' THEN -0.8
    ELSE -0.4
  END;

  SELECT * INTO v_m FROM concept_mastery
   WHERE user_id = v_user_id AND market_id = v_s.market_id AND concept_key = v_s.concept_key;

  -- recency factor: evidence decays the longer since the last attempt
  IF v_m IS NULL OR v_m.last_seen_at IS NULL THEN
    v_recency := 1.0;
  ELSE
    v_days_since := EXTRACT(EPOCH FROM (now() - v_m.last_seen_at)) / 86400.0;
    v_recency := GREATEST(0.5, 1.0 - (v_days_since / 60.0));
  END IF;

  v_delta := (CASE WHEN v_correct THEN 1 ELSE 1 END) * v_difficulty_weight * v_confidence_calibration * v_recency;

  IF NOT v_correct THEN
    v_misconception := COALESCE(v_s.misconception_tags ->> p_selected_option::text, v_s.concept_key || ':wrong');
  END IF;

  INSERT INTO decision_attempts (
    user_id, scenario_id, market_id, concept_key, selected_option,
    confidence, is_correct, misconception_tag, evidence_delta, time_spent_seconds
  ) VALUES (
    v_user_id, p_scenario_id, v_s.market_id, v_s.concept_key, p_selected_option,
    p_confidence, v_correct, v_misconception, v_delta, p_time_spent
  );

  INSERT INTO concept_mastery (
    user_id, market_id, concept_key, concept_label, state, evidence_score,
    attempts, correct_attempts, confident_wrong_count, last_misconception, last_seen_at
  ) VALUES (
    v_user_id, v_s.market_id, v_s.concept_key, v_s.concept_label, 'introduced',
    GREATEST(0, v_delta), 1, CASE WHEN v_correct THEN 1 ELSE 0 END,
    CASE WHEN NOT v_correct AND p_confidence = 'certain' THEN 1 ELSE 0 END,
    v_misconception, now()
  )
  ON CONFLICT (user_id, market_id, concept_key) DO UPDATE SET
    evidence_score = GREATEST(0, concept_mastery.evidence_score + v_delta),
    attempts = concept_mastery.attempts + 1,
    correct_attempts = concept_mastery.correct_attempts + CASE WHEN v_correct THEN 1 ELSE 0 END,
    confident_wrong_count = concept_mastery.confident_wrong_count
      + CASE WHEN NOT v_correct AND p_confidence = 'certain' THEN 1 ELSE 0 END,
    last_misconception = COALESCE(v_misconception, concept_mastery.last_misconception),
    concept_label = COALESCE(concept_mastery.concept_label, v_s.concept_label),
    last_seen_at = now();

  SELECT evidence_score INTO v_score FROM concept_mastery
   WHERE user_id = v_user_id AND market_id = v_s.market_id AND concept_key = v_s.concept_key;

  v_state := CASE
    WHEN v_score >= 6 THEN 'mastered'
    WHEN v_score >= 3.5 THEN 'proficient'
    WHEN v_score >= 1.2 THEN 'practicing'
    ELSE 'introduced'
  END;

  UPDATE concept_mastery SET state = v_state
   WHERE user_id = v_user_id AND market_id = v_s.market_id AND concept_key = v_s.concept_key;

  RETURN json_build_object(
    'isCorrect', v_correct,
    'correctIndex', v_s.correct_option_index,
    'consequence', v_s.consequence,
    'mechanism', v_s.mechanism,
    'confidence', p_confidence,
    'misconception', v_misconception,
    'conceptKey', v_s.concept_key,
    'masteryState', v_state,
    'evidenceScore', v_score
  );
END;
$$;

-- Decay pass: concepts unseen for a long time slip to 'decaying'
CREATE OR REPLACE FUNCTION public.decay_concept_mastery()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_count integer;
BEGIN
  UPDATE concept_mastery
     SET state = 'decaying'
   WHERE state IN ('proficient', 'mastered')
     AND last_seen_at < now() - INTERVAL '45 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;