import { NextResponse } from 'next/server';
import {
  getMERData,
  getConversionData,
  getChannelCostData,
  getCampaignConversions,
  getGlobalMER,
  getBlendedCPL,
} from '@/lib/ga4';

// Helper pour calculer les dates
function getDateRange(range: string): {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
} {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];

  let daysBack = 30;
  if (range === '7d') daysBack = 7;
  else if (range === '90d') daysBack = 90;
  else if (range === '12m') daysBack = 365;

  const startDateObj = new Date(today);
  startDateObj.setDate(startDateObj.getDate() - daysBack);
  const startDate = startDateObj.toISOString().split('T')[0];

  // Période précédente (même durée, juste avant)
  const previousEndObj = new Date(startDateObj);
  previousEndObj.setDate(previousEndObj.getDate() - 1);
  const previousEndDate = previousEndObj.toISOString().split('T')[0];

  const previousStartObj = new Date(previousEndObj);
  previousStartObj.setDate(previousStartObj.getDate() - daysBack);
  const previousStartDate = previousStartObj.toISOString().split('T')[0];

  return { startDate, endDate, previousStartDate, previousEndDate };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'overview';
  const range = searchParams.get('range') || '30d';
  const campaign = searchParams.get('campaign') || undefined;

  const { startDate, endDate, previousStartDate, previousEndDate } = getDateRange(range);

  try {
    // Vérifier si GA4 est configuré
    if (!process.env.GA4_PROPERTY_ID) {
      // Retourner des données mockées si non configuré
      return NextResponse.json({
        success: true,
        mock: true,
        message: 'GA4 not configured - returning mock data',
        data: getMockData(type),
      });
    }

    let data;

    switch (type) {
      case 'mer':
        data = await getMERData(startDate, endDate);
        break;

      case 'mer-global':
        data = await getGlobalMER(startDate, endDate, previousStartDate, previousEndDate);
        break;

      case 'conversions':
        data = await getConversionData(startDate, endDate, previousStartDate, previousEndDate);
        break;

      case 'channels':
        data = await getChannelCostData(startDate, endDate);
        break;

      case 'campaigns':
        data = await getCampaignConversions(startDate, endDate, campaign);
        break;

      case 'blended-cpl':
        data = await getBlendedCPL(startDate, endDate);
        break;

      case 'overview':
      default:
        // Récupère toutes les données principales
        const [merGlobal, conversions, blendedCPL] = await Promise.all([
          getGlobalMER(startDate, endDate, previousStartDate, previousEndDate),
          getConversionData(startDate, endDate, previousStartDate, previousEndDate),
          getBlendedCPL(startDate, endDate),
        ]);
        data = { merGlobal, conversions, blendedCPL };
        break;
    }

    return NextResponse.json({
      success: true,
      mock: false,
      dateRange: { startDate, endDate },
      data,
    });
  } catch (error) {
    console.error('GA4 API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        mock: true,
        data: getMockData(type),
      },
      { status: 200 } // Return 200 with mock data instead of 500
    );
  }
}

// Données mockées pour le développement
function getMockData(type: string) {
  switch (type) {
    case 'mer':
      return [
        { date: '01/01/2026', revenue: 45000, adCost: 12000, mer: 3.75 },
        { date: '08/01/2026', revenue: 52000, adCost: 14000, mer: 3.71 },
        { date: '15/01/2026', revenue: 48000, adCost: 13500, mer: 3.56 },
        { date: '22/01/2026', revenue: 55000, adCost: 15000, mer: 3.67 },
        { date: '29/01/2026', revenue: 61000, adCost: 16500, mer: 3.70 },
        { date: '05/02/2026', revenue: 58000, adCost: 15200, mer: 3.82 },
        { date: '12/02/2026', revenue: 64000, adCost: 16800, mer: 3.81 },
        { date: '19/02/2026', revenue: 72000, adCost: 18000, mer: 4.00 },
      ];

    case 'mer-global':
      return {
        current: 3.85,
        previous: 3.42,
        changePercent: 12.6,
        revenue: 485000,
        adCost: 126000,
      };

    case 'conversions':
      return [
        {
          eventName: 'purchase',
          conversions: 1250,
          previousConversions: 1080,
          rate: 2.8,
          previousRate: 2.4,
          changePercent: 16.7,
        },
        {
          eventName: 'generate_lead',
          conversions: 3420,
          previousConversions: 2950,
          rate: 7.6,
          previousRate: 6.5,
          changePercent: 16.9,
        },
      ];

    case 'channels':
      return [
        { channel: 'Google Ads', source: 'google', medium: 'cpc', adCost: 47500, conversions: 1250, revenue: 187000, cpl: 38 },
        { channel: 'Meta Ads', source: 'facebook', medium: 'cpc', adCost: 35200, conversions: 890, revenue: 98000, cpl: 39.55 },
        { channel: 'Organic', source: 'google', medium: 'organic', adCost: 0, conversions: 2100, revenue: 156000, cpl: 0 },
        { channel: 'Direct', source: '(direct)', medium: '(none)', adCost: 0, conversions: 780, revenue: 44000, cpl: 0 },
      ];

    case 'campaigns':
      return [
        { campaignName: 'Brand - Search', conversions: 450, cost: 12500, cpa: 27.78, rate: 5.2 },
        { campaignName: 'Generic - Search', conversions: 380, cost: 28000, cpa: 73.68, rate: 2.8 },
        { campaignName: 'Remarketing', conversions: 290, cost: 8500, cpa: 29.31, rate: 8.5 },
        { campaignName: 'Meta - Prospecting', conversions: 520, cost: 35000, cpa: 67.31, rate: 2.1 },
      ];

    case 'blended-cpl':
      return {
        blendedCPL: 42.50,
        totalCost: 126000,
        totalConversions: 2965,
      };

    default:
      return {
        merGlobal: {
          current: 3.85,
          previous: 3.42,
          changePercent: 12.6,
          revenue: 485000,
          adCost: 126000,
        },
        conversions: [
          {
            eventName: 'purchase',
            conversions: 1250,
            previousConversions: 1080,
            rate: 2.8,
            previousRate: 2.4,
            changePercent: 16.7,
          },
          {
            eventName: 'generate_lead',
            conversions: 3420,
            previousConversions: 2950,
            rate: 7.6,
            previousRate: 6.5,
            changePercent: 16.9,
          },
        ],
        blendedCPL: {
          blendedCPL: 42.50,
          totalCost: 126000,
          totalConversions: 2965,
        },
      };
  }
}
