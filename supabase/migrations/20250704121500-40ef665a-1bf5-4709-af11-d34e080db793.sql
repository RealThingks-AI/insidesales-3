
-- Update the DEAL_STAGES to match the new pipeline
-- Remove the auto-update trigger since we want manual control
DROP TRIGGER IF EXISTS auto_update_deal_stage_trigger ON public.deals;
DROP FUNCTION IF EXISTS public.auto_update_deal_stage();

-- Update the default stage to 'Discussions' instead of 'Lead'
ALTER TABLE public.deals ALTER COLUMN stage SET DEFAULT 'Discussions';

-- Add fields needed for the new stage requirements
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS confirmation_note TEXT,
ADD COLUMN IF NOT EXISTS begin_execution_date DATE;

-- Create a function to validate stage transitions
CREATE OR REPLACE FUNCTION public.validate_deal_stage_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Discussions to Qualified: requires confirmation_note
    IF OLD.stage = 'Discussions' AND NEW.stage = 'Qualified' THEN
        IF NEW.confirmation_note IS NULL OR NEW.confirmation_note = '' THEN
            RAISE EXCEPTION 'Confirmation note is required to move to Qualified stage';
        END IF;
    END IF;
    
    -- Qualified to RFQ: requires budget_holder, decision_makers, timeline, nda_signed
    IF OLD.stage = 'Qualified' AND NEW.stage = 'RFQ' THEN
        IF NEW.budget_holder IS NULL OR NEW.budget_holder = '' OR
           NEW.decision_makers IS NULL OR NEW.decision_makers = '' OR
           NEW.timeline IS NULL OR NEW.timeline = '' OR
           NEW.nda_signed IS NULL THEN
            RAISE EXCEPTION 'Budget holder, decision makers, timeline, and NDA status are required to move to RFQ stage';
        END IF;
    END IF;
    
    -- RFQ to Offered: requires rfq_document_link or rfq_confirmation_note
    IF OLD.stage = 'RFQ' AND NEW.stage = 'Offered' THEN
        IF (NEW.rfq_document_link IS NULL OR NEW.rfq_document_link = '') AND
           (NEW.rfq_confirmation_note IS NULL OR NEW.rfq_confirmation_note = '') THEN
            RAISE EXCEPTION 'RFQ document link or confirmation note is required to move to Offered stage';
        END IF;
    END IF;
    
    -- Offered to Won: requires offer_sent_date
    IF OLD.stage = 'Offered' AND NEW.stage = 'Won' THEN
        IF NEW.offer_sent_date IS NULL THEN
            RAISE EXCEPTION 'Offer sent date is required to move to Won stage';
        END IF;
    END IF;
    
    -- Lost stage: requires lost_reason
    IF NEW.stage = 'Lost' AND OLD.stage != 'Lost' THEN
        IF NEW.lost_reason IS NULL OR NEW.lost_reason = '' THEN
            RAISE EXCEPTION 'Lost reason is required when marking deal as Lost';
        END IF;
    END IF;
    
    -- Dropped stage: requires drop_summary
    IF NEW.stage = 'Dropped' AND OLD.stage != 'Dropped' THEN
        IF NEW.drop_summary IS NULL OR NEW.drop_summary = '' THEN
            RAISE EXCEPTION 'Drop summary is required when marking deal as Dropped';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stage validation
CREATE TRIGGER validate_deal_stage_transition_trigger
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_deal_stage_transition();
