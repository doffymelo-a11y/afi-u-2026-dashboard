'use client';

import { Card, Title, Flex, Text, ProgressBar } from '@tremor/react';
import { seoData } from '@/data/mockData';

interface VitalProps {
  name: string;
  value: number;
  unit: string;
  thresholds: { good: number; poor: number };
  lowerIsBetter?: boolean;
}

function VitalIndicator({ name, value, unit, thresholds, lowerIsBetter = true }: VitalProps) {
  let status: 'good' | 'needs-improvement' | 'poor';
  let color: string;
  let progressValue: number;

  if (lowerIsBetter) {
    if (value <= thresholds.good) {
      status = 'good';
      color = 'emerald';
      progressValue = (value / thresholds.good) * 33;
    } else if (value <= thresholds.poor) {
      status = 'needs-improvement';
      color = 'amber';
      progressValue = 33 + ((value - thresholds.good) / (thresholds.poor - thresholds.good)) * 33;
    } else {
      status = 'poor';
      color = 'red';
      progressValue = Math.min(100, 66 + ((value - thresholds.poor) / thresholds.poor) * 34);
    }
  } else {
    progressValue = Math.min(100, (value / thresholds.poor) * 100);
    color = value >= thresholds.good ? 'emerald' : value >= thresholds.poor ? 'amber' : 'red';
    status = value >= thresholds.good ? 'good' : value >= thresholds.poor ? 'needs-improvement' : 'poor';
  }

  const statusLabels = {
    'good': 'Bon',
    'needs-improvement': 'À améliorer',
    'poor': 'Mauvais',
  };

  const statusColors = {
    'good': 'bg-emerald-500',
    'needs-improvement': 'bg-amber-500',
    'poor': 'bg-red-500',
  };

  return (
    <div className="space-y-2">
      <Flex justifyContent="between" alignItems="center">
        <Text className="font-medium">{name}</Text>
        <Flex justifyContent="end" className="gap-2">
          <Text className="font-semibold">{value}{unit}</Text>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        </Flex>
      </Flex>
      <ProgressBar value={progressValue} color={color as 'emerald' | 'amber' | 'red'} className="h-2" />
    </div>
  );
}

export default function CoreWebVitals() {
  const { coreWebVitals } = seoData;

  return (
    <Card>
      <Title>Core Web Vitals</Title>
      <Text className="mb-4">Performance utilisateur (INP remplace FID depuis 2024)</Text>

      <div className="space-y-6">
        <VitalIndicator
          name="LCP (Largest Contentful Paint)"
          value={coreWebVitals.lcp.value}
          unit="s"
          thresholds={{ good: 2.5, poor: 4 }}
        />
        <VitalIndicator
          name="INP (Interaction to Next Paint)"
          value={coreWebVitals.inp.value}
          unit="ms"
          thresholds={{ good: 200, poor: 500 }}
        />
        <VitalIndicator
          name="CLS (Cumulative Layout Shift)"
          value={coreWebVitals.cls.value}
          unit=""
          thresholds={{ good: 0.1, poor: 0.25 }}
        />
      </div>

      <div className="mt-6 rounded-lg bg-slate-50 p-3">
        <Text className="text-xs text-slate-600">
          Seuils Google : Vert {'<'} Bon | Orange = À améliorer | Rouge {'>'} Mauvais
        </Text>
      </div>
    </Card>
  );
}
