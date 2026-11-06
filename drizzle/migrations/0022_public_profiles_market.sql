CREATE OR REPLACE VIEW public.public_profiles WITH (security_invoker = false) AS
SELECT id, display_name, friend_code, avatar_url, selected_market FROM public.profiles;
GRANT SELECT ON public.public_profiles TO authenticated;