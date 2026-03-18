
CREATE OR REPLACE FUNCTION public.increment_user_xp(
  p_user_id UUID,
  p_market_id TEXT,
  p_amount INTEGER
)
RETURNS public.user_xp
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.user_xp;
BEGIN
  UPDATE public.user_xp
  SET 
    total_xp = total_xp + p_amount,
    current_level = public.calculate_level(total_xp + p_amount),
    startup_stage = public.calculate_startup_stage(total_xp + p_amount),
    updated_at = now()
  WHERE user_id = p_user_id AND market_id = p_market_id
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;
