import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useFilters } from '@/lib/filters';

type InitiativeData = {
  initiatives: string;
  total_beneficiaries: number;
  total_amount: number;
  count: number;
};

const ICONS = ['🏥', '📚', '🍎', '🎁', '💊', '🩺', '🏫', '🤝', '🌱', '💙'];
const GRADIENTS = [
  'from-green-500 to-green-700',
  'from-blue-500 to-blue-700',
  'from-orange-500 to-orange-700',
  'from-pink-500 to-pink-700',
  'from-purple-500 to-purple-700',
  'from-teal-500 to-teal-700',
  'from-yellow-500 to-yellow-700',
  'from-red-500 to-red-700',
  'from-indigo-500 to-indigo-700',
  'from-cyan-500 to-cyan-700',
];

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

        if (result.success && result.data?.byInitiatives) {
          setInitiatives(result.data.byInitiatives.filter((i: InitiativeData) => i.initiatives));
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

  if (initiatives.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-accent-tertiary py-8">
        No initiative data available
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
          <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
          <div className="relative z-10">
            <div className="text-6xl mb-4">{ICONS[index % ICONS.length]}</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-accent-primary mb-3">
              {item.initiatives}
            </h3>
            <div className="text-4xl font-bold text-highlight-blue">
              {item.total_beneficiaries.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 dark:text-accent-secondary mt-1">Beneficiaries</p>
            {item.count > 0 && (
              <p className="text-xs text-gray-400 dark:text-accent-tertiary mt-2">
                {item.count.toLocaleString()} activities
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
