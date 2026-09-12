CREATE TABLE public.collectible_catalog (
  id TEXT PRIMARY KEY,
  market_id TEXT NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  set_name TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  specialty TEXT NOT NULL,
  insight TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common','rare','epic','legendary')),
  unlock_type TEXT NOT NULL CHECK (unlock_type IN ('first_lesson','lesson_count','mastery','journey_day')),
  unlock_threshold INTEGER NOT NULL DEFAULT 1 CHECK (unlock_threshold > 0),
  power INTEGER NOT NULL DEFAULT 50 CHECK (power BETWEEN 0 AND 100),
  judgment INTEGER NOT NULL DEFAULT 50 CHECK (judgment BETWEEN 0 AND 100),
  fluency INTEGER NOT NULL DEFAULT 50 CHECK (fluency BETWEEN 0 AND 100),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (market_id, sort_order)
);
GRANT SELECT ON public.collectible_catalog TO anon, authenticated;
GRANT ALL ON public.collectible_catalog TO service_role;
ALTER TABLE public.collectible_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collectible catalog is public" ON public.collectible_catalog FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.user_collectibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  collectible_id TEXT NOT NULL REFERENCES public.collectible_catalog(id) ON DELETE CASCADE,
  market_id TEXT NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  reward_source_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, collectible_id),
  UNIQUE (user_id, reward_source_key, collectible_id)
);
GRANT SELECT ON public.user_collectibles TO authenticated;
GRANT ALL ON public.user_collectibles TO service_role;
ALTER TABLE public.user_collectibles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own collectibles" ON public.user_collectibles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.user_market_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  market_id TEXT NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  milestone_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_source_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, market_id, milestone_key),
  UNIQUE (user_id, reward_source_key, milestone_key)
);
GRANT SELECT ON public.user_market_milestones TO authenticated;
GRANT ALL ON public.user_market_milestones TO service_role;
ALTER TABLE public.user_market_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own market milestones" ON public.user_market_milestones FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.reward_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  market_id TEXT NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  source_key TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  result JSONB NOT NULL DEFAULT '{"collectibles":[],"milestones":[]}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_key)
);
GRANT SELECT ON public.reward_evaluations TO authenticated;
GRANT ALL ON public.reward_evaluations TO service_role;
ALTER TABLE public.reward_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own reward evaluations" ON public.reward_evaluations FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.profiles ADD COLUMN featured_collectible_id TEXT REFERENCES public.collectible_catalog(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.evaluate_market_rewards(
  p_market_id TEXT,
  p_activity_type TEXT,
  p_source_key TEXT,
  p_accuracy INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_existing JSONB;
  v_lessons INTEGER := 0;
  v_day INTEGER := 1;
  v_streak INTEGER := 0;
  v_mastered INTEGER := 0;
  v_collectibles JSONB := '[]'::jsonb;
  v_milestones JSONB := '[]'::jsonb;
  v_card RECORD;
  v_mark INTEGER;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_source_key IS NULL OR length(trim(p_source_key)) < 3 THEN RAISE EXCEPTION 'Invalid reward source'; END IF;
  IF NOT EXISTS (SELECT 1 FROM markets WHERE id = p_market_id) THEN RAISE EXCEPTION 'Unknown market'; END IF;

  SELECT result INTO v_existing FROM reward_evaluations WHERE user_id = v_user AND source_key = p_source_key;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  SELECT COUNT(*)::integer INTO v_lessons FROM daily_completions
   WHERE user_id = v_user AND market_id = p_market_id AND lesson_completed;
  SELECT COALESCE(current_day,1), COALESCE(current_streak,0) INTO v_day, v_streak FROM user_progress
   WHERE user_id = v_user AND market_id = p_market_id;
  SELECT COUNT(*)::integer INTO v_mastered FROM concept_mastery
   WHERE user_id = v_user AND market_id = p_market_id AND state = 'mastered';

  FOR v_card IN
    SELECT c.* FROM collectible_catalog c
    WHERE c.market_id = p_market_id
      AND NOT EXISTS (SELECT 1 FROM user_collectibles uc WHERE uc.user_id = v_user AND uc.collectible_id = c.id)
      AND (
        (c.unlock_type = 'first_lesson' AND v_lessons >= 1) OR
        (c.unlock_type = 'lesson_count' AND v_lessons >= c.unlock_threshold) OR
        (c.unlock_type = 'mastery' AND v_mastered >= c.unlock_threshold) OR
        (c.unlock_type = 'journey_day' AND v_day >= c.unlock_threshold)
      )
    ORDER BY c.sort_order
  LOOP
    INSERT INTO user_collectibles(user_id, collectible_id, market_id, reward_source_key)
    VALUES (v_user, v_card.id, p_market_id, p_source_key)
    ON CONFLICT (user_id, collectible_id) DO NOTHING;
    IF FOUND THEN
      v_collectibles := v_collectibles || jsonb_build_array(jsonb_build_object(
        'id', v_card.id, 'name', v_card.name, 'rarity', v_card.rarity,
        'role', v_card.role, 'specialty', v_card.specialty, 'insight', v_card.insight
      ));
    END IF;
  END LOOP;

  FOREACH v_mark IN ARRAY ARRAY[7,30,60,90,120,180]
  LOOP
    IF v_day >= v_mark THEN
      INSERT INTO user_market_milestones(user_id, market_id, milestone_key, title, description, reward_source_key)
      VALUES (v_user, p_market_id, 'day_' || v_mark, 'Day ' || v_mark || ' Insider',
              'Reached day ' || v_mark || ' in this market world.', p_source_key)
      ON CONFLICT (user_id, market_id, milestone_key) DO NOTHING;
      IF FOUND THEN
        v_milestones := v_milestones || jsonb_build_array(jsonb_build_object(
          'key', 'day_' || v_mark, 'title', 'Day ' || v_mark || ' Insider', 'day', v_mark
        ));
      END IF;
    END IF;
  END LOOP;

  IF COALESCE(p_accuracy,0) = 100 THEN
    INSERT INTO user_market_milestones(user_id, market_id, milestone_key, title, description, reward_source_key)
    VALUES (v_user, p_market_id, 'flawless_run', 'Flawless Operator', 'Finished a full challenge without a miss.', p_source_key)
    ON CONFLICT (user_id, market_id, milestone_key) DO NOTHING;
    IF FOUND THEN v_milestones := v_milestones || jsonb_build_array(jsonb_build_object('key','flawless_run','title','Flawless Operator')); END IF;
  END IF;

  IF v_mastered >= 5 THEN
    INSERT INTO user_market_milestones(user_id, market_id, milestone_key, title, description, reward_source_key)
    VALUES (v_user, p_market_id, 'market_mastery', 'Market Mind', 'Mastered five core concepts in this market.', p_source_key)
    ON CONFLICT (user_id, market_id, milestone_key) DO NOTHING;
    IF FOUND THEN v_milestones := v_milestones || jsonb_build_array(jsonb_build_object('key','market_mastery','title','Market Mind')); END IF;
  END IF;

  v_existing := jsonb_build_object('collectibles', v_collectibles, 'milestones', v_milestones,
    'progress', jsonb_build_object('lessons',v_lessons,'day',v_day,'streak',v_streak,'mastered',v_mastered));
  INSERT INTO reward_evaluations(user_id, market_id, source_key, activity_type, result)
  VALUES (v_user, p_market_id, p_source_key, p_activity_type, v_existing)
  ON CONFLICT (user_id, source_key) DO UPDATE SET result = reward_evaluations.result
  RETURNING result INTO v_existing;
  RETURN v_existing;
END;
$$;
REVOKE ALL ON FUNCTION public.evaluate_market_rewards(TEXT,TEXT,TEXT,INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.evaluate_market_rewards(TEXT,TEXT,TEXT,INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_featured_collectible(p_collectible_id TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM user_collectibles WHERE user_id = v_user AND collectible_id = p_collectible_id) THEN
    RAISE EXCEPTION 'Collectible not owned';
  END IF;
  UPDATE profiles SET featured_collectible_id = p_collectible_id WHERE id = v_user;
END;
$$;
REVOKE ALL ON FUNCTION public.set_featured_collectible(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_featured_collectible(TEXT) TO authenticated;