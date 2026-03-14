const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProductsSchema() {
    console.log("=== CHECKING PRODUCTS SCHEMA ===\n");

    try {
        const { data, error } = await supabase.from('products').select('*').limit(1);
        if (error) {
            console.error("Error fetching products:", error.message);
            return;
        }
        
        if (data && data.length > 0) {
            console.log("Existing columns:", Object.keys(data[0]));
        } else {
            console.log("No products found, trying to infer from an insert attempt...");
            const { error: insError } = await supabase.from('products').insert({ id: '00000000-0000-0000-0000-000000000000' });
            console.log("Insert attempt error (reveals schema issues):", insError.message);
        }

    } catch (err) {
        console.error("Schema check failed:", err);
    }
}

checkProductsSchema();
