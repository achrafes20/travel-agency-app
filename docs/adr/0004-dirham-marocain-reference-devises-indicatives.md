# ADR-0004 : Dirham Marocain (MAD) comme devise unique de référence et conversions indicatives

> **Date :** 1er novembre 2026 | **Statut :** Accepté  
> **Décideurs :** Équipe d'Ingénierie & Architecture Atlas Voyage  
> **Contexte de référence :** Phases 1 à 14

---

## 1. Contexte et Problématique

Atlas Voyage opère au Maroc sous la réglementation stricte de l'Office des Changes.
Autoriser des règlements réels en monnaie étrangère sans statut de banque ou intermédiaire agréé expose l'entreprise à des sanctions de change et à des risques de volatilité financière.

---

## 2. Décision Prise

Tous les montants en base de données, calculs du panier, transactions bancaires et factures sont EXCLUSIVEMENT libellés en Dirhams Marocains (MAD TTC). Les devises étrangères (EUR, USD, GBP) sont calculées à titre strictement indicatif côté frontend avec mention obligatoire de l'astérisque légal.

---

## 3. Conséquences

Avantages :
- Conformité juridique et fiscale marocaine absolue (TVA, facturation en Dirhams).
- Zéro risque de change pour la trésorerie de l'agence.
- Clarté totale pour le consommateur grâce au double affichage transparent.
Inconvénients :
- L'acheteur international peut être soumis à des frais de change par sa banque émettrice.

---

## 4. Alternatives Envisagées et Raisons du Rejet

1. Multi-devises avec comptes bancaires séparés : Rejeté (complexité juridique et agréments bancaires hors périmètre).
2. Tarification en Euros sur le site : Rejeté par la réglementation marocaine.
