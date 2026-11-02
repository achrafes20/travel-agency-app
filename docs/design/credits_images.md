# Crédits & Licences des Médias — Atlas Voyage

Ce document répertorie l'ensemble des sources iconographiques, bibliothèques logicielles et crédits des médias utilisés dans la refonte de la plateforme **Atlas Voyage**.

---

## 1. Photographies & Illustrations

Toutes les photographies illustrant les destinations marocaines, riads, excursions dans le désert et paysages sont issues de banques d'images libres de droits sous licence **Unsplash License** (utilisation commerciale et non commerciale gratuite, sans attribution obligatoire mais créditée ici par respect des auteurs) :

| Emplacement / Thème | Auteur / Source | Licence |
| :--- | :--- | :--- |
| **Marrakech (Jardin Majorelle, Médina)** | Zakariae Daoui / Unsplash | Unsplash License |
| **Chefchaouen (La perle bleue)** | Heidi Kaden / Unsplash | Unsplash License |
| **Désert de Merzouga (Dunes & Chameaux)** | Trevor Cole / Unsplash | Unsplash License |
| **Fès (Médina El Bali, Tanneries Chouara)** | Annie Spratt / Unsplash | Unsplash License |
| **Essaouira (Remparts & Océan)** | Daniel Seßler / Unsplash | Unsplash License |
| **Atlas & Mont Toubkal** | Tine Mifsud / Unsplash | Unsplash License |

---

## 2. Iconographie

- **Lucide Icons** : Pack d'icônes vectorielles open-source.
  - Licence : **ISC License** (compatible MIT).
  - Intégration : via script CDN officiel `https://unpkg.com/lucide@latest`.
  - Attributs d'accessibilité : Toutes les icônes portent systématiquement `aria-hidden="true"`.

---

## 3. Cartographie & Données Géographiques

- **Leaflet 1.9.4** : Bibliothèque JavaScript libre pour cartes interactives mobiles-friendly.
  - Licence : **BSD 2-Clause License**.
  - Intégration : Auto-hébergée localement dans `frontend/vendor/leaflet/` (`leaflet.js`, `leaflet.css`, marqueurs PNG). Aucune dépendance CDN externe requise.
- **Fonds de carte OpenStreetMap** :
  - Fournisseur de tuiles : **OpenStreetMap Standard Tile Server**.
  - Attribution : `© OpenStreetMap contributors` sous licence **ODbL** (Open Database License).
- **Géocodage des villes marocaines** :
  - API Open-Meteo Geocoding : Utilisation des coordonnées géographiques réelles (Marrakech, Casablanca, Fès, Tanger, Agadir, Ouarzazate, Chefchaouen, etc.).

---

## 4. Polices de caractères (Typographie)

- **Inter** : Police sans-serif moderne pour le texte courant et les interfaces.
  - Créateur : Rasmus Andersson.
  - Licence : **SIL Open Font License (OFL) 1.1**.
- **Cinzel / Playfair Display / Serif système** : Polices pour les titres et l'élégance artisanale marocaine.
  - Licence : **SIL Open Font License (OFL) 1.1**.

