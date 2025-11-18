-- ============================================================================
-- COMBINED MIGRATIONS FOR NEW SUPABASE DATABASE
-- Run this entire file in Supabase SQL Editor to set up the database
-- ============================================================================

-- ============================================================================
-- MIGRATION 001: Initial Schema
-- ============================================================================

-- Drop existing objects if they exist
DROP VIEW IF EXISTS facts_clean CASCADE;
DROP TABLE IF EXISTS dim_assets CASCADE;
DROP TABLE IF EXISTS tracker_raw CASCADE;

-- Create tracker_raw table with all original columns plus shadow canonical fields
CREATE TABLE tracker_raw (
  id BIGSERIAL PRIMARY KEY,

  -- Original columns from Excel (all preserved as-is)
  sr_no TEXT,
  year TEXT,
  date TEXT,
  project TEXT,
  sub_project TEXT,
  institute TEXT,
  type_of_institution TEXT,
  quantity TEXT,
  no_of_beneficiaries TEXT,
  amount TEXT,
  remarks TEXT,

  -- Shadow canonical fields (cleaned, trimmed, Title Case)
  project_canon TEXT,
  sub_project_canon TEXT,
  institute_canon TEXT,
  type_of_institution_canon TEXT,
  remarks_canon TEXT,

  -- Derived year fields
  year_start INTEGER,
  year_end INTEGER,
  year_label TEXT,

  -- Parsed date field
  date_iso DATE,

  -- Safe numeric fields (NULL if not parseable or "Multiple"/"NA")
  quantity_num NUMERIC,
  no_of_beneficiaries_num NUMERIC,
  amount_num NUMERIC,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint for idempotency (hash based on key fields)
  row_hash TEXT UNIQUE
);

-- Create indexes for common query patterns
CREATE INDEX idx_tracker_year_project ON tracker_raw(year_start, project_canon, sub_project_canon);
CREATE INDEX idx_tracker_date ON tracker_raw(date_iso);
CREATE INDEX idx_tracker_sub_project ON tracker_raw(sub_project_canon);
CREATE INDEX idx_tracker_project ON tracker_raw(project_canon);

-- Create dim_assets table for sub-project images and descriptions
CREATE TABLE dim_assets (
  sub_project_canon TEXT PRIMARY KEY,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create facts_clean view exposing only canonical and numeric fields for charts
CREATE VIEW facts_clean AS
SELECT
  id,
  sr_no,

  -- Canonical text fields
  project_canon AS project,
  sub_project_canon AS sub_project,
  institute_canon AS institute,
  type_of_institution_canon AS type_of_institution,
  remarks_canon AS remarks,

  -- Year fields
  year_start,
  year_end,
  year_label,

  -- Date field
  date_iso AS date,

  -- Numeric fields (NULLs excluded from aggregations)
  quantity_num AS quantity,
  no_of_beneficiaries_num AS beneficiaries,
  amount_num AS amount,

  created_at
FROM tracker_raw
WHERE
  -- Only include rows with at least some valid data
  project_canon IS NOT NULL OR sub_project_canon IS NOT NULL;

-- Add helpful comments
COMMENT ON TABLE tracker_raw IS 'Raw tracker data with original and cleaned fields';
COMMENT ON TABLE dim_assets IS 'Asset metadata (images, descriptions) for sub-projects';
COMMENT ON VIEW facts_clean IS 'Clean view of tracker data for analytics and charts';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at
CREATE TRIGGER update_tracker_raw_updated_at
  BEFORE UPDATE ON tracker_raw
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dim_assets_updated_at
  BEFORE UPDATE ON dim_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION 003: Add Cause Column
-- ============================================================================

-- Add cause columns to tracker_raw
ALTER TABLE tracker_raw
ADD COLUMN IF NOT EXISTS cause TEXT,
ADD COLUMN IF NOT EXISTS cause_canon TEXT;

-- Update facts_clean view to include cause
DROP VIEW IF EXISTS facts_clean;

CREATE VIEW facts_clean AS
SELECT
  year_start,
  year_label,
  date_iso,
  project_canon AS project,
  sub_project_canon AS sub_project,
  institute_canon AS institute,
  type_of_institution_canon AS type_of_institution,
  cause_canon AS cause,
  remarks_canon AS remarks,
  quantity_num AS quantity,
  no_of_beneficiaries_num AS beneficiaries,
  amount_num AS amount
FROM tracker_raw;

-- Create index on cause for faster filtering
CREATE INDEX IF NOT EXISTS idx_tracker_cause ON tracker_raw(cause_canon);

COMMENT ON COLUMN tracker_raw.cause IS 'Original cause value from Excel';
COMMENT ON COLUMN tracker_raw.cause_canon IS 'Cleaned and canonicalized cause (Title Case, trimmed)';

-- ============================================================================
-- MIGRATION 004: Add All Missing Columns
-- ============================================================================

-- Add ALL missing columns from Excel to ensure complete data capture
ALTER TABLE tracker_raw
ADD COLUMN IF NOT EXISTS month TEXT,
ADD COLUMN IF NOT EXISTS month_canon TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS department_canon TEXT,
ADD COLUMN IF NOT EXISTS comments_by_pankti TEXT,
ADD COLUMN IF NOT EXISTS on_account_kind TEXT;

-- Update facts_clean view to include all fields
DROP VIEW IF EXISTS facts_clean;

CREATE VIEW facts_clean AS
SELECT
  year_start,
  year_label,
  date_iso,
  month_canon AS month,
  cause_canon AS cause,
  project_canon AS project,
  sub_project_canon AS sub_project,
  institute_canon AS institute,
  department_canon AS department,
  type_of_institution_canon AS type_of_institution,
  remarks_canon AS remarks,
  quantity_num AS quantity,
  no_of_beneficiaries_num AS beneficiaries,
  amount_num AS amount,
  comments_by_pankti,
  on_account_kind
FROM tracker_raw;

COMMENT ON COLUMN tracker_raw.month IS 'Original month value from Excel';
COMMENT ON COLUMN tracker_raw.month_canon IS 'Cleaned and canonicalized month';
COMMENT ON COLUMN tracker_raw.department IS 'Original department value from Excel';
COMMENT ON COLUMN tracker_raw.department_canon IS 'Cleaned and canonicalized department';
COMMENT ON COLUMN tracker_raw.comments_by_pankti IS 'Internal comments field';
COMMENT ON COLUMN tracker_raw.on_account_kind IS 'On account or Kind classification';

-- ============================================================================
-- MIGRATION 005: Google Sheets Sync Metadata
-- ============================================================================

-- Create sync_metadata table
CREATE TABLE IF NOT EXISTS sync_metadata (
  id SERIAL PRIMARY KEY,
  sync_source TEXT NOT NULL UNIQUE, -- e.g., 'google_sheets'
  last_synced_row_count INTEGER NOT NULL DEFAULT 0,
  last_sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  last_sync_status TEXT, -- 'success', 'partial', 'failed'
  last_sync_error TEXT,
  total_rows_synced INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial record for Google Sheets sync
-- Set last_synced_row_count to 0 since this is a new database
INSERT INTO sync_metadata (sync_source, last_synced_row_count, last_sync_status)
VALUES ('google_sheets', 0, 'initial')
ON CONFLICT (sync_source) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sync_metadata_source ON sync_metadata(sync_source);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_sync_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_metadata_updated_at
  BEFORE UPDATE ON sync_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_sync_metadata_updated_at();

-- Add comments for documentation
COMMENT ON TABLE sync_metadata IS 'Tracks sync state for external data sources (Google Sheets, etc.)';
COMMENT ON COLUMN sync_metadata.sync_source IS 'Identifier for the data source being synced';
COMMENT ON COLUMN sync_metadata.last_synced_row_count IS 'Number of rows that have been synced (used for incremental sync)';
COMMENT ON COLUMN sync_metadata.last_sync_timestamp IS 'Timestamp of the last successful sync';
COMMENT ON COLUMN sync_metadata.last_sync_status IS 'Status of the last sync attempt';

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================

SELECT 'All migrations completed successfully!' AS status;
SELECT 'Tables created: tracker_raw, dim_assets, sync_metadata' AS tables;
SELECT 'View created: facts_clean' AS views;
