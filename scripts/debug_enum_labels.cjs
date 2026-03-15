const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectData() {
    console.log("=== INSPECTING INSTITUTIONS DATA ===\n");

    try {
        const { data, error } = await supabase.from('institutions').select('type').limit(10);
        if (error) {
            console.error("Error fetching data:", error.message);
        } else {
            const types = [...new Set(data.map(d => d.type))];
            console.log("Existing types in data:", types);
        }

    } catch (err) {
        console.error("Inspection failed:", err);
    }
}

inspectData();
