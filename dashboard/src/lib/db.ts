import { Pool } from 'pg';

let _pool: Pool | null = null;

export async function getPool(): Promise<Pool> {
  if (_pool) return _pool;

  const connStr = process.env.DATABASE_URL;
  if (!connStr) throw new Error('DATABASE_URL not set');

  _pool = new Pool({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000,
  });

  return _pool;
}
