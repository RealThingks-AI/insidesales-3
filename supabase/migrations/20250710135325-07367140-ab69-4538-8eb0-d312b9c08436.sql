-- Create the user_role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ensure the profiles table has the correct structure
ALTER TABLE profiles 
ALTER COLUMN role SET DEFAULT 'member'::user_role;

-- Make sure the create_user_profile function exists and works correctly
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id uuid, 
  display_name text, 
  email text, 
  user_role text DEFAULT 'member'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, "Email ID", role)
  VALUES (
    user_id,
    display_name,
    email,
    user_role::user_role
  );
END;
$$;