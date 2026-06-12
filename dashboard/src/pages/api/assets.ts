import type { NextApiRequest, NextApiResponse } from 'next';
import { getPool } from '@/lib/db';

type AssetResponse = {
  success: boolean;
  data?: {
    sub_project_canon: string;
    image_url: string | null;
    description: string | null;
  } | null;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<AssetResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const subProject = req.query.subProject as string;
  if (!subProject) {
    return res.status(400).json({ success: false, error: 'subProject query param required' });
  }

  try {
    const pool = await getPool();
    const result = await pool.query(
      'SELECT sub_project_canon, image_url, description FROM dim_assets WHERE sub_project_canon = $1',
      [subProject]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ success: false, data: null });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Assets API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
