
-- Drop existing meetings table and recreate with new schema
DROP TABLE IF EXISTS public.meetings CASCADE;

-- Create new meetings table with updated schema
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_title TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  participants TEXT[] NOT NULL DEFAULT '{}',
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration TEXT NOT NULL CHECK (duration IN ('15 min', '30 min', '1 hour', '2 hours')),
  location TEXT NOT NULL CHECK (location IN ('Online', 'In-Person')),
  teams_link TEXT,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all meetings" 
  ON public.meetings 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create meetings" 
  ON public.meetings 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own meetings" 
  ON public.meetings 
  FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own meetings" 
  ON public.meetings 
  FOR DELETE 
  USING (auth.uid() = created_by);
