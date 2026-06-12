import type { NextApiRequest, NextApiResponse } from 'next';
import { getPool } from '@/lib/db';

type FilterOptionsResponse = {
  success: boolean;
  data?: {
    years: number[];
    projects: string[];
    subProjects: string[];
    institutes: string[];
    types: string[];
    initiatives: string[];
  };
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<FilterOptionsResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT
        ARRAY_AGG(DISTINCT year_start ORDER BY year_start) FILTER (WHERE year_start IS NOT NULL) AS years,
        ARRAY_AGG(DISTINCT project ORDER BY project) FILTER (WHERE project IS NOT NULL) AS projects,
        ARRAY_AGG(DISTINCT sub_project ORDER BY sub_project) FILTER (WHERE sub_project IS NOT NULL) AS sub_projects,
        ARRAY_AGG(DISTINCT institute ORDER BY institute) FILTER (WHERE institute IS NOT NULL) AS institutes,
        ARRAY_AGG(DISTINCT type_of_institution ORDER BY type_of_institution) FILTER (WHERE type_of_institution IS NOT NULL) AS types,
        ARRAY_AGG(DISTINCT initiatives ORDER BY initiatives) FILTER (WHERE initiatives IS NOT NULL) AS initiatives
      FROM facts_clean
    `);

    const row = result.rows[0] || {};

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      success: true,
      data: {
        years: (row.years || []).map(Number),
        projects: row.projects || [],
        subProjects: row.sub_projects || [],
        institutes: row.institutes || [],
        types: row.types || [],
        initiatives: row.initiatives || [],
      },
    });
  } catch (error: any) {
    console.error('Filter options API error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}
