
-- Create deal_action_items table
CREATE TABLE public.deal_action_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  next_action TEXT NOT NULL,
  assigned_to UUID,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'Open',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deal_action_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies similar to lead_action_items
CREATE POLICY "Users can view action items for accessible deals" 
  ON public.deal_action_items 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM deals 
    WHERE deals.id = deal_action_items.deal_id
  ));

CREATE POLICY "Users can create action items for deals" 
  ON public.deal_action_items 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = created_by AND 
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_action_items.deal_id
    )
  );

CREATE POLICY "Users can update their own action items, admins can update all" 
  ON public.deal_action_items 
  FOR UPDATE 
  USING (
    is_user_admin() OR 
    created_by = auth.uid() OR 
    assigned_to = auth.uid()
  );

CREATE POLICY "Users can delete their own action items, admins can delete all" 
  ON public.deal_action_items 
  FOR DELETE 
  USING (
    is_user_admin() OR 
    created_by = auth.uid()
  );

-- Create trigger for updated_at
CREATE TRIGGER update_deal_action_items_updated_at
  BEFORE UPDATE ON public.deal_action_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for notifications
CREATE TRIGGER create_deal_action_item_notification_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.deal_action_items
  FOR EACH ROW
  EXECUTE FUNCTION public.create_deal_action_item_notification();
