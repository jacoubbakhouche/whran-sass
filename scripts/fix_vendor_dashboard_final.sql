-- ====================================================================
-- FINAL VENDOR DASHBOARD FIX: Robust RLS & Schema Correction
-- This script fixes the "column buyer_id does not exist" error.
-- Run this in the Supabase SQL Editor.
-- ====================================================================

-- 1. Reset Products Policies
DROP POLICY IF EXISTS "sellers_view_all_own" ON public.products;
DROP POLICY IF EXISTS "view_active_products" ON public.products;
DROP POLICY IF EXISTS "sellers_insert_own" ON public.products;
DROP POLICY IF EXISTS "sellers_update_own" ON public.products;
DROP POLICY IF EXISTS "sellers_delete_own" ON public.products;

CREATE POLICY "view_active_products" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "sellers_view_all_own" ON public.products FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "sellers_insert_own" ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "sellers_update_own" ON public.products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "sellers_delete_own" ON public.products FOR DELETE USING (auth.uid() = seller_id);

-- 2. Orders RLS (Handling user_id vs buyer_id dynamically)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vendors_view_orders" ON public.orders;

DO $$
BEGIN
    -- Check if it's user_id or buyer_id and create policy accordingly
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_id') THEN
        CREATE POLICY "vendors_view_orders" ON public.orders FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.order_items oi
            JOIN public.products p ON oi.product_id = p.id
            WHERE oi.order_id = public.orders.id AND p.seller_id = auth.uid()
          )
          OR auth.uid() = user_id
        );
    ELSE
        CREATE POLICY "vendors_view_orders" ON public.orders FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.order_items oi
            JOIN public.products p ON oi.product_id = p.id
            WHERE oi.order_id = public.orders.id AND p.seller_id = auth.uid()
          )
          OR auth.uid() = buyer_id
        );
    END IF;
END $$;

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
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
        CREATE POLICY "users_view_own_notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Force Schema Reload
NOTIFY pgrst, 'reload schema';
