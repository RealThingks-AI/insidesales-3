
-- Create email templates table for automated emails
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'welcome', 'follow_up', 'meeting_invite', etc.
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email campaigns table to track sent emails
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.contacts(id),
  template_id UUID REFERENCES public.email_templates(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'opened', 'responded'
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow actions table to track pipeline progression
CREATE TABLE public.workflow_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.contacts(id),
  lead_id UUID REFERENCES public.leads(id),
  deal_id UUID REFERENCES public.deals(id),
  meeting_id UUID REFERENCES public.meetings(id),
  action_type TEXT NOT NULL, -- 'email_sent', 'meeting_scheduled', 'lead_converted', 'deal_created', etc.
  action_data JSONB DEFAULT '{}',
  performed_by UUID REFERENCES auth.users NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add workflow status to contacts
ALTER TABLE public.contacts ADD COLUMN workflow_stage TEXT DEFAULT 'new'; -- 'new', 'contacted', 'interested', 'meeting_scheduled', 'converted'

-- Add lead conversion fields to contacts
ALTER TABLE public.contacts ADD COLUMN converted_to_lead_id UUID REFERENCES public.leads(id);
ALTER TABLE public.contacts ADD COLUMN conversion_date TIMESTAMP WITH TIME ZONE;

-- Add deal conversion fields to leads
ALTER TABLE public.leads ADD COLUMN converted_to_deal_id UUID REFERENCES public.deals(id);
ALTER TABLE public.leads ADD COLUMN deal_conversion_date TIMESTAMP WITH TIME ZONE;

-- Add meeting outcome tracking
ALTER TABLE public.meetings ADD COLUMN outcome TEXT; -- 'interested', 'not_interested', 'reschedule', 'no_show'
ALTER TABLE public.meetings ADD COLUMN follow_up_required BOOLEAN DEFAULT false;
ALTER TABLE public.meetings ADD COLUMN next_action TEXT;

-- Enable RLS on new tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_templates
CREATE POLICY "Users can view all email templates" ON public.email_templates FOR SELECT USING (true);
CREATE POLICY "Users can create email templates" ON public.email_templates FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own email templates" ON public.email_templates FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own email templates" ON public.email_templates FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for email_campaigns
CREATE POLICY "Users can view all email campaigns" ON public.email_campaigns FOR SELECT USING (true);
CREATE POLICY "Users can create email campaigns" ON public.email_campaigns FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update email campaigns" ON public.email_campaigns FOR UPDATE USING (auth.uid() = created_by);

-- Create RLS policies for workflow_actions
CREATE POLICY "Users can view all workflow actions" ON public.workflow_actions FOR SELECT USING (true);
CREATE POLICY "Users can create workflow actions" ON public.workflow_actions FOR INSERT WITH CHECK (auth.uid() = performed_by);

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, body, template_type, created_by) VALUES
('Welcome Email', 'Welcome to our CRM System', 'Hi {{first_name}}, welcome to our system! We''re excited to work with you.', 'welcome', '00000000-0000-0000-0000-000000000000'),
('Follow Up Email', 'Following up on our conversation', 'Hi {{first_name}}, I wanted to follow up on our recent conversation. Are you still interested in learning more?', 'follow_up', '00000000-0000-0000-0000-000000000000'),
('Meeting Invitation', 'Let''s schedule a meeting', 'Hi {{first_name}}, I''d love to schedule a meeting to discuss how we can help you. When would be a good time?', 'meeting_invite', '00000000-0000-0000-0000-000000000000');
