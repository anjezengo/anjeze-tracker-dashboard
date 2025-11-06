/**
 * Cause Cards - Shows beneficiaries by cause with icon and styling
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useFilters } from '@/lib/filters';

type CauseData = {
  cause: string;
  beneficiaries: number;
  icon: string;
  color: string;
};

const CAUSE_CONFIG: Record<string, { icon: string; color: string }> = {
  'Education Support': { icon: '📚', color: 'from-blue-500 to-blue-700' },
  'Medical Support': { icon: '🏥', color: 'from-green-500 to-green-700' },
  'Nutrition Support': { icon: '🍎', color: 'from-orange-500 to-orange-700' },
  'Out Of The Box Support': { icon: '🎁', color: 'from-pink-500 to-pink-700' },
};

export function CauseCards() {
  const { filters } = useFilters();
  const [causes, setCauses] = useState<CauseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCauseData() {
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
          // Create a map of causes from API data
          const causeMap = new Map<string, number>();
          result.data.byCause.forEach((item: any) => {
            causeMap.set(item.cause, item.total_beneficiaries);
          });

          // Always show all 4 causes, with 0 beneficiaries if not in data
          const causeData: CauseData[] = Object.entries(CAUSE_CONFIG).map(([causeName, config]) => ({
            cause: causeName,
            beneficiaries: causeMap.get(causeName) || 0,
            icon: config.icon,
            color: config.color,
          }));

          setCauses(causeData);
        }
      } catch (error) {
        console.error('Error fetching cause data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCauseData();
  }, [filters]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-effect rounded-xl p-8">
            <div className="shimmer h-16 w-16 rounded-full mx-auto mb-4"></div>
            <div className="shimmer h-6 w-32 rounded mx-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {causes.map((cause, index) => (
        <motion.div
          key={cause.cause}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={`glass-effect rounded-xl p-8 text-center relative overflow-hidden group hover:scale-105 transition-transform duration-300`}
        >
          {/* Gradient background */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${cause.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
          />

          {/* Content */}
          <div className="relative z-10">
            <div className="text-6xl mb-4">{cause.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-accent-primary mb-2">
              {cause.cause}
            </h3>
            {cause.beneficiaries > 0 ? (
              <div className="text-4xl font-bold text-highlight-blue">
                {cause.beneficiaries.toLocaleString()}
              </div>
            ) : (
              <div className="text-lg text-gray-500 dark:text-accent-tertiary italic">
                Please Select Data
              </div>
            )}
            {cause.beneficiaries > 0 && (
              <p className="text-sm text-gray-600 dark:text-accent-secondary mt-1">
                Beneficiaries
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
