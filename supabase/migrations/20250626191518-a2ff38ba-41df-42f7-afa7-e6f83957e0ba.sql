
-- Add interest field to contacts table
ALTER TABLE public.contacts 
ADD COLUMN interest TEXT CHECK (interest IN ('Interested', 'Not Interested'));

-- Add lead_id field to meetings table  
ALTER TABLE public.meetings
ADD COLUMN lead_id UUID REFERENCES public.leads(id);
