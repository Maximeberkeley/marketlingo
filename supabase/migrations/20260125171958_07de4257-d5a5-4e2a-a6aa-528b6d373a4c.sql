-- Fix function search paths for security

-- Fix calculate_level function
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN FLOOR(SQRT(xp::float / 50)) + 1;
END;
$$;

-- Fix calculate_startup_stage function
CREATE OR REPLACE FUNCTION public.calculate_startup_stage(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF xp < 500 THEN RETURN 1;
  ELSIF xp < 1500 THEN RETURN 2;
  ELSIF xp < 3000 THEN RETURN 3;
  ELSIF xp < 5000 THEN RETURN 4;
  ELSIF xp < 8000 THEN RETURN 5;
  ELSE RETURN 6;
  END IF;
END;
$$;

-- Fix update_xp_levels function
CREATE OR REPLACE FUNCTION public.update_xp_levels()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.current_level := public.calculate_level(NEW.total_xp);
  NEW.startup_stage := public.calculate_startup_stage(NEW.total_xp);
  NEW.xp_to_next_level := (NEW.current_level * NEW.current_level * 50) - NEW.total_xp;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;