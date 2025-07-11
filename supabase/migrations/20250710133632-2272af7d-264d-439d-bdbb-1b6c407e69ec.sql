-- Create the user_role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the profiles table to use the enum if it's not already using it
DO $$ BEGIN
    -- Check if the column exists and update it if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role' 
        AND data_type != 'USER-DEFINED'
    ) THEN
        ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
    END IF;
END $$;