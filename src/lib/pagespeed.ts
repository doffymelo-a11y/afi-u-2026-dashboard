// PageSpeed Insights API Service
// Récupère les Core Web Vitals (LCP, INP, CLS)
// Note: INP remplace FID depuis mars 2024

const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY;
const SITE_URL = process.env.SITE_URL_FOR_PAGESPEED || process.env.GSC_SITE_URL;

// Types
export type VitalStatus = 'good' | 'needs-improvement' | 'poor';

export interface CoreWebVital {
  name: string;
  value: number;
  unit: string;
  status: VitalStatus;
  percentile: number; // p75
}

export interface CoreWebVitalsData {
  lcp: CoreWebVital;
  inp: CoreWebVital; // Remplace FID
  cls: CoreWebVital;
  fcp: CoreWebVital; // First Contentful Paint (bonus)
  ttfb: CoreWebVital; // Time to First Byte (bonus)
  overallScore: number;
  overallStatus: VitalStatus;
  fetchedAt: string;
}

// Seuils Core Web Vitals (Google 2024)
const THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 }, // ms
  inp: { good: 200, poor: 500 }, // ms (remplace FID)
  cls: { good: 0.1, poor: 0.25 }, // score
  fcp: { good: 1800, poor: 3000 }, // ms
  ttfb: { good: 800, poor: 1800 }, // ms
};

/**
 * Récupère les Core Web Vitals via PageSpeed Insights API
 */
export async function getCoreWebVitals(
  url?: string,
  strategy: 'mobile' | 'desktop' = 'mobile'
): Promise<CoreWebVitalsData> {
  const targetUrl = url || SITE_URL;

  if (!targetUrl) {
    throw new Error('SITE_URL_FOR_PAGESPEED or GSC_SITE_URL is not configured');
  }

  // Construire l'URL de l'API
  const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  apiUrl.searchParams.set('url', targetUrl);
  apiUrl.searchParams.set('strategy', strategy);
  apiUrl.searchParams.set('category', 'performance');

  if (PAGESPEED_API_KEY) {
    apiUrl.searchParams.set('key', PAGESPEED_API_KEY);
  }

  const response = await fetch(apiUrl.toString());

  if (!response.ok) {
    throw new Error(`PageSpeed API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Extraire les métriques du rapport Lighthouse
  const audits = data.lighthouseResult?.audits || {};
  const fieldData = data.loadingExperience?.metrics || {};

  // LCP
  const lcpValue = fieldData.LARGEST_CONTENTFUL_PAINT_MS?.percentile ||
                   audits['largest-contentful-paint']?.numericValue ||
                   0;

  // INP (Interaction to Next Paint) - remplace FID
  // Note: INP peut ne pas être disponible dans toutes les réponses
  const inpValue = fieldData.INTERACTION_TO_NEXT_PAINT?.percentile ||
                   fieldData.FIRST_INPUT_DELAY_MS?.percentile || // Fallback FID si INP non dispo
                   audits['max-potential-fid']?.numericValue ||
                   0;

  // CLS
  const clsValue = fieldData.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile ||
                   audits['cumulative-layout-shift']?.numericValue ||
                   0;

  // FCP
  const fcpValue = fieldData.FIRST_CONTENTFUL_PAINT_MS?.percentile ||
                   audits['first-contentful-paint']?.numericValue ||
                   0;

  // TTFB
  const ttfbValue = fieldData.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.percentile ||
                    audits['server-response-time']?.numericValue ||
                    0;

  // Calculer les statuts
  const lcp = createVital('LCP', lcpValue, 'ms', THRESHOLDS.lcp);
  const inp = createVital('INP', inpValue, 'ms', THRESHOLDS.inp);
  const cls = createVital('CLS', clsValue / 100, '', THRESHOLDS.cls); // CLS est en centièmes
  const fcp = createVital('FCP', fcpValue, 'ms', THRESHOLDS.fcp);
  const ttfb = createVital('TTFB', ttfbValue, 'ms', THRESHOLDS.ttfb);

  // Score global
  const overallScore = data.lighthouseResult?.categories?.performance?.score || 0;
  const overallStatus = getOverallStatus([lcp, inp, cls]);

  return {
    lcp,
    inp,
    cls,
    fcp,
    ttfb,
    overallScore: Math.round(overallScore * 100),
    overallStatus,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Récupère les CWV pour plusieurs pages
 */
export async function getMultiPageCWV(
  urls: string[],
  strategy: 'mobile' | 'desktop' = 'mobile'
): Promise<Map<string, CoreWebVitalsData>> {
  const results = new Map<string, CoreWebVitalsData>();

  // Limiter les requêtes parallèles pour éviter le rate limiting
  const batchSize = 3;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const promises = batch.map(async (url) => {
      try {
        const data = await getCoreWebVitals(url, strategy);
        return { url, data };
      } catch (error) {
        console.error(`Error fetching CWV for ${url}:`, error);
        return { url, data: null };
      }
    });

    const batchResults = await Promise.all(promises);
    for (const result of batchResults) {
      if (result.data) {
        results.set(result.url, result.data);
      }
    }

    // Petite pause entre les batches
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Vérifie si les CWV passent les seuils Google
 */
export function checkCWVPass(cwv: CoreWebVitalsData): {
  passed: boolean;
  failedMetrics: string[];
} {
  const failedMetrics: string[] = [];

  if (cwv.lcp.status === 'poor') failedMetrics.push('LCP');
  if (cwv.inp.status === 'poor') failedMetrics.push('INP');
  if (cwv.cls.status === 'poor') failedMetrics.push('CLS');

  return {
    passed: failedMetrics.length === 0,
    failedMetrics,
  };
}

// Helpers
function createVital(
  name: string,
  value: number,
  unit: string,
  thresholds: { good: number; poor: number }
): CoreWebVital {
  let status: VitalStatus;

  if (value <= thresholds.good) {
    status = 'good';
  } else if (value <= thresholds.poor) {
    status = 'needs-improvement';
  } else {
    status = 'poor';
  }

  return {
    name,
    value: unit === 'ms' ? Math.round(value) : parseFloat(value.toFixed(3)),
    unit,
    status,
    percentile: 75, // p75 par défaut
  };
}

function getOverallStatus(vitals: CoreWebVital[]): VitalStatus {
  const hasPoor = vitals.some(v => v.status === 'poor');
  const hasNeedsImprovement = vitals.some(v => v.status === 'needs-improvement');

  if (hasPoor) return 'poor';
  if (hasNeedsImprovement) return 'needs-improvement';
  return 'good';
}
