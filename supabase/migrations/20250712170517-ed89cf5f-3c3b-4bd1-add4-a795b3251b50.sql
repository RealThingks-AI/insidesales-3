-- Create function for updating timestamps first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create meeting_outcomes table
CREATE TABLE public.meeting_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  outcome_type TEXT NOT NULL CHECK (outcome_type IN ('Positive', 'Neutral', 'Negative', 'No Show')),
  summary TEXT,
  next_steps TEXT,
  interested_in_deal BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.meeting_outcomes ENABLE ROW LEVEL SECURITY;

-- Create policies for meeting_outcomes
CREATE POLICY "Users can view all meeting outcomes" 
ON public.meeting_outcomes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create meeting outcomes" 
ON public.meeting_outcomes 
FOR INSERT 
WITH CHECK ((auth.uid() = created_by) OR is_current_user_admin());

CREATE POLICY "Users can update meeting outcomes" 
ON public.meeting_outcomes 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete meeting outcomes" 
ON public.meeting_outcomes 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_meeting_outcomes_updated_at
BEFORE UPDATE ON public.meeting_outcomes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();