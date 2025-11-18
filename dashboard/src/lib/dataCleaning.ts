/**
 * Data cleaning and parsing utilities for Anjeze Tracker
 * Ported from ETL utils.js to TypeScript
 */

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import crypto from 'crypto';

dayjs.extend(customParseFormat);

/**
 * Normalize text: trim, collapse multiple spaces, Title Case
 */
export function canonicalizeText(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') return null;

  // Trim and collapse multiple spaces
  const cleaned = text.trim().replace(/\s+/g, ' ');

  if (!cleaned) return null;

  // Convert to Title Case
  return cleaned
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Parse year field into year_start, year_end, year_label
 * Supports formats: "2016-17", "2016-2017", "2019"
 */
export function parseYear(yearInput: string | number | null | undefined): {
  year_start: number | null;
  year_end: number | null;
  year_label: string | null;
} {
  if (!yearInput) {
    return { year_start: null, year_end: null, year_label: null };
  }

  const yearStr = String(yearInput).trim();

  // Pattern: "2016-17" or "2016-2017"
  const rangeMatch = yearStr.match(/^(\d{4})\s*-\s*(\d{2,4})$/);
  if (rangeMatch) {
    const startYear = parseInt(rangeMatch[1], 10);
    let endYear = parseInt(rangeMatch[2], 10);

    // Handle 2-digit year suffix (e.g., "2016-17" -> 2017)
    if (endYear < 100) {
      const century = Math.floor(startYear / 100) * 100;
      endYear = century + endYear;
      // Handle century rollover if needed
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

  // Pattern: Single year "2019"
  const singleMatch = yearStr.match(/^(\d{4})$/);
  if (singleMatch) {
    const year = parseInt(singleMatch[1], 10);
    return {
      year_start: year,
      year_end: year,
      year_label: String(year)
    };
  }

  // Unparseable
  return { year_start: null, year_end: null, year_label: yearStr };
}

/**
 * Parse date field into ISO format (YYYY-MM-DD)
 * Handles multiple date formats from Excel/Google Sheets
 */
export function parseDate(dateInput: string | number | Date | null | undefined): string | null {
  if (!dateInput) return null;

  // If it's already a Date object
  if (dateInput instanceof Date) {
    const parsed = dayjs(dateInput);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
  }

  // If it's a number (Excel serial date)
  if (typeof dateInput === 'number') {
    // Excel serial date: days since 1900-01-01 (with 1900 leap year bug)
    const excelEpoch = new Date(1900, 0, 1);
    const days = dateInput - 2; // Adjust for Excel's 1900 leap year bug
    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    const parsed = dayjs(date);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
  }

  // If it's a string, try multiple formats
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

  // Try default parsing as last resort
  const parsed = dayjs(dateStr);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
}

/**
 * Parse numeric field safely
 * Returns null for "Multiple", "NA", or non-numeric values
 */
export function parseNumeric(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const strValue = String(value).trim().toLowerCase();

  // Check for special values
  if (strValue === 'multiple' || strValue === 'na' || strValue === 'n/a') {
    return null;
  }

  // Remove common formatting (commas, currency symbols)
  const cleaned = strValue.replace(/[,₹$]/g, '');

  const parsed = parseFloat(cleaned);

  return !isNaN(parsed) && isFinite(parsed) ? parsed : null;
}

/**
 * Generate a unique hash for a row to enable idempotent imports
 */
export function generateRowHash(row: {
  sr_no?: string | null;
  date?: string | null;
  project?: string | null;
  sub_project?: string | null;
}): string {
  const key = `${row.sr_no || ''}|${row.date || ''}|${row.project || ''}|${row.sub_project || ''}`;
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Type for raw row from Google Sheets
 */
export interface RawSheetRow {
  'Sr.No'?: any;
  'Year'?: any;
  'Month'?: any;
  'Date'?: any;
  'Cause'?: any;
  'Project'?: any;
  'Sub Project'?: any;
  'Institute'?: any;
  'Name of Institute / Area of Service'?: any;
  'Department'?: any;
  'Type of Institution'?: any;
  'Type of Institute'?: any;
  'Quantity'?: any;
  'No. of Beneficiaries'?: any;
  'Remarks'?: any;
  'Services / Remarks'?: any;
  'Amount'?: any;
  'Comments by Pankti'?: any;
  'On account / Kind'?: any;
}

/**
 * Type for cleaned row ready for database
 */
export interface CleanedRow {
  sr_no: string | null;
  year: string | null;
  month: string | null;
  date: string | null;
  cause: string | null;
  project: string | null;
  sub_project: string | null;
  institute: string | null;
  department: string | null;
  type_of_institution: string | null;
  quantity: string | null;
  no_of_beneficiaries: string | null;
  remarks: string | null;
  amount: string | null;
  comments_by_pankti: string | null;
  on_account_kind: string | null;
  month_canon: string | null;
  cause_canon: string | null;
  project_canon: string | null;
  sub_project_canon: string | null;
  institute_canon: string | null;
  department_canon: string | null;
  type_of_institution_canon: string | null;
  remarks_canon: string | null;
  year_start: number | null;
  year_end: number | null;
  year_label: string | null;
  date_iso: string | null;
  quantity_num: number | null;
  no_of_beneficiaries_num: number | null;
  amount_num: number | null;
  row_hash: string;
}

/**
 * Clean and transform a row from Google Sheets according to the data cleaning rules
 */
export function cleanRow(rawRow: RawSheetRow): CleanedRow {
  // Extract original values (preserve exact as-is)
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

  // Generate canonical (cleaned) fields
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

  // Parse year
  const yearParsed = parseYear(original.year);

  // Parse date
  const date_iso = parseDate(rawRow['Date']); // Use raw Excel value for better date parsing

  // Parse numeric fields
  const numeric = {
    quantity_num: parseNumeric(original.quantity),
    no_of_beneficiaries_num: parseNumeric(original.no_of_beneficiaries),
    amount_num: parseNumeric(original.amount)
  };

  // Generate row hash for idempotency
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
