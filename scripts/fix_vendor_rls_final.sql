-- ====================================================================
-- FINAL VENDOR RLS FIX (CORRECTED): Robust access for All Tables
-- Fixes "buyer_id" column name error.
-- Run this in the Supabase SQL Editor.
-- ====================================================================

-- 1. Reset Products Policies (Redundant but safe)
DROP POLICY IF EXISTS "sellers_view_all_own" ON public.products;
DROP POLICY IF EXISTS "sellers_view_own" ON public.products;
DROP POLICY IF EXISTS "view_active_products" ON public.products;
DROP POLICY IF EXISTS "sellers_insert_own" ON public.products;
DROP POLICY IF EXISTS "sellers_update_own" ON public.products;
DROP POLICY IF EXISTS "sellers_delete_own" ON public.products;

CREATE POLICY "view_active_products" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "sellers_view_all_own" ON public.products FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "sellers_insert_own" ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "sellers_update_own" ON public.products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "sellers_delete_own" ON public.products FOR DELETE USING (auth.uid() = seller_id);

-- 2. Orders RLS (CORRECTED: user_id instead of buyer_id)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vendors_view_orders" ON public.orders;
CREATE POLICY "vendors_view_orders" ON public.orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON oi.product_id = p.id
    WHERE oi.order_id = public.orders.id AND p.seller_id = auth.uid()
  )
  OR auth.uid() = user_id -- CORRECTED!
);

-- 3. Order Items RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vendors_view_order_items" ON public.order_items;
CREATE POLICY "vendors_view_order_items" ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = public.order_items.product_id AND p.seller_id = auth.uid()
  )
);

-- 4. Notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_view_own_notifications" ON public.notifications;
CREATE POLICY "users_view_own_notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
