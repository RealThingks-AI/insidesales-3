-- Add missing columns for qualified stage fields
ALTER TABLE public.deals 
ADD COLUMN budget_holder TEXT,
ADD COLUMN decision_makers TEXT,
ADD COLUMN timeline TEXT;