-- ====================================================================
-- FIX: RLS Policies for Announcements and Institution Services
-- Run this in the Supabase SQL Editor
-- Project: Edu-Expert Platform
-- ====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- STEP 1: Fix RLS on `institution_services` table
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.institution_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view services" ON public.institution_services;
DROP POLICY IF EXISTS "Owners can manage their services" ON public.institution_services;
DROP POLICY IF EXISTS "Admins can manage all services" ON public.institution_services;

-- 1. Anyone can view services (needed for public profile)
CREATE POLICY "Anyone can view services"
ON public.institution_services FOR SELECT
USING (true);

-- 2. Owners can manage their own services
CREATE POLICY "Owners can manage their services"
ON public.institution_services FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.institutions i
    WHERE i.id = public.institution_services.institution_id
    AND i.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.institutions i
    WHERE i.id = public.institution_services.institution_id
    AND i.owner_id = auth.uid()
  )
);

-- 3. Admins can manage all services
CREATE POLICY "Admins can manage all services"
ON public.institution_services FOR ALL
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
);


-- ─────────────────────────────────────────────────────────────────────
-- STEP 2: Fix RLS on `announcements` table
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Owners can manage their announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage all announcements" ON public.announcements;

-- 1. Anyone can view announcements
CREATE POLICY "Anyone can view announcements"
ON public.announcements FOR SELECT
USING (true);

-- 2. Owners can manage their own announcements
CREATE POLICY "Owners can manage their announcements"
ON public.announcements FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.institutions i
    WHERE i.id = public.announcements.institution_id
    AND i.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.institutions i
    WHERE i.id = public.announcements.institution_id
    AND i.owner_id = auth.uid()
  )
);

-- 3. Admins can manage all announcements
CREATE POLICY "Admins can manage all announcements"
ON public.announcements FOR ALL
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
);

-- Note: Admins also inherit visibility if we want to add specific admin policies later, 
-- but this is the primary fix for the institution owner's "blindness".
