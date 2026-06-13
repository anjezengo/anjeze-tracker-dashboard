import { useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';

type ImportResult = {
  success: boolean;
  stats?: {
    total: number;
    imported: number;
    errors: number;
    nullDates: number;
    nullDateRate: string;
  };
  errorSamples?: string[];
  error?: string;
};

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      setResult({ success: false, error: 'Only .xlsx / .xls files are accepted.' });
      return;
    }
    setFile(f);
    setResult(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const CHUNK_SIZE = 100;

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    setProgress(null);

    try {
      // Parse Excel in the browser (avoids Lambda CPU timeout)
      const arrayBuffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
      const sheetName = wb.SheetNames.find((n: string) => /tracker/i.test(n)) ?? wb.SheetNames[0];
      const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { raw: true, defval: null });

      // Find columns that have at least one non-null, non-empty value across the whole file.
      // This removes phantom/empty Excel columns without dropping data columns whose
      // header names differ from our expected aliases.
      const activeKeys = new Set<string>();
      for (const row of rawRows) {
        for (const [k, v] of Object.entries(row)) {
          if (v !== null && v !== undefined && String(v).trim() !== '') activeKeys.add(k);
        }
      }
      const slimRows = rawRows.map(row => {
        const slim: Record<string, any> = {};
        for (const k of activeKeys) slim[k] = row[k] ?? null;
        return slim;
      });

      const totalChunks = Math.ceil(slimRows.length / CHUNK_SIZE);
      let accTotal = 0, accImported = 0, accErrors = 0, accNullDates = 0;
      const allErrorSamples: string[] = [];

      for (let i = 0; i < slimRows.length; i += CHUNK_SIZE) {
        const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
        setProgress(`Uploading batch ${chunkNum} of ${totalChunks}…`);

        const chunk = slimRows.slice(i, i + CHUNK_SIZE);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: chunk }),
        });

        let data: ImportResult;
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`Server error on batch ${chunkNum}: ${text.slice(0, 300)}`);
        }

        if (!data.success) throw new Error(data.error ?? `Batch ${chunkNum} failed`);

        accTotal     += data.stats?.total     ?? 0;
        accImported  += data.stats?.imported  ?? 0;
        accErrors    += data.stats?.errors    ?? 0;
        accNullDates += data.stats?.nullDates  ?? 0;
        if (data.errorSamples) allErrorSamples.push(...data.errorSamples);
      }

      setProgress(null);
      setResult({
        success: true,
        stats: {
          total: accTotal,
          imported: accImported,
          errors: accErrors,
          nullDates: accNullDates,
          nullDateRate: accTotal > 0 ? ((accNullDates / accTotal) * 100).toFixed(1) + '%' : '0%',
        },
        errorSamples: allErrorSamples.slice(0, 5),
      });
    } catch (e: any) {
      setProgress(null);
      setResult({ success: false, error: e.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Upload Excel — Anjeze Tracker</title>
      </Head>

      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-accent-primary mb-2">Upload Excel</h2>
          <p className="text-gray-600 dark:text-accent-secondary mb-8">
            Upload the latest <code className="font-mono text-sm bg-gray-100 dark:bg-dark-700 px-1 rounded">.xlsx</code> tracker file to update the database. Existing rows (matched by row hash) are updated; new rows are inserted.
          </p>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              glass-effect rounded-xl border-2 border-dashed p-12 text-center cursor-pointer
              transition-all duration-300
              ${dragging
                ? 'border-highlight-blue bg-blue-50 dark:bg-blue-900/20 scale-[1.01]'
                : 'border-gray-300 dark:border-dark-500 hover:border-highlight-blue hover:bg-gray-50 dark:hover:bg-dark-800/50'}
            `}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onInputChange}
            />
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ y: dragging ? -6 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <svg className="w-16 h-16 text-gray-400 dark:text-accent-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </motion.div>

              {file ? (
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-accent-primary">{file.name}</p>
                  <p className="text-sm text-gray-500 dark:text-accent-tertiary mt-1">
                    {(file.size / 1024).toFixed(0)} KB — click to change
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-700 dark:text-accent-secondary">
                    Drag & drop your <span className="text-highlight-blue font-semibold">.xlsx</span> file here
                  </p>
                  <p className="text-sm text-gray-500 dark:text-accent-tertiary mt-1">or click to browse</p>
                </div>
              )}
            </div>
          </div>

          {/* Upload button */}
          <AnimatePresence>
            {file && !uploading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6"
              >
                <button
                  onClick={handleUpload}
                  className="w-full bg-highlight-blue hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-blue-500/20"
                >
                  Import {file.name}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading state */}
          {uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 text-center"
            >
              <div className="inline-flex items-center gap-3 text-gray-700 dark:text-accent-secondary">
                <svg className="animate-spin w-6 h-6 text-highlight-blue" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-lg font-medium">
                  {progress ?? 'Parsing Excel…'}
                </span>
              </div>
              <div className="mt-4 h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-highlight-blue rounded-full"
                  animate={{ width: ['0%', '90%'] }}
                  transition={{ duration: 15, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className={`mt-8 rounded-xl p-6 border ${
                  result.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                }`}
              >
                {result.success && result.stats ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Import Complete</h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Total rows', value: result.stats.total },
                        { label: 'Imported', value: result.stats.imported, highlight: true },
                        { label: 'Errors', value: result.stats.errors, warn: result.stats.errors > 0 },
                        { label: 'Missing dates', value: result.stats.nullDates, sub: result.stats.nullDateRate },
                      ].map(s => (
                        <div key={s.label} className="text-center bg-white dark:bg-dark-800 rounded-lg p-3">
                          <div className={`text-2xl font-bold ${
                            s.highlight ? 'text-green-600 dark:text-green-400' :
                            s.warn ? 'text-red-500' : 'text-gray-700 dark:text-accent-primary'
                          }`}>
                            {s.value}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-accent-tertiary mt-1">{s.label}</div>
                          {s.sub && <div className="text-xs text-gray-400 dark:text-accent-tertiary">({s.sub})</div>}
                        </div>
                      ))}
                    </div>

                    {result.errorSamples && result.errorSamples.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">Sample errors:</p>
                        <ul className="space-y-1">
                          {result.errorSamples.map((e, i) => (
                            <li key={i} className="text-xs font-mono text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded">
                              {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-400">Import Failed</p>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{result.error}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
