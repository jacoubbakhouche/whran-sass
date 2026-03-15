const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseAnonKey = 'sb_publishable_wecrEujeNBWyw8OH2Clfgw_ZIkHoJT2';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDetailedSchema() {
    console.log("--- Detailed Table Schema Audit ---");
    
    // We can't query information_schema directly through PostgREST.
    // We'll infer types by trying to insert a bad type or just looking at JSON output.
    
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error("Fetch Error:", error.message);
    } else if (data && data.length > 0) {
        console.log("Sample product record keys and values types:");
        Object.entries(data[0]).forEach(([key, value]) => {
            console.log(`- ${key}: ${typeof value} (Value: ${value})`);
        });
    }

    console.log("\nChecking product_categories visibility...");
    const { count: catCount, error: catErr } = await supabase
        .from('product_categories')
        .select('*', { count: 'exact', head: true });
    
    if (catErr) {
        console.error("Categories RLS Error:", catErr.message);
    } else {
        console.log(`Total visible categories: ${catCount}`);
    }
}

checkDetailedSchema();
