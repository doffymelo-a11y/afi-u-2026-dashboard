'use client';

import { useEffect, useState } from 'react';
import { Card, Metric, Text, Flex, ProgressBar } from '@tremor/react';
import { useDateRange } from '@/contexts/DateRangeContext';

interface ConversionData {
  eventName: string;
  conversions: number;
  previousConversions: number;
  rate: number;
  previousRate: number;
  changePercent: number;
}

export default function ConversionRateCard() {
  const { dateRange, customDates, comparisonEnabled, getComparisonDateStrings } = useDateRange();
  const [data, setData] = useState<ConversionData[]>([]);
  const [comparisonData, setComparisonData] = useState<ConversionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let url = `/api/analytics?type=conversions&range=${dateRange}`;
        if (dateRange === 'custom' && customDates) {
          url += `&startDate=${customDates.startDate}&endDate=${customDates.endDate}`;
        }
        const response = await fetch(url);
        const result = await response.json();
        setData(result.data || []);
        setIsMock(result.mock || false);

        // Fetch comparison data if enabled
        if (comparisonEnabled) {
          const compDates = getComparisonDateStrings();
          if (compDates) {
            const compUrl = `/api/analytics?type=conversions&range=custom&startDate=${compDates.startDate}&endDate=${compDates.endDate}`;
            const compResponse = await fetch(compUrl);
            const compResult = await compResponse.json();
            if (compResult.data) {
              setComparisonData(compResult.data);
            }
          }
        } else {
          setComparisonData([]);
        }
      } catch (error) {
        console.error('Error fetching conversion data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange, customDates, comparisonEnabled, getComparisonDateStrings]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-32 bg-slate-200 rounded"></div>
      </Card>
    );
  }

  const globalRate = data.length > 0
    ? data.reduce((sum, d) => sum + d.rate, 0) / data.length
    : 0;

  // Calculate comparison rate when enabled
  const comparisonGlobalRate = comparisonData.length > 0
    ? comparisonData.reduce((sum, d) => sum + d.rate, 0) / comparisonData.length
    : 0;

  // Use comparison data or previous period data for change calculation
  const referenceRate = comparisonEnabled && comparisonData.length > 0
    ? comparisonGlobalRate
    : (data.length > 0 ? data.reduce((sum, d) => sum + d.previousRate, 0) / data.length : 0);

  const globalChange = referenceRate > 0
    ? ((globalRate - referenceRate) / referenceRate) * 100
    : 0;

  const isPositive = globalChange >= 0;

  // Helper to get comparison item
  const getComparisonItem = (eventName: string) => {
    return comparisonData.find(c => c.eventName === eventName);
  };

  return (
    <Card>
      <Flex justifyContent="between" alignItems="start" className="flex-col sm:flex-row gap-2">
        <div>
          <Text>Taux de Conversion Global</Text>
          <Metric className="mt-1">{globalRate.toFixed(2)}%</Metric>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white ${
            isPositive ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        >
          {isPositive ? '↑' : '↓'} {globalChange > 0 ? '+' : ''}{globalChange.toFixed(1)}%
        </span>
      </Flex>

      <Text className="mt-4 mb-2">
        {comparisonEnabled && comparisonData.length > 0
          ? `vs ${comparisonGlobalRate.toFixed(2)}% comparé`
          : 'vs période précédente'}
      </Text>
      <ProgressBar
        value={Math.min(100, (globalRate / 10) * 100)}
        color={globalChange >= 0 ? 'emerald' : 'red'}
        className="h-2"
      />

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
        {data.map((item) => {
          const compItem = getComparisonItem(item.eventName);
          const itemChange = comparisonEnabled && compItem
            ? ((item.conversions - compItem.conversions) / compItem.conversions) * 100
            : item.changePercent;

          return (
            <div key={item.eventName} className="text-center">
              <Text className="text-xs text-slate-500 capitalize">
                {item.eventName === 'purchase' ? 'Achats' : 'Leads'}
              </Text>
              <p className="text-lg font-semibold text-slate-900">
                {item.conversions.toLocaleString('fr-FR')}
              </p>
              <span
                className={`inline-flex items-center justify-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium text-white ${
                  itemChange >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              >
                {itemChange >= 0 ? '↑' : '↓'}{itemChange > 0 ? '+' : ''}{itemChange.toFixed(1)}%
              </span>
              {comparisonEnabled && compItem && (
                <Text className="text-xs text-slate-400">
                  vs {compItem.conversions.toLocaleString('fr-FR')}
                </Text>
              )}
            </div>
          );
        })}
      </div>

      {isMock && (
        <div className="mt-3 rounded bg-amber-50 px-2 py-1">
          <Text className="text-xs text-amber-700">Données de démonstration</Text>
        </div>
      )}
    </Card>
  );
}
