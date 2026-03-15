const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseAnonKey = 'sb_publishable_wecrEujeNBWyw8OH2Clfgw_ZIkHoJT2';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("--- Diagnostic Check ---");
    
    // 1. Check all products
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, seller_id, status');
    
    if (prodError) {
        console.error("Error fetching products:", prodError.message);
    } else {
        console.log(`Found ${products.length} products total.`);
        products.forEach(p => {
            console.log(`Product: ${p.name} (ID: ${p.id}), SellerID: ${p.seller_id}, Status: ${p.status}`);
        });
    }

    // 2. Check profiles
    if (products && products.length > 0) {
        const uniqueSellers = [...new Set(products.map(p => p.seller_id))];
        console.log(`Unique Sellers in products table: ${uniqueSellers.join(', ')}`);
        
        for (const sid of uniqueSellers) {
            const { data: profile, error: profError } = await supabase
                .from('profiles')
                .select('id, full_name, role')
                .eq('id', sid)
                .single();
            
            if (profError) {
                console.error(`Error fetching profile for seller ${sid}:`, profError.message);
            } else {
                console.log(`Profile for ${sid}: Name='${profile.full_name}', Role='${profile.role}'`);
            }
        }
    }
}

check();
