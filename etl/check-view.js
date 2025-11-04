/**
 * Check if facts_clean view exists and create it if not
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false },
});

async function checkAndCreateView() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking if facts_clean view exists...');

    // Check if view exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_views
        WHERE schemaname = 'public'
        AND viewname = 'facts_clean'
      );
    `);

    const viewExists = checkResult.rows[0].exists;

    if (viewExists) {
      console.log('✅ facts_clean view already exists!');

      // Count rows
      const countResult = await client.query('SELECT COUNT(*) FROM facts_clean');
      console.log(`📊 View contains ${countResult.rows[0].count} rows`);

      // Sample data
      const sampleResult = await client.query(`
        SELECT
          project, sub_project, year_start, beneficiaries, amount, quantity
        FROM facts_clean
        WHERE beneficiaries IS NOT NULL
        LIMIT 5
      `);

      console.log('\n📋 Sample data:');
      console.table(sampleResult.rows);

    } else {
      console.log('❌ facts_clean view does NOT exist. Creating it...');

      // Read migration file
      const migrationPath = join(__dirname, '../supabase/migrations/001_init_schema.sql');
      const migrationSQL = readFileSync(migrationPath, 'utf8');

      // Execute migration
      await client.query(migrationSQL);

      console.log('✅ Migration executed successfully!');

      // Verify creation
      const verifyResult = await client.query('SELECT COUNT(*) FROM facts_clean');
      console.log(`📊 View now contains ${verifyResult.rows[0].count} rows`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkAndCreateView().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
