
-- First, let's create a temporary column to store the new stage values
ALTER TABLE deals ADD COLUMN stage_temp TEXT;

-- Map existing stage values to new enum values
UPDATE deals SET stage_temp = CASE 
    WHEN stage::text = 'Closed Won' THEN 'Won'
    WHEN stage::text = 'Closed Lost' THEN 'Lost'
    WHEN stage::text = 'Negotiation' THEN 'Qualified'
    WHEN stage::text = 'Proposal' THEN 'Offered'
    WHEN stage::text = 'Qualification' THEN 'Qualified'
    WHEN stage::text = 'Contact' THEN 'Contact'
    WHEN stage::text = 'Lead' THEN 'Lead'
    WHEN stage::text = 'Meeting' THEN 'Meeting'
    WHEN stage::text = 'RFQ' THEN 'RFQ'
    WHEN stage::text = 'Offered' THEN 'Offered'
    ELSE 'Contact'
END;

-- Drop the old stage column and rename the temp column
ALTER TABLE deals DROP COLUMN stage;
ALTER TABLE deals RENAME COLUMN stage_temp TO stage;

-- Now update the deals table to match the new requirements
ALTER TABLE deals DROP COLUMN IF EXISTS interest;
ALTER TABLE deals DROP COLUMN IF EXISTS need;
ALTER TABLE deals DROP COLUMN IF EXISTS trust;
ALTER TABLE deals DROP COLUMN IF EXISTS their_challenge;
ALTER TABLE deals DROP COLUMN IF EXISTS budget;
ALTER TABLE deals DROP COLUMN IF EXISTS hierarchy;
ALTER TABLE deals DROP COLUMN IF EXISTS value;
ALTER TABLE deals DROP COLUMN IF EXISTS closing;
ALTER TABLE deals DROP COLUMN IF EXISTS comment;

-- Add the new topic fields
ALTER TABLE deals ADD COLUMN interest TEXT DEFAULT 'Open' CHECK (interest IN ('Open', 'Done'));
ALTER TABLE deals ADD COLUMN need TEXT DEFAULT 'Open' CHECK (need IN ('Open', 'Done'));
ALTER TABLE deals ADD COLUMN trust TEXT DEFAULT 'Open' CHECK (trust IN ('Open', 'Done'));
ALTER TABLE deals ADD COLUMN challenge TEXT DEFAULT 'Open' CHECK (challenge IN ('Open', 'Done'));
ALTER TABLE deals ADD COLUMN budget TEXT DEFAULT 'Open' CHECK (budget IN ('Open', 'Done'));
ALTER TABLE deals ADD COLUMN value TEXT DEFAULT 'Open' CHECK (value IN ('Open', 'Done'));
ALTER TABLE deals ADD COLUMN closing TEXT DEFAULT 'Open' CHECK (closing IN ('Open', 'Done'));
ALTER TABLE deals ADD COLUMN comment TEXT;

-- Update the stage enum to match your requirements
ALTER TYPE deal_stage RENAME TO deal_stage_old;
CREATE TYPE deal_stage AS ENUM ('Contact', 'Lead', 'Meeting', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped');

-- Update the deals table to use the new enum
ALTER TABLE deals ALTER COLUMN stage TYPE deal_stage USING stage::deal_stage;
ALTER TABLE deals ALTER COLUMN stage SET DEFAULT 'Contact';

-- Drop the old enum
DROP TYPE deal_stage_old;

-- Add a function to automatically update stages based on topic completion
CREATE OR REPLACE FUNCTION auto_update_deal_stage()
RETURNS TRIGGER AS $$
BEGIN
    -- Only auto-update if current stage is not Lost or Dropped (manually controlled)
    IF NEW.stage NOT IN ('Lost', 'Dropped') THEN
        -- Auto-progression logic
        IF NEW.closing = 'Done' THEN
            NEW.stage = 'Won';
        ELSIF NEW.value = 'Done' THEN
            NEW.stage = 'Offered';
        ELSIF NEW.budget = 'Done' AND NEW.challenge = 'Done' THEN
            NEW.stage = 'RFQ';
        ELSIF NEW.trust = 'Done' THEN
            NEW.stage = 'Qualified';
        ELSIF NEW.need = 'Done' THEN
            NEW.stage = 'Meeting';
        ELSIF NEW.interest = 'Done' THEN
            NEW.stage = 'Lead';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stage updates
DROP TRIGGER IF EXISTS auto_update_deal_stage_trigger ON deals;
CREATE TRIGGER auto_update_deal_stage_trigger
    BEFORE UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_deal_stage();
