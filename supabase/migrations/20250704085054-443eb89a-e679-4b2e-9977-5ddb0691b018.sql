
-- Fix foreign key constraints to allow cascading deletes
-- First, drop the existing foreign key constraints
ALTER TABLE public.lead_conversions 
DROP CONSTRAINT IF EXISTS lead_conversions_contact_id_fkey;

ALTER TABLE public.lead_conversions 
DROP CONSTRAINT IF EXISTS lead_conversions_lead_id_fkey;

-- Recreate foreign key constraints with CASCADE DELETE
ALTER TABLE public.lead_conversions 
ADD CONSTRAINT lead_conversions_contact_id_fkey 
FOREIGN KEY (contact_id) REFERENCES public.contacts(id) 
ON DELETE CASCADE;

ALTER TABLE public.lead_conversions 
ADD CONSTRAINT lead_conversions_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) 
ON DELETE CASCADE;

-- Also check for any other foreign key constraints that might cause issues
-- Fix the deals table foreign key constraints
ALTER TABLE public.deals 
DROP CONSTRAINT IF EXISTS deals_contact_id_fkey;

ALTER TABLE public.deals 
DROP CONSTRAINT IF EXISTS deals_contact_name_fkey;

ALTER TABLE public.deals 
ADD CONSTRAINT deals_contact_id_fkey 
FOREIGN KEY (contact_id) REFERENCES public.contacts(id) 
ON DELETE SET NULL;

ALTER TABLE public.deals 
ADD CONSTRAINT deals_contact_name_fkey 
FOREIGN KEY (contact_name) REFERENCES public.contacts(id) 
ON DELETE SET NULL;

-- Fix the tasks table foreign key constraint
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_contact_fkey;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_contact_fkey 
FOREIGN KEY (contact) REFERENCES public.contacts(id) 
ON DELETE SET NULL;
