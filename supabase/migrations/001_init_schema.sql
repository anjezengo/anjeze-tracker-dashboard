-- Anjeze Tracker Database Schema
-- Migration 001: Initial schema with tracker_raw, dim_assets, and facts_clean view

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
