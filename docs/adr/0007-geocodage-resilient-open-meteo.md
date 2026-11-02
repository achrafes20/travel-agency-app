# ADR-0007 : Géocodage mondial résilient via l'API Open-Meteo sans clé payante

> **Date :** 1er novembre 2026 | **Statut :** Accepté  
> **Décideurs :** Équipe d'Ingénierie & Architecture Atlas Voyage  
> **Contexte de référence :** Phases 1 à 14

---

## 1. Contexte et Problématique

La localisation géographique des offres et villes requiert des coordonnées GPS (latitude, longitude) fiables pour l'affichage cartographique et le calcul d'itinéraires.
Les solutions payantes (Google Maps API, Mapbox) introduisaient des coûts et des clés d'API contraignantes.

---

## 2. Décision Prise

Utiliser l'API publique de géocodage Open-Meteo (`https://geocoding-api.open-meteo.com/v1/search`) avec une stratégie de résilience à triple niveau :
1. Recherche exacte et normalisée (`CityNormalizer`).
2. Cache persistant des villes résolues dans la table `cities`.
3. Coordonnées de repli par défaut sur les métropoles marocaines (Marrakech, Casablanca) en cas de panne réseau ou de limite de requêtes.

---

## 3. Conséquences

Avantages :
- Zéro coût financier et zéro clé d'API secrète à gérer.
- Résolution rapide des villes marocaines et internationales.
Inconvénients :
- Dépendance réseau externe lors de la première saisie d'une nouvelle ville par un fournisseur.

---

## 4. Alternatives Envisagées et Raisons du Rejet

1. Google Places API : Rejeté pour coûts récurrents et nécessité d'enregistrer une carte bancaire.
2. Nominatim OpenStreetMap direct : Rejeté pour politique de restriction d'usage très stricte (1 req/s maximum).
