/**
 * API Route: /api/metrics
 * Returns aggregated metrics filtered by query params
 *
 * Query params:
 * - years: comma-separated years (e.g., "2018,2019")
 * - subProject: sub-project name
 * - project: project name
 * - institute: institute name
 * - type: institution type
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { FilterState, parseFiltersFromQuery, applyFiltersToQuery } from '@/lib/filters';

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
    overall: {
      total_beneficiaries: number;
      total_amount: number;
      total_quantity: number;
      total_records: number;
      unique_projects: number;
      unique_sub_projects: number;
    };
  };
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MetricsResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Parse filters from query
    const queryFilters: any = {};
    if (req.query.years) {
      const yearsStr = Array.isArray(req.query.years) ? req.query.years[0] : req.query.years;
      queryFilters.years = yearsStr.split(',').map(Number);
    }
    if (req.query.project) queryFilters.project = req.query.project;
    if (req.query.subProject) queryFilters.subProject = req.query.subProject;
    if (req.query.institute) queryFilters.institute = req.query.institute;
    if (req.query.type) queryFilters.type = req.query.type;

    const filters = parseFiltersFromQuery(queryFilters);

    // Build base query
    let baseQuery = supabase.from('facts_clean').select('*');
    baseQuery = applyFiltersToQuery(baseQuery, filters);

    const { data: rows, error } = await baseQuery;

    if (error) {
      throw error;
    }

    if (!rows) {
      return res.status(200).json({
        success: true,
        data: {
          bySubProject: [],
          byYear: [],
          overall: {
            total_beneficiaries: 0,
            total_amount: 0,
            total_quantity: 0,
            total_records: 0,
            unique_projects: 0,
            unique_sub_projects: 0,
          },
        },
      });
    }

    // Aggregate by sub-project
    const bySubProjectMap = new Map<string, {
      total_beneficiaries: number;
      total_amount: number;
      total_quantity: number;
      count: number;
    }>();

    const byYearMap = new Map<number, {
      total_beneficiaries: number;
      total_amount: number;
      total_quantity: number;
      count: number;
    }>();

    const uniqueProjects = new Set<string>();
    const uniqueSubProjects = new Set<string>();
    let totalBeneficiaries = 0;
    let totalAmount = 0;
    let totalQuantity = 0;

    for (const row of rows) {
      // By sub-project
      if (row.sub_project) {
        uniqueSubProjects.add(row.sub_project);
        const current = bySubProjectMap.get(row.sub_project) || {
          total_beneficiaries: 0,
          total_amount: 0,
          total_quantity: 0,
          count: 0,
        };

        current.total_beneficiaries += row.beneficiaries || 0;
        current.total_amount += row.amount || 0;
        current.total_quantity += row.quantity || 0;
        current.count += 1;

        bySubProjectMap.set(row.sub_project, current);
      }

      // By year
      if (row.year_start) {
        const current = byYearMap.get(row.year_start) || {
          total_beneficiaries: 0,
          total_amount: 0,
          total_quantity: 0,
          count: 0,
        };

        current.total_beneficiaries += row.beneficiaries || 0;
        current.total_amount += row.amount || 0;
        current.total_quantity += row.quantity || 0;
        current.count += 1;

        byYearMap.set(row.year_start, current);
      }

      // Overall
      if (row.project) uniqueProjects.add(row.project);
      totalBeneficiaries += row.beneficiaries || 0;
      totalAmount += row.amount || 0;
      totalQuantity += row.quantity || 0;
    }

    // Convert maps to arrays
    const bySubProject = Array.from(bySubProjectMap.entries())
      .map(([sub_project, stats]) => ({ sub_project, ...stats }))
      .sort((a, b) => b.total_beneficiaries - a.total_beneficiaries);

    const byYear = Array.from(byYearMap.entries())
      .map(([year_start, stats]) => ({ year_start, ...stats }))
      .sort((a, b) => a.year_start - b.year_start);

    return res.status(200).json({
      success: true,
      data: {
        bySubProject,
        byYear,
        overall: {
          total_beneficiaries: totalBeneficiaries,
          total_amount: totalAmount,
          total_quantity: totalQuantity,
          total_records: rows.length,
          unique_projects: uniqueProjects.size,
          unique_sub_projects: uniqueSubProjects.size,
        },
      },
    });
  } catch (error: any) {
    console.error('Metrics API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
