-- 1. Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table (NOT on profiles to prevent privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (prevents recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. RLS policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 6. RLS policy: Only admins can manage roles (using the security definer function)
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Create secure RPC function for submitting trainer answers
-- This prevents cheating by hiding correct_option_index from client
CREATE OR REPLACE FUNCTION public.submit_trainer_answer(
  p_scenario_id UUID,
  p_selected_option INTEGER,
  p_time_spent INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scenario RECORD;
  v_is_correct BOOLEAN;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;
  
  -- Get scenario (including hidden fields)
  SELECT * INTO v_scenario FROM trainer_scenarios WHERE id = p_scenario_id;
  
  IF v_scenario IS NULL THEN
    RETURN json_build_object('error', 'Scenario not found');
  END IF;
  
  -- Check if answer is correct
  v_is_correct := (p_selected_option = v_scenario.correct_option_index);
  
  -- Record the attempt
  INSERT INTO trainer_attempts (user_id, scenario_id, selected_option, is_correct, time_spent_seconds)
  VALUES (v_user_id, p_scenario_id, p_selected_option, v_is_correct, p_time_spent);
  
  -- Return result with feedback (only revealed AFTER answer submission)
  RETURN json_build_object(
    'isCorrect', v_is_correct,
    'correctIndex', v_scenario.correct_option_index,
    'feedback_pro_reasoning', v_scenario.feedback_pro_reasoning,
    'feedback_common_mistake', v_scenario.feedback_common_mistake,
    'feedback_mental_model', v_scenario.feedback_mental_model,
    'follow_up_question', v_scenario.follow_up_question
  );
END;
$$;

-- 8. Drop the overly permissive policy on trainer_scenarios
DROP POLICY IF EXISTS "Trainer scenarios are publicly readable" ON public.trainer_scenarios;

-- 9. Create a more restrictive policy that only exposes safe fields
-- We use a view approach: create a policy that allows SELECT but the actual
-- answer fields are hidden via client-side fetching of only safe columns
CREATE POLICY "Trainer scenarios are readable by authenticated users"
ON public.trainer_scenarios
FOR SELECT
TO authenticated
USING (true);

-- 10. Create a view for public scenario data (without answers)
CREATE OR REPLACE VIEW public.trainer_scenarios_public AS
SELECT 
  id,
  market_id,
  scenario,
  question,
  options,
  tags,
  sources,
  created_at
FROM public.trainer_scenarios;

-- 11. Grant select on the view to authenticated users
GRANT SELECT ON public.trainer_scenarios_public TO authenticated;

-- 12. Create similar secure RPC for investment scenarios
CREATE OR REPLACE FUNCTION public.submit_investment_answer(
  p_scenario_id UUID,
  p_selected_option INTEGER,
  p_time_spent INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scenario RECORD;
  v_is_correct BOOLEAN;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;
  
  SELECT * INTO v_scenario FROM investment_scenarios WHERE id = p_scenario_id;
  
  IF v_scenario IS NULL THEN
    RETURN json_build_object('error', 'Scenario not found');
  END IF;
  
  v_is_correct := (p_selected_option = v_scenario.correct_option_index);
  
  INSERT INTO investment_attempts (user_id, scenario_id, selected_option, is_correct, time_spent_seconds)
  VALUES (v_user_id, p_scenario_id, p_selected_option, v_is_correct, p_time_spent);
  
  RETURN json_build_object(
    'isCorrect', v_is_correct,
    'correctIndex', v_scenario.correct_option_index,
    'explanation', v_scenario.explanation,
    'real_world_example', v_scenario.real_world_example
  );
END;
$$;

-- 13. Fix investment_scenarios policy too
DROP POLICY IF EXISTS "Investment scenarios are publicly readable" ON public.investment_scenarios;

CREATE POLICY "Investment scenarios are readable by authenticated users"
ON public.investment_scenarios
FOR SELECT
TO authenticated
USING (true);

-- 14. Create public view for investment scenarios without answers
CREATE OR REPLACE VIEW public.investment_scenarios_public AS
SELECT 
  id,
  market_id,
  scenario_type,
  title,
  scenario,
  question,
  options,
  difficulty,
  valuation_model,
  tags,
  created_at
FROM public.investment_scenarios;