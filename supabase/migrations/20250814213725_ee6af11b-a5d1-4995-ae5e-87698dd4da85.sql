
-- Create meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration TEXT NOT NULL,
  location TEXT,
  timezone TEXT DEFAULT 'UTC',
  description TEXT,
  participants TEXT[] DEFAULT '{}',
  teams_link TEXT,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting_outcomes table
CREATE TABLE public.meeting_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  outcome_type TEXT NOT NULL,
  summary TEXT,
  next_steps TEXT,
  interested_in_deal BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_outcomes ENABLE ROW LEVEL SECURITY;

-- Create policies for meetings
CREATE POLICY "Users can view meetings they created" 
  ON public.meetings 
  FOR SELECT 
  USING (auth.uid() = created_by OR is_current_user_admin());

CREATE POLICY "Users can create meetings" 
  ON public.meetings 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update meetings they created" 
  ON public.meetings 
  FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete meetings they created" 
  ON public.meetings 
  FOR DELETE 
  USING (auth.uid() = created_by OR is_current_user_admin());

-- Create policies for meeting_outcomes
CREATE POLICY "Users can view meeting outcomes they created" 
  ON public.meeting_outcomes 
  FOR SELECT 
  USING (auth.uid() = created_by OR is_current_user_admin());

CREATE POLICY "Users can create meeting outcomes" 
  ON public.meeting_outcomes 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update meeting outcomes they created" 
  ON public.meeting_outcomes 
  FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete meeting outcomes they created" 
  ON public.meeting_outcomes 
  FOR DELETE 
  USING (auth.uid() = created_by OR is_current_user_admin());
