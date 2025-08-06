-- Enhancement for Upload Features
-- This migration adds optional enhancements for the PDF upload and AI extraction features

-- 1. Add columns to tasks table for PDF extraction metadata
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual', -- 'manual', 'pdf_extraction', 'google_calendar'
ADD COLUMN IF NOT EXISTS extraction_confidence numeric(3,2), -- 0.00 to 1.00
ADD COLUMN IF NOT EXISTS original_instruction text, -- AI instruction used for extraction
ADD COLUMN IF NOT EXISTS location text, -- Event location
ADD COLUMN IF NOT EXISTS instructor text; -- Instructor/teacher name

-- 2. Create table for tracking PDF uploads and extractions
CREATE TABLE IF NOT EXISTS public.pdf_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_size bigint,
  ai_instruction text,
  extracted_text text, -- Store extracted text for debugging/reprocessing
  events_found integer DEFAULT 0,
  events_added integer DEFAULT 0,
  processing_time_ms integer,
  confidence_avg numeric(3,2),
  status text DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  error_message text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for pdf_extractions
ALTER TABLE public.pdf_extractions ENABLE ROW LEVEL SECURITY;

-- Create policies for pdf_extractions
CREATE POLICY "Users can view their own extractions" 
ON public.pdf_extractions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extractions" 
ON public.pdf_extractions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extractions" 
ON public.pdf_extractions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Create table for AI query templates (user can save frequently used instructions)
CREATE TABLE IF NOT EXISTS public.ai_query_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  instruction text NOT NULL,
  is_default boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for ai_query_templates
ALTER TABLE public.ai_query_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_query_templates
CREATE POLICY "Users can manage their own templates" 
ON public.ai_query_templates 
FOR ALL 
USING (auth.uid() = user_id);

-- 4. Create function to get extraction statistics
CREATE OR REPLACE FUNCTION public.get_extraction_stats(p_user_id uuid)
RETURNS TABLE (
  total_extractions bigint,
  total_events_found bigint,
  total_events_added bigint,
  avg_confidence numeric,
  avg_processing_time numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_extractions,
    COALESCE(SUM(events_found), 0)::bigint as total_events_found,
    COALESCE(SUM(events_added), 0)::bigint as total_events_added,
    ROUND(AVG(confidence_avg), 2) as avg_confidence,
    ROUND(AVG(processing_time_ms), 0) as avg_processing_time
  FROM public.pdf_extractions 
  WHERE user_id = p_user_id AND status = 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Create function to get tasks by source type
CREATE OR REPLACE FUNCTION public.get_tasks_by_source(p_user_id uuid)
RETURNS TABLE (
  source_type text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.source_type,
    COUNT(*)::bigint as count
  FROM public.tasks t
  WHERE t.user_id = p_user_id
  GROUP BY t.source_type
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Create trigger for updating ai_query_templates timestamp
CREATE TRIGGER update_ai_query_templates_updated_at
BEFORE UPDATE ON public.ai_query_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_source_type ON public.tasks(source_type);
CREATE INDEX IF NOT EXISTS idx_tasks_extraction_confidence ON public.tasks(extraction_confidence);
CREATE INDEX IF NOT EXISTS idx_pdf_extractions_user_status ON public.pdf_extractions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pdf_extractions_created_at ON public.pdf_extractions(created_at);

-- 8. Insert default AI query templates
INSERT INTO public.ai_query_templates (user_id, name, instruction, is_default) VALUES
('00000000-0000-0000-0000-000000000000'::uuid, 'Extract All Events', 'Extract all academic events from the schedule', true),
('00000000-0000-0000-0000-000000000000'::uuid, 'RPLK Classes Only', 'Extract schedule for III RPLK class only', true),
('00000000-0000-0000-0000-000000000000'::uuid, 'TKJ Classes Only', 'Extract schedule for III TKJ class only', true),
('00000000-0000-0000-0000-000000000000'::uuid, 'MM Classes Only', 'Extract schedule for III MM class only', true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Laboratory Sessions', 'Show only laboratory sessions', true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Monday Schedules', 'Extract Monday schedules only', true)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.pdf_extractions IS 'Tracks PDF upload and AI extraction history for analytics and debugging';
COMMENT ON TABLE public.ai_query_templates IS 'Stores user-defined AI instruction templates for quick reuse';
COMMENT ON COLUMN public.tasks.source_type IS 'Indicates how the task was created: manual, pdf_extraction, google_calendar';
COMMENT ON COLUMN public.tasks.extraction_confidence IS 'AI confidence score (0-1) for extracted events';
COMMENT ON COLUMN public.tasks.original_instruction IS 'Original AI instruction used to extract this event';
