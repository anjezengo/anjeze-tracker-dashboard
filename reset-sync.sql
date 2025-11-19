-- Reset sync counter to force re-sync of all rows
UPDATE sync_metadata 
SET last_synced_row_count = 0,
    last_sync_status = 'reset',
    last_sync_timestamp = NOW()
WHERE sync_source = 'google_sheets';

-- Truncate tracker_raw to clear old data with NULL values
TRUNCATE TABLE tracker_raw CASCADE;

SELECT 'Reset complete! Now click Sync Now in the dashboard.' AS message;
