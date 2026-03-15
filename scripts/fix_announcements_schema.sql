-- Migration to fix missing columns in announcements table
-- Run this in Supabase SQL Editor

-- 1. Add missing bilingual columns
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS title_fr TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS content_ar TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS content_fr TEXT;

-- 2. (Optional) Migrate existing data from title/content if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='title') THEN
        UPDATE public.announcements SET title_ar = title WHERE title_ar IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='content') THEN
        UPDATE public.announcements SET content_ar = content WHERE content_ar IS NULL;
    END IF;
END $$;

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
