-- Add fields for Discussions stage data mapping
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS lead_name TEXT,
ADD COLUMN IF NOT EXISTS lead_owner TEXT,
ADD COLUMN IF NOT EXISTS meeting_summary TEXT;