const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseAnonKey = 'sb_publishable_wecrEujeNBWyw8OH2Clfgw_ZIkHoJT2';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    try {
        console.log("--- Products Table ---");
        const { data: prodData, error: prodError } = await supabase.from('products').select('*').limit(1);
        if (prodError) {
            console.error("Error products:", prodError.message);
        } else {
            console.log("Columns:", Object.keys(prodData[0] || {}));
        }

        console.log("\n--- Profiles Table ---");
        const { data: profData, error: profError } = await supabase.from('profiles').select('*').limit(1);
        if (profError) {
            console.error("Error profiles:", profError.message);
        } else {
            console.log("Columns:", Object.keys(profData[0] || {}));
        }

        const { data: roles } = await supabase.from('profiles').select('role').limit(5);
        console.log("\n--- Sample Roles ---");
        console.log(roles);

    } catch (err) {
        console.error("Script failed:", err);
    }
}

checkSchema();
