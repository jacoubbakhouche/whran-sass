const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateRoles() {
    console.log("=== VALIDATING 'institution' & 'seller' ROLES ===\n");

    try {
        const { data: profile } = await supabase.from('profiles').select('id, role').limit(1);
        if (!profile || profile.length === 0) return;
        const id = profile[0].id;
        const oldRole = profile[0].role;

        const roles = ['institution', 'seller'];
        for (const role of roles) {
            console.log(`Attempting to set role to '${role}' for ID: ${id}`);
            const { error } = await supabase.from('profiles').update({ role: role }).eq('id', id);
            
            if (error) {
                console.error(`Update to '${role}' FAILED:`, error.message);
            } else {
                console.log(`Update to '${role}' SUCCEEDED.`);
            }
        }
        
        // Revert
        await supabase.from('profiles').update({ role: oldRole }).eq('id', id);

    } catch (err) {
        console.error("Validation failed:", err);
    }
}

validateRoles();
