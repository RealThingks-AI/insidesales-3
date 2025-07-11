
-- First, let's drop the existing check constraint if it exists
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_stage_check;

-- Add a new check constraint with the correct stages that match the DEAL_STAGES in the code
ALTER TABLE public.deals ADD CONSTRAINT deals_stage_check 
CHECK (stage IN ('Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'));
