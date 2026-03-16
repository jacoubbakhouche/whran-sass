const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkInstitutions() {
    console.log("=== INSPECTING INSTITUTIONS COORDS ===\n");

    try {
        const { data, error } = await supabase
            .from('institutions')
            .select('id, name_ar, name_fr, lat, lng')
            .limit(20);
            
        if (error) {
            console.error("Error fetching data:", error.message);
        } else {
            console.log(`Found ${data.length} institutions:`);
            data.forEach(inst => {
                console.log(`- [${inst.id}] AR: ${inst.name_ar} | FR: ${inst.name_fr}`);
                console.log(`  Lat: ${inst.lat}, Lng: ${inst.lng}`);
            });
        }

    } catch (err) {
        console.error("Inspection failed:", err);
    }
}

checkInstitutions();
