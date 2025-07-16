-- Update the negotiation_status check constraint to include new values
ALTER TABLE deals 
DROP CONSTRAINT deals_negotiation_status_check;

ALTER TABLE deals 
ADD CONSTRAINT deals_negotiation_status_check 
CHECK (negotiation_status = ANY (ARRAY['Ongoing'::text, 'Finalized'::text, 'Rejected'::text, 'Accepted'::text, 'Dropped'::text, 'No Response'::text]));