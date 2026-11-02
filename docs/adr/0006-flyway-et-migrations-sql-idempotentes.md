# ADR-0006 : Migrations Flyway historiques et scripts SQL manuels versionnés

> **Date :** 1er novembre 2026 | **Statut :** Accepté  
> **Décideurs :** Équipe d'Ingénierie & Architecture Atlas Voyage  
> **Contexte de référence :** Phases 1 à 14

---

## 1. Contexte et Problématique

Les évolutions de modèle au fil des phases ont combiné des migrations automatiques Flyway (V1 à V9) et des ajustements SQL manuels en profil dev avec Hibernate `ddl-auto=update`.

---

## 2. Décision Prise

Garantir la reproductibilité stricte du schéma :
- En développement local : Flyway applique la base puis Hibernate complète le schéma en `update`.
- En production : Schéma verrouillé en `validate` avec exécution préalable des scripts ordonnancés (`scripts/migrations/V*.sql`).
- Tous les scripts DDL doivent être idempotents (`IF EXISTS`, `IF NOT EXISTS`).

---

## 3. Conséquences

Avantages :
- Zéro dérive de schéma entre dev, tests et production.
- Traçabilité complète des modifications d'index et de contraintes d'intégrité.
Inconvénients :
- Nécessite d'écrire manuellement le script SQL pour chaque nouvelle entité ou colonne ajoutée.

---

## 4. Alternatives Envisagées et Raisons du Rejet

1. ddl-auto=update en production : Rejeté formellement (risque critique de perte de données ou de verrous prolongés).
2. Liquibase : Rejeté pour cohérence avec l'existant Flyway déjà en place.
