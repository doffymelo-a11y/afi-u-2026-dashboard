# Product Requirements Document (PRD)
## Dashboard Performance Numérique 2026

**Projet :** Afi u. 2026
**Date :** Mars 2026
**Version :** 1.1 (révisée)

---

## 1. Objectif du Produit

Créer un tableau de bord interne en React, facilement partageable (via une URL avec authentification), permettant de visualiser :
- La rentabilité globale de la stratégie d'acquisition
- L'impact de la migration sur le SEO

---

## 2. Architecture Technique

### Stack Recommandée

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Framework | **Next.js 14+** | SSR, API routes sécurisées, déploiement optimisé |
| Visualisation | **Tremor** ou **Recharts** | Composants analytics-ready, performants |
| Authentification | **NextAuth.js** ou **Clerk** | Sécurité robuste, intégration simple |
| Base de données | **Supabase** | Historisation des métriques, temps réel |
| Cache | **Redis** ou **Next.js Cache** | Gestion des quotas API |
| Hébergement | **Vercel** | Intégration native Next.js |

### Sources de Données

| Source | Données | Fréquence |
|--------|---------|-----------|
| Google Analytics Data API | Trafic, Conversions, Revenus | Quotidienne |
| Google Search Console API | Branded Search, Erreurs 404, Trafic organique | Quotidienne |
| PageSpeed Insights API | Core Web Vitals (LCP, INP, CLS) | Hebdomadaire |
| Google Ads API | Dépenses SEM, CPL payant | Quotidienne |
| Meta Ads API | Dépenses Social, CPL social | Quotidienne |
| Import manuel/CSV | Autres dépenses marketing | À définir |

---

## 3. Spécifications Fonctionnelles

### Bloc A : Marketing Efficiency Ratio (MER)

**Objectif :** Mesurer l'efficacité globale des investissements marketing

**KPIs :**
- **MER** = Revenu web global / Dépenses marketing totales
- **ROAS SEM** croisé avec tendance SEO (détection cannibalisation)

**Visualisation :**
- Jauge principale pour le MER
- Graphique en courbe superposant ROAS SEM et trafic SEO
- Indicateur d'alerte si corrélation négative détectée

---

### Bloc B : Migration et SEO

**Objectif :** Suivre la santé technique post-migration

**KPIs :**

| Métrique | Source | Seuils |
|----------|--------|--------|
| Erreurs 404 | GSC API / Crawler | < 50 = Vert, 50-200 = Orange, > 200 = Rouge |
| Trafic organique | GA4 | Comparaison N-1, tendance sur 12 semaines |
| LCP | PageSpeed | < 2.5s = Vert, 2.5-4s = Orange, > 4s = Rouge |
| INP* | PageSpeed | < 200ms = Vert, 200-500ms = Orange, > 500ms = Rouge |
| CLS | PageSpeed | < 0.1 = Vert, 0.1-0.25 = Orange, > 0.25 = Rouge |

*Note : INP (Interaction to Next Paint) remplace FID depuis mars 2024*

**Visualisation :**
- Feux tricolores pour Core Web Vitals
- Courbe de récupération trafic SEO avec annotations (dates clés migration)
- Tableau des URLs 404 les plus impactantes

---

### Bloc C : Rentabilité par Canal d'Acquisition

**Objectif :** Comparer l'efficacité des canaux

**KPIs :**
- **Blended CPL** = Dépenses totales / Nombre de leads
- **CPL par canal** (SEM, Social, Organique, Direct)
- **Volume requêtes Branded** vs Coût acquisition payant

**Visualisation :**
- Bar chart comparatif CPL par canal
- Scatter plot : Volume Branded vs Dépenses (corrélation)
- Tendance mensuelle du Blended CPL

---

### Bloc D : Taux de Conversion

**Objectif :** Analyser la performance conversion

**KPIs :**
- Taux de conversion global
- Coût par conversion par campagne
- Évolution mensuelle

**Visualisation :**
- KPI card principal (taux global)
- Tableau détaillé par campagne avec tri dynamique
- Sparklines pour tendances rapides

---

## 4. Exigences Non-Fonctionnelles

### Sécurité
- Authentification obligatoire (OAuth ou credentials)
- Tokens API stockés côté serveur uniquement (variables d'environnement)
- HTTPS enforced

### Performance
- First Contentful Paint < 1.5s
- Cache des données API (TTL configurable)
- Lazy loading des graphiques

### Accessibilité
- Responsive design (mobile-first)
- Contraste WCAG AA minimum
- Navigation clavier

### Monitoring
- Système d'alertes configurable :
  - Slack webhook pour alertes critiques
  - Email digest hebdomadaire
  - Notifications in-app pour seuils dépassés

---

## 5. Roadmap Technique

### Phase 1 : Setup & Infrastructure
- [ ] Initialisation projet Next.js
- [ ] Configuration Supabase (schéma BDD)
- [ ] Setup authentification
- [ ] Connexion APIs Google

### Phase 2 : Développement Blocs
- [ ] Bloc A : MER
- [ ] Bloc B : Migration SEO
- [ ] Bloc C : Rentabilité canaux
- [ ] Bloc D : Conversions

### Phase 3 : Finalisation
- [ ] Système d'alertes
- [ ] Tests & optimisation performance
- [ ] Documentation utilisateur
- [ ] Déploiement production

---

## 6. Annexes

### Schéma d'architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Bloc A  │ │ Bloc B  │ │ Bloc C  │ │ Bloc D  │       │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │
│       └───────────┴───────────┴───────────┘             │
│                         │                               │
│              ┌──────────▼──────────┐                   │
│              │   API Routes Next   │                   │
│              └──────────┬──────────┘                   │
└─────────────────────────┼───────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐     ┌─────▼─────┐    ┌─────▼─────┐
    │ Supabase│     │   Cache   │    │ External  │
    │   (DB)  │     │  (Redis)  │    │   APIs    │
    └─────────┘     └───────────┘    └───────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
              ┌─────▼─────┐         ┌──────▼──────┐        ┌──────▼──────┐
              │ GA4 API   │         │  GSC API    │        │ Ads APIs    │
              └───────────┘         └─────────────┘        └─────────────┘
```

### Glossaire

| Terme | Définition |
|-------|------------|
| MER | Marketing Efficiency Ratio - Ratio revenus/dépenses marketing |
| CPL | Cost Per Lead - Coût par prospect acquis |
| ROAS | Return On Ad Spend - Retour sur investissement publicitaire |
| LCP | Largest Contentful Paint - Temps de chargement contenu principal |
| INP | Interaction to Next Paint - Réactivité aux interactions |
| CLS | Cumulative Layout Shift - Stabilité visuelle |
| GSC | Google Search Console |

---

*Document généré le 03/03/2026*
