import Header from '@/components/layout/Header';
import KPICard from '@/components/dashboard/KPICard';
import MERChartLive from '@/components/dashboard/MERChartLive';
import ConversionRateCard from '@/components/dashboard/ConversionRateCard';
import CoreWebVitalsLive from '@/components/dashboard/CoreWebVitalsLive';
import ChannelPerformance from '@/components/dashboard/ChannelPerformance';
import ConversionTable from '@/components/dashboard/ConversionTable';
import BrandedTrafficChart from '@/components/dashboard/BrandedTrafficChart';
import SEOHealthIndex from '@/components/dashboard/SEOHealthIndex';
import { kpiSummary } from '@/data/mockData';

export default function DashboardPage() {
  return (
    <>
      <Header title="Vue d'ensemble" />
      <div className="p-6">
        {/* KPI Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        {/* Main Charts - MER & Conversion Rate (GA4 Connected) */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MERChartLive dateRange="30d" />
          </div>
          <ConversionRateCard dateRange="30d" />
        </div>

        {/* SEO Section - Brand Traffic & Health */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BrandedTrafficChart dateRange="30d" />
          <SEOHealthIndex />
        </div>

        {/* Performance - Channels & Core Web Vitals */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChannelPerformance />
          <CoreWebVitalsLive strategy="mobile" />
        </div>

        {/* Conversion Table */}
        <ConversionTable />
      </div>
    </>
  );
}
