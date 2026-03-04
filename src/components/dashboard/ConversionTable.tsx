'use client';

import { useEffect, useState } from 'react';
import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Text, Badge } from '@tremor/react';
import { useDateRange } from '@/contexts/DateRangeContext';

interface CampaignData {
  campaign: string;
  source: string;
  conversions: number;
  leads: number;
  sessions: number;
  rate: number;
  cost: number;
  cpa: number;
}

export default function ConversionTable() {
  const { dateRange, customDates } = useDateRange();
  const [data, setData] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let url = `/api/analytics?type=campaigns&range=${dateRange}`;
        if (dateRange === 'custom' && customDates) {
          url += `&startDate=${customDates.startDate}&endDate=${customDates.endDate}`;
        }
        const response = await fetch(url);
        const result = await response.json();
        setData(result.data || []);
        setIsMock(result.mock || false);
      } catch (error) {
        console.error('Error fetching campaign data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange, customDates]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-64 bg-slate-200 rounded"></div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <Title>Conversions par Source</Title>
        <Text className="text-slate-500 mt-4">Aucune donnée disponible pour cette période</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Title>Conversions par Source</Title>
      <Text>Performance et coût par acquisition</Text>

      <div className="overflow-x-auto">
        <Table className="mt-4">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Source / Campagne</TableHeaderCell>
              <TableHeaderCell className="text-right">Sessions</TableHeaderCell>
              <TableHeaderCell className="text-right">Conversions</TableHeaderCell>
              <TableHeaderCell className="text-right">Leads</TableHeaderCell>
              <TableHeaderCell className="text-right">Taux</TableHeaderCell>
              <TableHeaderCell className="text-right">Coût</TableHeaderCell>
              <TableHeaderCell className="text-right">CPA</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={`${row.source}-${index}`}>
                <TableCell>
                  <div>
                    <Text className="font-medium">{row.source}</Text>
                    {row.campaign && row.campaign !== '(not set)' && (
                      <Text className="text-xs text-slate-500 truncate max-w-[200px]">{row.campaign}</Text>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Text>{row.sessions.toLocaleString('fr-FR')}</Text>
                </TableCell>
                <TableCell className="text-right">
                  <Text className="font-semibold">{row.conversions.toLocaleString('fr-FR')}</Text>
                </TableCell>
                <TableCell className="text-right">
                  <Text>{row.leads.toLocaleString('fr-FR')}</Text>
                </TableCell>
                <TableCell className="text-right">
                  <Badge color={row.rate >= 5 ? 'emerald' : row.rate >= 2 ? 'amber' : 'red'}>
                    {row.rate.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Text>{row.cost > 0 ? `${row.cost.toLocaleString('fr-FR')}$` : '-'}</Text>
                </TableCell>
                <TableCell className="text-right">
                  {row.cpa > 0 ? (
                    <Text className={row.cpa < 50 ? 'text-emerald-600' : row.cpa < 100 ? 'text-amber-600' : 'text-red-600'}>
                      {row.cpa.toFixed(2)}$
                    </Text>
                  ) : (
                    <Text className="text-slate-400">-</Text>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isMock && (
        <div className="mt-3 rounded bg-amber-50 px-2 py-1">
          <Text className="text-xs text-amber-700">Données de démonstration</Text>
        </div>
      )}
    </Card>
  );
}
