const { Client } = require('pg');

const PROJECT_REF = 'hswctqluqtrlmxymepce';
const DB_PASSWORD = 'Yanis6256!';

const connectionStrings = [
    `postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`
];

async function testConnections() {
    for (const conn of connectionStrings) {
        console.log(`Testing: ${conn.replace(DB_PASSWORD, '****')}`);
        const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
        try {
            await client.connect();
            console.log('✅ Connection successful!');
            await client.end();
            process.exit(0);
        } catch (err) {
            console.error(`❌ Connection failed: ${err.message}`);
        }
    }
    process.exit(1);
}

testConnections();
