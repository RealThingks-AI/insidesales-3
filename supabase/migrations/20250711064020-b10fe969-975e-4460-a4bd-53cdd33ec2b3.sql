-- First, check if any deals reference the leads we're trying to delete
DO $$
BEGIN
    -- Drop the constraint completely first
    ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_related_lead_id_fkey;
    
    -- Recreate it with proper CASCADE behavior
    ALTER TABLE deals 
    ADD CONSTRAINT deals_related_lead_id_fkey 
    FOREIGN KEY (related_lead_id) 
    REFERENCES leads(id) 
    ON DELETE SET NULL
    ON UPDATE CASCADE;
    
    -- Also fix the lead_conversions constraint if needed
    ALTER TABLE lead_conversions DROP CONSTRAINT IF EXISTS lead_conversions_lead_id_fkey;
    
    ALTER TABLE lead_conversions 
    ADD CONSTRAINT lead_conversions_lead_id_fkey 
    FOREIGN KEY (lead_id) 
    REFERENCES leads(id) 
    ON DELETE CASCADE;
    
END $$;