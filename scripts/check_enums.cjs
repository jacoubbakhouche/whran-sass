const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEnums() {
    console.log("=== CHECKING EXISTING ROLE & STATUS VALUES ===\n");

    try {
        const { data: roles } = await supabase.from('profiles').select('role').limit(100);
        const uniqueRoles = [...new Set(roles.map(r => r.role))];
        console.log("Existing Roles:", uniqueRoles);

        const { data: statuses } = await supabase.from('profiles').select('status').limit(100);
        const uniqueStatuses = [...new Set(statuses.map(s => s.status))];
        console.log("Existing Statuses:", uniqueStatuses);

    } catch (err) {
        console.error("Check failed:", err);
    }
}

checkEnums();
