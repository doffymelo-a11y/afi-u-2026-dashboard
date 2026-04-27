'use client';

import { useEffect, useState } from 'react';
import { Card, Text, Metric, Flex, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from '@tremor/react';
import Header from '@/components/layout/Header';
import ChannelDonut from '@/components/dashboard/ChannelDonut';
import { useDateRange } from '@/contexts/DateRangeContext';

interface ChannelData {
  channel: string;
  source: string;
  medium: string;
  adCost: number;
  conversions: number;
  revenue: number;
  cpl: number;
  leads: number;
}

function formatCurrency(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M$`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K$`;
  return `${num.toFixed(0)}$`;
}

export default function ChannelsPage() {
  const { dateRange, customDates, comparisonEnabled, getComparisonDateStrings } = useDateRange();
  const [data, setData] = useState<ChannelData[]>([]);
  const [comparisonData, setComparisonData] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let url = `/api/analytics?type=channels&range=${dateRange}`;
        if (dateRange === 'custom' && customDates) {
          url += `&startDate=${customDates.startDate}&endDate=${customDates.endDate}`;
        }
        const response = await fetch(url);
        const result = await response.json();
        setData(result.data || []);

        // Fetch comparison data if enabled
        if (comparisonEnabled) {
          const compDates = getComparisonDateStrings();
          if (compDates) {
            const compUrl = `/api/analytics?type=channels&range=custom&startDate=${compDates.startDate}&endDate=${compDates.endDate}`;
            const compResponse = await fetch(compUrl);
            const compResult = await compResponse.json();
            setComparisonData(compResult.data || []);
          }
        } else {
          setComparisonData([]);
        }
      } catch (error) {
        console.error('Error fetching channel data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange, customDates, comparisonEnabled, getComparisonDateStrings]);

  // Calculer les KPIs
  const totalLeads = data.reduce((sum, ch) => sum + ch.leads + ch.conversions, 0);
  const totalCost = data.reduce((sum, ch) => sum + ch.adCost, 0);
  const blendedCPL = totalLeads > 0 ? totalCost / totalLeads : 0;
  const paidChannels = data.filter(ch => ch.adCost > 0);
  const sortedData = [...data].sort((a, b) => (b.leads + b.conversions) - (a.leads + a.conversions));
  const bestChannel = sortedData[0];

  // Comparison KPIs
  const compTotalLeads = comparisonData.reduce((sum, ch) => sum + ch.leads + ch.conversions, 0);
  const compTotalCost = comparisonData.reduce((sum, ch) => sum + ch.adCost, 0);
  const compBlendedCPL = compTotalLeads > 0 ? compTotalCost / compTotalLeads : 0;

  // Helper for calculating comparison change
  const calcChange = (current: number, comparison: number): number => {
    if (comparisonEnabled && comparison !== 0) {
      return ((current - comparison) / comparison) * 100;
    }
    return 0;
  };

  const kpis = [
    {
      title: 'Blended CPL',
      value: blendedCPL > 0 ? `${blendedCPL.toFixed(2)}$` : '-',
      change: calcChange(blendedCPL, compBlendedCPL),
      subtitle: 'Coût par lead global',
      compValue: comparisonEnabled && compBlendedCPL > 0 ? `${compBlendedCPL.toFixed(2)}$` : null,
      invertColor: true,
    },
    {
      title: 'Total Leads',
      value: totalLeads.toLocaleString('fr-FR'),
      change: calcChange(totalLeads, compTotalLeads),
      subtitle: 'Leads + Conversions',
      compValue: comparisonEnabled && compTotalLeads > 0 ? compTotalLeads.toLocaleString('fr-FR') : null,
      invertColor: false,
    },
    {
      title: 'Canaux actifs',
      value: data.length.toString(),
      change: 0,
      subtitle: `${paidChannels.length} payants`,
      compValue: null,
      invertColor: false,
    },
    {
      title: 'Meilleur canal',
      value: bestChannel?.channel || '-',
      change: 0,
      subtitle: bestChannel ? `${(bestChannel.leads + bestChannel.conversions).toLocaleString('fr-FR')} actions` : '',
      compValue: null,
      invertColor: false,
    },
  ];

  return (
    <>
      <Header title="Canaux d'acquisition" />
      <div className="p-4 sm:p-6">
        {/* KPI Cards - Live */}
        <div className="mb-4 sm:mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-16 bg-slate-200 rounded"></div>
              </Card>
            ))
          ) : (
            kpis.map((kpi) => {
              const deltaType = kpi.change > 0 ? 'increase' : kpi.change < 0 ? 'decrease' : 'unchanged';
              const isPositive = kpi.invertColor ? kpi.change <= 0 : kpi.change >= 0;
              return (
                <Card key={kpi.title}>
                  <Flex alignItems="start" justifyContent="between">
                    <div className="truncate">
                      <Text className="text-xs sm:text-sm text-slate-500 truncate">{kpi.title}</Text>
                      <Metric className="text-lg sm:text-2xl mt-1 truncate">{kpi.value}</Metric>
                    </div>
                    {kpi.change !== 0 && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white ${
                          isPositive ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      >
                        {isPositive ? '↑' : '↓'} {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
                      </span>
                    )}
                  </Flex>
                  <Text className="text-xs text-slate-400 mt-2 truncate">
                    {kpi.compValue ? `vs ${kpi.compValue} comparé` : kpi.subtitle}
                  </Text>
                </Card>
              );
            })
          )}
        </div>

        {/* Channel Distribution & Donut */}
        <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <ChannelDonut />
          <Card>
            <Text className="font-semibold text-slate-900 text-lg mb-4">Performance par canal</Text>
            {loading ? (
              <div className="h-48 bg-slate-200 rounded animate-pulse"></div>
            ) : (
              <div className="space-y-3">
                {data.slice(0, 5).map((channel) => {
                  const actions = channel.leads + channel.conversions;
                  const maxActions = Math.max(...data.map(c => c.leads + c.conversions));
                  const width = maxActions > 0 ? (actions / maxActions) * 100 : 0;

                  return (
                    <div key={channel.channel}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600 font-medium">{channel.channel}</span>
                        <span className="text-slate-900">{actions.toLocaleString('fr-FR')} actions</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${width}%` }}
                        ></div>
                      </div>
                      {channel.cpl > 0 && (
                        <Text className="text-xs text-slate-500 mt-1">CPL: {channel.cpl.toFixed(2)}$</Text>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Detailed Channel Table */}
        <Card>
          <Text className="font-semibold text-slate-900 text-lg mb-4">Performance détaillée par canal</Text>
          {loading ? (
            <div className="h-48 bg-slate-200 rounded animate-pulse"></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Canal</TableHeaderCell>
                    <TableHeaderCell className="text-right">Leads</TableHeaderCell>
                    <TableHeaderCell className="text-right">Conversions</TableHeaderCell>
                    <TableHeaderCell className="text-right">Dépenses</TableHeaderCell>
                    <TableHeaderCell className="text-right">CPL</TableHeaderCell>
                    <TableHeaderCell className="text-right">Revenus</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((channel) => (
                    <TableRow key={channel.channel}>
                      <TableCell>
                        <Text className="font-medium">{channel.channel}</Text>
                      </TableCell>
                      <TableCell className="text-right">
                        <Text>{channel.leads.toLocaleString('fr-FR')}</Text>
                      </TableCell>
                      <TableCell className="text-right">
                        <Text>{channel.conversions.toLocaleString('fr-FR')}</Text>
                      </TableCell>
                      <TableCell className="text-right">
                        <Text>{channel.adCost > 0 ? formatCurrency(channel.adCost) : '-'}</Text>
                      </TableCell>
                      <TableCell className="text-right">
                        {channel.cpl > 0 ? (
                          <Badge color={channel.cpl < 30 ? 'emerald' : channel.cpl < 50 ? 'amber' : 'red'}>
                            {channel.cpl.toFixed(2)}$
                          </Badge>
                        ) : (
                          <Text className="text-slate-400">-</Text>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Text className="text-emerald-600 font-medium">
                          {channel.revenue > 0 ? formatCurrency(channel.revenue) : '-'}
                        </Text>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
