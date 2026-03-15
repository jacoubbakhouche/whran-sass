const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'hswctqluqtrlmxymepce';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

async function executeSqlViaRpc(sql) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql_admin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ sql_text: sql })
    });
    
    const text = await response.text();
    if (!response.ok) {
        throw new Error(`RPC failed: ${text}`);
    }
    return text;
}

async function run() {
    try {
        const sqlPath = path.join(process.cwd(), 'scripts', 'add_middle_to_enum.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Applying migration via RPC...');
        await executeSqlViaRpc(sql);
        console.log('Migration applied successfully!');
    } catch (err) {
        console.error('Failed to apply migration:', err.message);
        process.exit(1);
    }
}

run();
