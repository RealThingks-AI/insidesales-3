-- Create a more permissive deletion policy for leads
-- Since this is an admin dashboard, allow authenticated users to delete any leads
DROP POLICY IF EXISTS "Admin users can delete any leads" ON public.leads;

CREATE POLICY "Authenticated users can delete any leads" 
ON public.leads 
FOR DELETE 
TO authenticated
USING (true);

-- Also make sure updates work for all authenticated users  
DROP POLICY IF EXISTS "Admin users can update any leads" ON public.leads;
CREATE POLICY "Authenticated users can update any leads"
ON public.leads
FOR UPDATE
TO authenticated  
USING (true);