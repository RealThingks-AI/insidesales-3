-- Remove existing restrictive RLS policies for meetings and add admin bypass
DROP POLICY IF EXISTS "Users can delete their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can update their own meetings" ON public.meetings;

-- Create new policies that allow admin full access and regular users to manage their own meetings
CREATE POLICY "Users can delete meetings with admin bypass" 
ON public.meetings 
FOR DELETE 
USING (
  auth.uid() = created_by OR 
  is_current_user_admin()
);

CREATE POLICY "Users can update meetings with admin bypass" 
ON public.meetings 
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  is_current_user_admin()
);