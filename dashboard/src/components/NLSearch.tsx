import { useState, useRef } from 'react';
import { useFilters } from '@/lib/filters';

const EXAMPLES = [
  'What did we do in 2020?',
  'Show goodie bag activities',
  'Medical work from 2018 to 2022',
];

export function NLSearch() {
  const { updateFilters, clearFilters } = useFilters();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ summary: string } | { error: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent | null, overrideQuery?: string) => {
    e?.preventDefault();
    const q = overrideQuery ?? query;
    if (!q.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const optRes = await fetch('/api/filter-options').then(r => r.json());
      const options = optRes.success ? optRes.data : {};

      const res = await fetch('/api/nl-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, options }),
      });

      const data = await res.json();

      if (data.error) {
        setResult({ error: data.error });
        return;
      }

      if (data.filters && Object.keys(data.filters).length > 0) {
        clearFilters();
        updateFilters({
          years: data.filters.years ?? [],
          initiatives: data.filters.initiatives ?? [],
          projects: data.filters.projects ?? [],
          subProjects: data.filters.subProjects ?? [],
        });
        setResult({ summary: data.summary });
      } else {
        setResult({ error: "Couldn't extract filters — try rephrasing." });
      }
    } catch (e: any) {
      setResult({ error: 'Search failed. Check your Ollama Cloud API key.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask in plain English — 'What did we do in 2020?' or 'Medical work'"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-accent-primary placeholder-gray-400 dark:placeholder-accent-tertiary focus:outline-none focus:border-highlight-blue transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 text-sm font-medium bg-highlight-blue text-white rounded-lg disabled:opacity-40 hover:bg-teal-600 transition-colors"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : 'Search'}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className={`text-xs px-3 py-1.5 rounded-md ${
          'error' in result
            ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
            : 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/20'
        }`}>
          {'error' in result ? result.error : `Showing: ${result.summary}`}
        </div>
      )}

      {/* Example chips */}
      {!result && !loading && (
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              type="button"
              onClick={() => { setQuery(ex); handleSubmit(null, ex); }}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-200 dark:border-dark-600 text-gray-500 dark:text-accent-tertiary hover:border-highlight-blue hover:text-highlight-blue transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
