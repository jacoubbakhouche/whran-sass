-- ====================================================================
-- CATEGORIES & METADATA RLS FIX
-- Run this in the Supabase SQL Editor.
-- ====================================================================

-- 1. Product Categories
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_select_categories" ON public.product_categories;
CREATE POLICY "allow_public_select_categories" ON public.product_categories FOR SELECT TO public USING (true);

-- 2. School Levels (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'school_levels') THEN
        ALTER TABLE public.school_levels ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "allow_public_select_levels" ON public.school_levels;
        CREATE POLICY "allow_public_select_levels" ON public.school_levels FOR SELECT TO public USING (true);
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
