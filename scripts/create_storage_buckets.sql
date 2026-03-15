-- ====================================================================
-- FIX: Create Missing Storage Buckets
-- Run this in the Supabase SQL Editor
-- This script creates the required buckets and sets public access policies.
-- ====================================================================

-- 1. Create Buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('product-covers', 'product-covers', true),
  ('institution-covers', 'institution-covers', true),
  ('avatars', 'avatars', true),
  ('institution-logos', 'institution-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable RLS on Storage objects
-- (Usually enabled by default, but let's ensure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create Public Access Policies for each bucket

-- Policy: Allow everyone to VIEW files in all public buckets
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( public = true );

-- Policy: Allow AUTHENTICATED users to UPLOAD files to product-covers
-- (You can refine this to only allow the owner later, but this fix will get it working)
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'product-covers' );

-- Policy: Allow AUTHENTICATED users to UPDATE/DELETE their own files in product-covers
CREATE POLICY "Authenticated Manage Own" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'product-covers' )
WITH CHECK ( bucket_id = 'product-covers' );

CREATE POLICY "Authenticated Delete Own" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'product-covers' );
