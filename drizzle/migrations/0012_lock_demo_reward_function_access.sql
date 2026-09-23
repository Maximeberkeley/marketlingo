REVOKE ALL ON FUNCTION public.claim_demo_onboarding_reward(text, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_demo_onboarding_reward(text, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_demo_onboarding_reward(text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_demo_onboarding_reward(text, date) TO service_role;