/**
 * Netlify Scheduled Function
 * Auto-syncs Google Sheets data to Supabase every 6 hours
 * Runs at: 12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM UTC
 */

import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Import from the main app (these will be bundled by Netlify)
// We need to inline the logic here since Netlify functions are separate bundles
import crypto from 'crypto';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { google } from 'googleapis';

dayjs.extend(customParseFormat);

// ============================================================================
// Data Cleaning Utilities (inlined)
// ============================================================================

function canonicalizeText(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (!cleaned) return null;
  return cleaned
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function parseYear(yearInput: string | number | null | undefined) {
  if (!yearInput) {
    return { year_start: null, year_end: null, year_label: null };
  }

  const yearStr = String(yearInput).trim();

  const rangeMatch = yearStr.match(/^(\d{4})\s*-\s*(\d{2,4})$/);
  if (rangeMatch) {
    const startYear = parseInt(rangeMatch[1], 10);
    let endYear = parseInt(rangeMatch[2], 10);

    if (endYear < 100) {
      const century = Math.floor(startYear / 100) * 100;
      endYear = century + endYear;
      if (endYear < startYear) {
        endYear += 100;
      }
    }

    return {
      year_start: startYear,
      year_end: endYear,
      year_label: `${startYear}-${endYear}`
    };
  }

  const singleMatch = yearStr.match(/^(\d{4})$/);
  if (singleMatch) {
    const year = parseInt(singleMatch[1], 10);
    return {
      year_start: year,
      year_end: year,
      year_label: String(year)
    };
  }

  return { year_start: null, year_end: null, year_label: yearStr };
}

function parseDate(dateInput: string | number | Date | null | undefined): string | null {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    const parsed = dayjs(dateInput);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
  }

  if (typeof dateInput === 'number') {
    const excelEpoch = new Date(1900, 0, 1);
    const days = dateInput - 2;
    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    const parsed = dayjs(date);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
  }

  const dateStr = String(dateInput).trim();
  if (!dateStr) return null;

  const formats = [
    'YYYY-MM-DD',
    'DD/MM/YYYY',
    'MM/DD/YYYY',
    'DD-MM-YYYY',
    'MM-DD-YYYY',
    'D/M/YYYY',
    'M/D/YYYY',
    'DD.MM.YYYY',
    'YYYY/MM/DD',
    'D-M-YYYY',
    'D MMM YYYY',
    'DD MMM YYYY',
    'MMM D, YYYY',
    'MMMM D, YYYY'
  ];

  for (const format of formats) {
    const parsed = dayjs(dateStr, format, true);
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD');
    }
  }

  const parsed = dayjs(dateStr);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
}

function parseNumeric(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const strValue = String(value).trim().toLowerCase();

  if (strValue === 'multiple' || strValue === 'na' || strValue === 'n/a') {
    return null;
  }

  const cleaned = strValue.replace(/[,₹$]/g, '');
  const parsed = parseFloat(cleaned);

  return !isNaN(parsed) && isFinite(parsed) ? parsed : null;
}

function generateRowHash(row: any): string {
  const key = `${row.sr_no || ''}|${row.date || ''}|${row.project || ''}|${row.sub_project || ''}`;
  return crypto.createHash('sha256').update(key).digest('hex');
}

function cleanRow(rawRow: any) {
  const original = {
    sr_no: rawRow['Sr.No'] != null ? String(rawRow['Sr.No']) : null,
    year: rawRow['Year'] != null ? String(rawRow['Year']) : null,
    month: rawRow['Month'] != null ? String(rawRow['Month']) : null,
    date: rawRow['Date'] != null ? String(rawRow['Date']) : null,
    cause: rawRow['Cause'] != null ? String(rawRow['Cause']) : null,
    project: rawRow['Project'] != null ? String(rawRow['Project']) : null,
    sub_project: rawRow['Sub Project'] != null ? String(rawRow['Sub Project']) : null,
    institute: (rawRow['Institute'] ?? rawRow['Name of Institute / Area of Service']) != null
      ? String(rawRow['Institute'] ?? rawRow['Name of Institute / Area of Service'])
      : null,
    department: rawRow['Department'] != null ? String(rawRow['Department']) : null,
    type_of_institution: (rawRow['Type of Institution'] ?? rawRow['Type of Institute']) != null
      ? String(rawRow['Type of Institution'] ?? rawRow['Type of Institute'])
      : null,
    quantity: rawRow['Quantity'] != null ? String(rawRow['Quantity']) : null,
    no_of_beneficiaries: rawRow['No. of Beneficiaries'] != null ? String(rawRow['No. of Beneficiaries']) : null,
    remarks: (rawRow['Remarks'] ?? rawRow['Services / Remarks']) != null
      ? String(rawRow['Remarks'] ?? rawRow['Services / Remarks'])
      : null,
    amount: rawRow['Amount'] != null ? String(rawRow['Amount']) : null,
    comments_by_pankti: rawRow['Comments by Pankti'] != null ? String(rawRow['Comments by Pankti']) : null,
    on_account_kind: rawRow['On account / Kind'] != null ? String(rawRow['On account / Kind']) : null
  };

  const canonical = {
    month_canon: canonicalizeText(original.month),
    cause_canon: canonicalizeText(original.cause),
    project_canon: canonicalizeText(original.project),
    sub_project_canon: canonicalizeText(original.sub_project),
    institute_canon: canonicalizeText(original.institute),
    department_canon: canonicalizeText(original.department),
    type_of_institution_canon: canonicalizeText(original.type_of_institution),
    remarks_canon: canonicalizeText(original.remarks)
  };

  const yearParsed = parseYear(original.year);
  const date_iso = parseDate(rawRow['Date']);

  const numeric = {
    quantity_num: parseNumeric(original.quantity),
    no_of_beneficiaries_num: parseNumeric(original.no_of_beneficiaries),
    amount_num: parseNumeric(original.amount)
  };

  const row_hash = generateRowHash(original);

  return {
    ...original,
    ...canonical,
    ...yearParsed,
    date_iso,
    ...numeric,
    row_hash
  };
}

// ============================================================================
// Google Sheets Utilities (inlined)
// ============================================================================

async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

async function fetchNewRows(lastSyncedRowCount: number) {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
    range: process.env.GOOGLE_SHEETS_RANGE || 'Tracker!A:Z',
  });

  const rows = response.data.values || [];

  if (rows.length === 0) {
    return [];
  }

  const [headers, ...dataRows] = rows;

  if (dataRows.length <= lastSyncedRowCount) {
    return [];
  }

  const newRows = dataRows.slice(lastSyncedRowCount);

  return newRows.map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || null;
    });
    return obj;
  });
}

async function getSheetRowCount() {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
    range: process.env.GOOGLE_SHEETS_RANGE || 'Tracker!A:Z',
  });

  const rows = response.data.values || [];
  return Math.max(0, rows.length - 1);
}

// ============================================================================
// Scheduled Sync Handler
// ============================================================================

const handler = async () => {
  try {
    console.log('🔄 Starting scheduled Google Sheets sync...');
    console.log(`⏰ Sync triggered at: ${new Date().toISOString()}`);

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current sync metadata
    const { data: syncMeta, error: metaError } = await supabase
      .from('sync_metadata')
      .select('*')
      .eq('sync_source', 'google_sheets')
      .single();

    if (metaError && metaError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch sync metadata: ${metaError.message}`);
    }

    const lastSyncedRowCount = syncMeta?.last_synced_row_count || 0;
    console.log(`📊 Last synced row count: ${lastSyncedRowCount}`);

    // Get current total row count in Google Sheets
    const totalRowsInSheet = await getSheetRowCount();
    console.log(`📊 Total rows in Google Sheets: ${totalRowsInSheet}`);

    // Check if there are new rows
    if (totalRowsInSheet <= lastSyncedRowCount) {
      console.log('✓ No new rows to sync');

      await supabase
        .from('sync_metadata')
        .update({
          last_sync_timestamp: new Date().toISOString(),
          last_sync_status: 'success'
        })
        .eq('sync_source', 'google_sheets');

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No new rows to sync',
          timestamp: new Date().toISOString()
        }),
      };
    }

    // Fetch only new rows
    console.log(`📥 Fetching new rows (from row ${lastSyncedRowCount + 1})...`);
    const rawRows = await fetchNewRows(lastSyncedRowCount);
    console.log(`✓ Fetched ${rawRows.length} new rows`);

    if (rawRows.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No new rows to sync',
          timestamp: new Date().toISOString()
        }),
      };
    }

    // Clean and transform rows
    console.log('🧹 Cleaning and transforming rows...');
    const cleanedRows = rawRows.map(cleanRow);

    // Sync to Supabase
    console.log('💾 Syncing to Supabase...');
    let synced = 0;
    let errors = 0;

    for (const row of cleanedRows) {
      try {
        const { error: upsertError } = await supabase
          .from('tracker_raw')
          .upsert(row, {
            onConflict: 'row_hash',
          });

        if (upsertError) {
          console.error('Error upserting row:', upsertError);
          errors++;
        } else {
          synced++;
        }
      } catch (err) {
        console.error('Exception upserting row:', err);
        errors++;
      }
    }

    console.log(`✓ Synced ${synced}/${cleanedRows.length} rows`);

    // Update sync metadata
    await supabase
      .from('sync_metadata')
      .upsert({
        sync_source: 'google_sheets',
        last_synced_row_count: totalRowsInSheet,
        last_sync_timestamp: new Date().toISOString(),
        last_sync_status: errors === 0 ? 'success' : 'partial',
        last_sync_error: errors > 0 ? `${errors} rows failed to sync` : null,
        total_rows_synced: (syncMeta?.total_rows_synced || 0) + synced
      }, {
        onConflict: 'sync_source'
      });

    console.log('✅ Scheduled sync completed successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        rowsSynced: synced,
        errors,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('❌ Scheduled sync failed:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
};

// Schedule to run every 6 hours (0 */6 * * *)
// Runs at: 12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM UTC
export default schedule('0 */6 * * *', handler);
