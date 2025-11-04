/**
 * Animated statistics cards
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useFilters } from '@/lib/filters';

type Stats = {
  totalBeneficiaries: number;
  totalAmount: number;
  totalRecords: number;
  uniqueProjects: number;
  uniqueSubProjects: number;
};

export function StatsCards() {
  const { filters } = useFilters();
  const [stats, setStats] = useState<Stats>({
    totalBeneficiaries: 0,
    totalAmount: 0,
    totalRecords: 0,
    uniqueProjects: 0,
    uniqueSubProjects: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.years.length > 0) {
          params.set('years', filters.years.join(','));
        }
        if (filters.project) params.set('project', filters.project);
        if (filters.subProject) params.set('subProject', filters.subProject);
        if (filters.institute) params.set('institute', filters.institute);
        if (filters.type) params.set('type', filters.type);

        const response = await fetch(`/api/metrics?${params.toString()}`);
        const result = await response.json();

        if (result.success && result.data) {
          setStats({
            totalBeneficiaries: result.data.overall.total_beneficiaries,
            totalAmount: result.data.overall.total_amount,
            totalRecords: result.data.overall.total_records,
            uniqueProjects: result.data.overall.unique_projects,
            uniqueSubProjects: result.data.overall.unique_sub_projects,
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
      label: 'Total Records',
      value: stats.totalRecords,
      color: 'text-highlight-purple',
      icon: '📊',
    },
    {
      label: 'Projects',
      value: stats.uniqueProjects,
      color: 'text-highlight-yellow',
      icon: '📁',
    },
    {
      label: 'Sub-Projects',
      value: stats.uniqueSubProjects,
      color: 'text-highlight-red',
      icon: '📂',
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
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="glass-effect rounded-xl p-6 hover:border-highlight-blue border border-transparent transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-accent-secondary">{card.label}</p>
            <span className="text-2xl">{card.icon}</span>
          </div>
          <p className={`text-2xl font-bold ${card.color}`}>
            {card.prefix}{card.value.toLocaleString()}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
