const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMissingCols() {
    console.log("=== CHECKING FOR REDUNDANT OR MISSING COLS ===\n");

    try {
        const testCols = ['owner_id', 'user_id', 'is_active'];
        for (const col of testCols) {
            const { error } = await supabase.from('profiles').select(col).limit(1);
            if (error) {
                console.log(`Column '${col}' does NOT exist.`);
            } else {
                console.log(`Column '${col}' EXISTS.`);
            }
        }
    } catch (err) {
        console.error("Check failed:", err);
    }
}

checkMissingCols();
