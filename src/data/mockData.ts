// Données mockées pour le dashboard - à remplacer par les vraies APIs

export const merData = {
  current: 3.2,
  previous: 2.8,
  trend: 'up' as const,
  history: [
    { date: 'Jan', mer: 2.5, roas: 3.1, seoTraffic: 45000 },
    { date: 'Fév', mer: 2.7, roas: 3.3, seoTraffic: 48000 },
    { date: 'Mar', mer: 2.6, roas: 3.0, seoTraffic: 52000 },
    { date: 'Avr', mer: 2.9, roas: 3.4, seoTraffic: 55000 },
    { date: 'Mai', mer: 3.1, roas: 3.6, seoTraffic: 58000 },
    { date: 'Juin', mer: 3.2, roas: 3.8, seoTraffic: 62000 },
  ],
};

export const revenueData = {
  total: 485000,
  adSpend: 151562,
  organic: 198000,
  paid: 287000,
};

export const seoData = {
  organicTraffic: {
    current: 62000,
    previous: 55000,
    trend: 'up' as const,
    recovery: 87, // % de récupération post-migration
  },
  errors404: {
    count: 23,
    trend: 'down' as const,
    topUrls: [
      { url: '/ancien-produit-1', hits: 156 },
      { url: '/categorie-supprimee', hits: 89 },
      { url: '/promo-2025', hits: 45 },
    ],
  },
  coreWebVitals: {
    lcp: { value: 2.1, status: 'good' as const },
    inp: { value: 180, status: 'good' as const },
    cls: { value: 0.08, status: 'good' as const },
  },
  trafficHistory: [
    { date: 'Sem 1', traffic: 12000, baseline: 15000 },
    { date: 'Sem 2', traffic: 10500, baseline: 15000 },
    { date: 'Sem 3', traffic: 11200, baseline: 15000 },
    { date: 'Sem 4', traffic: 13500, baseline: 15000 },
    { date: 'Sem 5', traffic: 14200, baseline: 15000 },
    { date: 'Sem 6', traffic: 14800, baseline: 15000 },
    { date: 'Sem 7', traffic: 15500, baseline: 15000 },
    { date: 'Sem 8', traffic: 16200, baseline: 15000 },
  ],
};

export const channelData = {
  blendedCPL: 42.5,
  channels: [
    { name: 'Google Ads', cpl: 38, leads: 1250, spend: 47500, color: 'blue' },
    { name: 'Meta Ads', cpl: 52, leads: 890, spend: 46280, color: 'indigo' },
    { name: 'LinkedIn', cpl: 85, leads: 320, spend: 27200, color: 'cyan' },
    { name: 'Organique', cpl: 0, leads: 2100, spend: 0, color: 'emerald' },
    { name: 'Direct', cpl: 0, leads: 780, spend: 0, color: 'amber' },
  ],
  brandedSearch: {
    volume: 8500,
    trend: 'up' as const,
    vsAdSpend: 0.65, // corrélation
  },
};

export const conversionData = {
  globalRate: 3.8,
  previousRate: 3.2,
  trend: 'up' as const,
  byCampaign: [
    { campaign: 'Brand - Search', conversions: 450, cost: 12500, rate: 5.2, cpa: 27.78 },
    { campaign: 'Generic - Search', conversions: 380, cost: 28000, rate: 2.8, cpa: 73.68 },
    { campaign: 'Remarketing', conversions: 290, cost: 8500, rate: 8.5, cpa: 29.31 },
    { campaign: 'Meta - Prospecting', conversions: 520, cost: 35000, rate: 2.1, cpa: 67.31 },
    { campaign: 'Meta - Retargeting', conversions: 180, cost: 11280, rate: 6.2, cpa: 62.67 },
    { campaign: 'LinkedIn - B2B', conversions: 95, cost: 27200, rate: 1.5, cpa: 286.32 },
  ],
  history: [
    { date: 'Jan', rate: 2.8, conversions: 1200 },
    { date: 'Fév', rate: 3.0, conversions: 1350 },
    { date: 'Mar', rate: 3.1, conversions: 1420 },
    { date: 'Avr', rate: 3.4, conversions: 1580 },
    { date: 'Mai', rate: 3.6, conversions: 1720 },
    { date: 'Juin', rate: 3.8, conversions: 1915 },
  ],
};

export const kpiSummary = [
  {
    title: 'MER Global',
    value: '3.2x',
    change: '+14.3%',
    changeType: 'positive' as const,
  },
  {
    title: 'Trafic Organique',
    value: '62K',
    change: '+12.7%',
    changeType: 'positive' as const,
  },
  {
    title: 'Blended CPL',
    value: '42.50€',
    change: '-8.2%',
    changeType: 'positive' as const,
  },
  {
    title: 'Taux de Conversion',
    value: '3.8%',
    change: '+18.7%',
    changeType: 'positive' as const,
  },
];
