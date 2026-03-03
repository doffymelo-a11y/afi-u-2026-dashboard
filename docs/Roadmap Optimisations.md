# Roadmap Optimisations - Dashboard Performance 2026

**Statut :** En attente (post-développement initial)
**Priorité :** À implémenter après réception des prompts ou pendant le développement si pertinent

---

## Vue d'ensemble

Ces optimisations seront intégrées soit :
- **Pendant le développement** : si nécessaire pour le bon fonctionnement
- **Post-développement** : en tant qu'améliorations itératives

---

## 1. Authentification Robuste

**Priorité :** Haute
**Moment :** Pendant le développement (setup initial)

| Tâche | Détail |
|-------|--------|
| Implémenter NextAuth.js ou Clerk | Remplacer "auth simple" par solution sécurisée |
| Gestion des rôles | `admin` (full access) / `viewer` (lecture seule) |
| Protection des routes API | Middleware de vérification token |

**Dépendances :** Aucune - à faire dès le setup

---

## 2. Core Web Vitals - Mise à jour INP

**Priorité :** Haute
**Moment :** Pendant le développement (Bloc B)

| Tâche | Détail |
|-------|--------|
| Remplacer FID par INP | Interaction to Next Paint (standard depuis mars 2024) |
| Ajuster les seuils | < 200ms (bon), 200-500ms (moyen), > 500ms (mauvais) |
| Mettre à jour l'appel PageSpeed API | Récupérer le champ INP |

**Dépendances :** Développement Bloc B

---

## 3. Sources de Données Complètes

**Priorité :** Moyenne
**Moment :** Pendant le développement (Blocs A & C)

| Tâche | Détail |
|-------|--------|
| Intégration Google Ads API | Dépenses SEM, impressions, clics |
| Intégration Meta Ads API | Dépenses Social, reach, conversions |
| Module import CSV | Fallback pour autres sources de dépenses |
| Définir fréquences refresh | GA4: quotidien, Ads: quotidien, CWV: hebdo |

**Dépendances :** Accès aux comptes publicitaires + credentials API

---

## 4. Architecture Données - Historisation

**Priorité :** Moyenne-Haute
**Moment :** Setup initial ou post-MVP

| Tâche | Détail |
|-------|--------|
| Setup Supabase | Base PostgreSQL managée |
| Schéma tables métriques | `daily_metrics`, `campaign_stats`, `seo_health` |
| Jobs de collecte | Cron jobs pour snapshot quotidien des APIs |
| Rétention données | Minimum 24 mois d'historique |

**Dépendances :** Décision sur l'hébergement BDD

```sql
-- Exemple schéma proposé
CREATE TABLE daily_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  metric_type VARCHAR(50),
  channel VARCHAR(50),
  value DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. Système d'Alertes

**Priorité :** Basse (post-MVP)
**Moment :** Après développement initial

| Tâche | Détail |
|-------|--------|
| Slack Webhook | Alertes critiques temps réel |
| Email digest | Résumé hebdomadaire automatique |
| Notifications in-app | Badge/toast pour seuils dépassés |

**Seuils d'alerte proposés :**
| Métrique | Condition | Niveau |
|----------|-----------|--------|
| Erreurs 404 | > 200 nouvelles/jour | Critique |
| Trafic organique | Chute > 20% vs semaine précédente | Critique |
| LCP | > 4s pendant 3 jours | Warning |
| INP | > 500ms pendant 3 jours | Warning |
| CLS | > 0.25 pendant 3 jours | Warning |
| MER | Chute > 15% vs mois précédent | Warning |

**Dépendances :** Dashboard fonctionnel + historisation données

---

## 6. Responsive / Mobile

**Priorité :** Moyenne
**Moment :** Pendant le développement (CSS/Layout)

| Tâche | Détail |
|-------|--------|
| Breakpoints Tailwind | `sm`, `md`, `lg`, `xl` |
| Layout adaptatif | Stack vertical sur mobile, grid sur desktop |
| Touch-friendly | Boutons min 44px, espacement suffisant |
| Test devices | iPhone SE, iPad, Desktop |

**Dépendances :** Choix du framework CSS (Tailwind recommandé)

---

## 7. Cache & Gestion Quotas API

**Priorité :** Haute
**Moment :** Pendant le développement (API layer)

| Tâche | Détail |
|-------|--------|
| Cache Next.js natif | `revalidate` sur les fetch |
| Redis (optionnel) | Si volume requêtes élevé |
| Stale-while-revalidate | Données servies immédiatement, refresh en background |

**Quotas à respecter :**
| API | Limite | Stratégie |
|-----|--------|-----------|
| GA4 Data API | 10,000 req/jour | Cache 1h minimum |
| Search Console API | 1,200 req/min | Cache 24h pour données historiques |
| PageSpeed API | 25,000 req/jour | Cache 7 jours (CWV stable) |
| Google Ads API | Variable selon compte | Cache 1h |

**Dépendances :** Architecture API routes

---

## Matrice de Décision

| Optimisation | Intégrer pendant dev ? | Raison |
|--------------|------------------------|--------|
| 1. Auth | OUI | Fondamental pour la sécurité |
| 2. INP | OUI | Donnée incorrecte sinon |
| 3. Sources données | OUI (partiel) | MVP fonctionnel |
| 4. Historisation | OPTIONNEL | Peut venir après si délai serré |
| 5. Alertes | NON | Post-MVP |
| 6. Responsive | OUI | UX de base |
| 7. Cache | OUI | Éviter blocage quotas |

---

## Notes pour le développement

Je vais intégrer automatiquement les points 1, 2, 6 et 7 pendant le développement car ils sont essentiels au bon fonctionnement.

Les points 3 et 4 dépendront des prompts et specs que tu me transmettras.

Le point 5 (alertes) sera documenté comme amélioration future sauf indication contraire.

---

*Document créé le 03/03/2026*
*À mettre à jour au fil du développement*
