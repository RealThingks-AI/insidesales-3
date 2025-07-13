-- Clean up conflicting RLS policies and create clear admin access
-- First, drop conflicting policies
DROP POLICY IF EXISTS "Users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;

-- Keep the permissive policies that allow all authenticated users
-- But add admin override for deletion
DROP POLICY IF EXISTS "Allow all users to delete leads" ON public.leads;

-- Create a comprehensive admin-friendly policy for deletion
CREATE POLICY "Admin users can delete any leads" 
ON public.leads 
FOR DELETE 
TO authenticated
USING (
    -- Allow if user is admin OR if user created the lead
    is_current_user_admin() OR auth.uid() = created_by
);

-- Ensure admins can update any leads too  
DROP POLICY IF EXISTS "Users can update leads" ON public.leads;
CREATE POLICY "Admin users can update any leads"
ON public.leads
FOR UPDATE
TO authenticated  
USING (
    is_current_user_admin() OR auth.uid() = created_by
);