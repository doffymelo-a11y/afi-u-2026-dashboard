'use client';

import { Card, Title, BarChart, Text, Flex, Metric } from '@tremor/react';
import { channelData } from '@/data/mockData';

export default function ChannelPerformance() {
  const chartData = channelData.channels.map((channel) => ({
    name: channel.name,
    'CPL (€)': channel.cpl,
    'Leads': channel.leads,
  }));

  return (
    <Card>
      <Flex justifyContent="between" alignItems="start">
        <div>
          <Title>Performance par Canal</Title>
          <Text>Coût par Lead et volume</Text>
        </div>
        <div className="text-right">
          <Text>Blended CPL</Text>
          <Metric className="text-blue-600">{channelData.blendedCPL}€</Metric>
        </div>
      </Flex>

      <BarChart
        className="mt-4 h-64"
        data={chartData}
        index="name"
        categories={['CPL (€)']}
        colors={['blue']}
        valueFormatter={(value) => `${value}€`}
        showLegend={false}
      />

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 md:grid-cols-5">
        {channelData.channels.map((channel) => (
          <div key={channel.name} className="text-center">
            <Text className="text-xs text-slate-500">{channel.name}</Text>
            <p className="text-lg font-semibold text-slate-900">{channel.leads}</p>
            <Text className="text-xs">leads</Text>
          </div>
        ))}
      </div>
    </Card>
  );
}
