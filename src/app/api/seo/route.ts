import { NextResponse } from 'next/server';
import {
  getBrandedTraffic,
  getBrandedSummary,
  get404Errors,
  getGSCPerformance,
} from '@/lib/gsc';

// Helper pour calculer les dates
function getDateRange(range: string): {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
} {
  const today = new Date();
  // GSC a un délai de 2-3 jours, on termine à J-3
  today.setDate(today.getDate() - 3);
  const endDate = today.toISOString().split('T')[0];

  let daysBack = 30;
  if (range === '7d') daysBack = 7;
  else if (range === '90d') daysBack = 90;

  const startDateObj = new Date(today);
  startDateObj.setDate(startDateObj.getDate() - daysBack);
  const startDate = startDateObj.toISOString().split('T')[0];

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
  const type = searchParams.get('type') || 'branded';
  const range = searchParams.get('range') || '30d';

  const { startDate, endDate, previousStartDate, previousEndDate } = getDateRange(range);

  try {
    // Vérifier si GSC est configuré
    if (!process.env.GSC_SITE_URL || !process.env.BRAND_NAME) {
      return NextResponse.json({
        success: true,
        mock: true,
        message: 'GSC not configured - returning mock data',
        data: getMockData(type),
      });
    }

    let data;

    switch (type) {
      case 'branded':
        data = await getBrandedTraffic(startDate, endDate);
        break;

      case 'branded-summary':
        data = await getBrandedSummary(startDate, endDate, previousStartDate, previousEndDate);
        break;

      case 'errors':
      case '404':
        data = await get404Errors();
        break;

      case 'performance':
        data = await getGSCPerformance(startDate, endDate);
        break;

      case 'overview':
      default:
        const [brandedData, summary, errors, performance] = await Promise.all([
          getBrandedTraffic(startDate, endDate),
          getBrandedSummary(startDate, endDate, previousStartDate, previousEndDate),
          get404Errors(),
          getGSCPerformance(startDate, endDate),
        ]);
        data = { brandedTraffic: brandedData, summary, errors, performance };
        break;
    }

    return NextResponse.json({
      success: true,
      mock: false,
      dateRange: { startDate, endDate },
      data,
    });
  } catch (error) {
    console.error('GSC API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        mock: true,
        data: getMockData(type),
      },
      { status: 200 }
    );
  }
}

// Données mockées
const MOCK_BRANDED = [
  { date: '01/02', branded: 1200, nonBranded: 4500, total: 5700, brandedPercent: 21.1 },
  { date: '08/02', branded: 1350, nonBranded: 4800, total: 6150, brandedPercent: 22.0 },
  { date: '15/02', branded: 1420, nonBranded: 5100, total: 6520, brandedPercent: 21.8 },
  { date: '22/02', branded: 1580, nonBranded: 5400, total: 6980, brandedPercent: 22.6 },
  { date: '01/03', branded: 1650, nonBranded: 5200, total: 6850, brandedPercent: 24.1 },
  { date: '08/03', branded: 1720, nonBranded: 5600, total: 7320, brandedPercent: 23.5 },
];

const MOCK_SUMMARY = {
  totalBranded: 8500,
  totalNonBranded: 31200,
  brandedPercent: 21.4,
  trend: 'up' as const,
  changePercent: 12.5,
};

const MOCK_ERRORS = {
  total404: 23,
  critical404: 5,
  trend: 'down' as const,
  changePercent: -15.2,
  topErrors: [
    { url: '/ancien-produit-promo-2025', count: 256, lastCrawled: '2026-03-01' },
    { url: '/categorie/ancienne-collection', count: 189, lastCrawled: '2026-03-01' },
    { url: '/blog/article-supprime', count: 145, lastCrawled: '2026-02-28' },
    { url: '/promo-black-friday-2025', count: 112, lastCrawled: '2026-02-28' },
    { url: '/landing-campagne-terminee', count: 98, lastCrawled: '2026-02-27' },
  ],
};

const MOCK_PERFORMANCE = {
  clicks: 39700,
  impressions: 892000,
  ctr: 4.45,
  position: 12.3,
};

function getMockData(type: string): unknown {
  switch (type) {
    case 'branded':
      return MOCK_BRANDED;
    case 'branded-summary':
      return MOCK_SUMMARY;
    case 'errors':
    case '404':
      return MOCK_ERRORS;
    case 'performance':
      return MOCK_PERFORMANCE;
    default:
      return {
        brandedTraffic: MOCK_BRANDED,
        summary: MOCK_SUMMARY,
        errors: MOCK_ERRORS,
        performance: MOCK_PERFORMANCE,
      };
  }
}
