const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseAnonKey = 'sb_publishable_wecrEujeNBWyw8OH2Clfgw_ZIkHoJT2';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCategories() {
    console.log("--- Categories Check ---");
    
    const { data, error } = await supabase
        .from('product_categories')
        .select('*');
    
    if (error) {
        console.error("Categories Select Error:", error.message);
    } else {
        console.log(`Anon can see ${data.length} categories:`);
        data.forEach(c => console.log(`- ${c.name_ar} (ID: ${c.id})`));
    }
}

checkCategories();
