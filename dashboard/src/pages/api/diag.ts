import type { NextApiRequest, NextApiResponse } from 'next';
import { getPool } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pool = await getPool();

    const [counts, sample, viewCheck, colSample] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(no_of_beneficiaries) AS has_beneficiaries_text,
          COUNT(no_of_beneficiaries_num) AS has_beneficiaries_num,
          COUNT(amount) AS has_amount_text,
          COUNT(amount_num) AS has_amount_num,
          COUNT(quantity) AS has_quantity_text,
          COUNT(quantity_num) AS has_quantity_num,
          COUNT(project_canon) AS has_project_canon,
          COUNT(initiatives) AS has_initiatives_text,
          COUNT(remarks) AS has_remarks_text,
          COUNT(institute) AS has_institute_text
        FROM tracker_raw
      `),
      pool.query(`
        SELECT
          sr_no, project, sub_project, initiatives,
          no_of_beneficiaries, no_of_beneficiaries_num,
          amount, amount_num,
          quantity, quantity_num,
          institute, type_of_institution
        FROM tracker_raw
        LIMIT 3
      `),
      pool.query(`
        SELECT COUNT(*) AS view_rows, SUM(beneficiaries) AS total_ben
        FROM facts_clean
      `),
      // Show a full row as JSON to reveal every column stored
      pool.query(`SELECT row_to_json(t) AS full_row FROM tracker_raw t LIMIT 1`),
    ]);

    return res.status(200).json({
      counts: counts.rows[0],
      sample: sample.rows,
      factsClean: viewCheck.rows[0],
      fullRow: colSample.rows[0]?.full_row ?? null,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
