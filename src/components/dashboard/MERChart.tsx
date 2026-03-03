'use client';

import { Card, Title, AreaChart, Text } from '@tremor/react';
import { merData } from '@/data/mockData';

export default function MERChart() {
  return (
    <Card>
      <Title>Marketing Efficiency Ratio (MER) vs ROAS SEM</Title>
      <Text>Évolution mensuelle - Détection de cannibalisation</Text>
      <AreaChart
        className="mt-4 h-72"
        data={merData.history}
        index="date"
        categories={['mer', 'roas']}
        colors={['blue', 'emerald']}
        valueFormatter={(value) => `${value.toFixed(1)}x`}
        showLegend={true}
        showGridLines={true}
        curveType="monotone"
      />
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate-500">
          MER actuel: <span className="font-semibold text-blue-600">{merData.current}x</span>
        </span>
        <span className="text-slate-500">
          vs mois précédent: <span className="font-semibold text-emerald-600">+{((merData.current - merData.previous) / merData.previous * 100).toFixed(1)}%</span>
        </span>
      </div>
    </Card>
  );
}
