const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraints() {
    console.log("=== CHECKING PROFILES CONSTRAINTS & TRIGGERS ===\n");

    try {
        // Querying information_schema to see NOT NULL and Default values
        const { data: constraints, error: cError } = await supabase.rpc('get_table_info', { t_name: 'profiles' });
        // Fallback if rpc missing: We'll try to insert a null-laden object to see the error message
        
        const { data, error } = await supabase.from('profiles').insert({ id: '00000000-0000-0000-0000-000000000000' }).select();
        if (error) {
            console.log("Constraint Test Result (expected error):", error.message);
        } else {
            console.log("Constraint Test: Insertion with minimal data succeeded.");
            // Clean up
            await supabase.from('profiles').delete().eq('id', '00000000-0000-0000-0000-000000000000');
        }

        // Try to fetch all triggers on auth.users (if possible via RPC)
        console.log("\n--- Checking for existing accounts ---");
        const { count, error: countError } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        console.log("Total profiles:", count);

    } catch (err) {
        console.error("Check failed:", err);
    }
}

checkConstraints();
