'use client';

import { useEffect, useState } from 'react';
import { Card, Title, AreaChart, Text, Flex, Metric, BadgeDelta, Legend } from '@tremor/react';
import { useDateRange } from '@/contexts/DateRangeContext';

interface BrandedTrafficData {
  date: string;
  branded: number;
  nonBranded: number;
  total: number;
  brandedPercent: number;
}

interface BrandedSummary {
  totalBranded: number;
  totalNonBranded: number;
  brandedPercent: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export default function BrandedTrafficChart() {
  const { dateRange } = useDateRange();
  const [chartData, setChartData] = useState<BrandedTrafficData[]>([]);
  const [summary, setSummary] = useState<BrandedSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [trafficRes, summaryRes] = await Promise.all([
          fetch(`/api/seo?type=branded&range=${dateRange}`),
          fetch(`/api/seo?type=branded-summary&range=${dateRange}`),
        ]);

        const trafficResult = await trafficRes.json();
        const summaryResult = await summaryRes.json();

        setChartData(trafficResult.data || []);
        setSummary(summaryResult.data || null);
        setIsMock(trafficResult.mock || summaryResult.mock || false);
      } catch (error) {
        console.error('Error fetching branded traffic:', error);
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

  // Transformer pour le graphique
  const transformedData = chartData.map((d) => ({
    date: d.date,
    'Branded': d.branded,
    'Non-Branded': d.nonBranded,
  }));

  const deltaType = summary?.trend === 'up' ? 'increase' :
                    summary?.trend === 'down' ? 'decrease' : 'unchanged';

  return (
    <Card>
      <Flex justifyContent="between" alignItems="start">
        <div>
          <Title>Trafic Organique: Brand vs Non-Brand</Title>
          <Text>Analyse de la notoriété de marque via GSC</Text>
        </div>
        {summary && (
          <div className="text-right">
            <Flex justifyContent="end" alignItems="baseline" className="gap-2">
              <Metric className="text-blue-600">{summary.brandedPercent}%</Metric>
              <BadgeDelta deltaType={deltaType}>
                {summary.changePercent > 0 ? '+' : ''}{summary.changePercent}%
              </BadgeDelta>
            </Flex>
            <Text className="text-xs text-slate-500">Part du trafic Branded</Text>
          </div>
        )}
      </Flex>

      <Legend
        className="mt-4"
        categories={['Branded', 'Non-Branded']}
        colors={['blue', 'slate']}
      />

      <AreaChart
        className="mt-2 h-64"
        data={transformedData}
        index="date"
        categories={['Branded', 'Non-Branded']}
        colors={['blue', 'slate']}
        valueFormatter={(value) => value.toLocaleString('fr-FR')}
        showLegend={false}
        showGridLines={true}
        curveType="monotone"
        stack={true}
      />

      {summary && (
        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-200 pt-4">
          <div className="text-center">
            <Text className="text-xs text-slate-500">Clics Branded</Text>
            <p className="text-lg font-semibold text-blue-600">
              {summary.totalBranded.toLocaleString('fr-FR')}
            </p>
          </div>
          <div className="text-center">
            <Text className="text-xs text-slate-500">Clics Non-Branded</Text>
            <p className="text-lg font-semibold text-slate-600">
              {summary.totalNonBranded.toLocaleString('fr-FR')}
            </p>
          </div>
          <div className="text-center">
            <Text className="text-xs text-slate-500">Tendance Branded</Text>
            <p className={`text-lg font-semibold ${
              summary.trend === 'up' ? 'text-emerald-600' :
              summary.trend === 'down' ? 'text-red-600' : 'text-amber-600'
            }`}>
              {summary.trend === 'up' ? '↑ Hausse' :
               summary.trend === 'down' ? '↓ Baisse' : '→ Stable'}
            </p>
          </div>
        </div>
      )}

      {isMock && (
        <div className="mt-3 rounded bg-amber-50 px-2 py-1">
          <Text className="text-xs text-amber-700">Données de démonstration - Connectez GSC pour les données réelles</Text>
        </div>
      )}
    </Card>
  );
}
