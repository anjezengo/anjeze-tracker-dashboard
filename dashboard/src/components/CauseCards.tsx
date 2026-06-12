import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useFilters } from '@/lib/filters';

type InitiativeData = {
  initiatives: string;
  beneficiaries: number;
  icon: string;
  color: string;
};

const INITIATIVES_CONFIG: Record<string, { icon: string; color: string }> = {
  'Education Support': { icon: '📚', color: 'from-blue-500 to-blue-700' },
  'Medical Support': { icon: '🏥', color: 'from-green-500 to-green-700' },
  'Nutrition Support': { icon: '🍎', color: 'from-orange-500 to-orange-700' },
  'Out Of The Box Support': { icon: '🎁', color: 'from-pink-500 to-pink-700' },
};

export function CauseCards() {
  const { filters } = useFilters();
  const [initiatives, setInitiatives] = useState<InitiativeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.years.length > 0) filters.years.forEach(y => params.append('years', String(y)));
        if (filters.projects.length > 0) filters.projects.forEach(p => params.append('projects', p));
        if (filters.subProjects.length > 0) filters.subProjects.forEach(s => params.append('subProjects', s));
        if (filters.institutes.length > 0) filters.institutes.forEach(i => params.append('institutes', i));
        if (filters.types.length > 0) filters.types.forEach(t => params.append('types', t));
        if (filters.initiatives.length > 0) filters.initiatives.forEach(c => params.append('initiatives', c));

        const response = await fetch(`/api/metrics?${params.toString()}`);
        const result = await response.json();

        if (result.success && result.data) {
          const initiativesMap = new Map<string, number>();
          result.data.byInitiatives.forEach((item: any) => {
            initiativesMap.set(item.initiatives, item.total_beneficiaries);
          });

          const data: InitiativeData[] = Object.entries(INITIATIVES_CONFIG).map(([name, config]) => ({
            initiatives: name,
            beneficiaries: initiativesMap.get(name) || 0,
            icon: config.icon,
            color: config.color,
          }));

          setInitiatives(data);
        }
      } catch (error) {
        console.error('Error fetching initiatives data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
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
      {initiatives.map((item, index) => (
        <motion.div
          key={item.initiatives}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="glass-effect rounded-xl p-8 text-center relative overflow-hidden group hover:scale-105 transition-transform duration-300"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
          <div className="relative z-10">
            <div className="text-6xl mb-4">{item.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-accent-primary mb-2">
              {item.initiatives}
            </h3>
            {item.beneficiaries > 0 ? (
              <div className="text-4xl font-bold text-highlight-blue">
                {item.beneficiaries.toLocaleString()}
              </div>
            ) : (
              <div className="text-lg text-gray-500 dark:text-accent-tertiary italic">
                Please Select Data
              </div>
            )}
            {item.beneficiaries > 0 && (
              <p className="text-sm text-gray-600 dark:text-accent-secondary mt-1">Beneficiaries</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
