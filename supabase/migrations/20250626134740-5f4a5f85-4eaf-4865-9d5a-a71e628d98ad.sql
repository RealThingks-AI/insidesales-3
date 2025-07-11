
-- First, let's see what data we have in the contacts table
-- This will help us identify which records are usable vs unusable

-- Delete records with missing essential contact information (name, email, or company)
DELETE FROM contacts 
WHERE (contact_name IS NULL OR contact_name = '' OR trim(contact_name) = '')
  AND (email IS NULL OR email = '' OR trim(email) = '')
  AND (company_name IS NULL OR company_name = '' OR trim(company_name) = '');

-- Delete records that have placeholder or test data patterns
DELETE FROM contacts 
WHERE contact_name ILIKE '%test%' 
   OR contact_name ILIKE '%dummy%'
   OR contact_name ILIKE '%sample%'
   OR email ILIKE '%test%'
   OR email ILIKE '%dummy%'
   OR email ILIKE '%sample%'
   OR company_name ILIKE '%test%'
   OR company_name ILIKE '%dummy%'
   OR company_name ILIKE '%sample%';

-- Delete duplicate records (keeping the most recent one based on created_time)
DELETE FROM contacts c1
WHERE EXISTS (
  SELECT 1 FROM contacts c2 
  WHERE c2.email = c1.email 
    AND c2.contact_name = c1.contact_name
    AND c2.created_time > c1.created_time
);

-- Clean up any orphaned records that might have invalid references
UPDATE contacts 
SET created_by = (SELECT id FROM profiles LIMIT 1)
WHERE created_by NOT IN (SELECT id FROM profiles WHERE id IS NOT NULL);

-- Reset the stats to ensure accurate counting
ANALYZE contacts;
