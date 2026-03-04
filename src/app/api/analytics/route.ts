import { NextResponse } from 'next/server';
import {
  getMERData,
  getConversionData,
  getChannelCostData,
  getCampaignConversions,
  getConversionsBySource,
  getGlobalMER,
  getBlendedCPL,
  getOverview,
} from '@/lib/ga4';

// Helper pour calculer les dates
function getDateRange(
  range: string,
  customStart?: string | null,
  customEnd?: string | null
): {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
} {
  const today = new Date();

  // Support custom date range
  if (range === 'custom' && customStart && customEnd) {
    const startDate = customStart;
    const endDate = customEnd;

    const startObj = new Date(customStart);
    const endObj = new Date(customEnd);
    const daysBack = Math.ceil((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const previousEndObj = new Date(startObj);
    previousEndObj.setDate(previousEndObj.getDate() - 1);
    const previousEndDate = previousEndObj.toISOString().split('T')[0];

    const previousStartObj = new Date(previousEndObj);
    previousStartObj.setDate(previousStartObj.getDate() - daysBack);
    const previousStartDate = previousStartObj.toISOString().split('T')[0];

    return { startDate, endDate, previousStartDate, previousEndDate };
  }

  const endDate = today.toISOString().split('T')[0];

  let daysBack = 30;
  if (range === '7d') daysBack = 7;
  else if (range === '90d') daysBack = 90;
  else if (range === '12m') daysBack = 365;
  else if (range === 'ytd') {
    // Year to date
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const startDate = startOfYear.toISOString().split('T')[0];
    const previousStartDate = new Date(today.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
    const previousEndDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    return { startDate, endDate, previousStartDate, previousEndDate };
  } else if (range === 'ly') {
    // Last year
    const startDate = new Date(today.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
    const endDateLY = new Date(today.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
    const previousStartDate = new Date(today.getFullYear() - 2, 0, 1).toISOString().split('T')[0];
    const previousEndDate = new Date(today.getFullYear() - 2, 11, 31).toISOString().split('T')[0];
    return { startDate, endDate: endDateLY, previousStartDate, previousEndDate };
  }

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
  const customStart = searchParams.get('startDate');
  const customEnd = searchParams.get('endDate');

  const { startDate, endDate, previousStartDate, previousEndDate } = getDateRange(
    range,
    customStart,
    customEnd
  );

  try {
    // Vérifier si GA4 est configuré
    console.log('[GA4 DEBUG] Property ID:', process.env.GA4_PROPERTY_ID);
    console.log('[GA4 DEBUG] Credentials path:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

    if (!process.env.GA4_PROPERTY_ID) {
      console.log('[GA4 DEBUG] No property ID - returning mock data');
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
        data = await getConversionsBySource(startDate, endDate);
        break;

      case 'blended-cpl':
        data = await getBlendedCPL(startDate, endDate);
        break;

      case 'overview':
      default:
        // Récupère toutes les données principales
        const [merGlobal, conversions, blendedCPL, overview] = await Promise.all([
          getGlobalMER(startDate, endDate, previousStartDate, previousEndDate),
          getConversionData(startDate, endDate, previousStartDate, previousEndDate),
          getBlendedCPL(startDate, endDate),
          getOverview(startDate, endDate, previousStartDate, previousEndDate),
        ]);
        data = { merGlobal, conversions, blendedCPL, overview };
        break;
    }

    console.log('[GA4 DEBUG] Data returned:', JSON.stringify(data).substring(0, 500));
    return NextResponse.json({
      success: true,
      mock: false,
      dateRange: { startDate, endDate },
      data,
    });
  } catch (error) {
    console.error('[GA4 DEBUG] API Error:', error);
    console.error('[GA4 DEBUG] Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('[GA4 DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack');
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
        { source: 'google / cpc', campaign: 'Brand - Search', sessions: 8650, conversions: 450, leads: 120, rate: 5.2, cost: 1200, cpa: 27.78 },
        { source: 'google / cpc', campaign: 'Generic - Search', sessions: 13571, conversions: 380, leads: 95, rate: 2.8, cost: 800, cpa: 73.68 },
        { source: 'facebook / cpc', campaign: 'Remarketing', sessions: 3412, conversions: 290, leads: 180, rate: 8.5, cost: 950, cpa: 29.31 },
        { source: 'facebook / cpc', campaign: 'Prospecting', sessions: 24762, conversions: 520, leads: 340, rate: 2.1, cost: 1350, cpa: 67.31 },
        { source: 'google / organic', campaign: '(not set)', sessions: 45000, conversions: 890, leads: 450, rate: 1.98, cost: 0, cpa: 0 },
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
