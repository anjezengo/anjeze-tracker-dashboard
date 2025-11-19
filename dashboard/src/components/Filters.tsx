/**
 * URL-persistent filter components
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFilters } from '@/lib/filters';
import { supabase } from '@/lib/supabase';
import clsx from 'clsx';

export function Filters() {
  const { filters, updateFilters, clearFilters } = useFilters();
  const [options, setOptions] = useState<{
    years: number[];
    projects: string[];
    subProjects: string[];
    institutes: string[];
    types: string[];
    causes: string[];
  }>({
    years: [],
    projects: [],
    subProjects: [],
    institutes: [],
    types: [],
    causes: [],
  });

  const [isLoading, setIsLoading] = useState(true);

  // Fetch filter options from database
  useEffect(() => {
    async function fetchOptions() {
      setIsLoading(true);
      try {
        // Use metrics API to get distinct values (already handles pagination)
        const response = await fetch('/api/metrics');
        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error('Failed to fetch metrics');
        }

        setOptions({
          years: result.data.byYear.map((item: any) => item.year_start).sort((a: number, b: number) => a - b),
          projects: result.data.overall.project_list || [],
          subProjects: result.data.overall.sub_project_list || [],
          institutes: [], // Not available in current API, would need to add
          types: [], // Not available in current API, would need to add
          causes: result.data.overall.cause_list || [],
        });
      } catch (error) {
        console.error('Error fetching filter options:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOptions();
  }, []);

  const hasActiveFilters =
    filters.years.length > 0 ||
    filters.projects.length > 0 ||
    filters.subProjects.length > 0 ||
    filters.institutes.length > 0 ||
    filters.types.length > 0 ||
    filters.causes.length > 0;

  if (isLoading) {
    return (
      <div className="glass-effect rounded-xl p-6">
        <div className="shimmer h-8 w-32 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="shimmer h-10 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-effect rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-accent-primary">Filters</h2>
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={clearFilters}
              className="text-sm text-gray-600 dark:text-accent-secondary hover:text-gray-900 dark:hover:text-accent-primary transition-colors"
            >
              Clear All
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Years (Multi-select) */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-accent-secondary mb-2">
            Years
          </label>
          <MultiSelect
            options={options.years.map(String)}
            selected={filters.years.map(String)}
            onChange={(selected) =>
              updateFilters({ years: selected.map(Number) })
            }
            placeholder="All Years"
          />
        </div>

        {/* Cause (Multi-select) */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-accent-secondary mb-2">
            Cause
          </label>
          <MultiSelect
            options={options.causes}
            selected={filters.causes}
            onChange={(selected) => updateFilters({ causes: selected })}
            placeholder="All Causes"
          />
        </div>

        {/* Project (Multi-select) */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-accent-secondary mb-2">
            Project
          </label>
          <MultiSelect
            options={options.projects}
            selected={filters.projects}
            onChange={(selected) => updateFilters({ projects: selected })}
            placeholder="All Projects"
          />
        </div>

        {/* Sub-Project (Multi-select) */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-accent-secondary mb-2">
            Sub-Project
          </label>
          <MultiSelect
            options={options.subProjects}
            selected={filters.subProjects}
            onChange={(selected) => updateFilters({ subProjects: selected })}
            placeholder="All Sub-Projects"
          />
        </div>

        {/* Institute (Multi-select) */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-accent-secondary mb-2">
            Institute
          </label>
          <MultiSelect
            options={options.institutes}
            selected={filters.institutes}
            onChange={(selected) => updateFilters({ institutes: selected })}
            placeholder="All Institutes"
          />
        </div>

        {/* Type (Multi-select) */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-accent-secondary mb-2">
            Type
          </label>
          <MultiSelect
            options={options.types}
            selected={filters.types}
            onChange={(selected) => updateFilters({ types: selected })}
            placeholder="All Types"
          />
        </div>
      </div>
    </motion.div>
  );
}


function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" style={{ zIndex: isOpen ? 1000 : 'auto' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg px-4 py-2 text-left text-gray-900 dark:text-accent-primary focus:border-highlight-blue transition-colors flex items-center justify-between hover:border-gray-400 dark:hover:border-dark-500"
      >
        <span className={clsx(
          selected.length === 0 && 'text-gray-400 dark:text-accent-tertiary'
        )}>
          {selected.length > 0
            ? `${selected.length} selected`
            : placeholder}
        </span>
        <svg
          className={clsx(
            'w-4 h-4 transition-transform text-gray-600 dark:text-accent-secondary',
            isOpen && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onAnimationComplete={(definition: any) => {
              if (definition.opacity === 0) setSearchTerm('');
            }}
            transition={{ duration: 0.2 }}
            className="absolute z-[1100] w-full mt-2 glass-effect rounded-lg border border-gray-200 dark:border-dark-600 shadow-xl max-h-96 overflow-visible"
          >
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200 dark:border-dark-600">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Type to search..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded text-gray-900 dark:text-accent-primary placeholder-gray-400 dark:placeholder-accent-tertiary focus:outline-none focus:border-highlight-blue"
              />
            </div>

            {/* Options List */}
            <div className="max-h-80 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-700 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(option)}
                      onChange={() => toggleOption(option)}
                      className="mr-3 accent-highlight-blue"
                    />
                    <span className="text-gray-900 dark:text-accent-primary">{option}</span>
                  </label>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-accent-tertiary text-center">
                  No matches found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
