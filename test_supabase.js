import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseAnonKey = 'sb_publishable_wecrEujeNBWyw8OH2Clfgw_ZIkHoJT2';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
    console.log('Testing Supabase connection...');
    try {
        const { data, error } = await supabase
            .from('wilayas')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error('Supabase Error:', JSON.stringify(error, null, 2));
        } else {
            console.log('Supabase Success! Data:', JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

testSupabase();
