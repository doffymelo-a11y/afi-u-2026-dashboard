'use client';

import { useEffect, useState } from 'react';
import { Card, Title, AreaChart, Text, Flex, Metric } from '@tremor/react';
import { useDateRange } from '@/contexts/DateRangeContext';

interface MERDataPoint {
  date: string;
  revenue: number;
  adCost: number;
  mer: number;
}

interface GlobalMER {
  current: number;
  previous: number;
  changePercent: number;
  revenue: number;
  adCost: number;
}

export default function MERChartLive() {
  const { dateRange, customDates, comparisonEnabled, getComparisonDateStrings } = useDateRange();
  const [chartData, setChartData] = useState<MERDataPoint[]>([]);
  const [globalMER, setGlobalMER] = useState<GlobalMER | null>(null);
  const [comparisonMER, setComparisonMER] = useState<GlobalMER | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let baseUrl = `/api/analytics?range=${dateRange}`;

        // Add custom dates if applicable
        if (dateRange === 'custom' && customDates) {
          baseUrl += `&startDate=${customDates.startDate}&endDate=${customDates.endDate}`;
        }

        const [merResponse, globalResponse] = await Promise.all([
          fetch(`${baseUrl}&type=mer`),
          fetch(`${baseUrl}&type=mer-global`),
        ]);

        const merResult = await merResponse.json();
        const globalResult = await globalResponse.json();

        setChartData(merResult.data || []);
        setGlobalMER(globalResult.data || null);
        setIsMock(merResult.mock || globalResult.mock || false);

        // Fetch comparison data if enabled
        if (comparisonEnabled) {
          const compDates = getComparisonDateStrings();
          if (compDates) {
            const compUrl = `/api/analytics?type=mer-global&range=custom&startDate=${compDates.startDate}&endDate=${compDates.endDate}`;
            const compResponse = await fetch(compUrl);
            const compResult = await compResponse.json();
            if (compResult.success && compResult.data) {
              setComparisonMER(compResult.data);
            }
          }
        } else {
          setComparisonMER(null);
        }
      } catch (error) {
        console.error('Error fetching MER data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange, customDates, comparisonEnabled, getComparisonDateStrings]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-80 bg-slate-200 rounded"></div>
      </Card>
    );
  }

  const transformedData = chartData.map((point) => ({
    date: point.date,
    'Revenus (K$)': Math.round(point.revenue / 1000),
    'Dépenses (K$)': Math.round(point.adCost / 1000),
    'MER': point.mer,
  }));

  // Calculate comparison change
  const changePercent = comparisonMER && globalMER
    ? ((globalMER.current - comparisonMER.current) / comparisonMER.current) * 100
    : globalMER?.changePercent || 0;

  const isPositive = changePercent >= 0;

  return (
    <Card>
      <Flex justifyContent="between" alignItems="start" className="flex-col sm:flex-row gap-2">
        <div>
          <Title>Marketing Efficiency Ratio (MER)</Title>
          <Text className="hidden sm:block">Revenus globaux vs Dépenses d'acquisition</Text>
        </div>
        {globalMER && (
          <div className="text-left sm:text-right">
            <Flex justifyContent="start" alignItems="baseline" className="gap-2 sm:justify-end">
              <Metric className="text-blue-600">{globalMER.current.toFixed(1)}x</Metric>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white ${
                  isPositive ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              >
                {isPositive ? '↑' : '↓'} {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
              </span>
            </Flex>
            <Text className="text-xs text-slate-500">
              {comparisonMER
                ? `vs ${comparisonMER.current.toFixed(1)}x comparé`
                : 'vs période précédente'}
            </Text>
          </div>
        )}
      </Flex>

      <AreaChart
        className="mt-4 h-48 sm:h-72"
        data={transformedData}
        index="date"
        categories={['Revenus (K$)', 'Dépenses (K$)']}
        colors={['emerald', 'blue']}
        valueFormatter={(value) => `${value}K$`}
        showLegend={true}
        showGridLines={true}
        curveType="monotone"
      />

      {globalMER && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4 border-t border-slate-200 pt-4">
          <div className="text-center">
            <Text className="text-xs text-slate-500">Revenus</Text>
            <p className="text-sm sm:text-lg font-semibold text-emerald-600">
              {(globalMER.revenue / 1000).toFixed(0)}K$
            </p>
            {comparisonMER && (
              <Text className="text-xs text-slate-400">
                vs {(comparisonMER.revenue / 1000).toFixed(0)}K$
              </Text>
            )}
          </div>
          <div className="text-center">
            <Text className="text-xs text-slate-500">Dépenses</Text>
            <p className="text-sm sm:text-lg font-semibold text-blue-600">
              {(globalMER.adCost / 1000).toFixed(1)}K$
            </p>
            {comparisonMER && (
              <Text className="text-xs text-slate-400">
                vs {(comparisonMER.adCost / 1000).toFixed(1)}K$
              </Text>
            )}
          </div>
          <div className="text-center">
            <Text className="text-xs text-slate-500">Rentabilité</Text>
            <p className={`text-sm sm:text-lg font-semibold ${globalMER.current >= 3 ? 'text-emerald-600' : globalMER.current >= 2 ? 'text-amber-600' : 'text-red-600'}`}>
              {globalMER.current >= 3 ? 'Excellente' : globalMER.current >= 2 ? 'Bonne' : 'À améliorer'}
            </p>
          </div>
        </div>
      )}

      {isMock && (
        <div className="mt-3 rounded bg-amber-50 px-2 py-1">
          <Text className="text-xs text-amber-700">Données de démonstration</Text>
        </div>
      )}
    </Card>
  );
}
