import type { Pool } from 'pg';
import crypto from 'crypto';
import { canonicalize, parseNumeric, parseYear, parseDateIso } from './etl';

export const COL_ALIASES = {
  srNo:          ['Sr-No-', 'Sr.No', 'Sr No', 'Sr. No.'],
  year:          ['Year'],
  date:          ['Date'],
  project:       ['Project'],
  subProject:    ['Sub Project', 'Sub-Project'],
  institute:     ['Name of Institute - Area of Service', 'Name of Institute / Area of Service', 'Institute'],
  typeInst:      ['Type of Institution', 'Type Of Institution'],
  quantity:      ['Quantity'],
  beneficiaries: ['No- of Beneficiaries', 'No. of Beneficiaries', 'No of Beneficiaries'],
  amount:        ['Amount'],
  initiatives:   ['Initiatives', 'Cause'],
  remarks:       ['Services-Remarks', 'Services / Remarks', 'Remarks'],
  comments:      ['Comments', 'Comments by Pankti'],
  onAccount:     ['On account- Kind', 'On account/ Kind'],
};

function getCol(row: Record<string, any>, aliases: string[]): any {
  for (const a of aliases) if (row[a] !== undefined) return row[a];
  return undefined;
}

function str(v: any): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

export type ProcessedRow = [
  string | null, // sr_no
  string | null, // year
  string | null, // date
  string | null, // project
  string | null, // sub_project
  string | null, // institute
  string | null, // type_of_institution
  string | null, // quantity
  string | null, // no_of_beneficiaries
  string | null, // amount
  string | null, // initiatives
  string | null, // remarks
  string | null, // comments
  string | null, // on_account_kind
  string | null, // project_canon
  string | null, // sub_project_canon
  string | null, // institute_canon
  string | null, // type_of_institution_canon
  string | null, // remarks_canon
  string | null, // initiatives_canon
  number | null, // year_start
  number | null, // year_end
  string | null, // year_label
  string | null, // date_iso
  number | null, // quantity_num
  number | null, // no_of_beneficiaries_num
  number | null, // amount_num
  string,        // row_hash
];

export function processRawRow(row: Record<string, any>): ProcessedRow | null {
  const srNo       = str(getCol(row, COL_ALIASES.srNo));
  const yearRaw    = str(getCol(row, COL_ALIASES.year));
  const dateRaw    = getCol(row, COL_ALIASES.date);
  const project    = str(getCol(row, COL_ALIASES.project));
  const subProject = str(getCol(row, COL_ALIASES.subProject));

  if (!project && !subProject && !srNo) return null; // blank row

  const dateIso  = parseDateIso(dateRaw);
  const { year_start, year_end, year_label } = parseYear(yearRaw);
  const hashInput = `${srNo ?? ''}|${dateRaw ?? ''}|${project ?? ''}`;
  const rowHash   = crypto.createHash('sha256').update(hashInput).digest('hex').slice(0, 32);

  return [
    srNo,
    yearRaw,
    str(dateRaw),
    project,
    subProject,
    str(getCol(row, COL_ALIASES.institute)),
    str(getCol(row, COL_ALIASES.typeInst)),
    str(getCol(row, COL_ALIASES.quantity)),
    str(getCol(row, COL_ALIASES.beneficiaries)),
    str(getCol(row, COL_ALIASES.amount)),
    str(getCol(row, COL_ALIASES.initiatives)),
    str(getCol(row, COL_ALIASES.remarks)),
    str(getCol(row, COL_ALIASES.comments)),
    str(getCol(row, COL_ALIASES.onAccount)),
    canonicalize(project),
    canonicalize(subProject),
    canonicalize(str(getCol(row, COL_ALIASES.institute))),
    canonicalize(str(getCol(row, COL_ALIASES.typeInst))),
    canonicalize(str(getCol(row, COL_ALIASES.remarks))),
    canonicalize(str(getCol(row, COL_ALIASES.initiatives))),
    year_start,
    year_end,
    year_label,
    dateIso,
    parseNumeric(str(getCol(row, COL_ALIASES.quantity))),
    parseNumeric(str(getCol(row, COL_ALIASES.beneficiaries))),
    parseNumeric(str(getCol(row, COL_ALIASES.amount))),
    rowHash,
  ];
}

const COLS = `sr_no, year, date, project, sub_project, institute, type_of_institution,
  quantity, no_of_beneficiaries, amount, initiatives, remarks, comments, on_account_kind,
  project_canon, sub_project_canon, institute_canon, type_of_institution_canon,
  remarks_canon, initiatives_canon,
  year_start, year_end, year_label, date_iso,
  quantity_num, no_of_beneficiaries_num, amount_num, row_hash`;

const UPDATE_SET = `
  sr_no=EXCLUDED.sr_no, year=EXCLUDED.year, date=EXCLUDED.date,
  project=EXCLUDED.project, sub_project=EXCLUDED.sub_project,
  institute=EXCLUDED.institute, type_of_institution=EXCLUDED.type_of_institution,
  quantity=EXCLUDED.quantity, no_of_beneficiaries=EXCLUDED.no_of_beneficiaries,
  amount=EXCLUDED.amount, initiatives=EXCLUDED.initiatives,
  remarks=EXCLUDED.remarks, comments=EXCLUDED.comments,
  on_account_kind=EXCLUDED.on_account_kind,
  project_canon=EXCLUDED.project_canon, sub_project_canon=EXCLUDED.sub_project_canon,
  institute_canon=EXCLUDED.institute_canon,
  type_of_institution_canon=EXCLUDED.type_of_institution_canon,
  remarks_canon=EXCLUDED.remarks_canon, initiatives_canon=EXCLUDED.initiatives_canon,
  year_start=EXCLUDED.year_start, year_end=EXCLUDED.year_end, year_label=EXCLUDED.year_label,
  date_iso=EXCLUDED.date_iso,
  quantity_num=EXCLUDED.quantity_num, no_of_beneficiaries_num=EXCLUDED.no_of_beneficiaries_num,
  amount_num=EXCLUDED.amount_num`;

const NUM_COLS = 28;
const BATCH_SIZE = 100;

export type UpsertStats = {
  total: number;
  imported: number;
  errors: number;
  nullDates: number;
  nullDateRate: string;
  errorSamples: string[];
};

export async function batchUpsert(pool: Pool, rawRows: Record<string, any>[]): Promise<UpsertStats> {
  // Process all rows first
  const processed: ProcessedRow[] = [];
  let nullDates = 0;
  for (const raw of rawRows) {
    const row = processRawRow(raw);
    if (!row) continue;
    if (!row[23]) nullDates++; // date_iso is index 23
    processed.push(row);
  }

  let imported = 0;
  let errors = 0;
  const errorSamples: string[] = [];

  // Batch insert
  for (let i = 0; i < processed.length; i += BATCH_SIZE) {
    const batch = processed.slice(i, i + BATCH_SIZE);
    const placeholders: string[] = [];
    const params: any[] = [];
    let idx = 1;

    for (const row of batch) {
      const rowPlaceholders = Array.from({ length: NUM_COLS }, (_, c) => `$${idx + c}`).join(',');
      placeholders.push(`(${rowPlaceholders})`);
      params.push(...row);
      idx += NUM_COLS;
    }

    try {
      await pool.query(
        `INSERT INTO tracker_raw (${COLS})
         VALUES ${placeholders.join(',\n')}
         ON CONFLICT (row_hash) DO UPDATE SET ${UPDATE_SET}`,
        params
      );
      imported += batch.length;
    } catch (e: any) {
      // On batch failure, try rows individually so one bad row doesn't kill the batch
      for (const row of batch) {
        try {
          await pool.query(
            `INSERT INTO tracker_raw (${COLS}) VALUES (${Array.from({ length: NUM_COLS }, (_, c) => `$${c + 1}`).join(',')})
             ON CONFLICT (row_hash) DO UPDATE SET ${UPDATE_SET}`,
            row
          );
          imported++;
        } catch (rowErr: any) {
          errors++;
          if (errorSamples.length < 5) errorSamples.push(String(rowErr.message).slice(0, 120));
        }
      }
    }
  }

  return {
    total: rawRows.length,
    imported,
    errors,
    nullDates,
    nullDateRate: processed.length > 0 ? ((nullDates / processed.length) * 100).toFixed(1) + '%' : '0%',
    errorSamples,
  };
}
