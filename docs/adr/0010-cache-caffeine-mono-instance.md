# ADR-0010 : Mise en cache mémoire locale Caffeine pour les statistiques et les taux de change

> **Date :** 1er novembre 2026 | **Statut :** Accepté  
> **Décideurs :** Équipe d'Ingénierie & Architecture Atlas Voyage  
> **Contexte de référence :** Phases 1 à 14

---

## 1. Contexte et Problématique

Certaines requêtes d'agrégation de données (calculs des tableaux de bord administratifs, agrégation du chiffre d'affaires, taux de devises indicatifs) sollicitent intensément la base MySQL ou nécessitent des appels réseau externes.

---

## 2. Décision Prise

Utiliser la bibliothèque haute performance `CaffeineCacheManager` en mémoire locale dans Spring Boot pour les caches critiques :
- `adminStats` : Durée de rétention 2 minutes avec éviction automatique.
- `currencyRates` : Durée de rétention 12 heures.

---

## 3. Conséquences

Avantages :
- Temps de réponse inférieurs à 2 ms pour les endpoints en cache.
- Réduction drastique de la charge processeur sur MySQL.
- Configuration simple et sans serveur Redis externe.
Inconvénients :
- Cache en mémoire vive local à chaque instance : en cas de déploiement multi-instances derrière un load balancer, une divergence transitoire de 2 minutes peut exister entre deux nœuds.

---

## 4. Alternatives Envisagées et Raisons du Rejet

1. Redis distribué : Jugé disproportionné et coûteux pour la volumétrie actuelle.
2. Pas de cache : Rejeté en raison des temps de réponse inacceptables sur les calculs d'agrégation.
