'use client';

import { useEffect, useState } from 'react';
import { Card, Title, AreaChart, Text, Flex, Metric, BadgeDelta } from '@tremor/react';

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

interface MERChartLiveProps {
  dateRange?: string;
}

export default function MERChartLive({ dateRange = '30d' }: MERChartLiveProps) {
  const [chartData, setChartData] = useState<MERDataPoint[]>([]);
  const [globalMER, setGlobalMER] = useState<GlobalMER | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch both MER history and global MER
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

  // Transformer les données pour le graphique avec les deux courbes
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
      <Flex justifyContent="between" alignItems="start">
        <div>
          <Title>Marketing Efficiency Ratio (MER)</Title>
          <Text>Revenus globaux vs Dépenses d'acquisition</Text>
        </div>
        {globalMER && (
          <div className="text-right">
            <Flex justifyContent="end" alignItems="baseline" className="gap-2">
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
        className="mt-4 h-72"
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
        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-200 pt-4">
          <div className="text-center">
            <Text className="text-xs text-slate-500">Revenus totaux</Text>
            <p className="text-lg font-semibold text-emerald-600">
              {(globalMER.revenue / 1000).toFixed(0)}K€
            </p>
          </div>
          <div className="text-center">
            <Text className="text-xs text-slate-500">Dépenses totales</Text>
            <p className="text-lg font-semibold text-blue-600">
              {(globalMER.adCost / 1000).toFixed(0)}K€
            </p>
          </div>
          <div className="text-center">
            <Text className="text-xs text-slate-500">Rentabilité</Text>
            <p className={`text-lg font-semibold ${globalMER.current >= 3 ? 'text-emerald-600' : globalMER.current >= 2 ? 'text-amber-600' : 'text-red-600'}`}>
              {globalMER.current >= 3 ? 'Excellente' : globalMER.current >= 2 ? 'Bonne' : 'À améliorer'}
            </p>
          </div>
        </div>
      )}

      {isMock && (
        <div className="mt-3 rounded bg-amber-50 px-2 py-1">
          <Text className="text-xs text-amber-700">Données de démonstration - Connectez GA4 pour les données réelles</Text>
        </div>
      )}
    </Card>
  );
}
