# Direction Artistique et Charte Graphique — Atlas Voyage

---

## 1. Vision et Esprit de Marque

**Atlas Voyage** n'est pas un catalogue de voyage générique, mais une passerelle authentique vers les trésors du Maroc. La direction artistique conjugue :
- **Élégance & Modernité :** Des interfaces épurées, des espacements aérés, des typographies fluides et des micro-interactions soignées de standard international.
- **Identité Marocaine Authentique :** 
  - La profondeur du **Bleu Majorelle & Bleu Atlas** (`#0A2B66`).
  - La chaleur solaire du **Safran & de l'Ambre de l'Atlas** (`#D97706`).
  - La richesse minérale de la **Terracotta des Kasbahs** (`#C2410C`).
  - La sérénité du **Vert Menthe / Zellige Fassi** (`#0D7A57`).
  - Les tons doux du **Sable et de l'Ivoire** (`#FAFAF8`) pour adoucir le fond clair.
- **Subtilité & Sobriété :** Motifs géométriques traditionnels (zellige, étoile octogonale) intégrés sous forme de textures vectorielles discrètes (opacités 3% à 6%), jamais criards, avec `aria-hidden="true"`.

---

## 2. Structure du Design System (`av-*`)

Tous les styles et composants du design system sont regroupés sous le préfixe unique `av-` et structurés dans `frontend/css/design-system/` :
- `tokens.css` : Définition des variables sémantiques (couleurs, typographie, espacements, ombres, rayons, z-index).
- `themes.css` : Déclinaisons des thèmes Clair / Sombre (`:root`, `[data-theme="dark"]`, `@media (prefers-color-scheme: dark)`).
- `base.css` : Reset moderne, normalisation, typographie fluide, styles globaux de base.
- `components.css` : Composants d'interface réutilisables (`av-btn`, `av-field`, `av-card`, `av-badge`, `av-table`, `av-modal`, `av-toast`, `av-stepper`, `av-skeleton`...).
- `utilities.css` : Classes utilitaires complémentaires (visibilité, alignement, conteneurs, grilles).
- `legacy.css` : Couche de compatibilité pour l'ancien code en cours de migration.
- `av.css` : Point d'entrée consolidé orchestré avec `@layer reset, tokens, base, components, utilities, legacy;`.

---

## 3. Typographie

- **Titre & Marque :** Sans-serif géométrique haute lisibilité (pile système optimisée et graisses 500, 600, 700).
- **Corps de texte :** Sans-serif moderne, haute lisibilité, taille minimale de 16px sur mobile (1rem) pour prévenir le zoom automatique iOS.
- **Échelle fluide :** Utilisation de `clamp()` pour un redimensionnement harmonieux de l'écran mobile (360px) au grand écran (1920px).

---

## 4. Mode Sombre (Dark Mode)

- Système sans flash : détection de la préférence mémorisée (`localStorage.getItem('atlas_theme')`) ou système (`prefers-color-scheme`) via un script synchrone ultra-léger dans le `<head>`.
- Inversion chromatique sémantique assurant un ratio de contraste supérieur à 4.5:1 pour tous les textes sur leurs arrière-plans.
- Ombrages renforcés et bordures luminescentes subtiles sur les surfaces surélevées.

---

## 5. Ordre de Migration Déroulé

1. **Tokens et Composants Socles (`av-*`)**
2. **Site Public :** Accueil, Catalogue, Détail d'offre, Panier, Connexion
3. **Parcours de Réservation :** Stepper interactif 4 étapes
4. **Galerie & Carte Interactive :** Lightbox zoomable et Leaflet OSM
5. **Module Avis & Notes :** Backend `Review` + Frontend
6. **Pages Institutionnelles :** À propos, Contact, FAQ, 404, 500
7. **Espaces Privés :** Client, Fournisseur, Agent, Administrateur
8. **Vérification d'Accessibilité (axe-core) & Responsive**

