import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type SyncResult = {
  success: boolean;
  syncedAt?: string;
  stats?: {
    total: number;
    imported: number;
    errors: number;
    nullDates: number;
    nullDateRate: string;
  };
  error?: string;
};

export function OneDriveSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    setResult(null);
    setShowResult(false);

    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data: SyncResult = await res.json();
      setResult(data);
      setShowResult(true);
    } catch (e: any) {
      setResult({ success: false, error: e.message || 'Sync failed' });
      setShowResult(true);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: isSyncing ? 1 : 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleSync}
        disabled={isSyncing}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
          ${isSyncing
            ? 'bg-gray-200 dark:bg-dark-700 text-gray-400 cursor-not-allowed'
            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20'}
        `}
        title="Fetch latest data from OneDrive and update database"
      >
        {isSyncing ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Syncing…</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Sync from OneDrive</span>
          </>
        )}
      </motion.button>

      {/* Result popover */}
      <AnimatePresence>
        {showResult && result && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`
              absolute right-0 top-full mt-2 w-72 rounded-xl shadow-xl border p-4 z-50
              ${result.success
                ? 'bg-white dark:bg-dark-800 border-emerald-200 dark:border-emerald-700'
                : 'bg-white dark:bg-dark-800 border-red-200 dark:border-red-700'}
            `}
          >
            <button
              onClick={() => setShowResult(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {result.success && result.stats ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold text-gray-900 dark:text-accent-primary text-sm">Sync complete</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-2">
                    <div className="text-lg font-bold text-gray-900 dark:text-accent-primary">{result.stats.total}</div>
                    <div className="text-xs text-gray-500 dark:text-accent-tertiary">rows</div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-2">
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{result.stats.imported}</div>
                    <div className="text-xs text-gray-500 dark:text-accent-tertiary">imported</div>
                  </div>
                  <div className={`rounded-lg p-2 ${result.stats.errors > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-gray-50 dark:bg-dark-700'}`}>
                    <div className={`text-lg font-bold ${result.stats.errors > 0 ? 'text-red-500' : 'text-gray-900 dark:text-accent-primary'}`}>
                      {result.stats.errors}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-accent-tertiary">errors</div>
                  </div>
                </div>

                {result.syncedAt && (
                  <p className="text-xs text-gray-400 dark:text-accent-tertiary mt-3 text-center">
                    {new Date(result.syncedAt).toLocaleString()}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Sync failed</p>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">{result.error}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
