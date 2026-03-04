'use client';

import { useEffect, useState } from 'react';
import { Card, Title, Text, Flex, Badge, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Metric } from '@tremor/react';

interface Error404Data {
  url: string;
  count: number;
  lastCrawled: string;
}

interface SEOHealthData {
  total404: number;
  critical404: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  topErrors: Error404Data[];
}

export default function SEOHealthIndex() {
  const [data, setData] = useState<SEOHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch('/api/seo?type=errors');
        const result = await response.json();
        setData(result.data || null);
        setIsMock(result.mock || false);
      } catch (error) {
        console.error('Error fetching 404 data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
        <Title>Index de Santé SEO</Title>
        <Text className="text-red-500">Erreur de chargement des données</Text>
      </Card>
    );
  }

  // Déterminer le statut global
  let healthStatus: 'good' | 'warning' | 'critical';
  let healthColor: 'emerald' | 'amber' | 'red';
  let healthLabel: string;

  if (data.critical404 === 0 && data.total404 < 10) {
    healthStatus = 'good';
    healthColor = 'emerald';
    healthLabel = 'Excellent';
  } else if (data.critical404 < 3 && data.total404 < 30) {
    healthStatus = 'warning';
    healthColor = 'amber';
    healthLabel = 'À surveiller';
  } else {
    healthStatus = 'critical';
    healthColor = 'red';
    healthLabel = 'Critique';
  }

  const trendIcon = data.trend === 'down' ? '↓' : data.trend === 'up' ? '↑' : '→';
  const trendColor = data.trend === 'down' ? 'text-emerald-600' : data.trend === 'up' ? 'text-red-600' : 'text-slate-600';

  return (
    <Card>
      <Flex justifyContent="between" alignItems="start">
        <div>
          <Title>Index de Santé SEO</Title>
          <Text>Erreurs 404 et pages problématiques (via GSC)</Text>
        </div>
        <Badge size="lg" color={healthColor}>
          {healthLabel}
        </Badge>
      </Flex>

      {/* Métriques principales */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-slate-50 p-4 text-center">
          <Text className="text-xs text-slate-500">Total Erreurs</Text>
          <Metric className={data.total404 > 20 ? 'text-red-600' : data.total404 > 10 ? 'text-amber-600' : 'text-emerald-600'}>
            {data.total404}
          </Metric>
        </div>
        <div className="rounded-lg bg-slate-50 p-4 text-center">
          <Text className="text-xs text-slate-500">Critiques (&gt;100 imp.)</Text>
          <Metric className={data.critical404 > 0 ? 'text-red-600' : 'text-emerald-600'}>
            {data.critical404}
          </Metric>
        </div>
        <div className="rounded-lg bg-slate-50 p-4 text-center">
          <Text className="text-xs text-slate-500">Tendance</Text>
          <Metric className={trendColor}>
            {trendIcon} {Math.abs(data.changePercent)}%
          </Metric>
        </div>
      </div>

      {/* Liste des erreurs */}
      {data.topErrors.length > 0 && (
        <div className="mt-6">
          <Text className="font-medium mb-2">Pages avec le plus d'impact</Text>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>URL</TableHeaderCell>
                <TableHeaderCell className="text-right">Impressions perdues</TableHeaderCell>
                <TableHeaderCell className="text-right">Priorité</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.topErrors.slice(0, 5).map((error, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Text className="truncate max-w-xs" title={error.url}>
                      {error.url}
                    </Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <Text>{error.count.toLocaleString('fr-FR')}</Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge color={error.count > 150 ? 'red' : error.count > 100 ? 'amber' : 'slate'}>
                      {error.count > 150 ? 'Haute' : error.count > 100 ? 'Moyenne' : 'Basse'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Recommandations */}
      <div className="mt-6 rounded-lg border border-slate-200 p-4">
        <Text className="font-medium mb-2">Recommandations</Text>
        <ul className="space-y-1 text-sm text-slate-600">
          {data.critical404 > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              <span>Corriger les {data.critical404} erreurs critiques en priorité (redirections 301)</span>
            </li>
          )}
          {data.total404 > 10 && (
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span>Vérifier les liens internes pointant vers les pages 404</span>
            </li>
          )}
          {data.trend === 'up' && (
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span>Tendance à la hausse : surveiller les nouvelles erreurs</span>
            </li>
          )}
          {data.total404 < 5 && data.critical404 === 0 && (
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">•</span>
              <span>Santé SEO excellente, continuez ainsi !</span>
            </li>
          )}
        </ul>
      </div>

      {isMock && (
        <div className="mt-3 rounded bg-amber-50 px-2 py-1">
          <Text className="text-xs text-amber-700">Données de démonstration - Connectez GSC pour les données réelles</Text>
        </div>
      )}
    </Card>
  );
}
