const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function listTables() {
    console.log("--- Listing tables in public schema ---");
    try {
        // PostgREST doesn't directly support listing tables, but we can query information_schema if we have a function or just try common tables
        const tables = ['profiles', 'institutions', 'products', 'announcements', 'announcement', 'posts', 'notifications'];
        for (const t of tables) {
            const { error } = await supabase.from(t).select('count').limit(0);
            if (error) {
                console.log(`Table ${t}: NOT FOUND or Error (${error.message})`);
            } else {
                console.log(`Table ${t}: FOUND`);
            }
        }
    } catch (e) {
        console.error("Crash:", e.message);
    }
}

listTables();
