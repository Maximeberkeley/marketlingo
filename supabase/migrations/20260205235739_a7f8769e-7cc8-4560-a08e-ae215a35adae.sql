
-- Add day-X tags to existing lessons that don't have them
-- This will assign days 1-180 sequentially per market based on stack creation order

-- Create a function to add day tags to existing stacks
CREATE OR REPLACE FUNCTION public.assign_day_tags_to_market(p_market_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stack RECORD;
  v_day_counter INTEGER := 1;
  v_updated INTEGER := 0;
BEGIN
  -- Loop through all MICRO_LESSON stacks for this market that don't have day tags
  FOR v_stack IN 
    SELECT id, tags 
    FROM stacks 
    WHERE market_id = p_market_id
      AND 'MICRO_LESSON' = ANY(tags)
      AND NOT (tags::text LIKE '%day-%')
    ORDER BY created_at ASC
    LIMIT 180
  LOOP
    -- Add the day tag to the existing tags array
    UPDATE stacks 
    SET tags = array_append(tags, 'day-' || v_day_counter::text)
    WHERE id = v_stack.id;
    
    v_day_counter := v_day_counter + 1;
    v_updated := v_updated + 1;
  END LOOP;
  
  RETURN v_updated;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.assign_day_tags_to_market(TEXT) TO authenticated;

-- Run for all markets that need day tagging
DO $$
DECLARE
  v_market TEXT;
  v_count INTEGER;
BEGIN
  FOR v_market IN 
    SELECT DISTINCT market_id 
    FROM stacks 
    WHERE 'MICRO_LESSON' = ANY(tags)
      AND NOT (tags::text LIKE '%day-%')
  LOOP
    SELECT public.assign_day_tags_to_market(v_market) INTO v_count;
    RAISE NOTICE 'Tagged % lessons for market %', v_count, v_market;
  END LOOP;
END;
$$;
