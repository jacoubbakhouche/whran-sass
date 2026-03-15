-- ====================================================================
-- RLS POLICY REPORTER: Run this to see exactly what is active.
-- Copy and paste this into the Supabase SQL Editor.
-- ====================================================================

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename IN ('products', 'profiles', 'order_items', 'orders')
ORDER BY
    tablename, cmd;
