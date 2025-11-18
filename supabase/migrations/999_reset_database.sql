-- ============================================================================
-- DATABASE RESET SCRIPT
-- ⚠️ WARNING: This will DELETE ALL DATA!
-- Use this when you need to re-import with a new Excel/Google Sheets file
-- ============================================================================

-- Option 1: DELETE ALL DATA (keeps tables structure, indexes, etc.)
-- This is FASTER and recommended for most cases

-- Delete all rows from tables
TRUNCATE TABLE tracker_raw CASCADE;
TRUNCATE TABLE dim_assets CASCADE;
TRUNCATE TABLE sync_metadata CASCADE;

-- Reset sync metadata to 0 (for fresh Google Sheets sync)
INSERT INTO sync_metadata (sync_source, last_synced_row_count, last_sync_status)
VALUES ('google_sheets', 0, 'reset')
ON CONFLICT (sync_source) DO UPDATE
SET last_synced_row_count = 0,
    last_sync_status = 'reset',
    last_sync_timestamp = NOW();

-- Confirm deletion
SELECT 'Database reset complete! All data deleted.' AS status;
SELECT 'You can now run ETL import or Google Sheets sync.' AS next_step;

-- ============================================================================
-- Option 2: FULL RESET (drops and recreates everything)
-- ⚠️ Only use if you modified the schema or want a complete fresh start
-- Uncomment the lines below and comment out Option 1 above
-- ============================================================================

-- DROP VIEW IF EXISTS facts_clean CASCADE;
-- DROP TABLE IF EXISTS dim_assets CASCADE;
-- DROP TABLE IF EXISTS tracker_raw CASCADE;
-- DROP TABLE IF EXISTS sync_metadata CASCADE;

-- Then run the combined migrations file:
-- supabase/migrations/000_combined_all_migrations.sql
