-- Create dashboard preferences table
CREATE TABLE public.dashboard_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  layout_view text DEFAULT 'grid',
  visible_widgets jsonb DEFAULT '["pipeline", "meetings", "leads", "activity", "revenue"]'::jsonb,
  card_order jsonb DEFAULT '["pipeline", "meetings", "leads", "activity", "revenue"]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own dashboard preferences" 
ON public.dashboard_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dashboard preferences" 
ON public.dashboard_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard preferences" 
ON public.dashboard_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboard preferences" 
ON public.dashboard_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_dashboard_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dashboard_preferences_updated_at
BEFORE UPDATE ON public.dashboard_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_dashboard_preferences_updated_at();