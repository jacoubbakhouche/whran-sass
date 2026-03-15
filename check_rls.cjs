const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseAnonKey = 'sb_publishable_wecrEujeNBWyw8OH2Clfgw_ZIkHoJT2';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLS() {
    console.log("--- RLS Policy Check ---");
    
    // We can't directly query pg_policies with anon key.
    // But we can try to SELECT as the user if we had their token.
    // Since we don't have the token, let's try to see if we can "see" the product with anon key.
    
    const { data: anonProds, error: anonError } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active');
    
    if (anonError) {
        console.error("Anon Select Error:", anonError.message);
    } else {
        console.log(`Anon can see ${anonProds.length} active products.`);
    }

    // If anon can see it, then the 'view_active_products' policy is working.
    // The issue might be 'sellers_view_own' policy.
}

checkRLS();
