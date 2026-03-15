-- ====================================================================
-- FINAL SYSTEM RESET: Explicit Role Policies
-- This script removes ALL ambiguity and creates clear, role-based access.
-- Run this in the Supabase SQL Editor.
-- ====================================================================

-- 1. CLEAN UP EVERYTHING
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('products', 'profiles', 'orders', 'order_items')) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. PRODUCTS POLICIES
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anonymous: Only see active products
CREATE POLICY "products_anon_select" ON public.products FOR SELECT TO anon 
USING (status = 'active');

-- Authenticated: See active OR own products
CREATE POLICY "products_auth_select" ON public.products FOR SELECT TO authenticated
USING (status = 'active' OR auth.uid() = seller_id);

-- Sellers: Manage own products
CREATE POLICY "products_auth_insert" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "products_auth_update" ON public.products FOR UPDATE TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "products_auth_delete" ON public.products FOR DELETE TO authenticated USING (auth.uid() = seller_id);

-- 3. PROFILES POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can see profile names/labels (needed for joins)
CREATE POLICY "profiles_public_select" ON public.profiles FOR SELECT TO public USING (true);

-- Owners can manage themselves
CREATE POLICY "profiles_owner_all" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id);

-- 4. ORDERS & ITEMS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Vendors see orders containing their products
CREATE POLICY "orders_vendor_select" ON public.orders FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON oi.product_id = p.id
    WHERE oi.order_id = public.orders.id AND p.seller_id = auth.uid()
  )
  OR auth.uid() = user_id
);

CREATE POLICY "order_items_vendor_select" ON public.order_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = public.order_items.product_id AND p.seller_id = auth.uid()
  )
);

-- 5. Force Schema Reload
NOTIFY pgrst, 'reload schema';
