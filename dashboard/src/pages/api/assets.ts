/**
 * API Route: /api/assets
 * Returns asset (image, description) for a sub-project
 *
 * Query params:
 * - subProject: sub-project canonical name (required)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase, AssetRow } from '@/lib/supabase';

export type AssetsResponse = {
  success: boolean;
  data?: AssetRow | null;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AssetsResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { subProject } = req.query;

    if (!subProject || typeof subProject !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'subProject query parameter is required',
      });
    }

    const { data, error } = await supabase
      .from('dim_assets')
      .select('*')
      .eq('sub_project_canon', subProject)
      .single();

    if (error) {
      // 404 if not found
      if (error.code === 'PGRST116') {
        return res.status(200).json({ success: true, data: null });
      }
      throw error;
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Assets API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
