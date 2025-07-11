
-- First, let's add the missing columns from contacts_module to the main contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS lead_status lead_status DEFAULT 'New'::lead_status,
ADD COLUMN IF NOT EXISTS no_of_employees integer,
ADD COLUMN IF NOT EXISTS annual_revenue numeric,
ADD COLUMN IF NOT EXISTS state text;

-- Copy data from contacts_module to contacts table (only if contacts_module has data)
INSERT INTO public.contacts (
  contact_name, company_name, position, email, phone_no, mobile_no, 
  linkedin, website, contact_source, industry, city, state, country, 
  description, contact_owner, created_by, modified_by, created_time, 
  modified_time, lead_status, no_of_employees, annual_revenue, fax
)
SELECT 
  contact_name, company_name, position, email, phone_no, mobile_no,
  linkedin, website, contact_source, industry, city, state, country,
  description, contact_owner::uuid, created_by, modified_by, created_time,
  modified_time, lead_status, no_of_employees, annual_revenue, fax
FROM public.contacts_module
WHERE contact_name IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Drop the contacts_module table
DROP TABLE IF EXISTS public.contacts_module CASCADE;

-- Drop unused tables
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;

-- Update the contacts table to ensure proper constraints and defaults
ALTER TABLE public.contacts 
ALTER COLUMN contact_owner TYPE uuid USING contact_owner::uuid;

-- Add any missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_lead_status ON public.contacts(lead_status);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_owner ON public.contacts(contact_owner);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
