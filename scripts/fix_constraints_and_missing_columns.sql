-- Fix for announcements (NOT NULL constraints) and institution_services (missing columns)
-- Run this in Supabase SQL Editor

-- 1. Fix announcements table (Relax old NOT NULL constraints)
ALTER TABLE public.announcements ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.announcements ALTER COLUMN content DROP NOT NULL;

-- 2. Fix institution_services table (Add missing fee_range)
ALTER TABLE public.institution_services ADD COLUMN IF NOT EXISTS fee_range TEXT;

-- 3. Fix institutions table (Add missing lat/lng)
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS lat DECIMAL;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS lng DECIMAL;

-- 4. Sync existing data from 'location' column if it exists
UPDATE public.institutions 
SET 
  lat = (ST_AsGeoJSON(location)::jsonb->'coordinates'->>1)::decimal,
  lng = (ST_AsGeoJSON(location)::jsonb->'coordinates'->>0)::decimal
WHERE location IS NOT NULL AND lat IS NULL;

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
