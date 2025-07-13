
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  "Email ID" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_name TEXT NOT NULL,
  company_name TEXT,
  position TEXT,
  email TEXT,
  phone_no TEXT,
  mobile_no TEXT,
  linkedin TEXT,
  website TEXT,
  contact_source TEXT,
  lead_status TEXT,
  industry TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  annual_revenue NUMERIC,
  no_of_employees INTEGER,
  description TEXT,
  contact_owner UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  modified_by UUID REFERENCES auth.users(id),
  created_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  modified_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_name TEXT NOT NULL,
  company_name TEXT,
  position TEXT,
  email TEXT,
  phone_no TEXT,
  mobile_no TEXT,
  linkedin TEXT,
  website TEXT,
  contact_source TEXT,
  lead_status TEXT,
  industry TEXT,
  city TEXT,
  country TEXT,
  description TEXT,
  contact_owner UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  modified_by UUID REFERENCES auth.users(id),
  created_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  modified_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meetings table
CREATE TABLE public.meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration TEXT DEFAULT '1 hour' CHECK (duration IN ('30 min', '1 hour')),
  location TEXT DEFAULT 'Online' CHECK (location IN ('Online', 'In-Person')),
  timezone TEXT DEFAULT 'UTC',
  participants TEXT[] DEFAULT '{}',
  teams_link TEXT,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deals table with comprehensive stage management
CREATE TABLE public.deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_name TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'Discussions' CHECK (stage IN ('Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped')),
  related_lead_id UUID REFERENCES public.leads(id),
  related_meeting_id UUID REFERENCES public.meetings(id),
  amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  closing_date DATE,
  description TEXT,
  
  -- Stage-specific fields
  customer_need_identified BOOLEAN,
  need_summary TEXT,
  decision_maker_present BOOLEAN,
  customer_agreed_on_need TEXT CHECK (customer_agreed_on_need IN ('Yes', 'No', 'Partial')),
  budget_confirmed TEXT CHECK (budget_confirmed IN ('Yes', 'No', 'Estimate Only')),
  supplier_portal_access TEXT CHECK (supplier_portal_access IN ('Invited', 'Approved', 'Not Invited')),
  expected_deal_timeline_start DATE,
  expected_deal_timeline_end DATE,
  nda_signed BOOLEAN,
  rfq_value NUMERIC,
  rfq_document_url TEXT,
  product_service_scope TEXT,
  proposal_sent_date DATE,
  negotiation_status TEXT CHECK (negotiation_status IN ('Ongoing', 'Finalized', 'Rejected')),
  decision_expected_date DATE,
  win_reason TEXT,
  loss_reason TEXT CHECK (loss_reason IN ('Budget', 'Competitor', 'Timeline', 'Other')),
  drop_reason TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  modified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for contacts
CREATE POLICY "Users can view all contacts" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Users can insert contacts" ON public.contacts FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update contacts" ON public.contacts FOR UPDATE USING (true);
CREATE POLICY "Users can delete contacts" ON public.contacts FOR DELETE USING (true);

-- Create RLS policies for leads
CREATE POLICY "Users can view all leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Users can insert leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update leads" ON public.leads FOR UPDATE USING (true);
CREATE POLICY "Users can delete leads" ON public.leads FOR DELETE USING (true);

-- Create RLS policies for meetings
CREATE POLICY "Users can view all meetings" ON public.meetings FOR SELECT USING (true);
CREATE POLICY "Users can insert meetings" ON public.meetings FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update meetings" ON public.meetings FOR UPDATE USING (true);
CREATE POLICY "Users can delete meetings" ON public.meetings FOR DELETE USING (true);

-- Create RLS policies for deals
CREATE POLICY "Users can view all deals" ON public.deals FOR SELECT USING (true);
CREATE POLICY "Users can insert deals" ON public.deals FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update deals" ON public.deals FOR UPDATE USING (true);
CREATE POLICY "Users can delete deals" ON public.deals FOR DELETE USING (true);

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, "Email ID")
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for all tables
ALTER TABLE public.contacts REPLICA IDENTITY FULL;
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.meetings REPLICA IDENTITY FULL;
ALTER TABLE public.deals REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
