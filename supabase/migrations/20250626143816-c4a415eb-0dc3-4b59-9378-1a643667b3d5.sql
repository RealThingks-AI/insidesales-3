
-- Step 1: Add the missing enum values to deal_stage
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Contact';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Lead'; 
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Meeting';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Qualified';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'RFQ';
ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Offered';

-- Create topic_status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'topic_status') THEN
        CREATE TYPE topic_status AS ENUM ('Open', 'Done');
    END IF;
END $$;
