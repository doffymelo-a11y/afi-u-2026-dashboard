'use client';

import { useEffect, useState } from 'react';
import { Card, Text, Metric, Flex, BadgeDelta } from '@tremor/react';
import Header from '@/components/layout/Header';
import ConversionRateCard from '@/components/dashboard/ConversionRateCard';
import ConversionTable from '@/components/dashboard/ConversionTable';
import { useDateRange } from '@/contexts/DateRangeContext';

interface ConversionPageData {
  merGlobal: {
    revenue: number;
  };
  conversions: {
    eventName: string;
    conversions: number;
    previousConversions: number;
    rate: number;
    previousRate: number;
    changePercent: number;
  }[];
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
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

function formatCurrency(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M$`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K$`;
  return `${num.toFixed(0)}$`;
}

export default function ConversionsPage() {
  const { dateRange, customDates, comparisonEnabled, getComparisonDateStrings } = useDateRange();
  const [data, setData] = useState<ConversionPageData | null>(null);
  const [comparisonData, setComparisonData] = useState<ConversionPageData | null>(null);
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
        console.error('Error fetching conversion data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange, customDates, comparisonEnabled, getComparisonDateStrings]);

  // Extraire les métriques
  const purchases = data?.conversions?.find(c => c.eventName === 'purchase');
  const leads = data?.conversions?.find(c => c.eventName === 'generate_lead');
  const globalRate = data?.overview
    ? (data.overview.conversions / data.overview.sessions) * 100
    : 0;

  // Comparison metrics
  const compPurchases = comparisonData?.conversions?.find(c => c.eventName === 'purchase');
  const compLeads = comparisonData?.conversions?.find(c => c.eventName === 'generate_lead');
  const compGlobalRate = comparisonData?.overview
    ? (comparisonData.overview.conversions / comparisonData.overview.sessions) * 100
    : 0;

  // Helper for calculating comparison change
  const calcChange = (current: number, comparison: number | undefined, fallback: number): number => {
    if (comparisonEnabled && comparison !== undefined && comparison !== 0) {
      return ((current - comparison) / comparison) * 100;
    }
    return fallback;
  };

  const previousGlobalRate = data?.overview?.previousSessions
    ? (data.overview.previousConversions / data.overview.previousSessions) * 100
    : 0;
  const globalRateChange = calcChange(globalRate, compGlobalRate,
    previousGlobalRate > 0 ? ((globalRate - previousGlobalRate) / previousGlobalRate) * 100 : 0
  );

  const kpis = data ? [
    {
      title: 'Taux global',
      value: `${globalRate.toFixed(2)}%`,
      change: globalRateChange,
      subtitle: `vs ${previousGlobalRate.toFixed(2)}% précédent`,
      compValue: comparisonEnabled && compGlobalRate > 0 ? `${compGlobalRate.toFixed(2)}%` : null,
    },
    {
      title: 'Purchases',
      value: formatNumber(purchases?.conversions || 0),
      change: calcChange(purchases?.conversions || 0, compPurchases?.conversions, purchases?.changePercent || 0),
      subtitle: `Taux: ${purchases?.rate?.toFixed(2) || 0}%`,
      compValue: comparisonEnabled && compPurchases ? formatNumber(compPurchases.conversions) : null,
    },
    {
      title: 'Leads générés',
      value: formatNumber(leads?.conversions || 0),
      change: calcChange(leads?.conversions || 0, compLeads?.conversions, leads?.changePercent || 0),
      subtitle: `Taux: ${leads?.rate?.toFixed(2) || 0}%`,
      compValue: comparisonEnabled && compLeads ? formatNumber(compLeads.conversions) : null,
    },
    {
      title: 'Valeur totale',
      value: formatCurrency(data.merGlobal?.revenue || 0),
      change: calcChange(data.merGlobal?.revenue || 0, comparisonData?.merGlobal?.revenue, 0),
      subtitle: 'Revenus période',
      compValue: comparisonEnabled && comparisonData?.merGlobal ? formatCurrency(comparisonData.merGlobal.revenue) : null,
    },
  ] : [];

  // Données pour le funnel
  const funnelData = data ? [
    {
      label: 'Sessions',
      value: data.overview.sessions,
      percent: 100,
      color: 'bg-blue-500',
    },
    {
      label: 'Leads',
      value: leads?.conversions || 0,
      percent: data.overview.sessions > 0
        ? ((leads?.conversions || 0) / data.overview.sessions) * 100
        : 0,
      color: 'bg-blue-400',
    },
    {
      label: 'Conversions',
      value: purchases?.conversions || 0,
      percent: data.overview.sessions > 0
        ? ((purchases?.conversions || 0) / data.overview.sessions) * 100
        : 0,
      color: 'bg-emerald-500',
    },
  ] : [];

  return (
    <>
      <Header title="Conversions" />
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
                  <Text className="text-xs text-slate-400 mt-2 truncate">
                    {kpi.compValue ? `vs ${kpi.compValue} comparé` : kpi.subtitle}
                  </Text>
                </Card>
              );
            })
          )}
        </div>

        {/* Conversion Rate Card & Funnel */}
        <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <ConversionRateCard />
          <Card>
            <Text className="font-semibold text-slate-900 text-lg mb-4">Funnel de conversion</Text>
            {loading ? (
              <div className="h-48 bg-slate-200 rounded animate-pulse"></div>
            ) : (
              <div className="space-y-4">
                {funnelData.map((step, index) => (
                  <div key={step.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{step.label}</span>
                      <span className="font-medium text-slate-900">
                        {step.value.toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100">
                      <div
                        className={`h-3 rounded-full ${step.color} transition-all duration-500`}
                        style={{ width: `${Math.max(step.percent, 2)}%` }}
                      ></div>
                    </div>
                    {index > 0 && (
                      <Text className="text-xs text-slate-500 mt-1">
                        {step.percent.toFixed(2)}% du total
                      </Text>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Conversion Table - Full width */}
        <div className="overflow-x-auto">
          <ConversionTable />
        </div>
      </div>
    </>
  );
}
