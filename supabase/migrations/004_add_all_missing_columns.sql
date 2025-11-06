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
