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
    byCause: Array<{
      cause: string;
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
      unique_causes: number;
      project_list: string[];
      sub_project_list: string[];
      cause_list: string[];
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
    // Parse filters from query (arrays are already passed correctly by Next.js)
    const filters = parseFiltersFromQuery(req.query);

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
          byCause: [],
          remarksQuantity: [],
          overall: {
            total_beneficiaries: 0,
            total_amount: 0,
            total_quantity: 0,
            total_records: 0,
            unique_projects: 0,
            unique_sub_projects: 0,
            unique_causes: 0,
            project_list: [],
            sub_project_list: [],
            cause_list: [],
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

    const byCauseMap = new Map<string, {
      total_beneficiaries: number;
      total_amount: number;
      count: number;
    }>();

    // Aggregate remarks + quantity (where both exist)
    const remarksQuantityMap = new Map<string, {
      quantity: number;
      institute: string | null;
      sub_project: string | null;
      count: number;
    }>();

    const uniqueProjects = new Set<string>();
    const uniqueSubProjects = new Set<string>();
    const uniqueCauses = new Set<string>();
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

      // By cause
      if (row.cause) {
        uniqueCauses.add(row.cause);
        const current = byCauseMap.get(row.cause) || {
          total_beneficiaries: 0,
          total_amount: 0,
          count: 0,
        };

        current.total_beneficiaries += row.beneficiaries || 0;
        current.total_amount += row.amount || 0;
        current.count += 1;

        byCauseMap.set(row.cause, current);
      }

      // Remarks + Quantity (only where BOTH exist)
      if (row.remarks && row.quantity && row.quantity > 0) {
        const current = remarksQuantityMap.get(row.remarks) || {
          quantity: 0,
          institute: row.institute || null,
          sub_project: row.sub_project || null,
          count: 0,
        };

        current.quantity += row.quantity;
        current.count += 1;
        // Keep the first institute/sub_project we see for this remark
        if (!current.institute && row.institute) {
          current.institute = row.institute;
        }
        if (!current.sub_project && row.sub_project) {
          current.sub_project = row.sub_project;
        }

        remarksQuantityMap.set(row.remarks, current);
      }

      // Overall
      if (row.project) uniqueProjects.add(row.project);
      if (row.sub_project) uniqueSubProjects.add(row.sub_project);
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

    const byCause = Array.from(byCauseMap.entries())
      .map(([cause, stats]) => ({ cause, ...stats }))
      .sort((a, b) => b.total_beneficiaries - a.total_beneficiaries);

    const remarksQuantity = Array.from(remarksQuantityMap.entries())
      .map(([remarks, data]) => ({ remarks, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 20); // Limit to top 20 items

    return res.status(200).json({
      success: true,
      data: {
        bySubProject,
        byYear,
        byCause,
        remarksQuantity,
        overall: {
          total_beneficiaries: totalBeneficiaries,
          total_amount: totalAmount,
          total_quantity: totalQuantity,
          total_records: rows.length,
          unique_projects: uniqueProjects.size,
          unique_sub_projects: uniqueSubProjects.size,
          unique_causes: uniqueCauses.size,
          project_list: Array.from(uniqueProjects).sort(),
          sub_project_list: Array.from(uniqueSubProjects).sort(),
          cause_list: Array.from(uniqueCauses).sort(),
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
