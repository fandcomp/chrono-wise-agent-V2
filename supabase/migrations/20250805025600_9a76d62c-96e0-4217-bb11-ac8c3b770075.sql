-- Add missing columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Personal',
ADD COLUMN IF NOT EXISTS is_completed boolean NOT NULL DEFAULT false;

-- Change the id column from serial/integer to uuid
ALTER TABLE public.tasks ALTER COLUMN id SET DATA TYPE uuid USING gen_random_uuid();
ALTER TABLE public.tasks ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Make sure start_time and end_time are not nullable
ALTER TABLE public.tasks ALTER COLUMN start_time SET NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN end_time SET NOT NULL;

-- Remove unnecessary google_calendar_event_id column if it exists
ALTER TABLE public.tasks DROP COLUMN IF EXISTS google_calendar_event_id;