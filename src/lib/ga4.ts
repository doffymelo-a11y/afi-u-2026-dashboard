import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { getBudgetForPeriod, identifyChannel, MONTHLY_BUDGETS } from './adSpendConfig';

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
  leads: number;
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
 * Utilise les dépenses fixes mensuelles proratisées
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
    metrics: [{ name: 'totalRevenue' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
  });

  const data: MERData[] = [];
  const { totalBudget, days } = getBudgetForPeriod(startDate, endDate);
  const dailyAdCost = totalBudget / days;

  if (response.rows) {
    for (const row of response.rows) {
      const date = row.dimensionValues?.[0]?.value || '';
      const revenue = parseFloat(row.metricValues?.[0]?.value || '0');
      const mer = dailyAdCost > 0 ? revenue / dailyAdCost : 0;

      data.push({
        date: formatDate(date),
        revenue,
        adCost: dailyAdCost,
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
 * Récupère les conversions par canal avec dépenses fixes
 */
export async function getChannelCostData(
  startDate: string,
  endDate: string
): Promise<ChannelCostData[]> {
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID is not configured');
  }

  const client = getClient();

  // Récupérer les conversions par source/medium
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'sessionSourceMedium' }],
    metrics: [
      { name: 'conversions' },
      { name: 'totalRevenue' },
      { name: 'sessions' },
    ],
    orderBys: [
      { metric: { metricName: 'conversions' }, desc: true },
    ],
    limit: 50,
  });

  // Aussi récupérer les generate_lead par source
  const [leadsResponse] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'sessionSourceMedium' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: {
          matchType: 'EXACT',
          value: 'generate_lead',
        },
      },
    },
  });

  // Mapper les leads par source/medium
  const leadsMap = new Map<string, number>();
  if (leadsResponse.rows) {
    for (const row of leadsResponse.rows) {
      const sourceMedium = row.dimensionValues?.[0]?.value || '';
      const leads = parseFloat(row.metricValues?.[0]?.value || '0');
      leadsMap.set(sourceMedium, leads);
    }
  }

  // Calculer les budgets pour la période
  const { channelBudgets } = getBudgetForPeriod(startDate, endDate);
  const budgetMap = new Map(channelBudgets.map((b) => [b.name, b.budget]));

  // Agréger par canal
  const channelAggregates = new Map<string, {
    conversions: number;
    revenue: number;
    leads: number;
    sources: string[];
  }>();

  if (response.rows) {
    for (const row of response.rows) {
      const sourceMedium = row.dimensionValues?.[0]?.value || '';
      const parts = sourceMedium.split(' / ');
      const source = parts[0] || '(direct)';
      const medium = parts[1] || '(none)';
      const conversions = parseFloat(row.metricValues?.[0]?.value || '0');
      const revenue = parseFloat(row.metricValues?.[1]?.value || '0');
      const leads = leadsMap.get(sourceMedium) || 0;

      const channel = identifyChannel(source, medium);

      const existing = channelAggregates.get(channel) || {
        conversions: 0,
        revenue: 0,
        leads: 0,
        sources: [],
      };

      existing.conversions += conversions;
      existing.revenue += revenue;
      existing.leads += leads;
      if (!existing.sources.includes(source)) {
        existing.sources.push(source);
      }

      channelAggregates.set(channel, existing);
    }
  }

  // Construire les données finales
  const data: ChannelCostData[] = [];

  for (const [channel, aggregate] of channelAggregates) {
    const adCost = budgetMap.get(channel) || 0;
    const totalLeadsAndConversions = aggregate.leads + aggregate.conversions;
    const cpl = totalLeadsAndConversions > 0 ? adCost / totalLeadsAndConversions : 0;

    data.push({
      channel,
      source: aggregate.sources.join(', '),
      medium: channel.includes('Ads') ? 'cpc' : 'organic',
      adCost,
      conversions: aggregate.conversions,
      revenue: aggregate.revenue,
      cpl: parseFloat(cpl.toFixed(2)),
      leads: aggregate.leads,
    });
  }

  // Trier par budget décroissant
  data.sort((a, b) => b.adCost - a.adCost || b.conversions - a.conversions);

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
      { name: 'sessions' },
    ],
    orderBys: [
      { metric: { metricName: 'conversions' }, desc: true },
    ],
    limit: 50,
  };

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

  // Calculer le coût total de la période
  const { totalBudget } = getBudgetForPeriod(startDate, endDate);

  // Compter les conversions totales pour répartir le budget
  let totalConversions = 0;
  const rows: { name: string; conversions: number; sessions: number }[] = [];

  if (response.rows) {
    for (const row of response.rows) {
      const conversions = parseFloat(row.metricValues?.[0]?.value || '0');
      totalConversions += conversions;
      rows.push({
        name: row.dimensionValues?.[0]?.value || '(not set)',
        conversions,
        sessions: parseFloat(row.metricValues?.[1]?.value || '1'),
      });
    }
  }

  const data: CampaignConversionData[] = [];

  for (const row of rows) {
    // Répartir le budget proportionnellement aux conversions
    const costShare = totalConversions > 0
      ? (row.conversions / totalConversions) * totalBudget
      : 0;
    const cpa = row.conversions > 0 ? costShare / row.conversions : 0;
    const rate = (row.conversions / row.sessions) * 100;

    if (row.name !== '(not set)' || row.conversions > 0) {
      data.push({
        campaignName: row.name,
        conversions: row.conversions,
        cost: parseFloat(costShare.toFixed(2)),
        cpa: parseFloat(cpa.toFixed(2)),
        rate: parseFloat(rate.toFixed(2)),
      });
    }
  }

  return data;
}

/**
 * Récupère le MER global et sa variation
 * Utilise les dépenses fixes pour le calcul
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
    metrics: [{ name: 'totalRevenue' }],
  });

  const currentRevenue = parseFloat(response.rows?.[0]?.metricValues?.[0]?.value || '0');
  const previousRevenue = parseFloat(response.rows?.[0]?.metricValues?.[1]?.value || '0');

  // Utiliser les dépenses fixes proratisées
  const currentBudget = getBudgetForPeriod(startDate, endDate);
  const previousBudget = getBudgetForPeriod(previousStartDate, previousEndDate);

  const currentAdCost = currentBudget.totalBudget;
  const previousAdCost = previousBudget.totalBudget;

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
 * Calcule le Blended CPL (tous canaux payants confondus)
 * Utilise les dépenses fixes
 */
export async function getBlendedCPL(
  startDate: string,
  endDate: string
): Promise<{
  blendedCPL: number;
  totalCost: number;
  totalLeads: number;
  totalConversions: number;
}> {
  const channelData = await getChannelCostData(startDate, endDate);

  // Ne compter que les canaux payants
  const paidChannels = channelData.filter((ch) =>
    ch.channel === 'Google Ads' || ch.channel === 'Meta Ads'
  );

  const totalCost = paidChannels.reduce((sum, ch) => sum + ch.adCost, 0);
  const totalLeads = paidChannels.reduce((sum, ch) => sum + ch.leads, 0);
  const totalConversions = paidChannels.reduce((sum, ch) => sum + ch.conversions, 0);
  const totalActions = totalLeads + totalConversions;
  const blendedCPL = totalActions > 0 ? totalCost / totalActions : 0;

  return {
    blendedCPL: parseFloat(blendedCPL.toFixed(2)),
    totalCost,
    totalLeads,
    totalConversions,
  };
}

/**
 * Récupère un aperçu global des métriques
 */
export async function getOverview(
  startDate: string,
  endDate: string,
  previousStartDate: string,
  previousEndDate: string
): Promise<{
  sessions: number;
  previousSessions: number;
  sessionsChange: number;
  users: number;
  previousUsers: number;
  usersChange: number;
  revenue: number;
  previousRevenue: number;
  revenueChange: number;
  conversions: number;
  previousConversions: number;
  conversionsChange: number;
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
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'totalRevenue' },
      { name: 'conversions' },
    ],
  });

  const row = response.rows?.[0];

  const sessions = parseFloat(row?.metricValues?.[0]?.value || '0');
  const previousSessions = parseFloat(row?.metricValues?.[4]?.value || '0');
  const users = parseFloat(row?.metricValues?.[1]?.value || '0');
  const previousUsers = parseFloat(row?.metricValues?.[5]?.value || '0');
  const revenue = parseFloat(row?.metricValues?.[2]?.value || '0');
  const previousRevenue = parseFloat(row?.metricValues?.[6]?.value || '0');
  const conversions = parseFloat(row?.metricValues?.[3]?.value || '0');
  const previousConversions = parseFloat(row?.metricValues?.[7]?.value || '0');

  return {
    sessions,
    previousSessions,
    sessionsChange: previousSessions > 0 ? ((sessions - previousSessions) / previousSessions) * 100 : 0,
    users,
    previousUsers,
    usersChange: previousUsers > 0 ? ((users - previousUsers) / previousUsers) * 100 : 0,
    revenue,
    previousRevenue,
    revenueChange: previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0,
    conversions,
    previousConversions,
    conversionsChange: previousConversions > 0 ? ((conversions - previousConversions) / previousConversions) * 100 : 0,
  };
}

/**
 * Récupère les données de conversion par source pour le tableau
 */
export async function getConversionsBySource(
  startDate: string,
  endDate: string
): Promise<{
  source: string;
  campaign: string;
  sessions: number;
  conversions: number;
  leads: number;
  rate: number;
  cost: number;
  cpa: number;
}[]> {
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID is not configured');
  }

  const client = getClient();

  // Récupérer sessions, conversions et leads par source
  const [mainResponse] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'sessionSourceMedium' },
      { name: 'sessionCampaignName' },
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'conversions' },
    ],
    orderBys: [
      { metric: { metricName: 'conversions' }, desc: true },
    ],
    limit: 20,
  });

  // Récupérer les leads (generate_lead) par source
  const [leadsResponse] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'sessionSourceMedium' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: {
          matchType: 'EXACT',
          value: 'generate_lead',
        },
      },
    },
  });

  // Mapper les leads
  const leadsMap = new Map<string, number>();
  if (leadsResponse.rows) {
    for (const row of leadsResponse.rows) {
      const sourceMedium = row.dimensionValues?.[0]?.value || '';
      const leads = parseFloat(row.metricValues?.[0]?.value || '0');
      leadsMap.set(sourceMedium, leads);
    }
  }

  // Budget proratisé pour la période
  const { channelBudgets } = getBudgetForPeriod(startDate, endDate);
  const budgetMap = new Map(channelBudgets.map((b) => [b.name, b.budget]));

  const data: {
    source: string;
    campaign: string;
    sessions: number;
    conversions: number;
    leads: number;
    rate: number;
    cost: number;
    cpa: number;
  }[] = [];

  if (mainResponse.rows) {
    for (const row of mainResponse.rows) {
      const sourceMedium = row.dimensionValues?.[0]?.value || '';
      const campaign = row.dimensionValues?.[1]?.value || '(not set)';
      const sessions = parseFloat(row.metricValues?.[0]?.value || '0');
      const conversions = parseFloat(row.metricValues?.[1]?.value || '0');

      const parts = sourceMedium.split(' / ');
      const source = parts[0] || '(direct)';
      const medium = parts[1] || '(none)';

      const leads = leadsMap.get(sourceMedium) || 0;
      const rate = sessions > 0 ? (conversions / sessions) * 100 : 0;

      // Déterminer le canal pour le coût
      const channel = identifyChannel(source, medium);
      const channelBudget = budgetMap.get(channel) || 0;

      // Estimer le coût basé sur les conversions
      const cost = channelBudget > 0 ? (conversions / (conversions || 1)) * channelBudget * 0.1 : 0;
      const cpa = conversions > 0 ? cost / conversions : 0;

      if (conversions > 0 || leads > 0) {
        data.push({
          source: sourceMedium,
          campaign,
          sessions,
          conversions,
          leads,
          rate: parseFloat(rate.toFixed(2)),
          cost: parseFloat(cost.toFixed(2)),
          cpa: parseFloat(cpa.toFixed(2)),
        });
      }
    }
  }

  return data;
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
