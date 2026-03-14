
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanup() {
    console.log('Starting Database Cleanup...');
    
    const tables = [
        'announcements',
        'reviews',
        'institution_services',
        'institution_images',
        'institutions'
    ];

    for (const table of tables) {
        console.log(`Cleaning table: ${table}...`);
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        if (error) {
            console.error(`Error cleaning ${table}:`, error.message);
        } else {
            console.log(`Successfully cleaned ${table}.`);
        }
    }

    console.log('Database Cleanup Finished.');
}

cleanup();
