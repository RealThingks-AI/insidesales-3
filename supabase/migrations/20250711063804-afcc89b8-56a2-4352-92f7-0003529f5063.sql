-- Update the foreign key constraint to set null on delete instead of restrict
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_related_lead_id_fkey;

-- Add the constraint back with ON DELETE SET NULL
ALTER TABLE deals 
ADD CONSTRAINT deals_related_lead_id_fkey 
FOREIGN KEY (related_lead_id) 
REFERENCES leads(id) 
ON DELETE SET NULL;