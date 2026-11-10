# Déclaration d'Accessibilité WCAG 2.1 AA — Atlas Voyage

**Date de l'audit :** 1er novembre 2026 — **mis à jour le 9 novembre 2026** (réexécution complète, voir §2)  
**Référentiel :** Web Content Accessibility Guidelines (WCAG) 2.1 niveau AA  
**Outil d'audit automatisé :** axe-core 4.14.0 via Puppeteer / Headless Chrome  
**Résultat global :** 0 violation, tous niveaux d'impact confondus, sur les 11 URL auditées — pages publiques et page de connexion ; les quatre espaces connectés ne sont pas couverts par cet audit (voir `ANO-18`)

---

## 1. Engagement pour l'accessibilité

Atlas Voyage s'engage à rendre sa plateforme de réservation de voyage accessible à tous les utilisateurs, y compris les personnes en situation de handicap visuel, moteur, auditif ou cognitif.

L'architecture front-end intègre nativement les normes du Web Accessibility Initiative (WAI-ARIA) et respecte strictement les critères d'accessibilité du niveau AA de la norme internationale WCAG 2.1.

---

## 2. Synthèse des résultats d'audit automatisé (axe-core)

Les résultats ci-dessous proviennent de `scripts/run_axe_audit.mjs` (règles `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` ; Desktop 1280×800, thème clair, état initial de chaque page), exécuté le 9 novembre 2026 sur la version courante du frontend :

| Page | URL | Violations critiques | Violations sérieuses | Statut |
| :--- | :--- | :---: | :---: | :---: |
| **Accueil** | `/accueil.html` | **0** | **0** | **Conforme** |
| **Catalogue** | `/catalogue.html` | **0** | **0** | **Conforme** |
| **Détail Offre** | `/offre.html?id=1` | **0** | **0** | **Conforme** |
| **Panier & Tunnel** | `/panier.html` | **0** | **0** | **Conforme** |
| **Connexion / Inscription** | `/connexion.html` | **0** | **0** | **Conforme** |
| **Erreur 404** | `/404.html` | **0** | **0** | **Conforme** |
| **Erreur 500** | `/500.html` | **0** | **0** | **Conforme** |
| **Espace Client** | `/client/index.html` | **0** | **0** | **Conforme** |
| **Espace Fournisseur** | `/supplier/index.html` | **0** | **0** | **Conforme** |
| **Espace Agent** | `/agent/index.html` | **0** | **0** | **Conforme** |
| **Espace Admin** | `/admin/index.html` | **0** | **0** | **Conforme** |

Le rapport complet au format JSON est archivé dans [audit_axe_final.json](audit_axe_final.json).

**Évolutions depuis l'audit du 1er novembre :**
- Les pages `À propos`, `Contact` et `FAQ` ont été supprimées du site et ne sont plus auditées (14 → 11 pages). Les pages `cgu.html` et `confidentialite.html`, supprimées également, ne figuraient pas dans l'audit.
- Le bouton du sélecteur de devise (`.av-cur-btn`), ajouté en Phase 14 après le premier audit, présentait une violation `label-content-name-mismatch` (critère 2.5.3 *Label in Name*) sur toutes les pages qui l'affichent : son nom accessible ne commençait pas par le texte visible. Corrigé dans `frontend/js/shared/currency.js` ; vérifié avec les quatre devises (MAD, EUR, USD, GBP).
- L'audit du dépôt ne couvre que l'état initial de chaque page. Les états ajoutés le 9 novembre ont été audités séparément avec axe-core 4.14.0, avec le même jeu de règles, et ne présentent aucune violation : onglet « Créer un compte » (champ mot de passe vide, au focus, avec 11 caractères, avec une règle rare violée, avec les 5 règles respectées), onglet « Connexion » avec le lien « Mot de passe oublié ? », arrivée sur la connexion depuis une offre (message d'invitation), accueil et offre côté invité, pages 404 et 500.

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
- Quand un bouton affiche aussi du texte, son nom accessible **commence par ce texte visible** (critère 2.5.3) : le sélecteur de devise expose par exemple « € EUR, sélectionner la devise d'affichage ».
- Les régions majeures de page sont balisées avec `<header role="banner">`, `<main id="main-content">`, `<footer role="contentinfo">`, `<nav aria-label="...">`.
- Le stepper de réservation utilise `<nav aria-label="Étapes de la réservation">` avec `<ol>` et `aria-current="step"`.

### 3.4 Respect des préférences utilisateur (Critère 2.3.3)
> **État actuel (9 novembre 2026, anomalie `ANO-10`) :** le thème est **forcé en clair** (`frontend/js/shared/theme.js` ignore toute préférence et supprime le choix enregistré). La puce « Thème sombre / clair » ci-dessous décrit la conception prévue, non le comportement actuel ; la prise en compte de `prefers-reduced-motion` n'est pas concernée.

- **Thème sombre / clair :** Détection automatique du choix système via `@media (prefers-color-scheme: dark)` et possibilité de forcer le choix utilisateur sauvegardé en `localStorage` sans aucun flash de contenu non stylisé (script bloquant d'initialisation en tête de `<head>`).
- **Mouvements réduits :** Prise en compte de `@media (prefers-reduced-motion: reduce)` désactivant les animations décoratives et transitions pour les utilisateurs souffrant de troubles vestibulaires.

### 3.5 Aide à la saisie du mot de passe (inscription, changement et réinitialisation)
Composant `AccountUI.strength` (`frontend/js/core/account.js`), partagé par les trois écrans :
- Le champ est relié à la liste des règles par `aria-describedby` : les règles sont annoncées au focus, même lorsque l'aide est masquée visuellement.
- Chaque règle porte un texte réservé aux lecteurs d'écran (« Respectée : … » / « À respecter : … ») : l'état n'est jamais porté par la seule couleur ou par un pictogramme.
- Les messages des règles rares (e-mail contenu dans le mot de passe, mot de passe trop long ou trop courant) sont dans une zone `aria-live="polite"` et n'apparaissent qu'en cas de violation.
- Contrastes sur fond blanc : règle à respecter `#5F6E84` **5,19:1**, règle respectée `#08754A` **5,75:1**, message d'alerte `#A92137` **7,10:1**, lien « Mot de passe oublié ? » `#0B3C8F` **10,21:1** (seuil exigé : 4,5:1).

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

