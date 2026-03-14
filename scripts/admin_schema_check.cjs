const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseAnonKey = 'sb_publishable_wecrEujeNBWyw8OH2Clfgw_ZIkHoJT2';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    const tables = ['profiles', 'institutions', 'products', 'product_categories', 'orders', 'order_items', 'reviews', 'analytics_views'];
    
    for (const table of tables) {
        console.log(`--- Checking ${table} ---`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error ${table}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`${table} columns:`, Object.keys(data[0]));
        } else {
            console.log(`${table} is empty.`);
        }
    }
}

checkSchema();
