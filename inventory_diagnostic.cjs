const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseAnonKey = 'sb_publishable_wecrEujeNBWyw8OH2Clfgw_ZIkHoJT2';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnostic() {
    console.log("--- Comprehensive Inventory Diagnostic ---");
    
    // 1. Check all products (using anon key, so only 'active' or allowed by RLS will show)
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*, product_categories(*)');
    
    if (prodError) {
        console.error("Error fetching products:", prodError.message);
    } else {
        console.log(`Found ${products.length} products visible to ANON.`);
        products.forEach(p => {
            console.log(`- Product: "${p.name}" | ID: ${p.id} | SellerID: ${p.seller_id} | CatID: ${p.category_id} | Status: ${p.status} | CatData: ${p.product_categories ? 'Yes' : 'No'}`);
        });
    }

    // 2. Check if the specific seller ID exists in profiles
    const targetSellerId = '24acb365-2472-4083-9762-4c0ee007c88d'; // From user screenshot
    const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', targetSellerId)
        .single();
    
    if (profError) {
        console.error(`Error fetching profile ${targetSellerId}:`, profError.message);
    } else {
        console.log(`Profile Found: Name: ${profile.full_name}, Role: ${profile.role}`);
    }
}

diagnostic();
