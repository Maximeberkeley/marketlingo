-- Add market_id column to notes table for proper market isolation
ALTER TABLE public.notes 
ADD COLUMN market_id text REFERENCES public.markets(id);

-- Create index for performance
CREATE INDEX idx_notes_market_id ON public.notes(market_id);

-- Update existing notes to have a market_id based on their linked stack
UPDATE public.notes n
SET market_id = s.market_id
FROM public.stacks s
WHERE n.stack_id = s.id AND n.market_id IS NULL;