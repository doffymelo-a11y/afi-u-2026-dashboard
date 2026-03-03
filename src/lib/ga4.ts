import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Configuration - À définir via variables d'environnement
const propertyId = process.env.GA4_PROPERTY_ID;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Initialisation du client GA4
let analyticsDataClient: BetaAnalyticsDataClient | null = null;

function getClient(): BetaAnalyticsDataClient {
  if (!analyticsDataClient) {
    if (credentialsPath) {
      analyticsDataClient = new BetaAnalyticsDataClient({
        keyFilename: credentialsPath,
      });
    } else {
      // Fallback: utilise les credentials par défaut (ADC)
      analyticsDataClient = new BetaAnalyticsDataClient();
    }
  }
  return analyticsDataClient;
}

// Types pour les réponses
export interface MERData {
  date: string;
  revenue: number;
  adCost: number;
  mer: number;
}

export interface ConversionData {
  eventName: string;
  conversions: number;
  previousConversions: number;
  rate: number;
  previousRate: number;
  changePercent: number;
}

export interface ChannelCostData {
  channel: string;
  source: string;
  medium: string;
  adCost: number;
  conversions: number;
  revenue: number;
  cpl: number;
}

export interface CampaignConversionData {
  campaignName: string;
  conversions: number;
  cost: number;
  cpa: number;
  rate: number;
}

/**
 * Récupère les données MER (Marketing Efficiency Ratio)
 * MER = Total Revenue / Total Ad Spend
 */
export async function getMERData(
  startDate: string,
  endDate: string
): Promise<MERData[]> {
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID is not configured');
  }

  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'totalRevenue' },
      { name: 'advertiserAdCost' },
    ],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
  });

  const data: MERData[] = [];

  if (response.rows) {
    for (const row of response.rows) {
      const date = row.dimensionValues?.[0]?.value || '';
      const revenue = parseFloat(row.metricValues?.[0]?.value || '0');
      const adCost = parseFloat(row.metricValues?.[1]?.value || '0');
      const mer = adCost > 0 ? revenue / adCost : 0;

      data.push({
        date: formatDate(date),
        revenue,
        adCost,
        mer: parseFloat(mer.toFixed(2)),
      });
    }
  }

  return data;
}

/**
 * Récupère les données de conversion par événement
 * Focus sur 'purchase' et 'generate_lead'
 */
export async function getConversionData(
  startDate: string,
  endDate: string,
  previousStartDate: string,
  previousEndDate: string
): Promise<ConversionData[]> {
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID is not configured');
  }

  const client = getClient();

  // Période actuelle
  const [currentResponse] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'eventName' }],
    metrics: [
      { name: 'eventCount' },
      { name: 'sessions' },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: ['purchase', 'generate_lead'],
        },
      },
    },
  });

  // Période précédente
  const [previousResponse] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: previousStartDate, endDate: previousEndDate }],
    dimensions: [{ name: 'eventName' }],
    metrics: [
      { name: 'eventCount' },
      { name: 'sessions' },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: ['purchase', 'generate_lead'],
        },
      },
    },
  });

  // Sessions totales pour calcul du taux
  const [sessionsResponse] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [
      { startDate, endDate },
      { startDate: previousStartDate, endDate: previousEndDate },
    ],
    metrics: [{ name: 'sessions' }],
  });

  const currentSessions = parseFloat(sessionsResponse.rows?.[0]?.metricValues?.[0]?.value || '1');
  const previousSessions = parseFloat(sessionsResponse.rows?.[0]?.metricValues?.[1]?.value || '1');

  const data: ConversionData[] = [];

  const currentMap = new Map<string, { count: number }>();
  const previousMap = new Map<string, { count: number }>();

  if (currentResponse.rows) {
    for (const row of currentResponse.rows) {
      const eventName = row.dimensionValues?.[0]?.value || '';
      const count = parseFloat(row.metricValues?.[0]?.value || '0');
      currentMap.set(eventName, { count });
    }
  }

  if (previousResponse.rows) {
    for (const row of previousResponse.rows) {
      const eventName = row.dimensionValues?.[0]?.value || '';
      const count = parseFloat(row.metricValues?.[0]?.value || '0');
      previousMap.set(eventName, { count });
    }
  }

  for (const eventName of ['purchase', 'generate_lead']) {
    const current = currentMap.get(eventName)?.count || 0;
    const previous = previousMap.get(eventName)?.count || 0;
    const rate = (current / currentSessions) * 100;
    const previousRate = (previous / previousSessions) * 100;
    const changePercent = previousRate > 0 ? ((rate - previousRate) / previousRate) * 100 : 0;

    data.push({
      eventName,
      conversions: current,
      previousConversions: previous,
      rate: parseFloat(rate.toFixed(2)),
      previousRate: parseFloat(previousRate.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(1)),
    });
  }

  return data;
}

/**
 * Récupère les coûts et conversions par canal (source/medium)
 * Inclut advertiserAdCost pour Google Ads et Facebook (via Data Import)
 */
export async function getChannelCostData(
  startDate: string,
  endDate: string
): Promise<ChannelCostData[]> {
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID is not configured');
  }

  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'sessionSourceMedium' }],
    metrics: [
      { name: 'advertiserAdCost' },
      { name: 'conversions' },
      { name: 'totalRevenue' },
    ],
    orderBys: [
      { metric: { metricName: 'advertiserAdCost' }, desc: true },
    ],
    limit: 20,
  });

  const data: ChannelCostData[] = [];

  if (response.rows) {
    for (const row of response.rows) {
      const sourceMedium = row.dimensionValues?.[0]?.value || '';
      const [source, medium] = sourceMedium.split(' / ');
      const adCost = parseFloat(row.metricValues?.[0]?.value || '0');
      const conversions = parseFloat(row.metricValues?.[1]?.value || '0');
      const revenue = parseFloat(row.metricValues?.[2]?.value || '0');
      const cpl = conversions > 0 ? adCost / conversions : 0;

      // Déterminer le canal
      let channel = 'Other';
      if (medium === 'cpc' || medium === 'ppc') {
        channel = source.includes('google') ? 'Google Ads' :
                  source.includes('facebook') || source.includes('fb') ? 'Meta Ads' :
                  'Paid Search';
      } else if (medium === 'organic') {
        channel = 'Organic';
      } else if (medium === 'referral') {
        channel = 'Referral';
      } else if (source === '(direct)') {
        channel = 'Direct';
      } else if (medium === 'social') {
        channel = 'Social';
      }

      data.push({
        channel,
        source,
        medium,
        adCost,
        conversions,
        revenue,
        cpl: parseFloat(cpl.toFixed(2)),
      });
    }
  }

  return data;
}

/**
 * Récupère les conversions par campagne avec filtrage
 */
export async function getCampaignConversions(
  startDate: string,
  endDate: string,
  campaignFilter?: string
): Promise<CampaignConversionData[]> {
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID is not configured');
  }

  const client = getClient();

  const reportRequest: Parameters<typeof client.runReport>[0] = {
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'sessionCampaignName' }],
    metrics: [
      { name: 'conversions' },
      { name: 'advertiserAdCost' },
      { name: 'sessions' },
    ],
    orderBys: [
      { metric: { metricName: 'conversions' }, desc: true },
    ],
    limit: 50,
  };

  // Ajouter le filtre si spécifié
  if (campaignFilter) {
    reportRequest.dimensionFilter = {
      filter: {
        fieldName: 'sessionCampaignName',
        stringFilter: {
          matchType: 'CONTAINS',
          value: campaignFilter,
          caseSensitive: false,
        },
      },
    };
  }

  const [response] = await client.runReport(reportRequest);

  const data: CampaignConversionData[] = [];

  if (response.rows) {
    for (const row of response.rows) {
      const campaignName = row.dimensionValues?.[0]?.value || '(not set)';
      const conversions = parseFloat(row.metricValues?.[0]?.value || '0');
      const cost = parseFloat(row.metricValues?.[1]?.value || '0');
      const sessions = parseFloat(row.metricValues?.[2]?.value || '1');
      const cpa = conversions > 0 ? cost / conversions : 0;
      const rate = (conversions / sessions) * 100;

      if (campaignName !== '(not set)' || conversions > 0) {
        data.push({
          campaignName,
          conversions,
          cost,
          cpa: parseFloat(cpa.toFixed(2)),
          rate: parseFloat(rate.toFixed(2)),
        });
      }
    }
  }

  return data;
}

/**
 * Récupère le MER global et sa variation
 */
export async function getGlobalMER(
  startDate: string,
  endDate: string,
  previousStartDate: string,
  previousEndDate: string
): Promise<{
  current: number;
  previous: number;
  changePercent: number;
  revenue: number;
  adCost: number;
}> {
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID is not configured');
  }

  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [
      { startDate, endDate },
      { startDate: previousStartDate, endDate: previousEndDate },
    ],
    metrics: [
      { name: 'totalRevenue' },
      { name: 'advertiserAdCost' },
    ],
  });

  const currentRevenue = parseFloat(response.rows?.[0]?.metricValues?.[0]?.value || '0');
  const currentAdCost = parseFloat(response.rows?.[0]?.metricValues?.[1]?.value || '0');
  const previousRevenue = parseFloat(response.rows?.[0]?.metricValues?.[2]?.value || '0');
  const previousAdCost = parseFloat(response.rows?.[0]?.metricValues?.[3]?.value || '0');

  const currentMER = currentAdCost > 0 ? currentRevenue / currentAdCost : 0;
  const previousMER = previousAdCost > 0 ? previousRevenue / previousAdCost : 0;
  const changePercent = previousMER > 0 ? ((currentMER - previousMER) / previousMER) * 100 : 0;

  return {
    current: parseFloat(currentMER.toFixed(2)),
    previous: parseFloat(previousMER.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(1)),
    revenue: currentRevenue,
    adCost: currentAdCost,
  };
}

/**
 * Calcule le Blended CPL (tous canaux confondus)
 */
export async function getBlendedCPL(
  startDate: string,
  endDate: string
): Promise<{
  blendedCPL: number;
  totalCost: number;
  totalConversions: number;
}> {
  const channelData = await getChannelCostData(startDate, endDate);

  const totalCost = channelData.reduce((sum, ch) => sum + ch.adCost, 0);
  const totalConversions = channelData.reduce((sum, ch) => sum + ch.conversions, 0);
  const blendedCPL = totalConversions > 0 ? totalCost / totalConversions : 0;

  return {
    blendedCPL: parseFloat(blendedCPL.toFixed(2)),
    totalCost,
    totalConversions,
  };
}

// Helper: format date YYYYMMDD to readable format
function formatDate(dateStr: string): string {
  if (dateStr.length === 8) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}
