import type { NextApiRequest, NextApiResponse } from 'next';
import { getPool } from '@/lib/db';
import { batchUpsert } from '@/lib/db-upsert';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { rows } = req.body as { rows?: Record<string, any>[] };
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ success: false, error: 'No rows received' });
  }

  try {
    const pool = await getPool();
    const stats = await batchUpsert(pool, rows);
    return res.status(200).json({ success: true, stats, errorSamples: stats.errorSamples });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}
