-- ==============================================================================
-- FIX: Missing Profile Edit Columns + Storage Bucket Setup
-- Run this script in the Supabase SQL Editor
-- ==============================================================================

-- 1. FIX institution_services TABLE
-- The UI attempts to save these boolean fields here. We add them with defaults.
ALTER TABLE public.institution_services ADD COLUMN IF NOT EXISTS programs TEXT;
ALTER TABLE public.institution_services ADD COLUMN IF NOT EXISTS fee_range TEXT;
ALTER TABLE public.institution_services ADD COLUMN IF NOT EXISTS has_transport BOOLEAN DEFAULT false;
ALTER TABLE public.institution_services ADD COLUMN IF NOT EXISTS has_canteen BOOLEAN DEFAULT false;
ALTER TABLE public.institution_services ADD COLUMN IF NOT EXISTS is_enrollment_open BOOLEAN DEFAULT true;

-- 2. FIX institutions TABLE
-- Ensuring all basic text and boolean fields sent by the UI exist with safe defaults where applicable
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS name_fr TEXT;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS address_detail TEXT;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS commune TEXT;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS founded_year INT;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 3. SETUP STORAGE BUCKET ('profiles')
-- Create the bucket if it doesn't exist and make it public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. STORAGE POLICIES
-- Enable RLS on storage objects just in case
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view the uploaded logos and covers
DROP POLICY IF EXISTS "Public profiles bucket access" ON storage.objects;
CREATE POLICY "Public profiles bucket access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- Policy: Authenticated users can upload (insert) images
DROP POLICY IF EXISTS "Auth users can upload profiles" ON storage.objects;
CREATE POLICY "Auth users can upload profiles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profiles');

-- Policy: Authenticated users can update their uploaded images
DROP POLICY IF EXISTS "Auth users can update profiles" ON storage.objects;
CREATE POLICY "Auth users can update profiles"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profiles');

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
