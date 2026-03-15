const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function checkAnnouncementsSchema() {
    console.log("--- Checking announcements schema ---");
    try {
        // Try to fetch data to get columns
        const { data, error } = await supabase.from('announcements').select('*').limit(1);
        if (error) {
            console.error("Error announcements:", error.message);
        } else if (data && data.length > 0) {
            console.log("announcements columns:", Object.keys(data[0]));
        } else {
            console.log("announcements is empty. Trying to describe schema via RPC or other means.");
            // If empty, let's try to insert a dummy row or use an RPC if available
            // but for now let's just grep the codebase for the create table statement if possible.
        }
    } catch (e) {
        console.error("Crash on announcements:", e.message);
    }
}

checkAnnouncementsSchema();
