import Head from 'next/head';
import { Filters } from '@/components/Filters';
import { StatsCards } from '@/components/StatsCards';
import { BeneficiariesPieChart } from '@/components/BeneficiariesPieChart';
import { YearlyTrendChart } from '@/components/YearlyTrendChart';
import { AssetDisplay } from '@/components/AssetDisplay';
import { CauseCards } from '@/components/CauseCards';
import { RemarksQuantityVisualization } from '@/components/RemarksQuantityVisualization';
import { UploadButton } from '@/components/UploadButton';
import { NLSearch } from '@/components/NLSearch';

export default function Home() {
  return (
    <>
      <Head>
        <title>Anjeze Tracker Dashboard</title>
        <meta name="description" content="Track and visualize NGO beneficiaries and project data" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="space-y-8">
        <NLSearch />
        <Filters />
        <StatsCards />
        <AssetDisplay />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <BeneficiariesPieChart />
          <YearlyTrendChart />
        </div>
        <RemarksQuantityVisualization />
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-accent-primary mb-6">
            Impact by Initiatives
          </h3>
          <CauseCards />
        </div>
      </div>

      <UploadButton />
    </>
  );
}
