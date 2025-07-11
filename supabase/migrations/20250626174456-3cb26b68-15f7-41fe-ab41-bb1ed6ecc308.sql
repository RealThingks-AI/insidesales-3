
-- Add response tracking to contact_emails table
ALTER TABLE public.contact_emails ADD COLUMN IF NOT EXISTS response_type TEXT CHECK (response_type IN ('interested', 'not_interested', 'no_response'));
ALTER TABLE public.contact_emails ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.contact_emails ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;

-- Add tags table for contact tagging
CREATE TABLE IF NOT EXISTS public.contact_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.contacts_module(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  tag_type TEXT DEFAULT 'manual', -- 'manual', 'system', 'response'
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on contact_tags
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contact_tags
CREATE POLICY "Users can view all contact tags" ON public.contact_tags FOR SELECT USING (true);
CREATE POLICY "Users can create contact tags" ON public.contact_tags FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own contact tags" ON public.contact_tags FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own contact tags" ON public.contact_tags FOR DELETE USING (auth.uid() = created_by);

-- Add follow-up reminders table
CREATE TABLE IF NOT EXISTS public.follow_up_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.contacts_module(id) ON DELETE CASCADE,
  email_id UUID REFERENCES public.contact_emails(id) ON DELETE CASCADE,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_type TEXT DEFAULT 'email_follow_up',
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on follow_up_reminders
ALTER TABLE public.follow_up_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for follow_up_reminders
CREATE POLICY "Users can view all follow-up reminders" ON public.follow_up_reminders FOR SELECT USING (true);
CREATE POLICY "Users can create follow-up reminders" ON public.follow_up_reminders FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update follow-up reminders" ON public.follow_up_reminders FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete follow-up reminders" ON public.follow_up_reminders FOR DELETE USING (auth.uid() = created_by);
