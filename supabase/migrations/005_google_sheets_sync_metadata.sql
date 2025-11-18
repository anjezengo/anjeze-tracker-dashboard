-- Migration: Add sync metadata table for tracking Google Sheets sync state
-- This enables incremental sync (only fetching new rows)

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
-- Set last_synced_row_count to current count in tracker_raw to avoid re-syncing existing data
INSERT INTO sync_metadata (sync_source, last_synced_row_count, last_sync_status)
VALUES ('google_sheets', (SELECT COUNT(*) FROM tracker_raw), 'initial')
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
