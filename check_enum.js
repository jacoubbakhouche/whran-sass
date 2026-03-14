import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.rpc('get_enum_values', { enum_name: 'institution_type' });
    if (error) {
        // Fallback: try querying a row to see the type or just handle error
        console.error('RPC Error:', error);
        const { data: cols, error: colError } = await supabase.from('institutions').select('*').limit(1);
        console.log('Sample Row:', cols);
        console.log('Row Error:', colError);
    } else {
        console.log('Enum Values:', data);
    }
}
check();
