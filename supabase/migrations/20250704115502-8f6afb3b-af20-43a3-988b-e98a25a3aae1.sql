
-- Create the deals table with all required fields for each stage
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_name TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'Lead',
  related_lead_id UUID REFERENCES public.leads(id),
  related_meeting_id UUID REFERENCES public.meetings(id),
  
  -- General fields
  amount DECIMAL,
  currency TEXT DEFAULT 'USD',
  probability INTEGER DEFAULT 0,
  closing_date DATE,
  description TEXT,
  
  -- Stage-specific fields
  -- Discussions stage
  discussion_notes TEXT,
  
  -- Qualified stage
  budget_holder TEXT,
  decision_makers TEXT,
  timeline TEXT,
  nda_signed BOOLEAN DEFAULT false,
  supplier_portal_required BOOLEAN DEFAULT false,
  
  -- RFQ stage
  rfq_document_link TEXT,
  rfq_confirmation_note TEXT,
  
  -- Offered stage
  offer_sent_date DATE,
  revised_offer_notes TEXT,
  negotiation_notes TEXT,
  
  -- Won stage
  execution_started BOOLEAN DEFAULT false,
  
  -- Lost stage
  lost_to TEXT,
  lost_reason TEXT,
  learning_summary TEXT,
  
  -- Dropped stage
  drop_summary TEXT,
  
  -- Internal tracking
  internal_notes TEXT,
  last_activity_time TIMESTAMP WITH TIME ZONE,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  modified_by UUID
);

-- Add Row Level Security
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create policies for deals
CREATE POLICY "Users can view all deals" 
  ON public.deals 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create deals" 
  ON public.deals 
  FOR INSERT 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update deals" 
  ON public.deals 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete deals" 
  ON public.deals 
  FOR DELETE 
  USING (true);

-- Create trigger to update modified_at timestamp
CREATE OR REPLACE FUNCTION public.update_deals_modified_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified_at = now();
  NEW.modified_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_deals_modified_time_trigger
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deals_modified_time();

-- Create auto-update stage function based on field completion
CREATE OR REPLACE FUNCTION public.auto_update_deal_stage()
RETURNS TRIGGER AS $$
BEGIN
    -- Only auto-update if current stage is not Lost or Dropped (manually controlled)
    IF NEW.stage NOT IN ('Lost', 'Dropped') THEN
        -- Auto-progression logic
        IF NEW.closing = 'Done' THEN
            NEW.stage = 'Won';
        ELSIF NEW.value = 'Done' THEN
            NEW.stage = 'Offered';
        ELSIF NEW.budget = 'Done' AND NEW.challenge = 'Done' THEN
            NEW.stage = 'RFQ';
        ELSIF NEW.trust = 'Done' THEN
            NEW.stage = 'Qualified';
        ELSIF NEW.need = 'Done' THEN
            NEW.stage = 'Meeting';
        ELSIF NEW.interest = 'Done' THEN
            NEW.stage = 'Lead';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_deal_stage_trigger
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_deal_stage();
