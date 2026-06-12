import type { NextApiRequest, NextApiResponse } from 'next';
import { parseFiltersFromQuery, buildSqlFilters } from '@/lib/filters';
import { getPool } from '@/lib/db';

export type MetricsResponse = {
  success: boolean;
  data?: {
    bySubProject: Array<{
      sub_project: string;
      total_beneficiaries: number;
      total_amount: number;
      total_quantity: number;
      count: number;
    }>;
    byYear: Array<{
      year_start: number;
      total_beneficiaries: number;
      total_amount: number;
      total_quantity: number;
      count: number;
    }>;
    byInitiatives: Array<{
      initiatives: string;
      total_beneficiaries: number;
      total_amount: number;
      count: number;
    }>;
    remarksQuantity: Array<{
      remarks: string;
      quantity: number;
      institute: string | null;
      sub_project: string | null;
      count: number;
    }>;
    overall: {
      total_beneficiaries: number;
      total_amount: number;
      total_quantity: number;
      total_records: number;
      unique_projects: number;
      unique_sub_projects: number;
      unique_initiatives: number;
      project_list: string[];
      sub_project_list: string[];
      initiatives_list: string[];
    };
  };
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<MetricsResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const filters = parseFiltersFromQuery(req.query);
    const { clause, params } = buildSqlFilters(filters);
    const pool = await getPool();

    const [subProjRes, yearRes, initiativesRes, overallRes, remarksRes] = await Promise.all([
      pool.query(`
        SELECT
          sub_project,
          COALESCE(SUM(beneficiaries), 0)::float AS total_beneficiaries,
          COALESCE(SUM(amount), 0)::float AS total_amount,
          COALESCE(SUM(quantity), 0)::float AS total_quantity,
          COUNT(*)::int AS count
        FROM facts_clean
        ${clause}
        GROUP BY sub_project
        ORDER BY total_beneficiaries DESC NULLS LAST
      `, params),

      pool.query(`
        SELECT
          year_start,
          COALESCE(SUM(beneficiaries), 0)::float AS total_beneficiaries,
          COALESCE(SUM(amount), 0)::float AS total_amount,
          COALESCE(SUM(quantity), 0)::float AS total_quantity,
          COUNT(*)::int AS count
        FROM facts_clean
        ${clause}
        GROUP BY year_start
        ORDER BY year_start NULLS LAST
      `, params),

      pool.query(`
        SELECT
          initiatives,
          COALESCE(SUM(beneficiaries), 0)::float AS total_beneficiaries,
          COALESCE(SUM(amount), 0)::float AS total_amount,
          COUNT(*)::int AS count
        FROM facts_clean
        ${clause}
        GROUP BY initiatives
        ORDER BY total_beneficiaries DESC NULLS LAST
      `, params),

      pool.query(`
        SELECT
          COALESCE(SUM(beneficiaries), 0)::float AS total_beneficiaries,
          COALESCE(SUM(amount), 0)::float AS total_amount,
          COALESCE(SUM(quantity), 0)::float AS total_quantity,
          COUNT(*)::int AS total_records,
          COUNT(DISTINCT project)::int AS unique_projects,
          COUNT(DISTINCT sub_project)::int AS unique_sub_projects,
          COUNT(DISTINCT initiatives)::int AS unique_initiatives,
          ARRAY_AGG(DISTINCT project ORDER BY project) FILTER (WHERE project IS NOT NULL) AS project_list,
          ARRAY_AGG(DISTINCT sub_project ORDER BY sub_project) FILTER (WHERE sub_project IS NOT NULL) AS sub_project_list,
          ARRAY_AGG(DISTINCT initiatives ORDER BY initiatives) FILTER (WHERE initiatives IS NOT NULL) AS initiatives_list
        FROM facts_clean
        ${clause}
      `, params),

      pool.query(`
        SELECT
          remarks,
          SUM(quantity)::float AS quantity,
          MIN(institute) AS institute,
          MIN(sub_project) AS sub_project,
          COUNT(*)::int AS count
        FROM facts_clean
        ${clause ? clause + ' AND' : 'WHERE'} remarks IS NOT NULL AND quantity > 0
        GROUP BY remarks
        ORDER BY quantity DESC
        LIMIT 20
      `, params),
    ]);

    const overall = overallRes.rows[0] || {};

    return res.status(200).json({
      success: true,
      data: {
        bySubProject: subProjRes.rows,
        byYear: yearRes.rows,
        byInitiatives: initiativesRes.rows,
        remarksQuantity: remarksRes.rows,
        overall: {
          total_beneficiaries: overall.total_beneficiaries || 0,
          total_amount: overall.total_amount || 0,
          total_quantity: overall.total_quantity || 0,
          total_records: overall.total_records || 0,
          unique_projects: overall.unique_projects || 0,
          unique_sub_projects: overall.unique_sub_projects || 0,
          unique_initiatives: overall.unique_initiatives || 0,
          project_list: overall.project_list || [],
          sub_project_list: overall.sub_project_list || [],
          initiatives_list: overall.initiatives_list || [],
        },
      },
    });
  } catch (error: any) {
    console.error('Metrics API error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}
