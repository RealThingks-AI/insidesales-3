-- Add missing execution fields to deals table
ALTER TABLE deals 
ADD COLUMN execution_started boolean DEFAULT false,
ADD COLUMN begin_execution_date date;