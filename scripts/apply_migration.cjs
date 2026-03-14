// apply_migration.cjs
// Uses the Supabase Management API to execute raw DDL SQL statements.
// The Management API /v1/projects/{ref}/database/query endpoint supports full SQL including DDL.
// Run: node scripts/apply_migration.cjs

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_REF = 'hswctqluqtrlmxymepce';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzd2N0cWx1cXRybG14eW1lcGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM5NDY0OSwiZXhwIjoyMDg4OTcwNjQ5fQ.vBVSOKjWqJsm6XJBVCsLTn0YEQ94R0CvGtyUW5oS8c4';

// Use the pg-direct approach via Supabase's transaction endpoint
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

async function executeSqlViaFetch(sql) {
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
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    if (!response.ok) return { ok: false, error: typeof parsed === 'string' ? parsed : JSON.stringify(parsed) };
    return { ok: true, data: parsed };
}

// Alternative: Use the Supabase DB webhook / transaction endpoint
async function executeSqlViaTransaction(sql) {
    const url = `${SUPABASE_URL}/rest/v1/`;
    const body = JSON.stringify([{ method: 'POST', path: '/rpc/exec_ddl', body: { ddl: sql }, headers: {} }]);
    // Actually use the pg-connection string fetched from management API
    // Fallback: check if pg module available
    try {
        const { Client } = require('pg');
        return { ok: true, client: new Client(), sql };
    } catch (e) {
        return { ok: false, error: 'pg module not available' };
    }
}

async function applyViaPg(fullSql) {
    try {
        const { Client } = require('pg');
        // Supabase connection string format
        const connectionString = `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent('Yanis6256!')}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`;
        
        const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
        await client.connect();
        console.log('✅ Connected to Supabase Postgres directly.\n');
        
        // Execute the entire script at once
        await client.query(fullSql);
        await client.end();
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

async function applyMigration() {
    console.log('🚀 Applying SQL migration to Supabase...\n');

    const sqlFile = path.join(__dirname, 'fix_rls_and_rpc.sql');
    const fullSql = fs.readFileSync(sqlFile, 'utf8');

    // Remove comment-only lines to clean up
    const cleanedSql = fullSql
        .split('\n')
        .filter(line => !line.trim().startsWith('--') || line.trim() === '')
        .join('\n');

    console.log('📄 Attempting direct Postgres connection via pg module...\n');
    const pgResult = await applyViaPg(cleanedSql);

    if (pgResult.ok) {
        console.log('✅ Migration applied successfully!\n');
        console.log('🔍 Verifying the RPC function...\n');
        
        // Test the new RPC
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        const { data, error } = await supabase.rpc('get_admin_registration_list');
        
        if (error) {
            console.error('❌ RPC Verification Failed:', error.message);
        } else {
            console.log(`✅ RPC Verification Passed! Returned ${data?.length ?? 0} row(s).`);
            if (data && data.length > 0) {
                console.log('\n📋 Sample data (first 2 rows):');
                data.slice(0, 2).forEach((row, i) => {
                    console.log(`\n  Row ${i + 1}:`);
                    console.log(`    profile_id: ${row.profile_id}`);
                    console.log(`    full_name: ${row.full_name}`);
                    console.log(`    profile_role: ${row.profile_role}`);
                    console.log(`    profile_status: ${row.profile_status}`);
                    console.log(`    institution_id: ${row.institution_id || 'NULL (profile only)'}`);
                    console.log(`    is_profile_only: ${row.is_profile_only}`);
                });
            } else {
                console.log('   → 0 rows. Expected if no institution/seller users exist in the DB yet.');
            }
        }
    } else {
        console.error('❌ pg connection failed:', pgResult.error);
        console.log('\n──────────────────────────────────────────────────');
        console.log('📋 MANUAL FALLBACK INSTRUCTIONS:');
        console.log('   Since auto-apply failed, please manually copy and run the SQL below');
        console.log('   in your Supabase Dashboard → SQL Editor:\n');
        console.log('   File path: scripts/fix_rls_and_rpc.sql');
        console.log('──────────────────────────────────────────────────');
    }
}

applyMigration().catch(console.error);
