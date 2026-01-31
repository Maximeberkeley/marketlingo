-- Fix Security Definer View warnings by recreating views with SECURITY INVOKER
DROP VIEW IF EXISTS public.trainer_scenarios_public;
DROP VIEW IF EXISTS public.investment_scenarios_public;

-- Recreate trainer_scenarios_public view with SECURITY INVOKER
CREATE VIEW public.trainer_scenarios_public 
WITH (security_invoker = on)
AS
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

-- Recreate investment_scenarios_public view with SECURITY INVOKER
CREATE VIEW public.investment_scenarios_public
WITH (security_invoker = on)
AS
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

-- Grant select on views
GRANT SELECT ON public.trainer_scenarios_public TO authenticated;
GRANT SELECT ON public.investment_scenarios_public TO authenticated;