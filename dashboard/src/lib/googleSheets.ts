/**
 * Google Sheets API Client for Anjeze Tracker
 * Fetches data from Google Sheets for sync with Supabase
 */

import { google } from 'googleapis';
import type { RawSheetRow } from './dataCleaning';

/**
 * Get authenticated Google Sheets client using Service Account
 */
export async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Fetch all data from Google Sheets
 * Returns array of row objects with column headers as keys
 */
export async function fetchSheetData(): Promise<RawSheetRow[]> {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
    range: process.env.GOOGLE_SHEETS_RANGE || 'Tracker!A:Z',
  });

  const rows = response.data.values || [];

  if (rows.length === 0) {
    return [];
  }

  // Convert to objects (first row = headers)
  const [headers, ...dataRows] = rows;

  // Normalize headers (remove newlines, trim spaces)
  const normalizedHeaders = headers.map(h =>
    h.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  );

  return dataRows.map(row => {
    const obj: any = {};
    normalizedHeaders.forEach((header, index) => {
      // Google Sheets returns empty strings for empty cells, convert to null
      obj[header] = row[index] || null;
    });
    return obj as RawSheetRow;
  });
}

/**
 * Fetch only new rows from Google Sheets (incremental sync)
 * @param lastSyncedRowCount - Number of rows that were synced last time
 * @returns Array of new rows only
 */
export async function fetchNewRows(lastSyncedRowCount: number): Promise<RawSheetRow[]> {
  const sheets = await getGoogleSheetsClient();

  // Fetch all rows to get the current count
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
    range: process.env.GOOGLE_SHEETS_RANGE || 'Tracker!A:Z',
  });

  const rows = response.data.values || [];

  if (rows.length === 0) {
    return [];
  }

  const [headers, ...dataRows] = rows;

  // If no new rows, return empty array
  if (dataRows.length <= lastSyncedRowCount) {
    return [];
  }

  // Get only the new rows (skip already synced rows)
  const newRows = dataRows.slice(lastSyncedRowCount);

  // Normalize headers (remove newlines, trim spaces)
  const normalizedHeaders = headers.map(h =>
    h.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  );

  return newRows.map(row => {
    const obj: any = {};
    normalizedHeaders.forEach((header, index) => {
      obj[header] = row[index] || null;
    });
    return obj as RawSheetRow;
  });
}

/**
 * Get the total row count from Google Sheets (excluding header)
 */
export async function getSheetRowCount(): Promise<number> {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
    range: process.env.GOOGLE_SHEETS_RANGE || 'Tracker!A:Z',
  });

  const rows = response.data.values || [];

  // Subtract 1 for header row
  return Math.max(0, rows.length - 1);
}
