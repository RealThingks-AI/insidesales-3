
-- Add new stage-specific fields to the deals table
ALTER TABLE public.deals 
ADD COLUMN customer_need_identified boolean,
ADD COLUMN need_summary text,
ADD COLUMN decision_maker_present boolean,
ADD COLUMN customer_agreed_on_need text,
ADD COLUMN budget_confirmed text,
ADD COLUMN supplier_portal_access text,
ADD COLUMN expected_deal_timeline_start date,
ADD COLUMN expected_deal_timeline_end date,
ADD COLUMN rfq_value numeric,
ADD COLUMN rfq_document_url text,
ADD COLUMN product_service_scope text,
ADD COLUMN proposal_sent_date date,
ADD COLUMN negotiation_status text,
ADD COLUMN decision_expected_date date,
ADD COLUMN win_reason text,
ADD COLUMN loss_reason text,
ADD COLUMN drop_reason text;

-- Add constraints for dropdown values
ALTER TABLE public.deals 
ADD CONSTRAINT customer_agreed_check CHECK (customer_agreed_on_need IN ('Yes', 'No', 'Partial')),
ADD CONSTRAINT budget_confirmed_check CHECK (budget_confirmed IN ('Yes', 'No', 'Estimate Only')),
ADD CONSTRAINT supplier_portal_check CHECK (supplier_portal_access IN ('Invited', 'Approved', 'Not Invited')),
ADD CONSTRAINT negotiation_status_check CHECK (negotiation_status IN ('Ongoing', 'Finalized', 'Rejected')),
ADD CONSTRAINT loss_reason_check CHECK (loss_reason IN ('Budget', 'Competitor', 'Timeline', 'Other'));

-- Create function to check stage completion requirements
CREATE OR REPLACE FUNCTION public.check_stage_completion(deal_id uuid, current_stage text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    deal_record deals%ROWTYPE;
BEGIN
    SELECT * INTO deal_record FROM deals WHERE id = deal_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    CASE current_stage
        WHEN 'Discussions' THEN
            RETURN (deal_record.customer_need_identified IS NOT NULL AND 
                   deal_record.need_summary IS NOT NULL AND 
                   deal_record.decision_maker_present IS NOT NULL AND 
                   deal_record.customer_agreed_on_need IS NOT NULL);
        WHEN 'Qualified' THEN
            RETURN (deal_record.nda_signed IS NOT NULL AND 
                   deal_record.budget_confirmed IS NOT NULL AND 
                   deal_record.supplier_portal_access IS NOT NULL AND 
                   deal_record.expected_deal_timeline_start IS NOT NULL AND 
                   deal_record.expected_deal_timeline_end IS NOT NULL);
        WHEN 'RFQ' THEN
            RETURN (deal_record.rfq_value IS NOT NULL AND 
                   deal_record.rfq_document_url IS NOT NULL AND 
                   deal_record.product_service_scope IS NOT NULL);
        WHEN 'Offered' THEN
            RETURN (deal_record.proposal_sent_date IS NOT NULL AND 
                   deal_record.negotiation_status IS NOT NULL AND 
                   deal_record.decision_expected_date IS NOT NULL);
        WHEN 'Lost' THEN
            RETURN (deal_record.loss_reason IS NOT NULL);
        WHEN 'Dropped' THEN
            RETURN (deal_record.drop_reason IS NOT NULL);
        ELSE
            RETURN true;
    END CASE;
END;
$$;

-- Update the stage validation trigger to use the new completion check
CREATE OR REPLACE FUNCTION public.validate_deal_stage_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if moving to next stage and current stage is complete
    IF OLD.stage != NEW.stage THEN
        -- Get stage order for validation
        DECLARE
            old_stage_order integer;
            new_stage_order integer;
        BEGIN
            SELECT CASE OLD.stage
                WHEN 'Discussions' THEN 1
                WHEN 'Qualified' THEN 2
                WHEN 'RFQ' THEN 3
                WHEN 'Offered' THEN 4
                WHEN 'Won' THEN 5
                WHEN 'Lost' THEN 5
                WHEN 'Dropped' THEN 5
                ELSE 0
            END INTO old_stage_order;
            
            SELECT CASE NEW.stage
                WHEN 'Discussions' THEN 1
                WHEN 'Qualified' THEN 2
                WHEN 'RFQ' THEN 3
                WHEN 'Offered' THEN 4
                WHEN 'Won' THEN 5
                WHEN 'Lost' THEN 5
                WHEN 'Dropped' THEN 5
                ELSE 0
            END INTO new_stage_order;
            
            -- Allow movement to Won, Lost, or Dropped from any stage
            IF NEW.stage IN ('Won', 'Lost', 'Dropped') THEN
                -- Check completion requirements for final stages
                IF NEW.stage = 'Lost' AND (NEW.loss_reason IS NULL OR NEW.loss_reason = '') THEN
                    RAISE EXCEPTION 'Loss reason is required when marking deal as Lost';
                END IF;
                
                IF NEW.stage = 'Dropped' AND (NEW.drop_reason IS NULL OR NEW.drop_reason = '') THEN
                    RAISE EXCEPTION 'Drop reason is required when marking deal as Dropped';
                END IF;
                
                RETURN NEW;
            END IF;
            
            -- For forward progression, check stage completion
            IF new_stage_order > old_stage_order THEN
                IF NOT check_stage_completion(NEW.id, OLD.stage) THEN
                    RAISE EXCEPTION 'Cannot move to next stage: current stage requirements not completed';
                END IF;
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS validate_deal_stage_transition_trigger ON deals;
CREATE TRIGGER validate_deal_stage_transition_trigger
    BEFORE UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION validate_deal_stage_transition();
