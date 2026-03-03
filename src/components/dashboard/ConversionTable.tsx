'use client';

import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Text, Badge } from '@tremor/react';
import { conversionData } from '@/data/mockData';

export default function ConversionTable() {
  return (
    <Card>
      <Title>Détail des Conversions par Campagne</Title>
      <Text>Performance et coût par acquisition</Text>

      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Campagne</TableHeaderCell>
            <TableHeaderCell className="text-right">Conversions</TableHeaderCell>
            <TableHeaderCell className="text-right">Taux</TableHeaderCell>
            <TableHeaderCell className="text-right">Coût</TableHeaderCell>
            <TableHeaderCell className="text-right">CPA</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {conversionData.byCampaign.map((campaign) => (
            <TableRow key={campaign.campaign}>
              <TableCell>
                <Text className="font-medium">{campaign.campaign}</Text>
              </TableCell>
              <TableCell className="text-right">
                <Text>{campaign.conversions}</Text>
              </TableCell>
              <TableCell className="text-right">
                <Badge color={campaign.rate >= 5 ? 'emerald' : campaign.rate >= 3 ? 'amber' : 'red'}>
                  {campaign.rate}%
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Text>{campaign.cost.toLocaleString('fr-FR')}€</Text>
              </TableCell>
              <TableCell className="text-right">
                <Text className={campaign.cpa < 50 ? 'text-emerald-600' : campaign.cpa < 100 ? 'text-amber-600' : 'text-red-600'}>
                  {campaign.cpa.toFixed(2)}€
                </Text>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
