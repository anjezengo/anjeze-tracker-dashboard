import { Pool } from 'pg';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function resolveToIp(hostname: string): Promise<string | null> {
  return new Promise(resolve => {
    dns.resolve4(hostname, (err, addrs) => resolve(err ? null : addrs[0]));
  });
}

let _pool: Pool | null = null;

export async function getPool(): Promise<Pool> {
  if (_pool) return _pool;

  const connStr = process.env.DATABASE_URL;
  if (!connStr) throw new Error('DATABASE_URL not set');

  const url = new URL(connStr);
  const ip = await resolveToIp(url.hostname);

  _pool = new Pool({
    host: ip || url.hostname,
    port: parseInt(url.port || '5432'),
    database: url.pathname.slice(1),
    user: url.username,
    password: decodeURIComponent(url.password),
    ssl: { rejectUnauthorized: false, ...(ip ? { servername: url.hostname } : {}) },
    max: 5,
    idleTimeoutMillis: 10000,
  });

  return _pool;
}
