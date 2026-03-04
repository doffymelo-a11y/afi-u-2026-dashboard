import { NextResponse } from 'next/server';
import { getCoreWebVitals, checkCWVPass } from '@/lib/pagespeed';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url') || undefined;
  const strategy = (searchParams.get('strategy') as 'mobile' | 'desktop') || 'mobile';

  try {
    // Vérifier si PageSpeed est configuré (au moins l'URL du site)
    const siteUrl = url || process.env.SITE_URL_FOR_PAGESPEED || process.env.GSC_SITE_URL;

    if (!siteUrl) {
      return NextResponse.json({
        success: true,
        mock: true,
        message: 'Site URL not configured - returning mock data',
        data: getMockData(),
      });
    }

    const cwvData = await getCoreWebVitals(siteUrl, strategy);
    const passCheck = checkCWVPass(cwvData);

    return NextResponse.json({
      success: true,
      mock: false,
      url: siteUrl,
      strategy,
      data: {
        ...cwvData,
        passesThresholds: passCheck.passed,
        failedMetrics: passCheck.failedMetrics,
      },
    });
  } catch (error) {
    console.error('PageSpeed API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        mock: true,
        data: getMockData(),
      },
      { status: 200 }
    );
  }
}

// Données mockées pour le développement
function getMockData() {
  return {
    lcp: {
      name: 'LCP',
      value: 2100,
      unit: 'ms',
      status: 'good',
      percentile: 75,
    },
    inp: {
      name: 'INP',
      value: 180,
      unit: 'ms',
      status: 'good',
      percentile: 75,
    },
    cls: {
      name: 'CLS',
      value: 0.08,
      unit: '',
      status: 'good',
      percentile: 75,
    },
    fcp: {
      name: 'FCP',
      value: 1200,
      unit: 'ms',
      status: 'good',
      percentile: 75,
    },
    ttfb: {
      name: 'TTFB',
      value: 450,
      unit: 'ms',
      status: 'good',
      percentile: 75,
    },
    overallScore: 92,
    overallStatus: 'good',
    fetchedAt: new Date().toISOString(),
    passesThresholds: true,
    failedMetrics: [],
  };
}
