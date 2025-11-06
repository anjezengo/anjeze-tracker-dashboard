/**
 * Bar Chart with Trend Line: Yearly metrics
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useFilters } from '@/lib/filters';

type ChartData = {
  year: number;
  beneficiaries: number;
  movingAvg: number;
};

export function YearlyTrendChart() {
  const { filters } = useFilters();
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Build query string from filters
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
          const yearData = result.data.byYear.map((item: any) => ({
            year: item.year_start,
            beneficiaries: item.total_beneficiaries,
            movingAvg: 0, // Will calculate next
          }));

          // Calculate 3-year moving average
          const windowSize = 3;
          for (let i = 0; i < yearData.length; i++) {
            const start = Math.max(0, i - windowSize + 1);
            const window = yearData.slice(start, i + 1);
            const avg =
              window.reduce((sum: number, d: any) => sum + d.beneficiaries, 0) /
              window.length;
            yearData[i].movingAvg = Math.round(avg);
          }

          setData(yearData);
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
        <div className="shimmer h-80 rounded"></div>
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
          Yearly Trend
        </h3>
        <div className="h-80 flex items-center justify-center text-accent-secondary">
          No data available
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="yearly-trend-chart"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="glass-effect rounded-xl p-6"
    >
      <h3 className="text-xl font-semibold text-accent-primary mb-4">
        Yearly Beneficiaries Trend
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
          <XAxis
            dataKey="year"
            stroke="#a3a3a3"
            tick={{ fill: '#a3a3a3' }}
          />
          <YAxis stroke="#a3a3a3" tick={{ fill: '#a3a3a3' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2e2e2e',
              borderRadius: '8px',
            }}
            formatter={(value: number) => value.toLocaleString()}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar
            dataKey="beneficiaries"
            fill="#3b82f6"
            name="Beneficiaries"
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-out"
            radius={[8, 8, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="movingAvg"
            stroke="#22c55e"
            strokeWidth={3}
            name="3-Year Moving Avg"
            dot={{ fill: '#22c55e', r: 5 }}
            animationBegin={200}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
