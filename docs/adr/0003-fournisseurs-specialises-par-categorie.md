# ADR-0003 : Spécialisation stricte des comptes fournisseurs par catégorie

> **Date :** 1er novembre 2026 | **Statut :** Accepté  
> **Décideurs :** Équipe d'Ingénierie & Architecture Atlas Voyage  
> **Contexte de référence :** Phases 1 à 14

---

## 1. Contexte et Problématique

Les prestataires touristiques sur le marché marocain sont des entités juridiques spécialisées (hôteliers, transporteurs touristiques agréés, loueurs de voitures déclarés, guides/agences d'excursions).
Permettre à un hôtelier de publier des billets de vol ou à un loueur de voitures de publier des séjours présentait un risque légal et opérationnel majeur.

---

## 2. Décision Prise

Associer chaque compte utilisateur ayant le rôle `SUPPLIER` à une catégorie obligatoire `supplierCategory` (`HOTEL`, `FLIGHT`, `CAR`, `TAXI`, `EXCURSION`). Le backend rejette toute création ou modification d'offre en dehors de la spécialité avec le code d'erreur `SUPPLIER_CATEGORY_MISMATCH` (HTTP 403).

---

## 3. Conséquences

Avantages :
- Ségrégation stricte des responsabilités métier et respect de la réglementation touristique marocaine.
- Interface du portail fournisseur pré-configurée et personnalisée dès la connexion.
Inconvénients :
- Un partenaire multi-activités doit disposer de comptes fournisseurs séparés ou passer par un compte agence.

---

## 4. Alternatives Envisagées et Raisons du Rejet

1. Fournisseurs généralistes sans restriction : Rejeté pour manque de traçabilité et risque de fraude.
