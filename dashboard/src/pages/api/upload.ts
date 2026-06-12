import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { getPool } from '@/lib/db';
import { batchUpsert } from '@/lib/db-upsert';

export const config = { api: { bodyParser: false } };

async function parseWorkbook(filePath: string): Promise<Record<string, any>[]> {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: false });
  const sheetName = wb.SheetNames.find(n => /tracker/i.test(n)) ?? wb.SheetNames[0];
  return XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { raw: true, defval: null });
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

  try {
    const pool = await getPool();
    const stats = await batchUpsert(pool, rows);
    return res.status(200).json({ success: true, stats, errorSamples: stats.errorSamples });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}
