'use client';

import { useEffect, useState } from 'react';
import { Card, Title, Text, Flex, Badge, ProgressBar } from '@tremor/react';

type VitalStatus = 'good' | 'needs-improvement' | 'poor';

interface CoreWebVital {
  name: string;
  value: number;
  unit: string;
  status: VitalStatus;
  percentile: number;
}

interface CoreWebVitalsData {
  lcp: CoreWebVital;
  inp: CoreWebVital;
  cls: CoreWebVital;
  fcp?: CoreWebVital;
  ttfb?: CoreWebVital;
  overallScore: number;
  overallStatus: VitalStatus;
  fetchedAt: string;
  passesThresholds: boolean;
  failedMetrics: string[];
}

interface CoreWebVitalsLiveProps {
  strategy?: 'mobile' | 'desktop';
}

// Seuils pour le calcul du pourcentage de la barre
const THRESHOLDS = {
  lcp: { good: 2500, poor: 4000, max: 6000 },
  inp: { good: 200, poor: 500, max: 800 },
  cls: { good: 0.1, poor: 0.25, max: 0.5 },
};

export default function CoreWebVitalsLive({ strategy = 'mobile' }: CoreWebVitalsLiveProps) {
  const [data, setData] = useState<CoreWebVitalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/pagespeed?strategy=${strategy}`);
        const result = await response.json();
        setData(result.data || null);
        setIsMock(result.mock || false);
      } catch (error) {
        console.error('Error fetching CWV:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [strategy]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-64 bg-slate-200 rounded"></div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <Title>Core Web Vitals</Title>
        <Text className="text-red-500">Erreur de chargement des données</Text>
      </Card>
    );
  }

  const vitals = [
    { ...data.lcp, threshold: THRESHOLDS.lcp, description: 'Largest Contentful Paint' },
    { ...data.inp, threshold: THRESHOLDS.inp, description: 'Interaction to Next Paint' },
    { ...data.cls, threshold: THRESHOLDS.cls, description: 'Cumulative Layout Shift' },
  ];

  const statusColors: Record<VitalStatus, string> = {
    good: 'emerald',
    'needs-improvement': 'amber',
    poor: 'red',
  };

  const statusLabels: Record<VitalStatus, string> = {
    good: 'Bon',
    'needs-improvement': 'À améliorer',
    poor: 'Mauvais',
  };

  const statusBgColors: Record<VitalStatus, string> = {
    good: 'bg-emerald-500',
    'needs-improvement': 'bg-amber-500',
    poor: 'bg-red-500',
  };

  return (
    <Card>
      <Flex justifyContent="between" alignItems="start">
        <div>
          <Title>Core Web Vitals</Title>
          <Text>Performance {strategy === 'mobile' ? 'Mobile' : 'Desktop'} (INP remplace FID)</Text>
        </div>
        <div className="text-right">
          <Flex justifyContent="end" alignItems="center" className="gap-2">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-white font-bold ${statusBgColors[data.overallStatus]}`}>
              {data.overallScore}
            </span>
          </Flex>
          <Text className="text-xs text-slate-500 mt-1">Score Lighthouse</Text>
        </div>
      </Flex>

      <div className="mt-6 space-y-6">
        {vitals.map((vital) => {
          // Calcul du pourcentage pour la barre
          const maxValue = vital.threshold.max;
          const percentage = Math.min(100, (vital.value / maxValue) * 100);

          return (
            <div key={vital.name} className="space-y-2">
              <Flex justifyContent="between" alignItems="center">
                <div>
                  <Text className="font-medium">{vital.name}</Text>
                  <Text className="text-xs text-slate-500">{vital.description}</Text>
                </div>
                <Flex justifyContent="end" className="gap-3">
                  <Text className="font-semibold">
                    {vital.value}{vital.unit}
                  </Text>
                  <Badge color={statusColors[vital.status]}>
                    {statusLabels[vital.status]}
                  </Badge>
                </Flex>
              </Flex>
              <ProgressBar
                value={percentage}
                color={statusColors[vital.status] as 'emerald' | 'amber' | 'red'}
                className="h-2"
              />
              <Flex justifyContent="between" className="text-xs text-slate-400">
                <span>0</span>
                <span className="text-emerald-500">{vital.threshold.good}{vital.unit}</span>
                <span className="text-amber-500">{vital.threshold.poor}{vital.unit}</span>
                <span>{maxValue}{vital.unit}</span>
              </Flex>
            </div>
          );
        })}
      </div>

      {/* Résumé */}
      <div className="mt-6 rounded-lg bg-slate-50 p-4">
        <Flex justifyContent="between" alignItems="center">
          <div>
            <Text className="font-medium">
              {data.passesThresholds ? '✓ Tous les seuils Google sont respectés' : '⚠ Certains seuils ne sont pas respectés'}
            </Text>
            {!data.passesThresholds && data.failedMetrics.length > 0 && (
              <Text className="text-xs text-red-600 mt-1">
                Métriques en échec : {data.failedMetrics.join(', ')}
              </Text>
            )}
          </div>
          <Badge color={data.passesThresholds ? 'emerald' : 'red'}>
            {data.passesThresholds ? 'PASS' : 'FAIL'}
          </Badge>
        </Flex>
      </div>

      {isMock && (
        <div className="mt-3 rounded bg-amber-50 px-2 py-1">
          <Text className="text-xs text-amber-700">Données de démonstration</Text>
        </div>
      )}
    </Card>
  );
}
