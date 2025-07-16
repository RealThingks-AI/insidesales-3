-- Add missing rfq_confirmation_note column for RFQ stage
ALTER TABLE public.deals 
ADD COLUMN rfq_confirmation_note TEXT;