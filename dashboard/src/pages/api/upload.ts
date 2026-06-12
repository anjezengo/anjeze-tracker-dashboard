import type { NextApiRequest, NextApiResponse } from 'next';
import * as XLSX from 'xlsx';
import { getPool } from '@/lib/db';
import { batchUpsert } from '@/lib/db-upsert';

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { fileData } = req.body as { fileData?: string };
  if (!fileData) {
    return res.status(400).json({ success: false, error: 'No file data received' });
  }

  let rows: Record<string, any>[];
  try {
    const buffer = Buffer.from(fileData, 'base64');
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false });
    const sheetName = wb.SheetNames.find(n => /tracker/i.test(n)) ?? wb.SheetNames[0];
    rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { raw: true, defval: null });
  } catch (e: any) {
    return res.status(422).json({ success: false, error: `Cannot parse Excel: ${e.message}` });
  }

  try {
    const pool = await getPool();
    const stats = await batchUpsert(pool, rows);
    return res.status(200).json({ success: true, stats, errorSamples: stats.errorSamples });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}
