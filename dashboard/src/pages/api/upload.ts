import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import crypto from 'crypto';
import * as XLSX from 'xlsx';
import { getPool } from '@/lib/db';
import { canonicalize, parseNumeric, parseYear, parseDateIso } from '@/lib/etl';

export const config = { api: { bodyParser: false } };

// Column name aliases — handles both old and new Excel headers
const COL = {
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

async function parseWorkbook(filePath: string): Promise<Record<string, any>[]> {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: false });
  const sheetName = wb.SheetNames.find(n => /tracker/i.test(n)) ?? wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(ws, { raw: true, defval: null });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const form = formidable({ maxFileSize: 20 * 1024 * 1024 });

  let filePath: string;
  try {
    const [, files] = await form.parse(req);
    const uploaded = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploaded) return res.status(400).json({ success: false, error: 'No file uploaded' });
    filePath = uploaded.filepath;
  } catch (e: any) {
    return res.status(400).json({ success: false, error: `Upload failed: ${e.message}` });
  }

  let rows: Record<string, any>[];
  try {
    rows = await parseWorkbook(filePath);
  } catch (e: any) {
    return res.status(422).json({ success: false, error: `Cannot parse Excel: ${e.message}` });
  } finally {
    try { fs.unlinkSync(filePath); } catch {}
  }

  const pool = await getPool();
  let imported = 0;
  let errors = 0;
  let nullDates = 0;
  const errorDetails: string[] = [];

  for (const row of rows) {
    try {
      const srNo       = str(getCol(row, COL.srNo));
      const yearRaw    = str(getCol(row, COL.year));
      const dateRaw    = getCol(row, COL.date);
      const project    = str(getCol(row, COL.project));
      const subProject = str(getCol(row, COL.subProject));

      if (!project && !subProject && !srNo) continue; // blank row

      const dateIso    = parseDateIso(dateRaw);
      if (!dateIso) nullDates++;

      const { year_start, year_end, year_label } = parseYear(yearRaw);
      const hashInput  = `${srNo ?? ''}|${dateRaw ?? ''}|${project ?? ''}`;
      const rowHash    = crypto.createHash('sha256').update(hashInput).digest('hex').slice(0, 32);

      await pool.query(`
        INSERT INTO tracker_raw (
          sr_no, year, date, project, sub_project, institute, type_of_institution,
          quantity, no_of_beneficiaries, amount, initiatives, remarks, comments, on_account_kind,
          project_canon, sub_project_canon, institute_canon, type_of_institution_canon,
          remarks_canon, initiatives_canon,
          year_start, year_end, year_label, date_iso,
          quantity_num, no_of_beneficiaries_num, amount_num,
          row_hash
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
          $15,$16,$17,$18,$19,$20,
          $21,$22,$23,$24,$25,$26,$27,$28
        )
        ON CONFLICT (row_hash) DO UPDATE SET
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
          amount_num=EXCLUDED.amount_num
      `, [
        srNo,
        yearRaw,
        str(dateRaw),
        project,
        subProject,
        str(getCol(row, COL.institute)),
        str(getCol(row, COL.typeInst)),
        str(getCol(row, COL.quantity)),
        str(getCol(row, COL.beneficiaries)),
        str(getCol(row, COL.amount)),
        str(getCol(row, COL.initiatives)),
        str(getCol(row, COL.remarks)),
        str(getCol(row, COL.comments)),
        str(getCol(row, COL.onAccount)),
        canonicalize(project),
        canonicalize(subProject),
        canonicalize(str(getCol(row, COL.institute))),
        canonicalize(str(getCol(row, COL.typeInst))),
        canonicalize(str(getCol(row, COL.remarks))),
        canonicalize(str(getCol(row, COL.initiatives))),
        year_start,
        year_end,
        year_label,
        dateIso,
        parseNumeric(str(getCol(row, COL.quantity))),
        parseNumeric(str(getCol(row, COL.beneficiaries))),
        parseNumeric(str(getCol(row, COL.amount))),
        rowHash,
      ]);

      imported++;
    } catch (e: any) {
      errors++;
      if (errorDetails.length < 5) errorDetails.push(String(e.message).slice(0, 120));
    }
  }

  return res.status(200).json({
    success: true,
    stats: {
      total: rows.length,
      imported,
      errors,
      nullDates,
      nullDateRate: rows.length > 0 ? ((nullDates / rows.length) * 100).toFixed(1) + '%' : '0%',
    },
    errorSamples: errorDetails,
  });
}
