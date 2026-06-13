import type { NextApiRequest, NextApiResponse } from 'next';
import { getPool } from '@/lib/db';

// One-shot truncate endpoint — protected by a secret token.
// DELETE this file after use.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).end();

    const token = req.headers['x-admin-token'] ?? req.query.token;
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const pool = await getPool();
    await pool.query('TRUNCATE tracker_raw');
    const r = await pool.query('SELECT COUNT(*) AS n FROM tracker_raw');
    return res.status(200).json({ ok: true, rowsAfter: Number(r.rows[0].n) });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
