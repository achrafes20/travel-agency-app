# ADR-0008 : Catalogue public unique partagé entre visiteurs invités et clients connectés

> **Date :** 1er novembre 2026 | **Statut :** Accepté  
> **Décideurs :** Équipe d'Ingénierie & Architecture Atlas Voyage  
> **Contexte de référence :** Phases 1 à 14

---

## 1. Contexte et Problématique

Le projet comportait historiquement deux pages de catalogue distinctes : `frontend/catalogue.html` pour les visiteurs et un second catalogue intégré dans le tableau de bord client (`frontend/client/index.html?page=catalog`), entraînant de la duplication de code et des divergences de filtres.

---

## 2. Décision Prise

Unifier la recherche d'offres autour d'une source unique :
- Les pages publiques `accueil.html`, `catalogue.html` et `offre.html` constituent l'unique point d'entrée pour la consultation des offres.
- Le menu client redirige directement vers `catalogue.html`.
- L'état de session (connecté vs invité) personnalise dynamiquement l'affichage (bouton favori, ajout direct au panier connecté, coordonnées pré-remplies).

---

## 3. Conséquences

Avantages :
- Élimination de 800+ lignes de code dupliqué.
- Même expérience riche de recherche et de filtres pour tous les utilisateurs.
Inconvénients :
- La navigation client sort temporairement de la SPA pour revenir sur le catalogue public.

---

## 4. Alternatives Envisagées et Raisons du Rejet

1. Maintenir deux catalogues : Rejeté pour coût de maintenance et risque d'incohérence visuelle.
