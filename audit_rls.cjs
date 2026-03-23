const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseAnonKey = 'sb_publishable_wecrEujeNBWyw8OH2Clfgw_ZIkHoJT2';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function auditPolicies() {
    console.log("--- RLS Policy Audit ---");
    
    // We can't query pg_policies directly through PostgREST easily without an RPC.
    // Let's try to detect if RLS is effectively blocking us by comparing count vs select.
    
    console.log("\n1. Testing 'products' table...");
    const { count, error: countErr } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
    
    if (countErr) {
        console.error("Count Error:", countErr.message);
    } else {
        console.log(`Total visible products (Select Count): ${count}`);
    }

    //adi karhatni bah thalt l erorr
    ?
}

auditPolicies();
