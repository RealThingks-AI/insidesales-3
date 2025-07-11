
-- First, drop any RLS policies that depend on the columns we need to modify
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON leads;
DROP POLICY IF EXISTS "Users can view all leads" ON leads;
DROP POLICY IF EXISTS "Users can create leads" ON leads;
DROP POLICY IF EXISTS "Users can update leads" ON leads;

-- Now safely drop and recreate the leads table columns
ALTER TABLE leads 
DROP COLUMN IF EXISTS lead_owner CASCADE,
DROP COLUMN IF EXISTS company CASCADE,
DROP COLUMN IF EXISTS first_name CASCADE,
DROP COLUMN IF EXISTS last_name CASCADE,
DROP COLUMN IF EXISTS lead_name CASCADE,
DROP COLUMN IF EXISTS title CASCADE,
DROP COLUMN IF EXISTS phone CASCADE,
DROP COLUMN IF EXISTS mobile CASCADE,
DROP COLUMN IF EXISTS lead_source CASCADE,
DROP COLUMN IF EXISTS rating CASCADE,
DROP COLUMN IF EXISTS currency CASCADE,
DROP COLUMN IF EXISTS exchange_rate CASCADE,
DROP COLUMN IF EXISTS street CASCADE,
DROP COLUMN IF EXISTS zip_code CASCADE,
DROP COLUMN IF EXISTS is_converted CASCADE,
DROP COLUMN IF EXISTS created_at CASCADE,
DROP COLUMN IF EXISTS modified_at CASCADE,
DROP COLUMN IF EXISTS created_by CASCADE,
DROP COLUMN IF EXISTS modified_by CASCADE,
DROP COLUMN IF EXISTS last_activity_time CASCADE,
DROP COLUMN IF EXISTS converted_to_deal_id CASCADE,
DROP COLUMN IF EXISTS deal_conversion_date CASCADE;

-- Add the correct columns for leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS contact_name text,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS position text,
ADD COLUMN IF NOT EXISTS phone_no text,
ADD COLUMN IF NOT EXISTS mobile_no text,
ADD COLUMN IF NOT EXISTS linkedin text,
ADD COLUMN IF NOT EXISTS contact_owner uuid,
ADD COLUMN IF NOT EXISTS contact_source contact_source DEFAULT 'Website',
ADD COLUMN IF NOT EXISTS created_time timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS modified_time timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS modified_by uuid;

-- Update leads industry to use the new enum with Automotive default
ALTER TABLE leads 
ALTER COLUMN industry SET DEFAULT 'Automotive'::industry_type;

-- Add missing columns to contacts_module if not present
ALTER TABLE contacts_module 
ADD COLUMN IF NOT EXISTS fax text,
ADD COLUMN IF NOT EXISTS industry industry_type DEFAULT 'Automotive';

-- Drop the contact_owner column from contacts_module since it's not in the specified list
ALTER TABLE contacts_module 
DROP COLUMN IF EXISTS contact_owner CASCADE;

-- Recreate basic RLS policies for leads
CREATE POLICY "Users can view all leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Users can create leads" ON leads FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update leads" ON leads FOR UPDATE USING (auth.uid() = created_by);
