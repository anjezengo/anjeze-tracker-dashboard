import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const dbUrl = process.env.DATABASE_URL;

  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    node: process.version,
    env: process.env.NODE_ENV,
    database_url_set: !!dbUrl,
    database_url_prefix: dbUrl ? dbUrl.slice(0, 30) + '…' : null,
  };

  // Try importing xlsx
  try {
    const XLSX = await import('xlsx');
    checks.xlsx = `ok (${Object.keys(XLSX).length} exports)`;
  } catch (e: any) {
    checks.xlsx = `ERROR: ${e.message}`;
  }

  // Try a DB connection
  if (dbUrl) {
    try {
      const { getPool } = await import('@/lib/db');
      const pool = await getPool();
      const result = await pool.query('SELECT NOW() as now, COUNT(*) as row_count FROM tracker_raw');
      checks.db = `ok — ${result.rows[0].row_count} rows, server time ${result.rows[0].now}`;
    } catch (e: any) {
      checks.db = `ERROR: ${e.message}`;
    }
  } else {
    checks.db = 'skipped — DATABASE_URL not set';
  }

  const allOk = !Object.values(checks).some(v => typeof v === 'string' && v.startsWith('ERROR'));
  res.status(allOk ? 200 : 500).json(checks);
}
