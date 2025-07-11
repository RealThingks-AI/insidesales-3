
-- Drop the existing foreign key constraint that points to contacts_module
ALTER TABLE lead_conversions DROP CONSTRAINT lead_conversions_contact_id_fkey;

-- Add a new foreign key constraint that points to the contacts table instead
ALTER TABLE lead_conversions ADD CONSTRAINT lead_conversions_contact_id_fkey 
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
