/**
 * Check what years we have data for
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

async function checkYears() {
  const client = await pool.connect();

  try {
    // Check which years have data
    const yearsResult = await client.query(`
      SELECT year_start, COUNT(*) as count
      FROM facts_clean
      WHERE year_start IS NOT NULL
      GROUP BY year_start
      ORDER BY year_start
    `);

    console.log('\n📅 Years with data:');
    console.table(yearsResult.rows);

    // Check 2016 specifically
    const year2016 = await client.query(`
      SELECT COUNT(*) as total,
             SUM(beneficiaries) as beneficiaries
      FROM facts_clean
      WHERE year_start = 2016
    `);

    console.log('\n2016 Data:');
    console.table(year2016.rows);

    // Sample 2016 rows
    const sample2016 = await client.query(`
      SELECT project, sub_project, beneficiaries, amount, quantity
      FROM facts_clean
      WHERE year_start = 2016
      LIMIT 10
    `);

    console.log('\n📋 Sample 2016 rows:');
    console.table(sample2016.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkYears().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
