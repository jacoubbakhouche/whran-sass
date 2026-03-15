const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://hswctqluqtrlmxymepce.supabase.co',
    'sb_publishable_wecrEujeNBWyw8OH2Clfgw_ZIkHoJT2'
);

async function checkProfiles() {
    console.log('--- Profil Diagnostic ---');
    
    // 1. Check columns
    const { data: cols, error: colErr } = await supabase.rpc('get_table_columns', { table_name: 'profiles' });
    // Note: get_table_columns might not exist, using another way
    
    // Testing column existence by attempting a small select
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, store_name, bio')
        .limit(1);
    
    if (error) {
        console.error('Column Check Error:', error.message);
        if (error.message.includes('column "store_name" does not exist')) {
            console.error('CRITICAL: store_name column is MISSING!');
        }
    } else {
        console.log('Column Check Successful: store_name and bio are visible.');
        console.log('Sample Data Key Names:', Object.keys(data[0] || {}));
    }

    // 2. Check RLS status via select
    const { data: selectData, error: selectErr } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
    
    if (selectErr) {
        console.error('Select RLS Error:', selectErr.message);
    } else {
        console.log('Select RLS seems OK.');
    }
}

checkProfiles();
