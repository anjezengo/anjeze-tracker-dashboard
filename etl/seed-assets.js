/**
 * Seed Assets Script
 * Creates dim_assets rows for each distinct sub_project_canon if missing
 *
 * Usage: npm run seed-assets
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables
dotenv.config();

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

// Default placeholder descriptions for sub-projects
const defaultDescriptions = {
  'Infant Goodie Bag': 'Essential items and supplies for newborn infants and their mothers, including hygiene products, clothing, and basic necessities.',
  'Health Kit': 'Comprehensive health and hygiene supplies for individuals and families, promoting wellness and disease prevention.',
  'Goodie Bag': 'Collection of useful items and supplies distributed to beneficiaries for various needs and occasions.',
  'Snacks': 'Nutritious snack items provided to support health and well-being of beneficiaries.',
  'Refreshment': 'Food and beverage items provided during events and programs.',
  'default': 'Program supporting community development and welfare initiatives.'
};

// Get description for sub-project
function getDescription(subProject) {
  return defaultDescriptions[subProject] || defaultDescriptions['default'];
}

// Main seed function
async function seedAssets() {
  const pool = createPool();

  try {
    console.log('🚀 Starting asset seeding process...\n');

    // Test database connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✓ Database connected\n');

    // Get distinct sub_projects from tracker_raw
    console.log('📊 Fetching distinct sub-projects...');
    const subProjectsResult = await pool.query(`
      SELECT DISTINCT sub_project_canon
      FROM tracker_raw
      WHERE sub_project_canon IS NOT NULL
      ORDER BY sub_project_canon
    `);

    const subProjects = subProjectsResult.rows.map(row => row.sub_project_canon);
    console.log(`✓ Found ${subProjects.length} distinct sub-projects\n`);

    if (subProjects.length === 0) {
      console.log('⚠️  No sub-projects found in tracker_raw table');
      return;
    }

    // Insert/update assets
    console.log('💾 Seeding assets...\n');

    let inserted = 0;
    let skipped = 0;

    for (const subProject of subProjects) {
      const description = getDescription(subProject);

      // Use INSERT ... ON CONFLICT DO NOTHING to avoid overwriting existing data
      const result = await pool.query(`
        INSERT INTO dim_assets (sub_project_canon, image_url, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (sub_project_canon) DO NOTHING
        RETURNING sub_project_canon
      `, [subProject, null, description]);

      if (result.rowCount > 0) {
        console.log(`  ✓ Created: ${subProject}`);
        inserted++;
      } else {
        console.log(`  ○ Skipped (already exists): ${subProject}`);
        skipped++;
      }
    }

    console.log('\n═'.repeat(50));
    console.log('✅ Asset seeding completed!');
    console.log('═'.repeat(50));
    console.log(`Total sub-projects: ${subProjects.length}`);
    console.log(`Newly inserted: ${inserted}`);
    console.log(`Already existed: ${skipped}`);
    console.log('═'.repeat(50));

    // Show current assets
    console.log('\n📋 Current assets in dim_assets:\n');
    const assets = await pool.query(`
      SELECT
        sub_project_canon,
        CASE WHEN image_url IS NOT NULL THEN '✓' ELSE '✗' END as has_image,
        CASE WHEN description IS NOT NULL THEN '✓' ELSE '✗' END as has_description
      FROM dim_assets
      ORDER BY sub_project_canon
    `);

    console.table(assets.rows);

    console.log('\n💡 Tip: You can update image_url and description directly in Supabase or using SQL:');
    console.log(`   UPDATE dim_assets SET image_url = 'https://...' WHERE sub_project_canon = 'Infant Goodie Bag';`);

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Main execution
(async () => {
  try {
    validateEnv();
    await seedAssets();
    console.log('\n🎉 All done!\n');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
})();
