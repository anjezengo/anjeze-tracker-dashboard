import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export function canonicalize(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (!cleaned) return null;
  return cleaned
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function parseNumeric(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[,₹$\s]/g, '');
  if (/^\s*(multiple|na)\s*$/i.test(String(value).trim())) return null;
  const parsed = parseFloat(cleaned);
  return !isNaN(parsed) && isFinite(parsed) ? parsed : null;
}

export function parseYear(
  yearStr: string | null | undefined
): { year_start: number | null; year_end: number | null; year_label: string | null } {
  if (!yearStr) return { year_start: null, year_end: null, year_label: null };

  // e.g. "2016-17" or "2019-2020"
  const rangeMatch = yearStr.trim().match(/^(\d{4})\s*[-–]\s*(\d{2,4})$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    let end = parseInt(rangeMatch[2]);
    if (end < 100) {
      const century = Math.floor(start / 100) * 100;
      end = century + end;
      if (end <= start) end += 100;
    }
    return { year_start: start, year_end: end, year_label: `${start}-${end}` };
  }

  // e.g. "2019"
  if (/^\d{4}$/.test(yearStr.trim())) {
    const y = parseInt(yearStr.trim());
    return { year_start: y, year_end: y, year_label: yearStr.trim() };
  }

  return { year_start: null, year_end: null, year_label: yearStr };
}

const DATE_FORMATS = [
  'DD/MM/YYYY',
  'D/M/YYYY',
  'YYYY-MM-DD',
  'DD-MM-YYYY',
  'MM/DD/YYYY',
  'D MMM YYYY',
  'DD MMM YYYY',
  'MMMM D, YYYY',
];

export function parseDateIso(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;

  // Excel serial date number
  if (typeof value === 'number' && value > 1000) {
    // Excel epoch: Jan 1, 1900 = serial 1; but Excel wrongly treats 1900 as leap year,
    // so serial 1 = Jan 1 1900, serial 60 = Feb 29 1900 (doesn't exist), serial 61 = Mar 1 1900
    const excelEpochMs = new Date(1899, 11, 30).getTime();
    const d = new Date(excelEpochMs + value * 86400000);
    if (isNaN(d.getTime())) return null;
    return dayjs(d).format('YYYY-MM-DD');
  }

  const str = String(value).trim();
  for (const fmt of DATE_FORMATS) {
    const d = dayjs(str, fmt, true);
    if (d.isValid()) return d.format('YYYY-MM-DD');
  }

  // Fallback: let dayjs try to parse loosely
  const fallback = dayjs(str);
  if (fallback.isValid() && fallback.year() > 1970) return fallback.format('YYYY-MM-DD');

  return null;
}
