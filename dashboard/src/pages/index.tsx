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
import { CauseCards } from '@/components/CauseCards';
import { RemarksQuantityVisualization } from '@/components/RemarksQuantityVisualization';
import { SyncButton } from '@/components/SyncButton';

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
          <h2 className="text-4xl font-bold text-gray-900 dark:text-accent-primary mb-2">
            Welcome to the Anjeze Tracker
          </h2>
          <p className="text-lg text-gray-700 dark:text-accent-secondary">
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

        {/* Remarks & Quantity Visualization */}
        <RemarksQuantityVisualization />

        {/* Cause Cards - Impact by Cause */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-accent-primary mb-6 text-center">
            Impact by Cause
          </h3>
          <CauseCards />
        </motion.div>
      </div>

      {/* Floating Sync Button */}
      <SyncButton />
    </>
  );
}
