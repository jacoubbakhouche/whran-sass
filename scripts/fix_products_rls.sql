-- ====================================================================
-- FIX: RLS Policies for Products Table
-- Run this in the Supabase SQL Editor
-- Project: Edu-Expert Platform
-- ====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- STEP 1: Enable RLS on `products` table
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Sellers can manage their own products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;

-- 1. Anyone can view active products
CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
USING (status = 'active');

-- 2. Sellers can manage (INSERT, UPDATE, DELETE) their own products
-- Note: Assuming the column is 'seller_id' based on InventoryManager.jsx
CREATE POLICY "Sellers can manage their own products"
ON public.products FOR ALL
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- 3. Admins can manage all products
CREATE POLICY "Admins can manage all products"
ON public.products FOR ALL
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
);

-- ─────────────────────────────────────────────────────────────────────
-- STEP 2: Storage Policies (Optional but recommended)
-- Ensure 'product-covers' bucket has appropriate policies
-- ─────────────────────────────────────────────────────────────────────
-- Note: Storage policies are usually managed in the Storage tab, 
-- but here is a reference for what's needed:
-- - SELECT: public (can read any file)
-- - INSERT/UPDATE/DELETE: authenticated (where auth.uid() matches folder name)
