
-- First, drop ALL existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "Allow all authenticated users to view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile only" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Allow service role to insert profiles" 
ON public.profiles 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Make sure we have the roles_permissions table with proper policies
CREATE TABLE IF NOT EXISTS public.roles_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on roles_permissions
ALTER TABLE public.roles_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on roles_permissions
DROP POLICY IF EXISTS "Users can view all roles" ON public.roles_permissions;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles_permissions;

-- Create simple policies for roles_permissions
CREATE POLICY "Allow all authenticated users to view roles" 
ON public.roles_permissions 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow service role to manage roles" 
ON public.roles_permissions 
FOR ALL 
TO service_role
USING (true);

-- Update the profiles table to ensure we have proper admin users
-- First, let's make sure there's at least one admin user
DO $$
BEGIN
  -- Check if there are any admin users in profiles
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    -- Update the first user to be admin if no admin exists
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);
  END IF;
END $$;
