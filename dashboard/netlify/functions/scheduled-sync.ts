import type { Handler } from '@netlify/functions';

// Google Sheets sync removed — data is managed via ETL import from OneDrive.
// This stub prevents build failures. For auto-sync, use the OneDrive ETL script.
export const handler: Handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Sync via ETL script — see etl/import.js' }),
  };
};
