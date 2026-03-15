-- ====================================================================
-- FIX: Profiles Table RLS Recursion Reset
-- This script cleans up ALL policies on profiles to fix recursion errors.
-- Run this in the Supabase SQL Editor.
-- ====================================================================

-- 1. DROP ALL EXISTING POLICIES on public.profiles to start fresh
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 2. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. CREATE CLEAN POLICIES

-- Policy: Users can view and update their own profile
CREATE POLICY "profiles_owner_all"
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Admins can view all profiles (Dashboard)
-- Uses JWT metadata to avoid recursive table lookup
CREATE POLICY "profiles_admin_select"
ON public.profiles FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
);

-- Policy: Admins can update all profiles (Approve/Reject)
CREATE POLICY "profiles_admin_update"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
);

-- Policy: Allow public viewing of profile names (needed for store profiles)
CREATE POLICY "profiles_public_select_names"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);
