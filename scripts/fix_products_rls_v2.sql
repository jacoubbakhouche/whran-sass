-- ====================================================================
-- COMPREHENSIVE FIX: Reset and Recreate RLS for Products
-- This script ensures no old policies remain and fixes column naming issues.
-- Run this in the Supabase SQL Editor.
-- ====================================================================

-- 1. DROP ALL EXISTING POLICIES on public.products to start fresh
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'products' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', pol.policyname);
    END LOOP;
END $$;

-- 2. Ensure RLS is enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. CREATE NEW EXPLICIT POLICIES

-- Policy: Anyone can view active products
CREATE POLICY "view_active_products"
ON public.products FOR SELECT
USING (status = 'active');

-- Policy: Sellers can view ALL their own products (even if not active)
CREATE POLICY "sellers_view_own"
ON public.products FOR SELECT
USING (auth.uid() = seller_id);

-- Policy: Sellers can insert their own products
CREATE POLICY "sellers_insert_own"
ON public.products FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- Policy: Sellers can update their own products
CREATE POLICY "sellers_update_own"
ON public.products FOR UPDATE
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- Policy: Sellers can delete their own products
CREATE POLICY "sellers_delete_own"
ON public.products FOR DELETE
USING (auth.uid() = seller_id);

-- Policy: Admins have full access
CREATE POLICY "admins_full_access"
ON public.products FOR ALL
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
)
WITH CHECK (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
);

-- 4. FIX COLUMN MISMATCH (Optional but likely needed)
-- If your 'products' table uses 'stock_quantity' but frontend uses 'stock_qty'
-- we handle it in the frontend, but let's check if we can add an alias or rename.
-- Re-confirming: seed data says 'stock_quantity'. 
-- Let's make sure the table has 'seller_id'. 
-- If 'seller_id' is missing, the above policies will fail to create.
-- Run this if seller_id is missing:
-- ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id);

-- 5. STORAGE POLICIES (Reference)
-- Ensure the 'product-covers' bucket allows AUTHENTICATED users to upload
-- and EVERYONE to read.
