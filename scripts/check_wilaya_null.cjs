const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWilayaNotNull() {
    console.log("=== CHECKING wilaya/commune NULLABILITY ===\n");

    try {
        const { data: profile } = await supabase.from('profiles').select('id, wilaya, commune').limit(1);
        if (!profile || profile.length === 0) return;
        const id = profile[0].id;

        const cols = ['wilaya', 'commune'];
        for (const col of cols) {
            const { error } = await supabase.from('profiles').update({ [col]: null }).eq('id', id);
            if (error && error.message.includes('null value in column')) {
                console.log(`Column '${col}' is NOT NULL.`);
            } else {
                console.log(`Column '${col}' allows NULL.`);
            }
        }

    } catch (err) {
        console.error("Check failed:", err);
    }
}

checkWilayaNotNull();
