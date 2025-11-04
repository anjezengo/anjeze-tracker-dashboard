/**
 * Debug: Check what data actually exists
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false },
});

async function debugData() {
  const client = await pool.connect();

  try {
    console.log('🔍 Debugging data in facts_clean view...\n');

    // Check total rows
    const totalRows = await client.query('SELECT COUNT(*) FROM facts_clean');
    console.log(`Total rows in facts_clean: ${totalRows.rows[0].count}`);

    // Check how many have beneficiaries
    const withBeneficiaries = await client.query('SELECT COUNT(*) FROM facts_clean WHERE beneficiaries IS NOT NULL');
    console.log(`Rows with beneficiaries NOT NULL: ${withBeneficiaries.rows[0].count}`);

    const withBeneficiariesGtZero = await client.query('SELECT COUNT(*) FROM facts_clean WHERE beneficiaries > 0');
    console.log(`Rows with beneficiaries > 0: ${withBeneficiariesGtZero.rows[0].count}`);

    // Check sample of all fields
    console.log('\n📋 Sample rows (all fields):');
    const sampleAll = await client.query(`
      SELECT project, sub_project, year_start, beneficiaries, amount, quantity
      FROM facts_clean
      LIMIT 10
    `);
    console.table(sampleAll.rows);

    // Check raw table
    console.log('\n📋 Sample from tracker_raw:');
    const rawSample = await client.query(`
      SELECT
        project_canon,
        sub_project_canon,
        year_start,
        no_of_beneficiaries,
        no_of_beneficiaries_num,
        amount,
        amount_num,
        quantity,
        quantity_num
      FROM tracker_raw
      LIMIT 10
    `);
    console.table(rawSample.rows);

    // Check distinct projects and sub-projects
    console.log('\n📊 Distinct values:');
    const distinctProjects = await client.query('SELECT COUNT(DISTINCT project) FROM facts_clean');
    const distinctSubProjects = await client.query('SELECT COUNT(DISTINCT sub_project) FROM facts_clean');
    console.log(`Unique projects: ${distinctProjects.rows[0].count}`);
    console.log(`Unique sub-projects: ${distinctSubProjects.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

debugData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
