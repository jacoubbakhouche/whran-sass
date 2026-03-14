const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validatePending() {
    console.log("=== VALIDATING 'pending' STATUS ===\n");

    try {
        const { data: profile } = await supabase.from('profiles').select('id, status').limit(1);
        if (!profile || profile.length === 0) return;
        const id = profile[0].id;
        const oldStatus = profile[0].status;

        console.log(`Attempting to set status to 'pending' for ID: ${id}`);
        const { error } = await supabase.from('profiles').update({ status: 'pending' }).eq('id', id);
        
        if (error) {
            console.error("Update to 'pending' FAILED:", error.message);
        } else {
            console.log("Update to 'pending' SUCCEEDED.");
            // Revert
            await supabase.from('profiles').update({ status: oldStatus }).eq('id', id);
        }

    } catch (err) {
        console.error("Validation failed:", err);
    }
}

validatePending();
