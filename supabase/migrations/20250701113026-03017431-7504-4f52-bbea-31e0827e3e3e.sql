
-- Add contact_owner column to contacts_module table
ALTER TABLE public.contacts_module 
ADD COLUMN contact_owner text;

-- Update the trigger function to handle the new column
CREATE OR REPLACE FUNCTION public.update_contacts_modified_time()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.modified_time = now();
  NEW.modified_by = auth.uid();
  RETURN NEW;
END;
$function$;
