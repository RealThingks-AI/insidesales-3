-- Add negotiation_notes field to deals table
ALTER TABLE deals 
ADD COLUMN negotiation_notes text;