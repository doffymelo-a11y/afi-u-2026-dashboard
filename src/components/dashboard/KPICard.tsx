'use client';

import { Card, Metric, Text, Flex } from '@tremor/react';

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

export default function KPICard({ title, value, change, changeType }: KPICardProps) {
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  return (
    <Card className="mx-auto">
      <Flex justifyContent="between" alignItems="center">
        <Text>{title}</Text>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white ${
            isPositive ? 'bg-emerald-500' : isNegative ? 'bg-red-500' : 'bg-slate-500'
          }`}
        >
          {isPositive ? '↑' : isNegative ? '↓' : '→'} {change}
        </span>
      </Flex>
      <Metric className="mt-2">{value}</Metric>
    </Card>
  );
}
