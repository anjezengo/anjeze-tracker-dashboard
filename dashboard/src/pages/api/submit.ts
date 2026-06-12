import type { NextApiRequest, NextApiResponse } from 'next';
import { getPool } from '@/lib/db';
import crypto from 'crypto';

function canonicalize(text: string | null): string | null {
  if (!text) return null;
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function parseNumeric(value: string | null): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[,₹$]/g, '');
  if (/^\s*(multiple|na)\s*$/i.test(cleaned)) return null;
  const parsed = parseFloat(cleaned);
  return !isNaN(parsed) && isFinite(parsed) ? parsed : null;
}

function parseYear(yearStr: string | null): { year_start: number | null; year_end: number | null; year_label: string | null } {
  if (!yearStr) return { year_start: null, year_end: null, year_label: null };
  const rangeMatch = yearStr.match(/^(\d{4})\s*-\s*(\d{2,4})$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    let end = parseInt(rangeMatch[2]);
    if (end < 100) {
      const century = Math.floor(start / 100) * 100;
      end = century + end;
      if (end < start) end += 100;
    }
    return { year_start: start, year_end: end, year_label: `${start}-${end}` };
  }
  if (/^\d{4}$/.test(yearStr)) {
    const y = parseInt(yearStr);
    return { year_start: y, year_end: y, year_label: yearStr };
  }
  return { year_start: null, year_end: null, year_label: yearStr };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const { year_start, year_end, year_label } = parseYear(body.year || null);
    const dateIso = body.date || null;

    const hashKey = `manual|${body.date || ''}|${body.project || ''}|${body.subProject || ''}|${Date.now()}`;
    const rowHash = 'manual-' + crypto.createHash('sha256').update(hashKey).digest('hex').slice(0, 24);

    const pool = await getPool();
    await pool.query(`
      INSERT INTO tracker_raw (
        year, date, project, sub_project, institute, type_of_institution,
        quantity, no_of_beneficiaries, amount, remarks,
        project_canon, sub_project_canon, institute_canon, type_of_institution_canon, remarks_canon,
        year_start, year_end, year_label, date_iso,
        quantity_num, no_of_beneficiaries_num, amount_num, row_hash
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19,
        $20, $21, $22, $23
      )
    `, [
      body.year || null,
      body.date || null,
      body.project || null,
      body.subProject || null,
      body.institute || null,
      body.typeOfInstitution || null,
      body.quantity || null,
      body.beneficiaries || null,
      body.amount || null,
      body.remarks || null,
      canonicalize(body.project || null),
      canonicalize(body.subProject || null),
      canonicalize(body.institute || null),
      canonicalize(body.typeOfInstitution || null),
      canonicalize(body.remarks || null),
      year_start,
      year_end,
      year_label,
      dateIso,
      parseNumeric(body.quantity || null),
      parseNumeric(body.beneficiaries || null),
      parseNumeric(body.amount || null),
      rowHash,
    ]);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Submit API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
