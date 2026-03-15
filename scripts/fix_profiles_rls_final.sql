-- ====================================================================
-- FINAL PROFILES RLS REINFORCEMENT
-- This ensures owners have full permissions (including WITH CHECK)
-- and admins use JWT metadata to avoid recursion.
-- ====================================================================

-- 1. Drop existing policies to be sure
DROP POLICY IF EXISTS "profiles_owner_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_select_names" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;

-- 2. Owner Policy (Full Access with Check)
CREATE POLICY "profiles_owner_all"
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Public Visibility (Allow joins and store browsing)
CREATE POLICY "profiles_public_select"
ON public.profiles FOR SELECT
TO public
USING (true);

-- 4. Admin Access (Avoid recursion via JWT checks)
CREATE POLICY "profiles_admin_auth"
ON public.profiles FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
  (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
);

NOTIFY pgrst, 'reload schema';
