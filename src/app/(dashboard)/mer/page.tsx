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
  const { dateRange, customDates, comparisonEnabled, getComparisonDateStrings } = useDateRange();
  const [data, setData] = useState<MERPageData | null>(null);
  const [comparisonData, setComparisonData] = useState<MERPageData | null>(null);
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

        // Fetch comparison data if enabled
        if (comparisonEnabled) {
          const compDates = getComparisonDateStrings();
          if (compDates) {
            const compUrl = `/api/analytics?type=overview&range=custom&startDate=${compDates.startDate}&endDate=${compDates.endDate}`;
            const compResponse = await fetch(compUrl);
            const compResult = await compResponse.json();
            if (compResult.success && compResult.data) {
              setComparisonData(compResult.data);
            }
          }
        } else {
          setComparisonData(null);
        }
      } catch (error) {
        console.error('Error fetching MER page data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange, customDates, comparisonEnabled, getComparisonDateStrings]);

  // Helper for calculating comparison change
  const calcChange = (current: number, comparison: number | undefined, fallback: number): number => {
    if (comparisonEnabled && comparison !== undefined && comparison !== 0) {
      return ((current - comparison) / comparison) * 100;
    }
    return fallback;
  };

  const kpis = data ? [
    {
      title: 'MER Global',
      value: `${data.merGlobal.current.toFixed(1)}x`,
      change: calcChange(data.merGlobal.current, comparisonData?.merGlobal.current, data.merGlobal.changePercent),
      subtitle: `Rev: ${formatCurrency(data.merGlobal.revenue)}`,
      compValue: comparisonData ? `${comparisonData.merGlobal.current.toFixed(1)}x` : null,
    },
    {
      title: 'Revenus',
      value: formatCurrency(data.merGlobal.revenue),
      change: calcChange(data.merGlobal.revenue, comparisonData?.merGlobal.revenue, data.merGlobal.changePercent),
      subtitle: 'Total période',
      compValue: comparisonData ? formatCurrency(comparisonData.merGlobal.revenue) : null,
    },
    {
      title: 'Dépenses Ads',
      value: formatCurrency(data.merGlobal.adCost),
      change: calcChange(data.merGlobal.adCost, comparisonData?.merGlobal.adCost, 0),
      subtitle: 'Budget proratisé',
      compValue: comparisonData ? formatCurrency(comparisonData.merGlobal.adCost) : null,
    },
    {
      title: 'Blended CPL',
      value: `${data.blendedCPL.blendedCPL.toFixed(2)}$`,
      change: calcChange(data.blendedCPL.blendedCPL, comparisonData?.blendedCPL.blendedCPL, 0),
      subtitle: `${data.blendedCPL.totalLeads + data.blendedCPL.totalConversions} actions`,
      compValue: comparisonData ? `${comparisonData.blendedCPL.blendedCPL.toFixed(2)}$` : null,
      invertColor: true, // Lower CPL is better
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
              const isPositive = kpi.invertColor ? kpi.change <= 0 : kpi.change >= 0;
              return (
                <Card key={kpi.title}>
                  <Flex alignItems="start" justifyContent="between">
                    <div className="truncate">
                      <Text className="text-xs sm:text-sm text-slate-500 truncate">{kpi.title}</Text>
                      <Metric className="text-lg sm:text-2xl mt-1 truncate">{kpi.value}</Metric>
                    </div>
                    {kpi.change !== 0 && (
                      <BadgeDelta
                        deltaType={kpi.invertColor ? (kpi.change > 0 ? 'decrease' : 'increase') : deltaType}
                        className={`text-xs ${isPositive ? '' : 'bg-red-100 text-red-700'}`}
                      >
                        {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
                      </BadgeDelta>
                    )}
                  </Flex>
                  <Text className="text-xs text-slate-400 mt-2 truncate">
                    {kpi.compValue ? `vs ${kpi.compValue} comparé` : kpi.subtitle}
                  </Text>
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
