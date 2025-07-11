
-- Ensure we have all the required fields for the final stages
-- Some of these may already exist, but this ensures they're all present

-- Add win_reason field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deals' AND column_name = 'win_reason') THEN
        ALTER TABLE public.deals ADD COLUMN win_reason TEXT;
    END IF;
END $$;

-- Add loss_reason field if it doesn't exist (should already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deals' AND column_name = 'loss_reason') THEN
        ALTER TABLE public.deals ADD COLUMN loss_reason TEXT;
    END IF;
END $$;

-- Add drop_reason field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deals' AND column_name = 'drop_reason') THEN
        ALTER TABLE public.deals ADD COLUMN drop_reason TEXT;
    END IF;
END $$;

-- Update the stage validation function to handle final stages properly
CREATE OR REPLACE FUNCTION public.validate_deal_stage_transition()
RETURNS TRIGGER AS $$
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
            
            -- Prevent moving FROM final stages (Won, Lost, Dropped)
            IF OLD.stage IN ('Won', 'Lost', 'Dropped') THEN
                RAISE EXCEPTION 'Cannot move from final stage %', OLD.stage;
            END IF;
            
            -- Allow movement to Won, Lost, or Dropped from any active stage
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
$$ LANGUAGE plpgsql;

-- Update the check_stage_completion function to handle final stages
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
            RETURN (deal_record.customer_need_identified = true AND 
                   deal_record.need_summary IS NOT NULL AND deal_record.need_summary != '' AND
                   deal_record.decision_maker_present = true AND 
                   deal_record.customer_agreed_on_need IS NOT NULL AND 
                   deal_record.customer_agreed_on_need IN ('Yes', 'No', 'Partial'));
        WHEN 'Qualified' THEN
            RETURN (deal_record.nda_signed IS NOT NULL AND 
                   deal_record.budget_confirmed IS NOT NULL AND deal_record.budget_confirmed != '' AND
                   deal_record.supplier_portal_access IS NOT NULL AND deal_record.supplier_portal_access != '' AND
                   deal_record.expected_deal_timeline_start IS NOT NULL AND 
                   deal_record.expected_deal_timeline_end IS NOT NULL);
        WHEN 'RFQ' THEN
            RETURN (deal_record.rfq_value IS NOT NULL AND deal_record.rfq_value > 0 AND
                   deal_record.rfq_document_url IS NOT NULL AND deal_record.rfq_document_url != '' AND
                   deal_record.product_service_scope IS NOT NULL AND deal_record.product_service_scope != '');
        WHEN 'Offered' THEN
            RETURN (deal_record.proposal_sent_date IS NOT NULL AND 
                   deal_record.negotiation_status IS NOT NULL AND deal_record.negotiation_status != '' AND
                   deal_record.decision_expected_date IS NOT NULL);
        WHEN 'Won' THEN
            RETURN true; -- Won stage is always complete once entered
        WHEN 'Lost' THEN
            RETURN (deal_record.loss_reason IS NOT NULL AND deal_record.loss_reason != '');
        WHEN 'Dropped' THEN
            RETURN (deal_record.drop_reason IS NOT NULL AND deal_record.drop_reason != '');
        ELSE
            RETURN true;
    END CASE;
END;
$$;
