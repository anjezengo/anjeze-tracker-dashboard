/**
 * Manual Sync Button Component
 * Allows admin to manually trigger Google Sheets sync
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SyncStats {
  totalRowsInSheet: number;
  lastSyncedCount: number;
  newRowsFetched: number;
  rowsSynced: number;
  errors: number;
}

interface SyncResponse {
  success: boolean;
  message?: string;
  stats?: SyncStats;
  error?: string;
  timestamp: string;
}

export function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResponse | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    setShowDetails(false);

    try {
      const response = await fetch('/api/sync/google-sheets', {
        method: 'POST',
      });

      const data: SyncResponse = await response.json();
      setLastSync(data);
      setShowDetails(true);

      // Auto-hide details after 10 seconds if successful
      if (data.success) {
        setTimeout(() => setShowDetails(false), 10000);
      }
    } catch (error: any) {
      setLastSync({
        success: false,
        error: error.message || 'Failed to connect to sync API',
        timestamp: new Date().toISOString(),
      });
      setShowDetails(true);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col items-end gap-3">
        {/* Sync Result Details */}
        <AnimatePresence>
          {showDetails && lastSync && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`
                relative max-w-sm p-4 rounded-lg shadow-2xl backdrop-blur-sm
                ${
                  lastSync.success
                    ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700'
                    : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700'
                }
              `}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Success State */}
              {lastSync.success ? (
                <div className="pr-6">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <h4 className="font-semibold text-green-800 dark:text-green-200">
                      Sync Successful
                    </h4>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                    {lastSync.message}
                  </p>
                  {lastSync.stats && (
                    <div className="space-y-1 text-xs text-green-600 dark:text-green-400">
                      <div className="flex justify-between">
                        <span>Total rows in sheet:</span>
                        <span className="font-mono font-semibold">{lastSync.stats.totalRowsInSheet}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Previously synced:</span>
                        <span className="font-mono font-semibold">{lastSync.stats.lastSyncedCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>New rows synced:</span>
                        <span className="font-mono font-semibold text-green-700 dark:text-green-300">
                          {lastSync.stats.rowsSynced}
                        </span>
                      </div>
                      {lastSync.stats.errors > 0 && (
                        <div className="flex justify-between text-red-600 dark:text-red-400">
                          <span>Errors:</span>
                          <span className="font-mono font-semibold">{lastSync.stats.errors}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-green-600 dark:text-green-500 mt-3">
                    {new Date(lastSync.timestamp).toLocaleString()}
                  </p>
                </div>
              ) : (
                /* Error State */
                <div className="pr-6">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <h4 className="font-semibold text-red-800 dark:text-red-200">
                      Sync Failed
                    </h4>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                    {lastSync.error}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-500">
                    {new Date(lastSync.timestamp).toLocaleString()}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sync Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSync}
          disabled={syncing}
          className={`
            flex items-center gap-3 px-6 py-3 rounded-full shadow-lg
            font-semibold text-white transition-all duration-300
            ${
              syncing
                ? 'bg-gray-400 cursor-wait'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            }
            disabled:opacity-70 disabled:cursor-not-allowed
          `}
          title="Manually sync data from Google Sheets"
        >
          {/* Sync Icon with Animation */}
          <motion.svg
            animate={{ rotate: syncing ? 360 : 0 }}
            transition={{
              duration: 1,
              repeat: syncing ? Infinity : 0,
              ease: 'linear',
            }}
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </motion.svg>

          <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>

          {/* Badge showing last sync time */}
          {!syncing && lastSync && lastSync.success && (
            <span className="text-xs opacity-80">
              ({new Date(lastSync.timestamp).toLocaleTimeString()})
            </span>
          )}
        </motion.button>

        {/* Helper Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-gray-500 dark:text-gray-400 max-w-xs text-right"
        >
          {syncing
            ? 'Fetching latest data from Google Sheets...'
            : 'Click to sync data from Google Sheets'}
        </motion.p>
      </div>
    </div>
  );
}
