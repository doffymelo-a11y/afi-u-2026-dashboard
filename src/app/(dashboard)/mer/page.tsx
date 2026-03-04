'use client';

import { useEffect, useState } from 'react';
import { Card, Text, Metric, Flex, BadgeDelta } from '@tremor/react';
import Header from '@/components/layout/Header';
import MERChartLive from '@/components/dashboard/MERChartLive';
import ConversionRateCard from '@/components/dashboard/ConversionRateCard';
import { useDateRange } from '@/contexts/DateRangeContext';

interface MERPageData {
  merGlobal: {
    current: number;
    previous: number;
    changePercent: number;
    revenue: number;
    adCost: number;
  };
  blendedCPL: {
    blendedCPL: number;
    totalCost: number;
    totalLeads: number;
    totalConversions: number;
  };
  overview: {
    conversions: number;
    previousConversions: number;
    conversionsChange: number;
  };
}

function formatCurrency(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M$`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K$`;
  return `${num.toFixed(0)}$`;
}

export default function MERPage() {
  const { dateRange, customDates } = useDateRange();
  const [data, setData] = useState<MERPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let url = `/api/analytics?type=overview&range=${dateRange}`;
        if (dateRange === 'custom' && customDates) {
          url += `&startDate=${customDates.startDate}&endDate=${customDates.endDate}`;
        }
        const response = await fetch(url);
        const result = await response.json();
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching MER page data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange, customDates]);

  const kpis = data ? [
    {
      title: 'MER Global',
      value: `${data.merGlobal.current.toFixed(1)}x`,
      change: data.merGlobal.changePercent,
      subtitle: `Rev: ${formatCurrency(data.merGlobal.revenue)}`,
    },
    {
      title: 'Revenus',
      value: formatCurrency(data.merGlobal.revenue),
      change: data.merGlobal.changePercent,
      subtitle: 'Total période',
    },
    {
      title: 'Dépenses Ads',
      value: formatCurrency(data.merGlobal.adCost),
      change: 0,
      subtitle: 'Budget proratisé',
    },
    {
      title: 'Blended CPL',
      value: `${data.blendedCPL.blendedCPL.toFixed(2)}$`,
      change: 0,
      subtitle: `${data.blendedCPL.totalLeads + data.blendedCPL.totalConversions} actions`,
    },
  ] : [];

  return (
    <>
      <Header title="MER & Rentabilité" />
      <div className="p-4 sm:p-6">
        {/* KPI Cards - Live */}
        <div className="mb-4 sm:mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-16 bg-slate-200 rounded"></div>
              </Card>
            ))
          ) : (
            kpis.map((kpi) => {
              const deltaType = kpi.change > 0 ? 'increase' : kpi.change < 0 ? 'decrease' : 'unchanged';
              return (
                <Card key={kpi.title}>
                  <Flex alignItems="start" justifyContent="between">
                    <div className="truncate">
                      <Text className="text-xs sm:text-sm text-slate-500 truncate">{kpi.title}</Text>
                      <Metric className="text-lg sm:text-2xl mt-1 truncate">{kpi.value}</Metric>
                    </div>
                    {kpi.change !== 0 && (
                      <BadgeDelta deltaType={deltaType} className="text-xs">
                        {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
                      </BadgeDelta>
                    )}
                  </Flex>
                  <Text className="text-xs text-slate-400 mt-2 truncate">{kpi.subtitle}</Text>
                </Card>
              );
            })
          )}
        </div>

        {/* MER Chart - Full width */}
        <div className="mb-4 sm:mb-6">
          <MERChartLive />
        </div>

        {/* Conversion Rate & Analysis */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <ConversionRateCard />
          {data && (
            <Card>
              <Text className="font-semibold text-slate-900 text-lg mb-4">Analyse de rentabilité</Text>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Coût par acquisition</span>
                  <span className="font-semibold text-slate-900">
                    {data.blendedCPL.blendedCPL.toFixed(2)}$
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Revenu par conversion</span>
                  <span className="font-semibold text-slate-900">
                    {data.overview.conversions > 0
                      ? formatCurrency(data.merGlobal.revenue / data.overview.conversions)
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Marge nette estimée</span>
                  <span className="font-semibold text-emerald-600">
                    {data.overview.conversions > 0
                      ? `+${formatCurrency((data.merGlobal.revenue / data.overview.conversions) - data.blendedCPL.blendedCPL)}`
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ROI Marketing</span>
                  <span className="font-semibold text-emerald-600">
                    {data.merGlobal.adCost > 0
                      ? `${(((data.merGlobal.revenue - data.merGlobal.adCost) / data.merGlobal.adCost) * 100).toFixed(0)}%`
                      : '-'}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
