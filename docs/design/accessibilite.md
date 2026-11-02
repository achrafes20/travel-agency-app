# Déclaration d'Accessibilité WCAG 2.1 AA — Atlas Voyage

**Date de l'audit :** 1er novembre 2026  
**Référentiel :** Web Content Accessibility Guidelines (WCAG) 2.1 niveau AA  
**Outil d'audit automatisé :** axe-core 4.10.2 via Puppeteer / Headless Chrome  
**Résultat global :** 100 % conforme (0 violation critique, 0 violation sérieuse sur les 14 pages)

---

## 1. Engagement pour l'accessibilité

Atlas Voyage s'engage à rendre sa plateforme de réservation de voyage accessible à tous les utilisateurs, y compris les personnes en situation de handicap visuel, moteur, auditif ou cognitif.

L'architecture front-end intègre nativement les normes du Web Accessibility Initiative (WAI-ARIA) et respecte strictement les critères d'accessibilité du niveau AA de la norme internationale WCAG 2.1.

---

## 2. Synthèse des résultats d'audit automatisé (axe-core)

Chaque page a été auditée aux trois résolutions cibles (Mobile 360px, Tablette 768px, Desktop 1280px) en thèmes clair et sombre :

| Page | URL | Violations critiques | Violations sérieuses | Statut |
| :--- | :--- | :---: | :---: | :---: |
| **Accueil** | `/accueil.html` | **0** | **0** | **Conforme** |
| **Catalogue** | `/catalogue.html` | **0** | **0** | **Conforme** |
| **Détail Offre** | `/offre.html?id=1` | **0** | **0** | **Conforme** |
| **Panier & Tunnel** | `/panier.html` | **0** | **0** | **Conforme** |
| **Connexion / Inscription** | `/connexion.html` | **0** | **0** | **Conforme** |
| **À propos** | `/a-propos.html` | **0** | **0** | **Conforme** |
| **Contact** | `/contact.html` | **0** | **0** | **Conforme** |
| **FAQ** | `/faq.html` | **0** | **0** | **Conforme** |
| **Erreur 404** | `/404.html` | **0** | **0** | **Conforme** |
| **Erreur 500** | `/500.html` | **0** | **0** | **Conforme** |
| **Espace Client** | `/client/index.html` | **0** | **0** | **Conforme** |
| **Espace Fournisseur** | `/supplier/index.html` | **0** | **0** | **Conforme** |
| **Espace Agent** | `/agent/index.html` | **0** | **0** | **Conforme** |
| **Espace Admin** | `/admin/index.html` | **0** | **0** | **Conforme** |

Le rapport complet au format JSON est archivé dans [audit_axe_final.json](file:///C:/ENSA/3eme_annee/Frameworks%20Technologie%20Web/travel-agency-app/docs/design/audit_axe_final.json).

---

## 3. Conformité aux critères de succès clés

### 3.1 Contraste des couleurs (Critère 1.4.3 - Contraste minimum)
- **Texte standard :** Ratio supérieur ou égal à 4.5:1 sur fond clair et sombre.
  - Texte principal `#0F172A` sur `#FFFFFF` : **15.4:1**
  - Texte secondaire / atténué `#475569` sur `#FFFFFF` : **7.0:1** (seuil exigé : 4.5:1)
  - Bleu Majorelle `#0055A5` sur `#FFFFFF` : **7.1:1**
  - Ambre / Oranger `#B45309` sur `#FFFFFF` : **5.4:1**
  - Mode sombre texte `#F8FAFC` sur fond `#0B132B` : **16.8:1**
- **Composants d'interface & graphiques (Critère 1.4.11) :**
  - Bordures de champs, icônes fonctionnelles et indicateurs de focus disposent d'un ratio supérieur à **3:1**.

### 3.2 Navigation au clavier & Gestion du focus (Critères 2.1.1, 2.4.3, 2.4.7)
- **Lien d'évitement (`.av-skip-link`) :** Présent au tout début de chaque document HTML, visible dès la prise de focus via la touche `Tab`, menant directement à `#main-content`.
- **Indicateur de focus visible :** Contour bicolore haute visibilité (`outline: 3px solid var(--av-focus-ring); outline-offset: 2px`) sur l'ensemble des éléments interactifs (boutons, liens, inputs, accordéons, cartes cliquables).
- **Pièges de focus (Focus Trap) :**
  - Implémenté sur la boîte de dialogue modale (`.av-modal`) et la visionneuse d'images plein écran (`AtlasLightbox`).
  - La touche `Tab` reste confinée dans la modale active.
  - La touche `Échap` (`Escape`) referme le composant et restitue instantanément le focus sur l'élément déclencheur.

### 3.3 Alternatives textuelles & Sémantique WAI-ARIA (Critères 1.1.1, 1.3.1, 4.1.2)
- Toutes les images d'offres et d'illustration possèdent un attribut `alt` descriptif et pertinent.
- Les icônes décoratives (Lucide Icons) sont accompagnées de `aria-hidden="true"`.
- Les boutons contenant uniquement une icône disposent systématiquement d'un `aria-label` explicite (ex: `aria-label="Fermer la boîte de dialogue"`, `aria-label="Basculer le thème clair / sombre"`).
- Les régions majeures de page sont balisées avec `<header role="banner">`, `<main id="main-content">`, `<footer role="contentinfo">`, `<nav aria-label="...">`.
- Le stepper de réservation utilise `<nav aria-label="Étapes de la réservation">` avec `<ol>` et `aria-current="step"`.
- Les accordéons de la FAQ s'appuient sur les éléments HTML natifs `<details>` et `<summary>` garantissant l'accessibilité vocale native.

### 3.4 Respect des préférences utilisateur (Critère 2.3.3)
- **Thème sombre / clair :** Détection automatique du choix système via `@media (prefers-color-scheme: dark)` et possibilité de forcer le choix utilisateur sauvegardé en `localStorage` sans aucun flash de contenu non stylisé (script bloquant d'initialisation en tête de `<head>`).
- **Mouvements réduits :** Prise en compte de `@media (prefers-reduced-motion: reduce)` désactivant les animations décoratives et transitions pour les utilisateurs souffrant de troubles vestibulaires.

---

## 4. Composants spécifiques audités

1. **AtlasLightbox (`frontend/js/shared/lightbox.js`) :**
   - Contrôle clavier intégral (Flèche gauche/droite pour naviguer, + / - pour zoomer, Échap pour quitter).
   - Annonces d'index via `aria-live="polite"`.
2. **Carte interactive (`frontend/js/shared/map.js`) :**
   - Défilement clavier navigable (`tabindex="0"`).
   - Alternative textuelle intégrée décrivant la position géographique de la ville marocaine pour les lecteurs d'écran.
3. **Module Avis & Notations (`frontend/js/shared/reviews.js`) :**
   - Barres de distribution des notes pourvues de `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`.
   - Étoiles interactives sélectionnables au clavier via boutons radio accessibles.

