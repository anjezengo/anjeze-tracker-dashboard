import type { NextApiRequest, NextApiResponse } from 'next';
import { getPool } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pool = await getPool();

    const [counts, sample, viewCheck] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(no_of_beneficiaries) AS has_beneficiaries_text,
          COUNT(no_of_beneficiaries_num) AS has_beneficiaries_num,
          COUNT(amount) AS has_amount_text,
          COUNT(amount_num) AS has_amount_num,
          COUNT(project_canon) AS has_project_canon
        FROM tracker_raw
      `),
      pool.query(`
        SELECT
          sr_no, project, sub_project,
          no_of_beneficiaries, no_of_beneficiaries_num,
          amount, amount_num,
          quantity, quantity_num
        FROM tracker_raw
        WHERE no_of_beneficiaries IS NOT NULL
        LIMIT 5
      `),
      pool.query(`
        SELECT COUNT(*) AS view_rows, SUM(beneficiaries) AS total_ben
        FROM facts_clean
      `),
    ]);

    return res.status(200).json({
      counts: counts.rows[0],
      sample: sample.rows,
      factsClean: viewCheck.rows[0],
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
