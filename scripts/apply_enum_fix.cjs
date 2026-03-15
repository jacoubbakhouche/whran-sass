const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const PROJECT_REF = 'hswctqluqtrlmxymepce';
const DB_PASSWORD = 'Yanis6256!'; // Extracted from existing scripts
const connectionString = `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASSWORD)}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`;

async function applyEnumMigration() {
    const sqlPath = path.join(process.cwd(), 'scripts', 'add_middle_to_enum.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database.');
        await client.query(sql);
        console.log('Migration applied successfully.');
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyEnumMigration();
