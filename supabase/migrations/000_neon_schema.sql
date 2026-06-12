-- ============================================================================
-- NEON FRESH SCHEMA — Anjeze Tracker Dashboard
-- Run once against a new Neon project to set up all tables, views, indexes.
-- Column names match updated_1.1 Anjeze Tracker - for Kiran.xlsx
-- ============================================================================

DROP VIEW IF EXISTS facts_clean CASCADE;
DROP TABLE IF EXISTS dim_assets CASCADE;
DROP TABLE IF EXISTS tracker_raw CASCADE;
DROP TABLE IF EXISTS sync_metadata CASCADE;

-- ============================================================================
-- tracker_raw: stores every row from the Excel file (raw + cleaned fields)
-- ============================================================================
CREATE TABLE tracker_raw (
  id BIGSERIAL PRIMARY KEY,

  -- Original columns (preserved as-is from Excel)
  sr_no               TEXT,
  year                TEXT,
  month               TEXT,
  date                TEXT,
  initiatives         TEXT,   -- was "Cause" in old Excel, now "Initiatives"
  project             TEXT,
  sub_project         TEXT,
  institute           TEXT,
  department          TEXT,
  type_of_institution TEXT,
  quantity            TEXT,
  no_of_beneficiaries TEXT,
  amount              TEXT,
  remarks             TEXT,
  comments            TEXT,   -- was "Comments by Pankti" in old Excel
  on_account_kind     TEXT,

  -- Canonical shadow fields (Title Case, trimmed, for filtering/grouping)
  month_canon               TEXT,
  initiatives_canon         TEXT,
  project_canon             TEXT,
  sub_project_canon         TEXT,
  institute_canon           TEXT,
  department_canon          TEXT,
  type_of_institution_canon TEXT,
  remarks_canon             TEXT,

  -- Derived year fields
  year_start  INTEGER,
  year_end    INTEGER,
  year_label  TEXT,

  -- Parsed date (ISO format)
  date_iso DATE,

  -- Safe numerics (NULL if non-numeric, "Multiple", or "NA")
  quantity_num            NUMERIC,
  no_of_beneficiaries_num NUMERIC,
  amount_num              NUMERIC,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Dedup key: SHA256 of (sr_no | date | project | sub_project)
  row_hash TEXT UNIQUE NOT NULL
);

CREATE INDEX idx_tracker_year_project   ON tracker_raw(year_start, project_canon, sub_project_canon);
CREATE INDEX idx_tracker_date           ON tracker_raw(date_iso);
CREATE INDEX idx_tracker_sub_project    ON tracker_raw(sub_project_canon);
CREATE INDEX idx_tracker_project        ON tracker_raw(project_canon);
CREATE INDEX idx_tracker_initiatives    ON tracker_raw(initiatives_canon);

-- ============================================================================
-- dim_assets: image + description per sub-project (managed manually or via API)
-- ============================================================================
CREATE TABLE dim_assets (
  sub_project_canon TEXT PRIMARY KEY,
  image_url         TEXT,
  description       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- sync_metadata: tracks last OneDrive sync state
-- ============================================================================
CREATE TABLE sync_metadata (
  id                    SERIAL PRIMARY KEY,
  sync_source           TEXT NOT NULL UNIQUE, -- 'onedrive'
  last_synced_row_count INTEGER NOT NULL DEFAULT 0,
  last_sync_timestamp   TIMESTAMPTZ DEFAULT NOW(),
  last_sync_status      TEXT,  -- 'success' | 'partial' | 'failed'
  last_sync_error       TEXT,
  total_rows_synced     INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sync_metadata (sync_source, last_sync_status)
VALUES ('onedrive', 'never');

-- ============================================================================
-- facts_clean: clean view for charts and API responses
-- ============================================================================
CREATE VIEW facts_clean AS
SELECT
  id,
  sr_no,
  year_start,
  year_end,
  year_label,
  date_iso                  AS date,
  month_canon               AS month,
  initiatives_canon         AS initiatives,
  project_canon             AS project,
  sub_project_canon         AS sub_project,
  institute_canon           AS institute,
  department_canon          AS department,
  type_of_institution_canon AS type_of_institution,
  remarks_canon             AS remarks,
  quantity_num              AS quantity,
  no_of_beneficiaries_num   AS beneficiaries,
  amount_num                AS amount,
  comments,
  on_account_kind,
  created_at
FROM tracker_raw
WHERE project_canon IS NOT NULL OR sub_project_canon IS NOT NULL;

-- ============================================================================
-- updated_at auto-trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tracker_raw_updated_at
  BEFORE UPDATE ON tracker_raw
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_dim_assets_updated_at
  BEFORE UPDATE ON dim_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sync_metadata_updated_at
  BEFORE UPDATE ON sync_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Neon schema created successfully.' AS status;
