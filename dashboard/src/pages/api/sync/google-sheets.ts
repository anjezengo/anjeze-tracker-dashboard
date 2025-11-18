/**
 * Manual Google Sheets Sync API Endpoint
 * Triggers sync from Google Sheets to Supabase
 * Supports incremental sync (only new rows)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { fetchNewRows, getSheetRowCount } from '@/lib/googleSheets';
import { cleanRow } from '@/lib/dataCleaning';

interface SyncResponse {
  success: boolean;
  message?: string;
  stats?: {
    totalRowsInSheet: number;
    lastSyncedCount: number;
    newRowsFetched: number;
    rowsSynced: number;
    errors: number;
  };
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SyncResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log('🔄 Starting Google Sheets sync...');

    // Initialize Supabase client with service role key (server-side only)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get current sync metadata
    const { data: syncMeta, error: metaError } = await supabase
      .from('sync_metadata')
      .select('*')
      .eq('sync_source', 'google_sheets')
      .single();

    if (metaError && metaError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Failed to fetch sync metadata: ${metaError.message}`);
    }

    const lastSyncedRowCount = syncMeta?.last_synced_row_count || 0;
    console.log(`📊 Last synced row count: ${lastSyncedRowCount}`);

    // Get current total row count in Google Sheets
    const totalRowsInSheet = await getSheetRowCount();
    console.log(`📊 Total rows in Google Sheets: ${totalRowsInSheet}`);

    // Check if there are new rows
    if (totalRowsInSheet <= lastSyncedRowCount) {
      console.log('✓ No new rows to sync');

      // Update sync metadata timestamp
      await supabase
        .from('sync_metadata')
        .update({
          last_sync_timestamp: new Date().toISOString(),
          last_sync_status: 'success'
        })
        .eq('sync_source', 'google_sheets');

      return res.status(200).json({
        success: true,
        message: 'No new rows to sync',
        stats: {
          totalRowsInSheet,
          lastSyncedCount: lastSyncedRowCount,
          newRowsFetched: 0,
          rowsSynced: 0,
          errors: 0
        },
        timestamp: new Date().toISOString()
      });
    }

    // Fetch only new rows from Google Sheets
    console.log(`📥 Fetching new rows (from row ${lastSyncedRowCount + 1})...`);
    const rawRows = await fetchNewRows(lastSyncedRowCount);
    console.log(`✓ Fetched ${rawRows.length} new rows`);

    if (rawRows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No new rows to sync',
        stats: {
          totalRowsInSheet,
          lastSyncedCount: lastSyncedRowCount,
          newRowsFetched: 0,
          rowsSynced: 0,
          errors: 0
        },
        timestamp: new Date().toISOString()
      });
    }

    // Clean and transform rows
    console.log('🧹 Cleaning and transforming rows...');
    const cleanedRows = rawRows.map(cleanRow);

    // Sync to Supabase (UPSERT using row_hash to avoid duplicates)
    console.log('💾 Syncing to Supabase...');
    let synced = 0;
    let errors = 0;

    for (const row of cleanedRows) {
      try {
        const { error: upsertError } = await supabase
          .from('tracker_raw')
          .upsert(row, {
            onConflict: 'row_hash',
          });

        if (upsertError) {
          console.error('Error upserting row:', upsertError);
          errors++;
        } else {
          synced++;
        }
      } catch (err) {
        console.error('Exception upserting row:', err);
        errors++;
      }
    }

    console.log(`✓ Synced ${synced}/${cleanedRows.length} rows`);

    // Update sync metadata
    const newRowCount = totalRowsInSheet;
    await supabase
      .from('sync_metadata')
      .upsert({
        sync_source: 'google_sheets',
        last_synced_row_count: newRowCount,
        last_sync_timestamp: new Date().toISOString(),
        last_sync_status: errors === 0 ? 'success' : 'partial',
        last_sync_error: errors > 0 ? `${errors} rows failed to sync` : null,
        total_rows_synced: (syncMeta?.total_rows_synced || 0) + synced
      }, {
        onConflict: 'sync_source'
      });

    console.log('✅ Sync completed successfully');

    return res.status(200).json({
      success: true,
      message: `Successfully synced ${synced} new rows`,
      stats: {
        totalRowsInSheet,
        lastSyncedCount: lastSyncedRowCount,
        newRowsFetched: rawRows.length,
        rowsSynced: synced,
        errors
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Sync failed:', error);

    // Update sync metadata with error
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      await supabase
        .from('sync_metadata')
        .update({
          last_sync_timestamp: new Date().toISOString(),
          last_sync_status: 'failed',
          last_sync_error: error.message
        })
        .eq('sync_source', 'google_sheets');
    } catch (metaError) {
      console.error('Failed to update sync metadata:', metaError);
    }

    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
