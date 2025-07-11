
-- Fix the search_path issues for the existing functions
-- This makes the functions more secure by explicitly setting the search_path

-- Update the get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT role FROM public.profiles WHERE id = user_id;
$function$;

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'member'
  );
  RETURN NEW;
END;
$function$;

-- Update the update_contacts_modified_time function
CREATE OR REPLACE FUNCTION public.update_contacts_modified_time()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.modified_time = now();
  NEW.modified_by = auth.uid();
  RETURN NEW;
END;
$function$;
