
-- Create contacts_module table (seems to be a separate module for contacts)
CREATE TABLE public.contacts_module (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_name TEXT,
  company_name TEXT,
  position TEXT,
  email TEXT,
  phone_no TEXT,
  mobile_no TEXT,
  linkedin TEXT,
  fax TEXT,
  website TEXT,
  contact_source contact_source DEFAULT 'Website',
  industry industry_type DEFAULT 'Technology',
  city TEXT,
  state TEXT,
  country TEXT,
  description TEXT,
  contact_owner UUID,
  created_by UUID NOT NULL,
  modified_by UUID,
  created_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  modified_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  lead_status lead_status DEFAULT 'New',
  no_of_employees INTEGER,
  annual_revenue NUMERIC,
  interest TEXT
);

-- Create lead_conversions table to track conversions
CREATE TABLE public.lead_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.contacts(id),
  lead_id UUID REFERENCES public.leads(id),
  converted_by UUID NOT NULL,
  conversion_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table for follow-ups
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status task_status DEFAULT 'Not Started',
  priority priority_level DEFAULT 'Medium',
  contact UUID REFERENCES public.contacts(id),
  created_by UUID NOT NULL,
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing columns to existing contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS lead_status lead_status DEFAULT 'New',
ADD COLUMN IF NOT EXISTS no_of_employees INTEGER,
ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC,
ADD COLUMN IF NOT EXISTS state TEXT;

-- Enable RLS for new tables
ALTER TABLE public.contacts_module ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for contacts_module
CREATE POLICY "Users can view all contacts_module" ON public.contacts_module FOR SELECT USING (true);
CREATE POLICY "Users can insert contacts_module" ON public.contacts_module FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update contacts_module" ON public.contacts_module FOR UPDATE USING (true);
CREATE POLICY "Users can delete contacts_module" ON public.contacts_module FOR DELETE USING (true);

-- RLS policies for lead_conversions
CREATE POLICY "Users can view all lead_conversions" ON public.lead_conversions FOR SELECT USING (true);
CREATE POLICY "Users can insert lead_conversions" ON public.lead_conversions FOR INSERT WITH CHECK (auth.uid() = converted_by);
CREATE POLICY "Users can update lead_conversions" ON public.lead_conversions FOR UPDATE USING (true);
CREATE POLICY "Users can delete lead_conversions" ON public.lead_conversions FOR DELETE USING (true);

-- RLS policies for tasks
CREATE POLICY "Users can view all tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Users can insert tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Users can delete tasks" ON public.tasks FOR DELETE USING (true);
