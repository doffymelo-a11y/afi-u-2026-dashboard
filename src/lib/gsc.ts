import { google } from 'googleapis';

// Configuration
const siteUrl = process.env.GSC_SITE_URL; // Format: https://www.example.com ou sc-domain:example.com
const brandName = process.env.BRAND_NAME || ''; // Nom de marque pour filtrer le trafic branded
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Types
export interface BrandedTrafficData {
  date: string;
  branded: number;
  nonBranded: number;
  total: number;
  brandedPercent: number;
}

export interface BrandedSummary {
  totalBranded: number;
  totalNonBranded: number;
  brandedPercent: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface Error404Data {
  url: string;
  count: number;
  lastCrawled: string;
}

export interface SEOHealthIndex {
  total404: number;
  critical404: number; // Plus de 100 impressions perdues
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  topErrors: Error404Data[];
}

// Initialiser le client Google Search Console
async function getSearchConsoleClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const authClient = await auth.getClient();
  return google.searchconsole({ version: 'v1', auth: authClient as Parameters<typeof google.searchconsole>[0]['auth'] });
}

/**
 * Récupère le trafic organique divisé en Branded vs Non-Branded
 * Le trafic Branded contient le nom de marque dans la requête
 */
export async function getBrandedTraffic(
  startDate: string,
  endDate: string
): Promise<BrandedTrafficData[]> {
  if (!siteUrl) {
    throw new Error('GSC_SITE_URL is not configured');
  }

  if (!brandName) {
    throw new Error('BRAND_NAME is not configured');
  }

  const searchconsole = await getSearchConsoleClient();

  // Requête pour le trafic Branded (contient le nom de marque)
  const brandedResponse = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['date'],
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: 'query',
              operator: 'contains',
              expression: brandName.toLowerCase(),
            },
          ],
        },
      ],
      rowLimit: 1000,
    },
  });

  // Requête pour tout le trafic (pour calculer non-branded)
  const totalResponse = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['date'],
      rowLimit: 1000,
    },
  });

  // Construire la map des données
  const brandedMap = new Map<string, number>();
  const totalMap = new Map<string, number>();

  if (brandedResponse.data.rows) {
    for (const row of brandedResponse.data.rows) {
      const date = row.keys?.[0] || '';
      brandedMap.set(date, row.clicks || 0);
    }
  }

  if (totalResponse.data.rows) {
    for (const row of totalResponse.data.rows) {
      const date = row.keys?.[0] || '';
      totalMap.set(date, row.clicks || 0);
    }
  }

  // Fusionner les données
  const data: BrandedTrafficData[] = [];
  const sortedDates = Array.from(totalMap.keys()).sort();

  for (const date of sortedDates) {
    const total = totalMap.get(date) || 0;
    const branded = brandedMap.get(date) || 0;
    const nonBranded = total - branded;
    const brandedPercent = total > 0 ? (branded / total) * 100 : 0;

    data.push({
      date: formatDate(date),
      branded,
      nonBranded,
      total,
      brandedPercent: parseFloat(brandedPercent.toFixed(1)),
    });
  }

  return data;
}

/**
 * Récupère le résumé du trafic branded avec tendance
 */
export async function getBrandedSummary(
  startDate: string,
  endDate: string,
  previousStartDate: string,
  previousEndDate: string
): Promise<BrandedSummary> {
  const currentData = await getBrandedTraffic(startDate, endDate);
  const previousData = await getBrandedTraffic(previousStartDate, previousEndDate);

  const totalBranded = currentData.reduce((sum, d) => sum + d.branded, 0);
  const totalNonBranded = currentData.reduce((sum, d) => sum + d.nonBranded, 0);
  const total = totalBranded + totalNonBranded;
  const brandedPercent = total > 0 ? (totalBranded / total) * 100 : 0;

  const previousBranded = previousData.reduce((sum, d) => sum + d.branded, 0);
  const changePercent = previousBranded > 0
    ? ((totalBranded - previousBranded) / previousBranded) * 100
    : 0;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (changePercent > 5) trend = 'up';
  else if (changePercent < -5) trend = 'down';

  return {
    totalBranded,
    totalNonBranded,
    brandedPercent: parseFloat(brandedPercent.toFixed(1)),
    trend,
    changePercent: parseFloat(changePercent.toFixed(1)),
  };
}

/**
 * Récupère les erreurs 404 via l'API URL Inspection (index de santé SEO)
 * Note: Cette API a des limitations, on utilise les données de couverture
 */
export async function get404Errors(): Promise<SEOHealthIndex> {
  if (!siteUrl) {
    throw new Error('GSC_SITE_URL is not configured');
  }

  const searchconsole = await getSearchConsoleClient();

  try {
    // L'API Search Console ne fournit pas directement les 404
    // On utilise l'inspection d'URL ou le rapport de couverture
    // Pour l'instant, on simule avec les pages ayant 0 clics mais des impressions

    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: getDateString(-30),
        endDate: getDateString(0),
        dimensions: ['page'],
        rowLimit: 500,
      },
    });

    // Identifier les pages potentiellement problématiques
    // (haute impression, 0 clics = possible 404 ou contenu de mauvaise qualité)
    const problematicPages: Error404Data[] = [];

    if (response.data.rows) {
      for (const row of response.data.rows) {
        const url = row.keys?.[0] || '';
        const clicks = row.clicks || 0;
        const impressions = row.impressions || 0;

        // Si beaucoup d'impressions mais aucun clic, page potentiellement problématique
        if (impressions > 100 && clicks === 0) {
          problematicPages.push({
            url,
            count: impressions,
            lastCrawled: new Date().toISOString().split('T')[0],
          });
        }
      }
    }

    // Trier par nombre d'impressions (impact)
    problematicPages.sort((a, b) => b.count - a.count);

    const total404 = problematicPages.length;
    const critical404 = problematicPages.filter(p => p.count > 100).length;

    return {
      total404,
      critical404,
      trend: total404 > 10 ? 'up' : total404 > 5 ? 'stable' : 'down',
      changePercent: 0, // Nécessiterait une comparaison historique
      topErrors: problematicPages.slice(0, 10),
    };
  } catch (error) {
    console.error('Error fetching 404 data:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques de performance globales GSC
 */
export async function getGSCPerformance(
  startDate: string,
  endDate: string
): Promise<{
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}> {
  if (!siteUrl) {
    throw new Error('GSC_SITE_URL is not configured');
  }

  const searchconsole = await getSearchConsoleClient();

  const response = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      rowLimit: 1,
    },
  });

  if (response.data.rows && response.data.rows.length > 0) {
    const row = response.data.rows[0];
    return {
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: parseFloat(((row.ctr || 0) * 100).toFixed(2)),
      position: parseFloat((row.position || 0).toFixed(1)),
    };
  }

  return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
}

// Helpers
function formatDate(dateStr: string): string {
  // Format YYYY-MM-DD to DD/MM
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

function getDateString(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}
