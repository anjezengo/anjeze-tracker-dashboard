import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useFilters } from '@/lib/filters';

type InitiativeData = {
  initiatives: string;
  total_beneficiaries: number;
  total_amount: number;
  count: number;
};

const GRADIENTS = [
  'linear-gradient(135deg, #0a1a0e 0%, #0f2214 100%)',
  'linear-gradient(135deg, #0a0f1a 0%, #0d1526 100%)',
  'linear-gradient(135deg, #1a0d0a 0%, #261208 100%)',
  'linear-gradient(135deg, #150a1a 0%, #1e0d26 100%)',
  'linear-gradient(135deg, #0a1618 0%, #0d1f22 100%)',
  'linear-gradient(135deg, #181208 0%, #22190a 100%)',
];

const ICONS = ['🏥', '📚', '🍎', '🎁', '💊', '🤝', '🧴', '🌱'];

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
          <div key={i} className="rounded-2xl p-8 bg-gray-900 animate-pulse">
            <div className="h-16 w-16 rounded-full bg-gray-800 mx-auto mb-4" />
            <div className="h-5 w-32 rounded bg-gray-800 mx-auto mb-3" />
            <div className="h-10 w-24 rounded bg-gray-800 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (initiatives.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">No initiative data available</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {initiatives.map((item, index) => (
        <motion.div
          key={item.initiatives}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.07 }}
          style={{ background: GRADIENTS[index % GRADIENTS.length] }}
          className="rounded-2xl p-6 flex flex-col items-center text-center"
        >
          <span className="text-6xl mb-4 select-none" role="img" aria-hidden>
            {ICONS[index % ICONS.length]}
          </span>
          <h3 className="text-white font-bold text-lg leading-snug mb-3">
            {item.initiatives}
          </h3>
          <div className="text-highlight-blue text-5xl font-bold tracking-tight">
            {Math.round(item.total_beneficiaries).toLocaleString()}
          </div>
          <p className="text-gray-400 text-sm mt-1">Beneficiaries</p>
          {item.count > 0 && (
            <p className="text-gray-500 text-xs mt-4 pt-3 border-t border-white/10 w-full">
              {item.count.toLocaleString()} activities
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
