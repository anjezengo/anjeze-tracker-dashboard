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
        if (filters.causes.length > 0) {
          filters.causes.forEach(c => params.append('causes', c));
        }

        const response = await fetch(`/api/metrics?${params.toString()}`);
        const result = await response.json();

        if (result.success && result.data) {
          const prevStats = { ...stats };
          const newStats = {
            totalBeneficiaries: result.data.overall.total_beneficiaries,
            totalAmount: result.data.overall.total_amount,
            totalRecords: result.data.overall.total_records,
            uniqueProjects: result.data.overall.unique_projects,
            uniqueSubProjects: result.data.overall.unique_sub_projects,
            uniqueCauses: result.data.overall.unique_causes,
            projectList: result.data.overall.project_list,
            subProjectList: result.data.overall.sub_project_list,
            causeList: result.data.overall.cause_list,
          };

          setStats(newStats);

          // Animate number changes
          statsRefs.current.forEach((ref, index) => {
            if (ref) {
              const key = Object.keys(newStats)[index] as keyof Stats;
              const from = prevStats[key];
              const to = newStats[key];

              gsap.fromTo(
                ref,
                { textContent: from },
                {
                  textContent: to,
                  duration: 1.5,
                  ease: 'power2.out',
                  snap: { textContent: 1 },
                  onUpdate: function () {
                    const current = Math.round(
                      parseFloat(ref.textContent || '0')
                    );
                    ref.textContent = current.toLocaleString();
                  },
                }
              );
            }
          });
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
      color: 'text-highlight-blue',
      icon: '👥',
    },
    {
      label: 'Total Amount',
      value: stats.totalAmount,
      color: 'text-highlight-green',
      icon: '💰',
      prefix: '₹',
    },
    {
      label: 'Causes Listed',
      value: stats.uniqueCauses,
      color: 'text-highlight-cyan',
      icon: '🎯',
      list: stats.causeList,
    },
    {
      label: 'Projects',
      value: stats.uniqueProjects,
      color: 'text-highlight-yellow',
      icon: '📁',
      list: stats.projectList,
    },
    {
      label: 'Sub-Projects',
      value: stats.uniqueSubProjects,
      color: 'text-highlight-red',
      icon: '📂',
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass-effect rounded-xl p-6 hover:border-highlight-blue border border-gray-200 dark:border-transparent transition-all duration-300 relative group"
      style={{ zIndex: showDropdown ? 10001 : 'auto' }}
      onMouseEnter={() => hasList && setShowDropdown(true)}
      onMouseLeave={() => setShowDropdown(false)}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600 dark:text-accent-secondary">{card.label}</p>
        <span className="text-2xl">{card.icon}</span>
      </div>
      <p className={`text-2xl font-bold ${card.color} ${card.prefix ? 'text-xl' : ''}`}>
        {card.prefix}
        <span ref={statRef}>
          {card.value.toLocaleString()}
        </span>
      </p>

      {/* Dropdown hint */}
      {hasList && (
        <p className="text-xs text-gray-400 dark:text-accent-tertiary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          Hover to see list
        </p>
      )}

      {/* Dropdown list */}
      {hasList && showDropdown && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute z-[10000] top-full mt-2 left-0 right-0 glass-effect border border-gray-200 dark:border-dark-600 rounded-lg p-4 max-h-60 overflow-y-auto shadow-xl"
        >
          <p className="text-xs text-gray-500 dark:text-accent-tertiary mb-2 font-semibold">
            {card.label}:
          </p>
          <ul className="space-y-1">
            {card.list.map((item: string) => (
              <li
                key={item}
                className="text-sm text-gray-900 dark:text-accent-primary hover:text-highlight-blue transition-colors"
              >
                • {item}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}
