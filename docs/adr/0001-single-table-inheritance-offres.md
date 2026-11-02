# ADR-0001 : Stratégie d'héritage SINGLE_TABLE pour les offres touristiques

> **Date :** 1er novembre 2026 | **Statut :** Accepté  
> **Décideurs :** Équipe d'Ingénierie & Architecture Atlas Voyage  
> **Contexte de référence :** Phases 1 à 14

---

## 1. Contexte et Problématique

Dans Atlas Voyage, les offres touristiques se divisent en 5 types distincts (Hôtels/Riads, Vols, Locations de voitures, Taxis/Transferts, Excursions).
Chaque catégorie possède des attributs spécifiques (ex. étoiles pour les hôtels, compagnie/aéroports pour les vols, transmission/catégorie pour les voitures), tout en partageant des propriétés communes critiques (titre, description, ville, prix de base, statut actif/modéré, fournisseur propriétaire, disponibilités, images).

---

## 2. Décision Prise

Adopter la stratégie JPA `@Inheritance(strategy = InheritanceType.SINGLE_TABLE)` avec une colonne discriminateur `offer_type` sur la table unique `offers`.

---

## 3. Conséquences

Avantages :
- Requêtes de recherche et catalogue ultra-rapides sans jointures polymorphiques coûteuses (LEFT JOIN sur 5 tables).
- Pagination et tri globaux simples et performants en SQL natif.
Inconvénients :
- Colonnes spécifiques nullables au niveau du schéma SQL ; l'intégrité des champs obligatoires est assurée par Jakarta Validation au niveau des sous-classes (@NotNull conditionnel).

---

## 4. Alternatives Envisagées et Raisons du Rejet

1. JOINED : Normalisé mais très lourd en performances (4 jointures obligatoires par recherche catalogue).
2. TABLE_PER_CLASS : Requêtes polymorphiques par UNION lentes et impossibilité d'avoir des clés étrangères uniques simples.
