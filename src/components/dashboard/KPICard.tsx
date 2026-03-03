'use client';

import { Card, Metric, Text, Flex, BadgeDelta } from '@tremor/react';

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

export default function KPICard({ title, value, change, changeType }: KPICardProps) {
  const deltaType = changeType === 'positive' ? 'increase' : changeType === 'negative' ? 'decrease' : 'unchanged';

  return (
    <Card className="mx-auto">
      <Flex justifyContent="between" alignItems="center">
        <Text>{title}</Text>
        <BadgeDelta deltaType={deltaType}>{change}</BadgeDelta>
      </Flex>
      <Metric className="mt-2">{value}</Metric>
    </Card>
  );
}
