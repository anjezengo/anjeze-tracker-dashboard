/**
 * Main Dashboard Page
 */

import { motion } from 'framer-motion';
import Head from 'next/head';
import { Filters } from '@/components/Filters';
import { StatsCards } from '@/components/StatsCards';
import { BeneficiariesPieChart } from '@/components/BeneficiariesPieChart';
import { YearlyTrendChart } from '@/components/YearlyTrendChart';
import { AssetDisplay } from '@/components/AssetDisplay';

export default function Home() {
  return (
    <>
      <Head>
        <title>Anjeze Tracker Dashboard</title>
        <meta
          name="description"
          content="Track and visualize NGO beneficiaries and project data"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl font-bold text-accent-primary mb-2">
            Welcome to Anjeze Tracker
          </h2>
          <p className="text-lg text-accent-secondary">
            Monitor impact, track beneficiaries, and visualize project outcomes
          </p>
        </motion.div>

        {/* Filters */}
        <Filters />

        {/* Stats Cards */}
        <StatsCards />

        {/* Asset Display (appears when sub-project is selected) */}
        <AssetDisplay />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <BeneficiariesPieChart />
          <YearlyTrendChart />
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="glass-effect rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-accent-primary mb-4">
            📊 How to Use This Dashboard
          </h3>
          <ul className="space-y-2 text-accent-secondary">
            <li>
              • Use the <strong>filters</strong> above to narrow down data by
              year, project, sub-project, institute, or institution type
            </li>
            <li>
              • Select a <strong>sub-project</strong> filter to view its image
              and description
            </li>
            <li>
              • Charts update automatically based on your selected filters
            </li>
            <li>
              • Filter settings are saved in the URL - share links with your
              team!
            </li>
            <li>
              • Visit the <strong>Submit Data</strong> page to add new records
            </li>
          </ul>
        </motion.div>
      </div>
    </>
  );
}
