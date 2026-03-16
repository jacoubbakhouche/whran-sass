const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImhhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLocationData() {
    console.log("=== INSPECTING LOCATION DATA ===\n");

    try {
        const { data, error } = await supabase
            .from('institutions')
            .select('id, name_ar, location')
            .limit(10);
            
        if (error) {
            console.error("Error fetching data:", error.message);
        } else {
            data.forEach(inst => {
                console.log(`- [${inst.id}] AR: ${inst.name_ar}`);
                console.log(`  Location:`, inst.location);
                console.log(`  Type of Location:`, typeof inst.location);
            });
        }

    } catch (err) {
        console.error("Inspection failed:", err);
    }
}

checkLocationData();
