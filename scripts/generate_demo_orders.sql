-- ====================================================================
-- DEMO DATA GENERATOR: Create 3 mock orders for the current seller
-- Run this in the Supabase SQL Editor if you want to see data in the dashboard.
-- ====================================================================

DO $$
DECLARE
    v_seller_id UUID := '24acb365-2472-4083-9762-4c0ee007c88d'; -- ID of seller 'sdfq'
    v_product_id UUID := '185dc976-8e51-4872-9ea6-a82b80a5fa01'; -- ID of product 'nbkjd'
    v_user_id UUID := '85834d9d-9e6b-4e8a-a82b-80a5fa011234'; -- Dummy buyer ID
    v_order1_id UUID := gen_random_uuid();
    v_order2_id UUID := gen_random_uuid();
    v_order3_id UUID := gen_random_uuid();
BEGIN
    -- 1. Create a dummy buyer profile if not exists
    INSERT INTO public.profiles (id, full_name, email, role, wilaya)
    VALUES (v_user_id, 'أحمد الجزائري', 'buyer@example.com', 'user', 'الجزائر')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Create 3 Orders in different states
    -- Order 1: Pending
    INSERT INTO public.orders (id, user_id, total_amount, status, created_at)
    VALUES (v_order1_id, v_user_id, 32423, 'pending', NOW() - INTERVAL '2 days');
    
    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (v_order1_id, v_product_id, 1, 32423, 32423);

    -- Order 2: Delivered (Historical)
    INSERT INTO public.orders (id, user_id, total_amount, status, created_at)
    VALUES (v_order2_id, v_user_id, 64846, 'delivered', NOW() - INTERVAL '1 month');
    
    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (v_order2_id, v_product_id, 2, 32423, 64846);

    -- Order 3: Shipped
    INSERT INTO public.orders (id, user_id, total_amount, status, created_at)
    VALUES (v_order3_id, v_user_id, 32423, 'shipped', NOW() - INTERVAL '5 days');
    
    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (v_order3_id, v_product_id, 1, 32423, 32423);

    RAISE NOTICE '3 Demo orders created for seller %', v_seller_id;
END $$;
