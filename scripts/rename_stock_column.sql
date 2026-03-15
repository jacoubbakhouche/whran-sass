-- ====================================================================
-- FIX: Rename stock_qty to stock_quantity
-- Run this in the Supabase SQL Editor to match the frontend code.
-- ====================================================================

ALTER TABLE public.products 
RENAME COLUMN stock_qty TO stock_quantity;

-- If the column doesn't exist at all, you might need to add it:
-- ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
