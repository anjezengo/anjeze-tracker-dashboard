/**
 * Animated statistics cards
 */

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useFilters } from '@/lib/filters';
import gsap from 'gsap';

type Stats = {
  totalBeneficiaries: number;
  totalAmount: number;
  totalRecords: number;
  uniqueProjects: number;
  uniqueSubProjects: number;
  uniqueCauses: number;
  projectList: string[];
  subProjectList: string[];
  causeList: string[];
};

export function StatsCards() {
  const { filters } = useFilters();
  const [stats, setStats] = useState<Stats>({
    totalBeneficiaries: 0,
    totalAmount: 0,
    totalRecords: 0,
    uniqueProjects: 0,
    uniqueSubProjects: 0,
    uniqueCauses: 0,
    projectList: [],
    subProjectList: [],
    causeList: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const statsRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    async function fetchStats() {
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
        if (filters.initiatives.length > 0) {
          filters.initiatives.forEach(c => params.append('initiatives', c));
        }

        const response = await fetch(`/api/metrics?${params.toString()}`);
        const result = await response.json();

        if (result.success && result.data) {
          const newStats = {
            totalBeneficiaries: result.data.overall.total_beneficiaries,
            totalAmount: result.data.overall.total_amount,
            totalRecords: result.data.overall.total_records,
            uniqueProjects: result.data.overall.unique_projects,
            uniqueSubProjects: result.data.overall.unique_sub_projects,
            uniqueCauses: result.data.overall.unique_initiatives,
            projectList: result.data.overall.project_list,
            subProjectList: result.data.overall.sub_project_list,
            causeList: result.data.overall.initiatives_list,
          };

          setStats(newStats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [filters]);

  const cards = [
    {
      label: 'Total Beneficiaries',
      value: stats.totalBeneficiaries,
      primary: true,
    },
    {
      label: 'Total Amount',
      value: stats.totalAmount,
      prefix: '₹',
    },
    {
      label: 'Initiatives',
      value: stats.uniqueCauses,
      list: stats.causeList,
    },
    {
      label: 'Projects',
      value: stats.uniqueProjects,
      list: stats.projectList,
    },
    {
      label: 'Sub-Projects',
      value: stats.uniqueSubProjects,
      list: stats.subProjectList,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="glass-effect rounded-xl p-6">
            <div className="shimmer h-6 w-24 rounded mb-2"></div>
            <div className="shimmer h-10 w-32 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 relative">
      {cards.map((card, index) => (
        <StatCard
          key={card.label}
          card={card}
          index={index}
          statRef={(el: HTMLSpanElement | null) => (statsRefs.current[index] = el)}
        />
      ))}
    </div>
  );
}

function StatCard({
  card,
  index,
  statRef,
}: {
  card: any;
  index: number;
  statRef: (el: HTMLSpanElement | null) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const hasList = card.list && card.list.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`glass-effect rounded-xl p-6 relative group cursor-default border-l-4 ${card.primary ? 'border-l-highlight-blue' : 'border-l-transparent'}`}
      style={{ zIndex: showDropdown ? 10001 : 'auto' }}
      onMouseEnter={() => hasList && setShowDropdown(true)}
      onMouseLeave={() => setShowDropdown(false)}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-accent-tertiary mb-3">
        {card.label}
      </p>
      <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-accent-primary">
        {card.prefix && <span className="text-xl text-gray-500 dark:text-accent-tertiary mr-0.5">{card.prefix}</span>}
        <span ref={statRef} className={card.primary ? 'text-highlight-blue' : ''}>{card.value.toLocaleString()}</span>
      </p>
      {hasList && (
        <p className="text-xs text-gray-400 dark:text-accent-tertiary mt-2">
          {card.list.length} total
        </p>
      )}

      {hasList && showDropdown && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute z-[10000] top-full mt-1 left-0 right-0 glass-effect rounded-lg p-4 max-h-60 overflow-y-auto shadow-lg"
        >
          <ul className="space-y-1">
            {card.list.map((item: string) => (
              <li key={item} className="text-sm text-gray-700 dark:text-accent-secondary">
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}
