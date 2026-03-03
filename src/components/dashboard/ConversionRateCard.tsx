'use client';

import { useEffect, useState } from 'react';
import { Card, Metric, Text, Flex, BadgeDelta, ProgressBar } from '@tremor/react';

interface ConversionData {
  eventName: string;
  conversions: number;
  previousConversions: number;
  rate: number;
  previousRate: number;
  changePercent: number;
}

interface ConversionRateCardProps {
  dateRange?: string;
}

export default function ConversionRateCard({ dateRange = '30d' }: ConversionRateCardProps) {
  const [data, setData] = useState<ConversionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics?type=conversions&range=${dateRange}`);
        const result = await response.json();
        setData(result.data || []);
        setIsMock(result.mock || false);
      } catch (error) {
        console.error('Error fetching conversion data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-32 bg-slate-200 rounded"></div>
      </Card>
    );
  }

  // Calculer le taux global (purchase + generate_lead)
  const totalConversions = data.reduce((sum, d) => sum + d.conversions, 0);
  const totalPreviousConversions = data.reduce((sum, d) => sum + d.previousConversions, 0);

  // Moyenne pondérée des taux
  const globalRate = data.length > 0
    ? data.reduce((sum, d) => sum + d.rate, 0) / data.length
    : 0;
  const previousGlobalRate = data.length > 0
    ? data.reduce((sum, d) => sum + d.previousRate, 0) / data.length
    : 0;
  const globalChange = previousGlobalRate > 0
    ? ((globalRate - previousGlobalRate) / previousGlobalRate) * 100
    : 0;

  const deltaType = globalChange > 0 ? 'increase' : globalChange < 0 ? 'decrease' : 'unchanged';

  return (
    <Card>
      <Flex justifyContent="between" alignItems="start">
        <div>
          <Text>Taux de Conversion Global</Text>
          <Metric className="mt-1">{globalRate.toFixed(2)}%</Metric>
        </div>
        <BadgeDelta deltaType={deltaType}>
          {globalChange > 0 ? '+' : ''}{globalChange.toFixed(1)}%
        </BadgeDelta>
      </Flex>

      <Text className="mt-4 mb-2">vs mois précédent</Text>
      <ProgressBar
        value={Math.min(100, (globalRate / 10) * 100)}
        color={globalChange >= 0 ? 'emerald' : 'red'}
        className="h-2"
      />

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
        {data.map((item) => (
          <div key={item.eventName} className="text-center">
            <Text className="text-xs text-slate-500 capitalize">
              {item.eventName === 'purchase' ? 'Achats' : 'Leads'}
            </Text>
            <p className="text-lg font-semibold text-slate-900">
              {item.conversions.toLocaleString('fr-FR')}
            </p>
            <Text className={`text-xs ${item.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
            </Text>
          </div>
        ))}
      </div>

      {isMock && (
        <div className="mt-3 rounded bg-amber-50 px-2 py-1">
          <Text className="text-xs text-amber-700">Données de démonstration</Text>
        </div>
      )}
    </Card>
  );
}
