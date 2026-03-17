
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET username = COALESCE(profiles.username, NEW.email);
  RETURN NEW;
END;
$function$;

-- Backfill existing users who have null usernames
UPDATE public.profiles
SET username = u.email
FROM auth.users u
WHERE profiles.id = u.id
AND profiles.username IS NULL;
