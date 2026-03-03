import Header from '@/components/layout/Header';
import KPICard from '@/components/dashboard/KPICard';
import MERChart from '@/components/dashboard/MERChart';
import CoreWebVitals from '@/components/dashboard/CoreWebVitals';
import ChannelPerformance from '@/components/dashboard/ChannelPerformance';
import ConversionTable from '@/components/dashboard/ConversionTable';
import SEORecovery from '@/components/dashboard/SEORecovery';
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

        {/* Main Charts */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MERChart />
          <SEORecovery />
        </div>

        {/* Secondary Charts */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChannelPerformance />
          <CoreWebVitals />
        </div>

        {/* Conversion Table */}
        <ConversionTable />
      </div>
    </>
  );
}
