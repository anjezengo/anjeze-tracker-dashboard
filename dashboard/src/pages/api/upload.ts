import type { NextApiRequest, NextApiResponse } from 'next';
import { getPool } from '@/lib/db';
import { batchUpsert } from '@/lib/db-upsert';

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const body = req.body;
    console.log('[upload] body type:', typeof body, '| has rows:', Array.isArray(body?.rows), '| row count:', body?.rows?.length ?? 'n/a');

    if (!body || !Array.isArray(body.rows) || body.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: `No rows received. body type=${typeof body}, rows=${JSON.stringify(body?.rows ?? null).slice(0, 100)}`,
      });
    }

    const pool = await getPool();
    console.log('[upload] pool ok, upserting', body.rows.length, 'rows');

    const stats = await batchUpsert(pool, body.rows);
    console.log('[upload] done —', stats.inserted, 'inserted,', stats.updated, 'updated,', stats.errors, 'errors');

    return res.status(200).json({ success: true, stats, errorSamples: stats.errorSamples });
  } catch (e: any) {
    console.error('[upload] unhandled error:', e?.message, e?.stack);
    return res.status(500).json({ success: false, error: e?.message ?? String(e) });
  }
}
