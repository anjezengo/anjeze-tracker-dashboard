import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    success: false,
    error: 'Google Sheets sync has been replaced by OneDrive sync. Use the ETL import script instead.',
  });
}
