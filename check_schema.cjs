const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseAnonKey = 'sb_publishable_wecrEujeNBWyw8OH2Clfgw_ZIkHoJT2';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    console.log("--- Orders Table Schema Check ---");
    
    // Attempting to select one row to see keys
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error("Error fetching order:", error.message);
    } else if (data && data.length > 0) {
        console.log("Columns found in 'orders':", Object.keys(data[0]));
    } else {
        console.log("No orders found to inspect columns. Trying another way...");
        // Fallback: try to select suspected columns
        const { error: error2 } = await supabase.from('orders').select('user_id').limit(1);
        console.log("Does 'user_id' exist?", !error2);
        const { error: error3 } = await supabase.from('orders').select('buyer_id').limit(1);
        console.log("Does 'buyer_id' exist?", !error3);
    }
}

checkSchema();
