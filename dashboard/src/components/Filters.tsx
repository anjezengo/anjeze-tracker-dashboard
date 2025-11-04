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
  }>({
    years: [],
    projects: [],
    subProjects: [],
    institutes: [],
    types: [],
  });

  const [isLoading, setIsLoading] = useState(true);

  // Fetch filter options from database
  useEffect(() => {
    async function fetchOptions() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('facts_clean').select('*');

        if (error) throw error;
        if (!data) return;

        const yearsSet = new Set<number>();
        const projectsSet = new Set<string>();
        const subProjectsSet = new Set<string>();
        const institutesSet = new Set<string>();
        const typesSet = new Set<string>();

        data.forEach((row) => {
          if (row.year_start) yearsSet.add(row.year_start);
          if (row.project) projectsSet.add(row.project);
          if (row.sub_project) subProjectsSet.add(row.sub_project);
          if (row.institute) institutesSet.add(row.institute);
          if (row.type_of_institution) typesSet.add(row.type_of_institution);
        });

        setOptions({
          years: Array.from(yearsSet).sort((a, b) => a - b),
          projects: Array.from(projectsSet).sort(),
          subProjects: Array.from(subProjectsSet).sort(),
          institutes: Array.from(institutesSet).sort(),
          types: Array.from(typesSet).sort(),
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
    filters.project ||
    filters.subProject ||
    filters.institute ||
    filters.type;

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
      className="glass-effect rounded-xl p-6 relative z-20"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-accent-primary">Filters</h2>
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={clearFilters}
              className="text-sm text-accent-secondary hover:text-accent-primary transition-colors"
            >
              Clear All
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Years (Multi-select) */}
        <div>
          <label className="block text-sm font-medium text-accent-secondary mb-2">
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

        {/* Project */}
        <div>
          <label className="block text-sm font-medium text-accent-secondary mb-2">
            Project
          </label>
          <Select
            options={options.projects}
            selected={filters.project}
            onChange={(value) => updateFilters({ project: value })}
            placeholder="All Projects"
          />
        </div>

        {/* Sub-Project */}
        <div>
          <label className="block text-sm font-medium text-accent-secondary mb-2">
            Sub-Project
          </label>
          <Select
            options={options.subProjects}
            selected={filters.subProject}
            onChange={(value) => updateFilters({ subProject: value })}
            placeholder="All Sub-Projects"
          />
        </div>

        {/* Institute */}
        <div>
          <label className="block text-sm font-medium text-accent-secondary mb-2">
            Institute
          </label>
          <Select
            options={options.institutes}
            selected={filters.institute}
            onChange={(value) => updateFilters({ institute: value })}
            placeholder="All Institutes"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-accent-secondary mb-2">
            Type
          </label>
          <Select
            options={options.types}
            selected={filters.type}
            onChange={(value) => updateFilters({ type: value })}
            placeholder="All Types"
          />
        </div>
      </div>
    </motion.div>
  );
}

function Select({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: string[];
  selected: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
}) {
  return (
    <select
      value={selected || ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-accent-primary focus:border-highlight-blue transition-colors"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
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

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-left text-accent-primary focus:border-highlight-blue transition-colors flex items-center justify-between"
      >
        <span className={clsx(selected.length === 0 && 'text-accent-tertiary')}>
          {selected.length > 0
            ? `${selected.length} selected`
            : placeholder}
        </span>
        <svg
          className={clsx(
            'w-4 h-4 transition-transform',
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
            transition={{ duration: 0.2 }}
            className="absolute z-[100] w-full mt-2 glass-effect rounded-lg border border-dark-600 max-h-60 overflow-y-auto shadow-2xl"
          >
            {options.map((option) => (
              <label
                key={option}
                className="flex items-center px-4 py-2 hover:bg-dark-700 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="mr-3 accent-highlight-blue"
                />
                <span className="text-accent-primary">{option}</span>
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
