'use client';

import { useEffect, useState } from 'react';
import { Card, Title, DonutChart, Text, Flex, Legend } from '@tremor/react';
import { useDateRange } from '@/contexts/DateRangeContext';

interface ChannelData {
  channel: string;
  leads: number;
  color: string;
}

const COLORS = ['blue', 'emerald', 'amber', 'indigo', 'rose'];

export default function ChannelDonut() {
  const { dateRange } = useDateRange();
  const [data, setData] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics?type=channels&range=${dateRange}`);
        const result = await response.json();

        // Transformer les données pour le DonutChart
        const channelData = (result.data || []).map((ch: { channel: string; conversions: number }, index: number) => ({
          channel: ch.channel,
          leads: ch.conversions || 0,
          color: COLORS[index % COLORS.length],
        }));

        setData(channelData);
        setIsMock(result.mock || false);
      } catch (error) {
        console.error('Error fetching channel data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-64 bg-slate-200 rounded"></div>
      </Card>
    );
  }

  const totalLeads = data.reduce((sum, d) => sum + d.leads, 0);

  return (
    <Card>
      <Title>Répartition des Leads par Canal</Title>
      <Text>Distribution des conversions</Text>

      <DonutChart
        className="mt-4 h-52"
        data={data}
        category="leads"
        index="channel"
        colors={COLORS as ('blue' | 'emerald' | 'amber' | 'indigo' | 'rose')[]}
        valueFormatter={(value) => `${value.toLocaleString('fr-FR')} leads`}
        showAnimation={true}
      />

      <Legend
        className="mt-4"
        categories={data.map(d => d.channel)}
        colors={COLORS as ('blue' | 'emerald' | 'amber' | 'indigo' | 'rose')[]}
      />

      <Flex justifyContent="center" className="mt-4 pt-4 border-t border-slate-200">
        <div className="text-center">
          <Text className="text-xs text-slate-500">Total Leads</Text>
          <p className="text-2xl font-bold text-slate-900">
            {totalLeads.toLocaleString('fr-FR')}
          </p>
        </div>
      </Flex>

      {isMock && (
        <div className="mt-3 rounded bg-amber-50 px-2 py-1">
          <Text className="text-xs text-amber-700">Données de démonstration</Text>
        </div>
      )}
    </Card>
  );
}
