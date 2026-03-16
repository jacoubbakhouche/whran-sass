const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
    console.log("=== INSPECTING INSTITUTIONS SCHEMA ===\n");

    try {
        const { data, error } = await supabase
            .from('institutions')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error("Error fetching data:", error.message);
        } else if (data && data.length > 0) {
            console.log("Columns found in 'institutions':", Object.keys(data[0]));
        } else {
            console.log("No data found in 'institutions' to inspect.");
        }

    } catch (err) {
        console.error("Inspection failed:", err);
    }
}

checkSchema();
