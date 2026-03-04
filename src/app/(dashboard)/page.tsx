'use client';

import Header from '@/components/layout/Header';
import KPICard from '@/components/dashboard/KPICard';
import MERChartLive from '@/components/dashboard/MERChartLive';
import ConversionRateCard from '@/components/dashboard/ConversionRateCard';
import CoreWebVitalsLive from '@/components/dashboard/CoreWebVitalsLive';
import ChannelDonut from '@/components/dashboard/ChannelDonut';
import ConversionTable from '@/components/dashboard/ConversionTable';
import BrandedTrafficChart from '@/components/dashboard/BrandedTrafficChart';
import SEOHealthIndex from '@/components/dashboard/SEOHealthIndex';
import { kpiSummary } from '@/data/mockData';

export default function DashboardPage() {
  return (
    <>
      <Header title="Vue d'ensemble" />
      <div className="p-4 sm:p-6">
        {/* KPI Summary Cards - Responsive grid */}
        <div className="mb-4 sm:mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {kpiSummary.map((kpi) => (
            <KPICard
              key={kpi.title}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              changeType={kpi.changeType}
            />
          ))}
        </div>

        {/* Main Charts - MER & Conversion Rate */}
        <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MERChartLive />
          </div>
          <ConversionRateCard />
        </div>

        {/* SEO Section - Brand Traffic & Channel Distribution */}
        <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <BrandedTrafficChart />
          <ChannelDonut />
        </div>

        {/* Performance - Health & Core Web Vitals */}
        <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <SEOHealthIndex />
          <CoreWebVitalsLive strategy="mobile" />
        </div>

        {/* Conversion Table - Full width on mobile */}
        <div className="overflow-x-auto">
          <ConversionTable />
        </div>
      </div>
    </>
  );
}
