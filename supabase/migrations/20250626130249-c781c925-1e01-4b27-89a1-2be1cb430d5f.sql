
-- Remove all non-essential fields from the contacts table
-- Keep only the basic required fields for system functionality
ALTER TABLE public.contacts 
DROP COLUMN IF EXISTS contact_owner,
DROP COLUMN IF EXISTS lead_source,
DROP COLUMN IF EXISTS secondary_email,
DROP COLUMN IF EXISTS salutation,
DROP COLUMN IF EXISTS other_city,
DROP COLUMN IF EXISTS linkedin,
DROP COLUMN IF EXISTS first_name,
DROP COLUMN IF EXISTS last_name,
DROP COLUMN IF EXISTS account_name,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS mobile,
DROP COLUMN IF EXISTS title,
DROP COLUMN IF EXISTS department,
DROP COLUMN IF EXISTS mailing_street,
DROP COLUMN IF EXISTS mailing_city,
DROP COLUMN IF EXISTS mailing_state,
DROP COLUMN IF EXISTS mailing_zip,
DROP COLUMN IF EXISTS mailing_country,
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS fax,
DROP COLUMN IF EXISTS website,
DROP COLUMN IF EXISTS assistant,
DROP COLUMN IF EXISTS skype_id,
DROP COLUMN IF EXISTS twitter,
DROP COLUMN IF EXISTS reports_to,
DROP COLUMN IF EXISTS workflow_stage,
DROP COLUMN IF EXISTS converted_to_lead_id,
DROP COLUMN IF EXISTS conversion_date,
DROP COLUMN IF EXISTS last_activity_time,
DROP COLUMN IF EXISTS change_log_time;

-- Keep only essential system fields:
-- id, created_by, modified_by, created_at, modified_at
