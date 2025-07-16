-- Add missing supplier_portal_required column to deals table
ALTER TABLE public.deals 
ADD COLUMN supplier_portal_required boolean DEFAULT false;