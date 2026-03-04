'use client';

import { useEffect, useState } from 'react';
import { Card, Title, Text, Flex } from '@tremor/react';
import { useDateRange } from '@/contexts/DateRangeContext';

interface ChannelData {
  channel: string;
  leads: number;
  color: string;
}

const COLOR_MAP: Record<string, string> = {
  'Direct': '#3b82f6',      // blue
  'Google Ads': '#10b981',  // emerald
  'Meta Ads': '#8b5cf6',    // violet
  'Organic': '#f59e0b',     // amber
  'Referral': '#ec4899',    // pink
  'Email': '#06b6d4',       // cyan
  'Other': '#6366f1',       // indigo
};

const DEFAULT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#6366f1', '#84cc16', '#f97316', '#14b8a6'
];

export default function ChannelDonut() {
  const { dateRange, customDates } = useDateRange();
  const [data, setData] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

        const channelData = (result.data || []).map((ch: { channel: string; conversions: number; leads: number }, index: number) => ({
          channel: ch.channel,
          leads: (ch.leads || 0) + (ch.conversions || 0),
          color: COLOR_MAP[ch.channel] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
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
  }, [dateRange, customDates]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-64 bg-slate-200 rounded"></div>
      </Card>
    );
  }

  const totalLeads = data.reduce((sum, d) => sum + d.leads, 0);

  // Calculate SVG donut segments
  const radius = 80;
  const strokeWidth = 30;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const segments = data.map((item, index) => {
    const percent = totalLeads > 0 ? item.leads / totalLeads : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const rotation = cumulativePercent * 360 - 90;
    cumulativePercent += percent;

    return {
      ...item,
      strokeDasharray,
      rotation,
      percent,
      index,
    };
  });

  return (
    <Card>
      <Title>Répartition des Leads par Canal</Title>
      <Text>Distribution des conversions</Text>

      <div className="mt-4 flex justify-center">
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {segments.map((segment) => (
              <circle
                key={segment.channel}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={hoveredIndex === segment.index ? strokeWidth + 5 : strokeWidth}
                strokeDasharray={segment.strokeDasharray}
                strokeLinecap="butt"
                transform={`rotate(${segment.rotation} 100 100)`}
                style={{
                  transition: 'stroke-width 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredIndex(segment.index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
            <text
              x="100"
              y="95"
              textAnchor="middle"
              className="text-2xl font-bold"
              fill="#1e293b"
            >
              {totalLeads.toLocaleString('fr-FR')}
            </text>
            <text
              x="100"
              y="115"
              textAnchor="middle"
              className="text-sm"
              fill="#64748b"
            >
              leads
            </text>
          </svg>

          {/* Tooltip */}
          {hoveredIndex !== null && segments[hoveredIndex] && (
            <div
              className="absolute bg-white shadow-lg rounded-lg px-3 py-2 text-sm border"
              style={{
                top: '50%',
                left: '110%',
                transform: 'translateY(-50%)',
                whiteSpace: 'nowrap',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segments[hoveredIndex].color }}
                />
                <span className="font-medium">{segments[hoveredIndex].channel}</span>
              </div>
              <div className="text-slate-600">
                {segments[hoveredIndex].leads.toLocaleString('fr-FR')} leads ({(segments[hoveredIndex].percent * 100).toFixed(1)}%)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
        {data.map((item, index) => (
          <div
            key={item.channel}
            className="flex items-center gap-1.5 cursor-pointer"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-slate-600">{item.channel}</span>
          </div>
        ))}
      </div>

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
