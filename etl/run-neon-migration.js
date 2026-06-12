/**
 * Runs the Neon schema migration.
 * Usage: node run-neon-migration.js
 */
import pg from 'pg';
import dnsModule from 'dns';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

dnsModule.setServers(['8.8.8.8', '1.1.1.1']);

async function resolveToIp(hostname) {
  return new Promise((resolve) => {
    dnsModule.resolve4(hostname, (err, addresses) => resolve(err ? null : addresses[0]));
  });
}

async function main() {
  const connStr = process.env.DATABASE_URL;
  if (!connStr) throw new Error('DATABASE_URL not set in .env');

  const url = new URL(connStr);
  const ip = await resolveToIp(url.hostname);
  if (!ip) throw new Error(`Could not resolve ${url.hostname} via Google DNS`);

  console.log(`Resolved ${url.hostname} → ${ip}`);

  const client = new Client({
    host: ip,
    port: parseInt(url.port || '5432', 10),
    database: url.pathname.slice(1),
    user: url.username,
    password: decodeURIComponent(url.password),
    ssl: { rejectUnauthorized: false, servername: url.hostname }
  });

  await client.connect();
  console.log('Connected to Neon.');

  const sqlPath = resolve(__dirname, '../supabase/migrations/000_neon_schema.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  console.log('Running migration...');
  await client.query(sql);
  console.log('Migration complete.');

  // Verify
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  console.log('Tables created:', tables.rows.map(r => r.table_name).join(', '));

  await client.end();
}

main().catch(e => { console.error('Migration failed:', e.message); process.exit(1); });
