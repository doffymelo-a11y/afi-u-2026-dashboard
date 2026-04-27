'use client';

import { useEffect, useState } from 'react';
import { Card, Text, Metric, Flex } from '@tremor/react';
import { useDateRange } from '@/contexts/DateRangeContext';

interface KPIData {
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
    sessions: number;
    previousSessions: number;
    sessionsChange: number;
    conversions: number;
    previousConversions: number;
    conversionsChange: number;
  };
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toFixed(0);
}

function formatCurrency(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K$`;
  return `${num.toFixed(2)}$`;
}

export default function KPISummaryLive() {
  const { dateRange, customDates, comparisonEnabled, getComparisonDateStrings } = useDateRange();
  const [data, setData] = useState<KPIData | null>(null);
  const [comparisonData, setComparisonData] = useState<KPIData | null>(null);
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

        if (result.success && !result.mock) {
          setData(result.data);
        }

        // Fetch comparison data if enabled
        if (comparisonEnabled) {
          const compDates = getComparisonDateStrings();
          if (compDates) {
            const compUrl = `/api/analytics?type=overview&range=custom&startDate=${compDates.startDate}&endDate=${compDates.endDate}`;
            const compResponse = await fetch(compUrl);
            const compResult = await compResponse.json();
            if (compResult.success && !compResult.mock) {
              setComparisonData(compResult.data);
            }
          }
        } else {
          setComparisonData(null);
        }
      } catch (error) {
        console.error('Error fetching KPI data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange, customDates, comparisonEnabled, getComparisonDateStrings]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-16 bg-slate-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Calculate comparison percentages
  const calcChange = (current: number, comparison: number | undefined): number => {
    if (!comparisonEnabled || comparison === undefined || comparison === 0) return 0;
    return ((current - comparison) / comparison) * 100;
  };

  const merChange = comparisonData
    ? calcChange(data.merGlobal.current, comparisonData.merGlobal.current)
    : data.merGlobal.changePercent;

  const sessionsChange = comparisonData
    ? calcChange(data.overview.sessions, comparisonData.overview.sessions)
    : data.overview.sessionsChange;

  const cplChange = comparisonData
    ? calcChange(data.blendedCPL.blendedCPL, comparisonData.blendedCPL.blendedCPL)
    : 0;

  const conversionsChange = comparisonData
    ? calcChange(data.overview.conversions, comparisonData.overview.conversions)
    : data.overview.conversionsChange;

  const kpis = [
    {
      title: 'MER Global',
      value: `${data.merGlobal.current.toFixed(1)}x`,
      change: merChange,
      subtitle: `Rev: ${formatCurrency(data.merGlobal.revenue)}`,
      compValue: comparisonData ? `${comparisonData.merGlobal.current.toFixed(1)}x` : null,
    },
    {
      title: 'Sessions',
      value: formatNumber(data.overview.sessions),
      change: sessionsChange,
      subtitle: comparisonData
        ? `vs ${formatNumber(comparisonData.overview.sessions)} comparé`
        : `vs ${formatNumber(data.overview.previousSessions)} précédent`,
      compValue: comparisonData ? formatNumber(comparisonData.overview.sessions) : null,
    },
    {
      title: 'Blended CPL',
      value: `${data.blendedCPL.blendedCPL.toFixed(2)}$`,
      change: cplChange,
      subtitle: `${data.blendedCPL.totalLeads + data.blendedCPL.totalConversions} leads/conv`,
      compValue: comparisonData ? `${comparisonData.blendedCPL.blendedCPL.toFixed(2)}$` : null,
      invertColor: true, // Lower CPL is better
    },
    {
      title: 'Conversions',
      value: formatNumber(data.overview.conversions),
      change: conversionsChange,
      subtitle: comparisonData
        ? `vs ${formatNumber(comparisonData.overview.conversions)} comparé`
        : `vs ${formatNumber(data.overview.previousConversions)} précédent`,
      compValue: comparisonData ? formatNumber(comparisonData.overview.conversions) : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const deltaType = kpi.change > 0 ? 'increase' : kpi.change < 0 ? 'decrease' : 'unchanged';
        const isPositive = kpi.invertColor
          ? kpi.change <= 0
          : kpi.change >= 0;

        return (
          <Card key={kpi.title} className="relative overflow-hidden">
            <Flex alignItems="start" justifyContent="between">
              <div className="truncate">
                <Text className="text-xs sm:text-sm text-slate-500 truncate">{kpi.title}</Text>
                <Metric className="text-lg sm:text-2xl mt-1 truncate">{kpi.value}</Metric>
              </div>
              {kpi.change !== 0 && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white ${
                    isPositive ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                >
                  {isPositive ? '↑' : '↓'} {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
                </span>
              )}
            </Flex>
            <Text className="text-xs text-slate-400 mt-2 truncate">{kpi.subtitle}</Text>
          </Card>
        );
      })}
    </div>
  );
}
