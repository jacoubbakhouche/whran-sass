const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
// Using SERVICE ROLE KEY to bypass RLS for schema discovery
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function checkSchema() {
    const tables = ['profiles', 'institutions', 'products', 'product_categories', 'orders', 'order_items', 'reviews', 'analytics_views'];
    
    for (const table of tables) {
        console.log(`--- Checking ${table} ---`);
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                console.error(`Error ${table}:`, error.message);
            } else if (data && data.length > 0) {
                console.log(`${table} columns:`, Object.keys(data[0]));
            } else {
                console.log(`${table} is empty.`);
            }
        } catch (e) {
            console.error(`Crash on ${table}:`, e.message);
        }
    }
}

checkSchema();
