import type { NextApiRequest, NextApiResponse } from 'next';
import * as XLSX from 'xlsx';
import { getPool } from '@/lib/db';
import { batchUpsert } from '@/lib/db-upsert';
import { onedriveToDownloadUrl, ONEDRIVE_SHARE_URL } from '@/lib/onedrive';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const downloadUrl = onedriveToDownloadUrl(ONEDRIVE_SHARE_URL);
  let buffer: Buffer;

  try {
    const response = await fetch(downloadUrl, {
      headers: { 'User-Agent': 'AnjezeDashboard/1.0' },
      redirect: 'follow',
    });
    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: `OneDrive returned ${response.status}: ${response.statusText}. Download the file and use the Upload page instead.`,
      });
    }
    buffer = Buffer.from(await response.arrayBuffer());
  } catch (e: any) {
    return res.status(502).json({ success: false, error: `Failed to fetch from OneDrive: ${e.message}` });
  }

  let rows: Record<string, any>[];
  try {
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false });
    const sheetName = wb.SheetNames.find(n => /tracker/i.test(n)) ?? wb.SheetNames[0];
    rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { raw: true, defval: null });
  } catch (e: any) {
    return res.status(422).json({ success: false, error: `Cannot parse Excel: ${e.message}` });
  }

  try {
    const pool = await getPool();
    const stats = await batchUpsert(pool, rows);
    return res.status(200).json({
      success: true,
      source: 'onedrive',
      syncedAt: new Date().toISOString(),
      stats,
      errorSamples: stats.errorSamples,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}
