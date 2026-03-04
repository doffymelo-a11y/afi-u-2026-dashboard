'use client';

import { useEffect, useState } from 'react';
import { Card, Title, LineChart, Text, Flex, Metric, BadgeDelta } from '@tremor/react';
import { useDateRange } from '@/contexts/DateRangeContext';

interface BrandedData {
  date: string;
  branded: number;
  nonBranded: number;
  total: number;
  brandedPercent: number;
}

interface PerformanceData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export default function SEORecovery() {
  const { dateRange, customDates } = useDateRange();
  const [trafficData, setTrafficData] = useState<BrandedData[]>([]);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let baseParams = `range=${dateRange}`;
        if (dateRange === 'custom' && customDates) {
          baseParams += `&startDate=${customDates.startDate}&endDate=${customDates.endDate}`;
        }

        const [trafficRes, perfRes] = await Promise.all([
          fetch(`/api/seo?type=branded&${baseParams}`),
          fetch(`/api/seo?type=performance&${baseParams}`),
        ]);

        const trafficResult = await trafficRes.json();
        const perfResult = await perfRes.json();

        setTrafficData(trafficResult.data || []);
        setPerformance(perfResult.data || null);
        setIsMock(trafficResult.mock || perfResult.mock || false);
      } catch (error) {
        console.error('Error fetching SEO recovery data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange, customDates]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-80 bg-slate-200 rounded"></div>
      </Card>
    );
  }

  // Calculer les métriques
  const totalClicks = trafficData.reduce((sum, d) => sum + d.total, 0);
  const firstPeriodClicks = trafficData.slice(0, Math.floor(trafficData.length / 2))
    .reduce((sum, d) => sum + d.total, 0);
  const secondPeriodClicks = trafficData.slice(Math.floor(trafficData.length / 2))
    .reduce((sum, d) => sum + d.total, 0);
  const growthPercent = firstPeriodClicks > 0
    ? ((secondPeriodClicks - firstPeriodClicks) / firstPeriodClicks) * 100
    : 0;

  // Transformer pour le graphique
  const chartData = trafficData.map((d) => ({
    date: d.date,
    'Clics totaux': d.total,
    'Branded': d.branded,
  }));

  return (
    <Card>
      <Flex justifyContent="between" alignItems="start">
        <div>
          <Title>Performance SEO Organique</Title>
          <Text>Évolution des clics GSC</Text>
        </div>
        <div className="text-right">
          <Text className="text-xs text-slate-500">Croissance période</Text>
          <Flex justifyContent="end" alignItems="baseline" className="gap-2">
            <Metric className={growthPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(1)}%
            </Metric>
            <BadgeDelta deltaType={growthPercent >= 0 ? 'increase' : 'decrease'}>
              {growthPercent >= 0 ? 'Hausse' : 'Baisse'}
            </BadgeDelta>
          </Flex>
        </div>
      </Flex>

      <LineChart
        className="mt-4 h-52"
        data={chartData}
        index="date"
        categories={['Clics totaux', 'Branded']}
        colors={['blue', 'emerald']}
        valueFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString()}
        showLegend={true}
        curveType="monotone"
      />

      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-200 pt-4">
        <div className="text-center">
          <Text className="text-xs text-slate-500">Clics totaux</Text>
          <p className="text-lg font-semibold text-blue-600">
            {totalClicks >= 1000 ? `${(totalClicks / 1000).toFixed(1)}K` : totalClicks}
          </p>
        </div>
        <div className="text-center">
          <Text className="text-xs text-slate-500">CTR moyen</Text>
          <p className="text-lg font-semibold text-slate-900">
            {performance?.ctr?.toFixed(2) || '-'}%
          </p>
        </div>
        <div className="text-center">
          <Text className="text-xs text-slate-500">Position moy.</Text>
          <p className="text-lg font-semibold text-amber-600">
            {performance?.position?.toFixed(1) || '-'}
          </p>
        </div>
      </div>

      {isMock && (
        <div className="mt-3 rounded bg-amber-50 px-2 py-1">
          <Text className="text-xs text-amber-700">Données de démonstration - Connectez GSC</Text>
        </div>
      )}
    </Card>
  );
}
