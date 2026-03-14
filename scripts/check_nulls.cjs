const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNotNulls() {
    console.log("=== CHECKING NOT NULL COLUMNS ===\n");

    try {
        // We can't query information_schema directly via PostgREST easily.
        // But we can try to insert a record with only ID and see what fails.
        // We'll use a valid UUID but not in auth.users to see if we get a specific error before the FK check.
        // Actually, let's use an existing ID and try to UPDATE it with NULLs.
        
        const { data: profile } = await supabase.from('profiles').select('*').limit(1);
        if (!profile || profile.length === 0) return;
        const id = profile[0].id;

        const columns = ['full_name', 'role', 'status', 'is_verified'];
        for (const col of columns) {
            const { error } = await supabase.from('profiles').update({ [col]: null }).eq('id', id);
            if (error && error.message.includes('null value in column')) {
                console.log(`Column '${col}' is NOT NULL.`);
            } else {
                console.log(`Column '${col}' allows NULL.`);
                // Reset value if we changed it (though we didn't if no error)
            }
        }
        
    } catch (err) {
        console.error("Check failed:", err);
    }
}

checkNotNulls();
