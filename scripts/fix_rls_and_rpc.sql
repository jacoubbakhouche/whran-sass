-- ====================================================================
-- FIX BUGS #1 & #5: Admin RLS Policies + Missing RPC Function
-- Run this entire script in the Supabase SQL Editor
-- Project: Edu-Expert Platform
-- ====================================================================


-- ─────────────────────────────────────────────────────────────────────
-- STEP 1: Fix RLS on `profiles` table
-- ─────────────────────────────────────────────────────────────────────

-- Drop old recursive or overly-restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Policy 1: Each user can SELECT their own profile
CREATE POLICY "Users can view own profile."
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Admins can SELECT ALL profiles (needed for dashboard)
-- Uses auth.jwt() to read the role from the JWT without a recursive profiles lookup
CREATE POLICY "Admins can view all profiles."
ON public.profiles FOR SELECT
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
);

-- Policy 3: Users can UPDATE their own profile (for has_filled_form, status changes)
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy 4: Admins can UPDATE all profiles (for approve/reject actions)
CREATE POLICY "Admins can update all profiles."
ON public.profiles FOR UPDATE
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
);


-- ─────────────────────────────────────────────────────────────────────
-- STEP 2: Fix RLS on `institutions` table
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Owners can view their institution." ON public.institutions;
DROP POLICY IF EXISTS "Admins can view all institutions." ON public.institutions;
DROP POLICY IF EXISTS "Admins can update all institutions." ON public.institutions;
DROP POLICY IF EXISTS "Owners can update their institution." ON public.institutions;
DROP POLICY IF EXISTS "Owners can insert their institution." ON public.institutions;

-- Owners can INSERT their own institution record
CREATE POLICY "Owners can insert their institution."
ON public.institutions FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Owners can SELECT their own institution
CREATE POLICY "Owners can view their institution."
ON public.institutions FOR SELECT
USING (auth.uid() = owner_id);

-- Admins can SELECT all institutions (for dashboard)
CREATE POLICY "Admins can view all institutions."
ON public.institutions FOR SELECT
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
);

-- Owners can UPDATE their own institution record
CREATE POLICY "Owners can update their institution."
ON public.institutions FOR UPDATE
USING (auth.uid() = owner_id);

-- Admins can UPDATE all institution records (approve/reject)
CREATE POLICY "Admins can update all institutions."
ON public.institutions FOR UPDATE
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
);


-- ─────────────────────────────────────────────────────────────────────
-- STEP 3: Create the missing RPC function get_admin_registration_list
-- This is the PRIMARY fix for Bug #1 — admin sees 0 results
-- SECURITY DEFINER: runs as the DB owner, completely bypasses RLS
-- ─────────────────────────────────────────────────────────────────────

-- Drop the old version first (required when return type changes)
DROP FUNCTION IF EXISTS public.get_admin_registration_list();

CREATE OR REPLACE FUNCTION public.get_admin_registration_list()
RETURNS TABLE (
  profile_id        UUID,
  full_name         TEXT,
  email             TEXT,
  profile_role      TEXT,
  profile_status    TEXT,
  has_filled_form   BOOLEAN,
  institution_id    UUID,
  name_ar           TEXT,
  name_fr           TEXT,
  type              TEXT,
  institution_status TEXT,
  created_at        TIMESTAMPTZ,
  is_profile_only   BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER  -- ← KEY: bypasses RLS entirely, runs as postgres superuser
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id                                    AS profile_id,
    p.full_name                             AS full_name,
    p.email                                 AS email,
    p.role::TEXT                            AS profile_role,
    p.status::TEXT                          AS profile_status,
    p.has_filled_form                       AS has_filled_form,
    i.id                                    AS institution_id,
    i.name_ar                               AS name_ar,
    i.name_fr                               AS name_fr,
    i.type                                  AS type,
    i.status::TEXT                          AS institution_status,
    COALESCE(i.created_at, p.created_at)    AS created_at,
    (i.id IS NULL)                          AS is_profile_only
  FROM public.profiles p
  LEFT JOIN public.institutions i ON i.owner_id = p.id
  WHERE p.role IN ('institution', 'seller')
  ORDER BY COALESCE(i.created_at, p.created_at) DESC;
END;
$$;

-- Grant execute permission to authenticated users
-- (ProtectedRoute already ensures only admins can reach this page)
GRANT EXECUTE ON FUNCTION public.get_admin_registration_list() TO authenticated;


-- ─────────────────────────────────────────────────────────────────────
-- STEP 4: Verify the fix — run this SELECT to confirm you see data
-- ─────────────────────────────────────────────────────────────────────

-- SELECT * FROM public.get_admin_registration_list();
-- Expected: All institution + seller profiles, with or without institution records

-- ====================================================================
-- END OF MIGRATION SCRIPT
-- ====================================================================
