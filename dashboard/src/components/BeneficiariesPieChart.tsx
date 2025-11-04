/**
 * Pie Chart: Total beneficiaries by sub-project
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useFilters } from '@/lib/filters';

type ChartData = {
  name: string;
  value: number;
  color: string;
};

const COLORS = [
  '#3b82f6', // blue
  '#a855f7', // purple
  '#22c55e', // green
  '#eab308', // yellow
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
];

export function BeneficiariesPieChart() {
  const { filters } = useFilters();
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Build query string from filters
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
          const chartData: ChartData[] = result.data.bySubProject
            .slice(0, 8) // Top 8
            .map((item: any, index: number) => ({
              name: item.sub_project,
              value: item.total_beneficiaries,
              color: COLORS[index % COLORS.length],
            }));

          setData(chartData);
          setTotal(result.data.overall.total_beneficiaries);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [filters]);

  if (isLoading) {
    return (
      <div className="glass-effect rounded-xl p-6">
        <div className="shimmer h-8 w-48 rounded mb-4"></div>
        <div className="shimmer h-64 rounded"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-xl p-6"
      >
        <h3 className="text-xl font-semibold text-accent-primary mb-4">
          Beneficiaries by Sub-Project
        </h3>
        <div className="h-64 flex items-center justify-center text-accent-secondary">
          No data available
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="pie-chart"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="glass-effect rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-accent-primary">
          Beneficiaries by Sub-Project
        </h3>
        <div className="text-right">
          <div className="text-sm text-accent-secondary">Total</div>
          <div className="text-2xl font-bold text-highlight-blue">
            {total.toLocaleString()}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={480}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="42%"
            labelLine={{
              stroke: '#6b7280',
              strokeWidth: 1,
            }}
            label={({ name, percent }) => {
              // Shorten long names to fit better
              const shortName = name.length > 22 ? name.substring(0, 20) + '...' : name;
              return `${shortName}: ${(percent * 100).toFixed(0)}%`;
            }}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2e2e2e',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [
              value.toLocaleString() + ' beneficiaries',
              '',
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={50}
            wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
