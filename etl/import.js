/**
 * Anjeze Tracker ETL Import Script
 * Reads Excel file, applies data cleaning rules, and UPSERTs to tracker_raw table
 *
 * Usage: npm run import -- --file ../1.1\ Anjeze\ Tracker\ -\ for\ Kiran.xlsx
 */

import XLSX from 'xlsx';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { cleanRow } from './utils.js';

const { Pool } = pg;

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && i + 1 < args.length) {
      result.file = args[i + 1];
      i++;
    }
  }

  return result;
}

// Validate environment variables
function validateEnv() {
  const required = ['PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}\nPlease copy .env.example to .env and fill in your Supabase credentials.`);
  }
}

// Create database connection pool
function createPool() {
  return new Pool({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT, 10),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

// Normalize column names by trimming whitespace and newlines
function normalizeColumnName(colName) {
  if (!colName) return colName;
  return String(colName).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
}

// Normalize all keys in a row object
function normalizeRowKeys(row) {
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeColumnName(key);
    normalized[normalizedKey] = value;
  }
  return normalized;
}

// Read Excel file and return rows from "Tracker" sheet
function readExcelFile(filePath) {
  console.log(`📖 Reading Excel file: ${filePath}`);

  const workbook = XLSX.readFile(filePath);

  // Find the "Tracker" sheet
  const sheetName = workbook.SheetNames.find(name =>
    name.toLowerCase().trim() === 'tracker'
  );

  if (!sheetName) {
    throw new Error(`Sheet "Tracker" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
  }

  console.log(`✓ Found sheet: "${sheetName}"`);

  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON (header row will be used as keys)
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    raw: false, // Keep original formatting
    defval: null // Default value for empty cells
  });

  // Normalize column names (remove newlines, extra spaces)
  const normalizedRows = rows.map(normalizeRowKeys);

  console.log(`✓ Parsed ${normalizedRows.length} rows`);

  return normalizedRows;
}

// Insert or update row in database (idempotent)
async function upsertRow(pool, cleanedRow) {
  const query = `
    INSERT INTO tracker_raw (
      sr_no, year, date, project, sub_project, institute, type_of_institution,
      quantity, no_of_beneficiaries, amount, remarks,
      project_canon, sub_project_canon, institute_canon, type_of_institution_canon, remarks_canon,
      year_start, year_end, year_label, date_iso,
      quantity_num, no_of_beneficiaries_num, amount_num, row_hash
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
      $12, $13, $14, $15, $16,
      $17, $18, $19, $20,
      $21, $22, $23, $24
    )
    ON CONFLICT (row_hash) DO UPDATE SET
      sr_no = EXCLUDED.sr_no,
      year = EXCLUDED.year,
      date = EXCLUDED.date,
      project = EXCLUDED.project,
      sub_project = EXCLUDED.sub_project,
      institute = EXCLUDED.institute,
      type_of_institution = EXCLUDED.type_of_institution,
      quantity = EXCLUDED.quantity,
      no_of_beneficiaries = EXCLUDED.no_of_beneficiaries,
      amount = EXCLUDED.amount,
      remarks = EXCLUDED.remarks,
      project_canon = EXCLUDED.project_canon,
      sub_project_canon = EXCLUDED.sub_project_canon,
      institute_canon = EXCLUDED.institute_canon,
      type_of_institution_canon = EXCLUDED.type_of_institution_canon,
      remarks_canon = EXCLUDED.remarks_canon,
      year_start = EXCLUDED.year_start,
      year_end = EXCLUDED.year_end,
      year_label = EXCLUDED.year_label,
      date_iso = EXCLUDED.date_iso,
      quantity_num = EXCLUDED.quantity_num,
      no_of_beneficiaries_num = EXCLUDED.no_of_beneficiaries_num,
      amount_num = EXCLUDED.amount_num,
      updated_at = NOW()
    RETURNING id;
  `;

  const values = [
    cleanedRow.sr_no,
    cleanedRow.year,
    cleanedRow.date,
    cleanedRow.project,
    cleanedRow.sub_project,
    cleanedRow.institute,
    cleanedRow.type_of_institution,
    cleanedRow.quantity,
    cleanedRow.no_of_beneficiaries,
    cleanedRow.amount,
    cleanedRow.remarks,
    cleanedRow.project_canon,
    cleanedRow.sub_project_canon,
    cleanedRow.institute_canon,
    cleanedRow.type_of_institution_canon,
    cleanedRow.remarks_canon,
    cleanedRow.year_start,
    cleanedRow.year_end,
    cleanedRow.year_label,
    cleanedRow.date_iso,
    cleanedRow.quantity_num,
    cleanedRow.no_of_beneficiaries_num,
    cleanedRow.amount_num,
    cleanedRow.row_hash
  ];

  const result = await pool.query(query, values);
  return result.rows[0].id;
}

// Main import function
async function importData(filePath) {
  const pool = createPool();

  try {
    console.log('🚀 Starting import process...\n');

    // Test database connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✓ Database connected\n');

    // Read Excel file
    const rows = readExcelFile(filePath);

    if (rows.length === 0) {
      console.log('⚠️  No rows found in Excel file');
      return;
    }

    // Process and insert rows
    console.log(`\n📊 Processing ${rows.length} rows...\n`);

    let inserted = 0;
    let updated = 0;
    let errors = 0;
    let nullDates = 0;

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];

      try {
        const cleanedRow = cleanRow(rawRow);

        // Track null dates for quality metrics
        if (!cleanedRow.date_iso && rawRow['Date']) {
          nullDates++;
        }

        const id = await upsertRow(pool, cleanedRow);

        if (i < rows.length - 1) {
          inserted++;
        }

        // Progress indicator
        if ((i + 1) % 10 === 0 || i === rows.length - 1) {
          process.stdout.write(`\r✓ Processed ${i + 1}/${rows.length} rows`);
        }
      } catch (error) {
        errors++;
        console.error(`\n❌ Error processing row ${i + 1}:`, error.message);
        console.error('   Raw row:', rawRow);
      }
    }

    console.log('\n');
    console.log('═'.repeat(50));
    console.log('✅ Import completed!');
    console.log('═'.repeat(50));
    console.log(`Total rows processed: ${rows.length}`);
    console.log(`Successfully imported: ${inserted}`);
    console.log(`Errors: ${errors}`);
    console.log(`Unparseable dates: ${nullDates} (${((nullDates / rows.length) * 100).toFixed(1)}%)`);
    console.log('═'.repeat(50));

    // Show sample data
    console.log('\n📊 Sample of imported data:\n');
    const sample = await pool.query(`
      SELECT
        sr_no,
        project_canon,
        sub_project_canon,
        year_label,
        date_iso,
        no_of_beneficiaries_num
      FROM tracker_raw
      ORDER BY id DESC
      LIMIT 5
    `);

    console.table(sample.rows);

    // Show summary statistics
    console.log('\n📈 Summary Statistics:\n');
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_rows,
        COUNT(DISTINCT project_canon) as unique_projects,
        COUNT(DISTINCT sub_project_canon) as unique_sub_projects,
        COUNT(DISTINCT year_start) as unique_years,
        COUNT(date_iso) as rows_with_valid_date,
        SUM(no_of_beneficiaries_num) as total_beneficiaries,
        SUM(amount_num) as total_amount
      FROM tracker_raw
    `);

    console.table(stats.rows[0]);

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Main execution
(async () => {
  try {
    // Parse arguments
    const args = parseArgs();

    if (!args.file) {
      console.error('❌ Error: --file argument is required');
      console.log('\nUsage: npm run import -- --file <path-to-excel-file>');
      console.log('Example: npm run import -- --file ../1.1\\ Anjeze\\ Tracker\\ -\\ for\\ Kiran.xlsx');
      process.exit(1);
    }

    // Resolve file path
    const filePath = resolve(process.cwd(), args.file);

    // Validate environment
    validateEnv();

    // Run import
    await importData(filePath);

    console.log('\n🎉 All done!\n');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
})();
