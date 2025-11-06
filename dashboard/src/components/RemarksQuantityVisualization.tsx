/**
 * Remarks & Quantity Visualization
 * Shows items where both remarks and quantity exist
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFilters } from '@/lib/filters';

type RemarksQuantityItem = {
  remarks: string;
  quantity: number;
  institute: string | null;
  sub_project: string | null;
  count: number;
};

export function RemarksQuantityVisualization() {
  const { filters } = useFilters();
  const [items, setItems] = useState<RemarksQuantityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.years.length > 0) {
          filters.years.forEach(y => params.append('years', String(y)));
        }
        if (filters.projects.length > 0) {
          filters.projects.forEach(p => params.append('projects', p));
        }
        if (filters.subProjects.length > 0) {
          filters.subProjects.forEach(s => params.append('subProjects', s));
        }
        if (filters.institutes.length > 0) {
          filters.institutes.forEach(i => params.append('institutes', i));
        }
        if (filters.types.length > 0) {
          filters.types.forEach(t => params.append('types', t));
        }
        if (filters.causes.length > 0) {
          filters.causes.forEach(c => params.append('causes', c));
        }

        const response = await fetch(`/api/metrics?${params.toString()}`);
        const result = await response.json();

        if (result.success && result.data) {
          setItems(result.data.remarksQuantity || []);
        }
      } catch (error) {
        console.error('Error fetching remarks+quantity data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [filters]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-effect rounded-xl p-6"
      >
        <div className="shimmer h-6 w-48 rounded mb-4"></div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="shimmer h-12 rounded"></div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (items.length === 0) {
    return null; // Don't show if no data
  }

  const displayItems = isExpanded ? items : items.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-effect rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-accent-primary">
            Items Donated
          </h3>
          <p className="text-sm text-gray-600 dark:text-accent-secondary mt-1">
            Showing items with remarks and quantities
          </p>
        </div>
        {items.length > 5 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-highlight-blue hover:text-blue-600 transition-colors font-medium"
          >
            {isExpanded ? 'Show Less' : `Show All (${items.length})`}
          </button>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {displayItems.map((item, index) => (
            <motion.div
              key={item.remarks}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-200 dark:border-dark-600 hover:border-highlight-blue dark:hover:border-highlight-blue transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-accent-primary text-base mb-1 truncate">
                    {item.remarks}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-accent-secondary">
                    {item.institute && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {item.institute}
                      </span>
                    )}
                    {item.sub_project && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        {item.sub_project}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-2xl font-bold text-highlight-blue">
                    {item.quantity.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-accent-tertiary">
                    {item.count > 1 ? `${item.count} donations` : '1 donation'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isExpanded && items.length > 10 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-600">
          <p className="text-sm text-gray-600 dark:text-accent-secondary text-center">
            Showing {items.length} items with remarks and quantities
          </p>
        </div>
      )}
    </motion.div>
  );
}
