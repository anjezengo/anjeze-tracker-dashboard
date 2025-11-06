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
