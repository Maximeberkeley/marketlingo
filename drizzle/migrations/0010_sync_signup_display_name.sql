CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_display_name text;
BEGIN
  v_display_name := nullif(btrim(COALESCE(NEW.raw_user_meta_data ->> 'display_name', '')), '');
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, NEW.email, CASE WHEN char_length(v_display_name) BETWEEN 1 AND 40 THEN v_display_name ELSE NULL END)
  ON CONFLICT (id) DO UPDATE
  SET username = COALESCE(public.profiles.username, EXCLUDED.username),
      display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
      updated_at = now();
  RETURN NEW;
END;
$$;