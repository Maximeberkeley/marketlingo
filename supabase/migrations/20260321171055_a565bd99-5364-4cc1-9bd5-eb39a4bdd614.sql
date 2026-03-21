-- Remove duplicate rows keeping the one with highest investment_xp
DELETE FROM public.investment_lab_progress
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY user_id, market_id 
      ORDER BY investment_xp DESC NULLS LAST, created_at ASC
    ) as rn
    FROM public.investment_lab_progress
  ) sub
  WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE public.investment_lab_progress 
  ADD CONSTRAINT investment_lab_progress_user_market_unique UNIQUE (user_id, market_id);