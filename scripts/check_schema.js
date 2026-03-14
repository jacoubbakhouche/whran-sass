import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    try {
        console.log("Checking products table...");
        const { data: prodData, error: prodError } = await supabase.from('products').select('*').limit(1);
        if (prodError) console.error("Error fetching products:", prodError);
        else console.log("Products columns:", Object.keys(prodData[0] || {}));

        console.log("\nChecking profiles table...");
        const { data: profData, error: profError } = await supabase.from('profiles').select('*').limit(1);
        if (profError) console.error("Error fetching profiles:", profError);
        else console.log("Profiles columns:", Object.keys(profData[0] || {}));
        
        // Check a few roles
        const { data: rolesData } = await supabase.from('profiles').select('role').limit(5);
        console.log("\nSample roles in profiles:", rolesData);

    } catch (e) {
        console.error("Execution failed:", e);
    }
}
checkSchema();
