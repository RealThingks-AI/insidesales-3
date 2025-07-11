-- Create a function to safely create user profiles
CREATE OR REPLACE FUNCTION create_user_profile(
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