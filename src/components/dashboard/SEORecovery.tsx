'use client';

import { Card, Title, LineChart, Text, Flex, Metric, BadgeDelta } from '@tremor/react';
import { seoData } from '@/data/mockData';

export default function SEORecovery() {
  return (
    <Card>
      <Flex justifyContent="between" alignItems="start">
        <div>
          <Title>Récupération Trafic SEO Post-Migration</Title>
          <Text>Comparaison avec la baseline pré-migration</Text>
        </div>
        <div className="text-right">
          <Text>Taux de récupération</Text>
          <Flex justifyContent="end" alignItems="baseline" className="gap-2">
            <Metric className="text-emerald-600">{seoData.organicTraffic.recovery}%</Metric>
            <BadgeDelta deltaType="increase">+12.7%</BadgeDelta>
          </Flex>
        </div>
      </Flex>

      <LineChart
        className="mt-4 h-64"
        data={seoData.trafficHistory}
        index="date"
        categories={['traffic', 'baseline']}
        colors={['blue', 'slate']}
        valueFormatter={(value) => `${(value / 1000).toFixed(1)}K`}
        showLegend={true}
        curveType="monotone"
      />

      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-200 pt-4">
        <div className="text-center">
          <Text className="text-sm text-slate-500">Trafic actuel</Text>
          <p className="text-xl font-semibold text-blue-600">{(seoData.organicTraffic.current / 1000).toFixed(0)}K</p>
        </div>
        <div className="text-center">
          <Text className="text-sm text-slate-500">Erreurs 404</Text>
          <p className="text-xl font-semibold text-amber-600">{seoData.errors404.count}</p>
        </div>
        <div className="text-center">
          <Text className="text-sm text-slate-500">vs Mois précédent</Text>
          <p className="text-xl font-semibold text-emerald-600">+{((seoData.organicTraffic.current - seoData.organicTraffic.previous) / seoData.organicTraffic.previous * 100).toFixed(1)}%</p>
        </div>
      </div>
    </Card>
  );
}
