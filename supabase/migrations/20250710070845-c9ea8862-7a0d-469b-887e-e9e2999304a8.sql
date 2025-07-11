-- Update the profile for peter.jakobsson to have the correct email
UPDATE profiles 
SET "Email ID" = 'peter.jakobsson@realthingks.com'
WHERE id = '49465ea0-0868-4939-a41f-beabfff25d29';

-- Update any profiles with null email to use a derived email from full_name
UPDATE profiles 
SET "Email ID" = full_name || '@realthingks.com'
WHERE "Email ID" IS NULL AND full_name IS NOT NULL;

-- Update the trigger function to properly set email when creating profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, "Email ID", role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name', 
      SPLIT_PART(NEW.email, '@', 1),
      'User'
    ),
    NEW.email,
    'member'
  );
  RETURN NEW;
END;
$$;