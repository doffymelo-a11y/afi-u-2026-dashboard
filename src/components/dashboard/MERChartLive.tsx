'use client';

import { useEffect, useState } from 'react';
import { Card, Title, AreaChart, Text, Flex, Metric, BadgeDelta } from '@tremor/react';
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
  const { dateRange } = useDateRange();
  const [chartData, setChartData] = useState<MERDataPoint[]>([]);
  const [globalMER, setGlobalMER] = useState<GlobalMER | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [merResponse, globalResponse] = await Promise.all([
          fetch(`/api/analytics?type=mer&range=${dateRange}`),
          fetch(`/api/analytics?type=mer-global&range=${dateRange}`),
        ]);

        const merResult = await merResponse.json();
        const globalResult = await globalResponse.json();

        setChartData(merResult.data || []);
        setGlobalMER(globalResult.data || null);
        setIsMock(merResult.mock || globalResult.mock || false);
      } catch (error) {
        console.error('Error fetching MER data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-80 bg-slate-200 rounded"></div>
      </Card>
    );
  }

  const transformedData = chartData.map((point) => ({
    date: point.date,
    'Revenus (K€)': Math.round(point.revenue / 1000),
    'Dépenses (K€)': Math.round(point.adCost / 1000),
    'MER': point.mer,
  }));

  const deltaType = (globalMER?.changePercent || 0) > 0 ? 'increase' :
                    (globalMER?.changePercent || 0) < 0 ? 'decrease' : 'unchanged';

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
              <Metric className="text-blue-600">{globalMER.current}x</Metric>
              <BadgeDelta deltaType={deltaType}>
                {globalMER.changePercent > 0 ? '+' : ''}{globalMER.changePercent}%
              </BadgeDelta>
            </Flex>
            <Text className="text-xs text-slate-500">vs période précédente</Text>
          </div>
        )}
      </Flex>

      <AreaChart
        className="mt-4 h-48 sm:h-72"
        data={transformedData}
        index="date"
        categories={['Revenus (K€)', 'Dépenses (K€)']}
        colors={['emerald', 'blue']}
        valueFormatter={(value) => `${value}K€`}
        showLegend={true}
        showGridLines={true}
        curveType="monotone"
      />

      {globalMER && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4 border-t border-slate-200 pt-4">
          <div className="text-center">
            <Text className="text-xs text-slate-500">Revenus</Text>
            <p className="text-sm sm:text-lg font-semibold text-emerald-600">
              {(globalMER.revenue / 1000).toFixed(0)}K€
            </p>
          </div>
          <div className="text-center">
            <Text className="text-xs text-slate-500">Dépenses</Text>
            <p className="text-sm sm:text-lg font-semibold text-blue-600">
              {(globalMER.adCost / 1000).toFixed(0)}K€
            </p>
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
