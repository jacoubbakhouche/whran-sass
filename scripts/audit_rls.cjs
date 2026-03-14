const { createClient } = require('@supabase/supabase-js');

// Using service_role key to bypass RLS for metadata inspection
const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function audit() {
    console.log("=== SUPABASE RLS & SCHEMA AUDIT ===\n");

    try {
        // 1. Check Profiles Schema
        console.log("--- Profiles Table Structure ---");
        const { data: profileCols, error: pColError } = await supabase.rpc('get_table_columns', { table_name: 'profiles' });
        // Many Supabase instances don't have custom RPCs for metadata. 
        // We'll try a fallback: select 1 record and check keys.
        const { data: pSample, error: pSampleError } = await supabase.from('profiles').select('*').limit(1);
        if (pSampleError) console.error("Error fetching profile sample:", pSampleError.message);
        else console.log("Columns:", Object.keys(pSample[0] || {}));

        // 2. Inspect RLS Policies (Requires direct Postgres query via RPC if available, or we check common ones)
        // Since we can't easily run arbitrary SQL unless there's an RPC, let's look for any SQL migration files again.
        // Wait, I already checked for .sql files and found none.
        
        // 3. Check for specific columns requested (is_verified)
        const { data: verifyCol, error: vError } = await supabase.from('profiles').select('is_verified').limit(1);
        console.log("\n--- is_verified Column Check ---");
        if (vError) console.log("is_verified column MISSING in profiles.");
        else console.log("is_verified column EXISTS in profiles.");

        // 4. Check handle_new_user() trigger - This usually needs Postgres metadata access.
        // We might be able to infer it if we check a newly created user (or a sample).

        // 5. Test Seller status restriction
        console.log("\n--- Seller Status Restriction Check ---");
        const { data: sellers, error: sError } = await supabase.from('profiles').select('id, role, status').eq('role', 'seller').limit(5);
        if (sError) console.error("Error fetching sellers:", sError.message);
        else console.log("Sellers Sample:", sellers);

    } catch (err) {
        console.error("Audit script failed:", err);
    }
}

audit();
