/**
 * Configuration des dépenses publicitaires mensuelles fixes
 * Ces valeurs sont utilisées pour calculer le MER et le CPL
 * car les coûts ne sont pas encore importés automatiquement dans GA4
 */

export interface ChannelBudget {
  name: string;
  monthlyBudget: number; // en CAD
  source: string; // source GA4 pour matcher
  medium: string; // medium GA4 pour matcher
}

// Budgets mensuels par canal
export const MONTHLY_BUDGETS: ChannelBudget[] = [
  {
    name: 'Google Ads',
    monthlyBudget: 2000, // 2,000 CAD / mois
    source: 'google',
    medium: 'cpc',
  },
  {
    name: 'Meta Ads',
    monthlyBudget: 2300, // 2,300 CAD / mois
    source: 'facebook',
    medium: 'cpc',
  },
];

// Total mensuel
export const TOTAL_MONTHLY_BUDGET = MONTHLY_BUDGETS.reduce(
  (sum, channel) => sum + channel.monthlyBudget,
  0
); // 4,300 CAD / mois

/**
 * Calcule le budget pour une période donnée (prorata)
 * @param startDate - Date de début (YYYY-MM-DD)
 * @param endDate - Date de fin (YYYY-MM-DD)
 * @returns Budget proratisé pour la période
 */
export function getBudgetForPeriod(startDate: string, endDate: string): {
  totalBudget: number;
  channelBudgets: { name: string; budget: number }[];
  days: number;
} {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Budget journalier moyen (basé sur 30 jours/mois)
  const dailyMultiplier = days / 30;

  const channelBudgets = MONTHLY_BUDGETS.map((channel) => ({
    name: channel.name,
    budget: Math.round(channel.monthlyBudget * dailyMultiplier * 100) / 100,
  }));

  const totalBudget = Math.round(TOTAL_MONTHLY_BUDGET * dailyMultiplier * 100) / 100;

  return {
    totalBudget,
    channelBudgets,
    days,
  };
}

/**
 * Retourne le budget mensuel d'un canal par son nom
 */
export function getChannelMonthlyBudget(channelName: string): number {
  const channel = MONTHLY_BUDGETS.find(
    (c) => c.name.toLowerCase() === channelName.toLowerCase()
  );
  return channel?.monthlyBudget || 0;
}

/**
 * Identifie le canal à partir de source/medium GA4
 */
export function identifyChannel(source: string, medium: string): string {
  const sourceLower = (source || '').toLowerCase();
  const mediumLower = (medium || '').toLowerCase();

  if (sourceLower.includes('google') && (mediumLower === 'cpc' || mediumLower === 'ppc')) {
    return 'Google Ads';
  }
  if ((sourceLower.includes('facebook') || sourceLower.includes('fb') || sourceLower.includes('meta') || sourceLower.includes('instagram') || sourceLower.includes('ig')) &&
      (mediumLower === 'cpc' || mediumLower === 'ppc' || mediumLower === 'paid' || mediumLower === 'paidsocial')) {
    return 'Meta Ads';
  }
  if (mediumLower === 'organic') {
    return 'Organic';
  }
  if (sourceLower === '(direct)' || sourceLower === 'direct') {
    return 'Direct';
  }
  if (mediumLower === 'referral') {
    return 'Referral';
  }
  if (mediumLower === 'email') {
    return 'Email';
  }

  return 'Other';
}
