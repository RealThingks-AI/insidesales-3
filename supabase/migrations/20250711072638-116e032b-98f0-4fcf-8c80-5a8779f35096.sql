-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user has admin role in their user_metadata
  RETURN COALESCE(
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin',
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update contacts policies to allow admin access
DROP POLICY IF EXISTS "Users can insert contacts" ON public.contacts;
CREATE POLICY "Users can insert contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (auth.uid() = created_by OR is_current_user_admin());

-- Update deals policies to allow admin access  
DROP POLICY IF EXISTS "Users can insert deals" ON public.deals;
CREATE POLICY "Users can insert deals"
ON public.deals 
FOR INSERT 
WITH CHECK (auth.uid() = created_by OR is_current_user_admin());

-- Update leads policies to allow admin access
DROP POLICY IF EXISTS "Users can insert leads" ON public.leads;  
CREATE POLICY "Users can insert leads"
ON public.leads 
FOR INSERT 
WITH CHECK (auth.uid() = created_by OR is_current_user_admin());

-- Update meetings policies to allow admin access
DROP POLICY IF EXISTS "Users can insert meetings" ON public.meetings;
CREATE POLICY "Users can insert meetings"
ON public.meetings 
FOR INSERT 
WITH CHECK (auth.uid() = created_by OR is_current_user_admin());

-- Update profiles policies to allow admin access
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id OR is_current_user_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id OR is_current_user_admin());

-- Add missing DELETE policy for profiles
CREATE POLICY "Users can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id OR is_current_user_admin());