
-- Add all the required fields to the contacts table
ALTER TABLE public.contacts 
ADD COLUMN contact_name TEXT,
ADD COLUMN company_name TEXT,
ADD COLUMN position TEXT,
ADD COLUMN email TEXT,
ADD COLUMN phone_no TEXT,
ADD COLUMN mobile_no TEXT,
ADD COLUMN linkedin TEXT,
ADD COLUMN fax TEXT,
ADD COLUMN website TEXT,
ADD COLUMN contact_owner UUID,
ADD COLUMN contact_source contact_source DEFAULT 'Website',
ADD COLUMN lead_status lead_status DEFAULT 'New',
ADD COLUMN industry industry_type DEFAULT 'Automotive',
ADD COLUMN no_of_employees INTEGER,
ADD COLUMN annual_revenue NUMERIC,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN country TEXT,
ADD COLUMN description TEXT;

-- Rename the timestamp columns to match your requirements
ALTER TABLE public.contacts 
RENAME COLUMN created_at TO created_time;

ALTER TABLE public.contacts 
RENAME COLUMN modified_at TO modified_time;

-- Update the trigger function to use the new column names
CREATE OR REPLACE FUNCTION public.update_contacts_modified_time()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.modified_time = now();
  NEW.modified_by = auth.uid();
  RETURN NEW;
END;
$function$;

-- Create the trigger for auto-updating modified_time
DROP TRIGGER IF EXISTS update_contacts_modified_time_trigger ON public.contacts;
CREATE TRIGGER update_contacts_modified_time_trigger
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_modified_time();
