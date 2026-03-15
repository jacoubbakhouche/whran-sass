-- Fix for announcements (NOT NULL constraints) and institution_services (missing columns)
-- Run this in Supabase SQL Editor

-- 1. Fix announcements table (Relax old NOT NULL constraints)
ALTER TABLE public.announcements ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.announcements ALTER COLUMN content DROP NOT NULL;

-- 2. Fix institution_services table (Add missing fee_range)
ALTER TABLE public.institution_services ADD COLUMN IF NOT EXISTS fee_range TEXT;

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
