const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWilayas() {
    console.log("=== CHECKING INSTITUTIONS SCHEMA ===\n");

    try {
        const { data, error } = await supabase.from('institutions').select('*').limit(1);
        if (error) {
            console.error("Error:", error.message);
        } else {
            console.log("Sample Institution Row:", data[0]);
        }

        // Try to get enum values via a query that might fail with the list
        const { data: enumVals, error: enumErr } = await supabase.rpc('inspect_enum', { enum_name: 'wilaya_code' });
        if (enumErr) {
            console.log("Enum inspection error (expected if RPC missing):", enumErr.message);
        } else {
            console.log("Wilaya Codes:", enumVals);
        }

    } catch (err) {
        console.error("Check failed:", err);
    }
}

checkWilayas();
