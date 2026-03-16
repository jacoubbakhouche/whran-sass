const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
// Using Anon Key which should have read access to public institutions
const supabaseAnonKey = 'sb_publishable_wecrEujeNBWyw8OH2Clfgw_ZIkHoJT2'; 
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
            console.log(`Found ${data.length} records.`);
            data.forEach(inst => {
                console.log(`- [${inst.id}] AR: ${inst.name_ar}`);
                console.log(`  Location:`, inst.location);
                console.log(`  Type:`, typeof inst.location);
            });
        }

    } catch (err) {
        console.error("Inspection failed:", err);
    }
}

checkLocationData();
