const { createClient } = require('@supabase/supabase-js');

// Using the keys found in src/lib/supabase.js
const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseAnonKey = 'sb_publishable_wecrEujeNBWyw8OH2Clfgw_ZIkHoJT2';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
    try {
        console.log("--- Checking 'products' table structure ---");
        // We try to insert a dummy record with 0 results just to see the error if columns are missing
        const { data, error } = await supabase.from('products').select('*').limit(1);
        
        if (error) {
            console.error("Error products:", error.message);
        } else if (data && data.length > 0) {
            console.log("Product columns:", Object.keys(data[0]));
        } else {
            console.log("Products table is empty. Dynamic check not possible via select. Attempting metadata query...");
            // fallback: check if we can get a minimal object
            const { data: cols, error: colError } = await supabase.from('products').select('author').limit(1);
            if (colError) console.log("Column 'author' does NOT exist.");
            else console.log("Column 'author' EXISTS.");
        }

        console.log("\n--- Checking 'profiles' table roles ---");
        const { data: profiles, error: profError } = await supabase.from('profiles').select('id, full_name, role').limit(5);
        if (profError) {
            console.error("Error profiles:", profError.message);
        } else {
            console.log("Profiles Sample:", profiles);
        }

    } catch (err) {
        console.error("Script crash:", err);
    }
}

checkTables();
