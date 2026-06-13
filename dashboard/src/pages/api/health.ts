import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    node: process.version,
    env: process.env.NODE_ENV,
    database_url_set: !!process.env.DATABASE_URL,
  };

  // Test 1: pg Pool import
  try {
    const { Pool } = await import('pg');
    new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    checks.pg = 'ok';
  } catch (e: any) { checks.pg = `ERROR: ${e.message}`; }

  // Test 2: crypto
  try {
    const crypto = await import('crypto');
    const h = crypto.createHash('sha256').update('test').digest('hex');
    checks.crypto = h.length === 64 ? 'ok' : 'wrong length';
  } catch (e: any) { checks.crypto = `ERROR: ${e.message}`; }

  // Test 3: dayjs + customParseFormat
  try {
    const dayjs = (await import('dayjs')).default;
    const cpf = (await import('dayjs/plugin/customParseFormat')).default;
    dayjs.extend(cpf);
    checks.dayjs = dayjs('15/06/2024', 'DD/MM/YYYY', true).format('YYYY-MM-DD');
  } catch (e: any) { checks.dayjs = `ERROR: ${e.message}`; }

  // Test 4: etl functions
  try {
    const { canonicalize, parseNumeric, parseYear, parseDateIso } = await import('@/lib/etl');
    checks.etl = {
      canonicalize: canonicalize('  hello world  '),
      parseNumeric: parseNumeric('1,234'),
      parseYear: parseYear('2016-17'),
      parseDateIso: parseDateIso(44635),
    };
  } catch (e: any) { checks.etl = `ERROR: ${e.message}`; }

  // Test 5: db-upsert (processRawRow + batchUpsert imports)
  try {
    const { processRawRow } = await import('@/lib/db-upsert');
    const row = processRawRow({ 'Project': 'Test', 'Sr.No': '1', 'Date': '01/01/2024' });
    checks.db_upsert = row ? `ok — hash ${row[27].slice(0, 8)}…` : 'null row';
  } catch (e: any) { checks.db_upsert = `ERROR: ${e.message}`; }

  // Test 6: DB connection + row count
  try {
    const { getPool } = await import('@/lib/db');
    const pool = await getPool();
    const r = await pool.query('SELECT COUNT(*) as n FROM tracker_raw');
    checks.db = `ok — ${r.rows[0].n} rows`;
  } catch (e: any) { checks.db = `ERROR: ${e.message}`; }

  const hasError = Object.values(checks).some(v => typeof v === 'string' && v.startsWith('ERROR'));
  return res.status(hasError ? 500 : 200).json(checks);
}
