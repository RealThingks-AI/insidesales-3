
-- Remove fields from contacts table
ALTER TABLE public.contacts 
DROP COLUMN IF EXISTS lead_status,
DROP COLUMN IF EXISTS no_of_employees,
DROP COLUMN IF EXISTS annual_revenue,
DROP COLUMN IF EXISTS state;

-- Rename contact_name to lead_name in leads table
ALTER TABLE public.leads 
RENAME COLUMN contact_name TO lead_name;
