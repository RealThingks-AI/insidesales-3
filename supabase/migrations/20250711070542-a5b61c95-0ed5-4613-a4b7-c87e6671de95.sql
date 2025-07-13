-- Create roles table
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Create policies for roles table
CREATE POLICY "Anyone can view roles" 
ON public.roles 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage roles" 
ON public.roles 
FOR ALL 
USING (is_current_user_admin());

-- Insert default roles
INSERT INTO public.roles (name, description, permissions) VALUES 
('admin', 'Administrator with full access', '{"all": true}'),
('member', 'Regular member with basic access', '{"read": true}');

-- Add role_id column to user_roles table
ALTER TABLE public.user_roles ADD COLUMN role_id UUID REFERENCES public.roles(id);

-- Update existing user_roles to reference the new roles table
UPDATE public.user_roles 
SET role_id = (SELECT id FROM public.roles WHERE name = 'admin') 
WHERE role = 'admin';

UPDATE public.user_roles 
SET role_id = (SELECT id FROM public.roles WHERE name = 'member') 
WHERE role = 'member';

-- Make role_id NOT NULL after data migration
ALTER TABLE public.user_roles ALTER COLUMN role_id SET NOT NULL;

-- Create updated timestamp trigger for roles
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION update_roles_updated_at();