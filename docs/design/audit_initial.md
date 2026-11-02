# Audit Visuel et Technique Initial — Phase 12 : Design, UX, Accessibilité & Responsive

Date : Novembre 2026  
Projet : **Atlas Voyage**  
Auteur : Designer-Développeur Front-End Senior  

---

## 1. Périmètre de l'Audit

L'audit a couvert l'ensemble des 5 espaces applicatifs de la plateforme :
1. **Site public :** `accueil.html`, `catalogue.html`, `offre.html`, `panier.html`, `connexion.html`, pages de réinitialisation/vérification.
2. **Espace Client :** `client/index.html` (dashboard, réservations, paiements, notifications, profil, tickets, favoris).
3. **Espace Fournisseur :** `supplier/index.html` (dashboard, gestion des offres, réservations, profil entreprise, statistiques, tickets).
4. **Espace Agent :** `agent/index.html` (dashboard, traitement des réservations, paiements espèces, validation, tickets).
5. **Espace Administrateur :** `admin/index.html` (dashboard, modération des offres, villes, utilisateurs, codes promo, audit, paramètres, tickets).

---

## 2. Incohérences Visuelles et Techniques Relevées

### 2.1 Fragmentation des Couleurs et Tokens
Une dispersion notable des teintes existe entre les espaces :
- **Bleu Atlas (Couleur de marque) :** `#003580` (public), `#0B3A8C` (supplier), `#0A2A6B` (agent), `#0A2A66` (admin).
- **Accents chauds (Ambre/Or) :** `#feba02` (public), `#FFB800` (supplier), `#FFB400` (agent), `#f28c00` (connexion).
- **Fonds de page :** `#f5f5f5` (public), `#F4F6F9` (supplier), `#F4F5F7` (agent).
- **Textes atténués (Muted) :** `#64748b` (public), `#667085` (supplier), `#6B7280` (agent), `#8c96a8` (connexion).

### 2.2 Typographie et Dépendances Externes
- Le site public importe `DM Sans` et `Manrope` depuis Google Fonts.
- L'administration, le client et le fournisseur importent `Montserrat` depuis Google Fonts.
- L'espace agent importe `Poppins` et `Montserrat`.
- **Risques :** Dépendance réseau externe, blocage potentiel en CSP stricte (Phase 10), non-conformité RGPD (transmission d'IP à Google Fonts sans consentement préalable).

### 2.3 Duplication des Composants d'Interface
- **Boutons :** `.btn`, `.btn-primary`, `.primary-btn`, `.btn-save`, `.action-btn` avec des rayons de bordure hétérogènes (4px, 6px, 8px, 9999px).
- **Badges :** Statuts stylisés différemment entre `bookings.css`, `style.css`, `supplier.css` et `tickets.css`.
- **Modales et Tiroirs :** Plusieurs implémentations concurrentes de modales sans piégeage complet du focus ni fermeture au clavier standardisée.
- **Tableaux :** Pas d'en-têtes sticky cohérents, cellules de tableaux non adaptées au mobile sur plusieurs écrans.
- **Conflits de noms :** Conflit historique `.stepper` identifié entre le wizard fournisseur et les réservations.

---

## 3. Résultats de l'Audit d'Accessibilité Initial (axe-core WCAG 2.1 AA)

Un audit automatisé via `axe-core` a été exécuté sur les 9 écrans majeurs (résultats consignés dans `docs/design/audit_axe_initial.json`) :

| Page | Violations Critiques | Violations Sérieuses | Type Principal de Violation |
| :--- | :---: | :---: | :--- |
| `accueil.html` | 0 | 1 | `color-contrast` : texte `#64748b` sur fond `#f5f5f5` (ratio 4.36:1 < 4.5:1 requis). |
| `catalogue.html` | 0 | 0 | Conforme sur la structure initiale. |
| `offre.html` | 0 | 0 | Conforme sur la structure initiale. |
| `panier.html` | 0 | 0 | Conforme sur la structure initiale. |
| `connexion.html` | 0 | 1 | `color-contrast` : `.eyebrow` (#f28c00 sur #fff, ratio 2.46:1) et `.secure-note` (#8c96a8 sur #fff, ratio 2.98:1). |
| `admin/index.html` | 0 | 1 | Redirection vers connexion ou contraste éléments de formulaire. |
| `client/index.html` | 0 | 1 | Redirection vers connexion ou contraste éléments de formulaire. |
| `supplier/index.html` | 0 | 1 | Redirection vers connexion ou contraste éléments de formulaire. |
| `agent/index.html` | 0 | 1 | Redirection vers connexion ou contraste éléments de formulaire. |

### Déficits d'Accessibilité Identifiés manuellement :
1. **Navigation Clavier :** Absence de lien d'évitement (« Aller au contenu principal ») sur l'ensemble des pages publiques.
2. **Focus Visible :** Remplacement d'outline par défaut sans anneau de focus contrasté sur certains boutons et liens d'onglets.
3. **Labels de Formulaires :** Plusieurs champs de recherche s'appuient uniquement sur `placeholder` sans `label` ou `aria-label` explicite.
4. **Mode Sombre :** Inexistant (uniquement fond blanc/gris clair).
5. **Préférences Mouvement :** Aucune prise en compte de `prefers-reduced-motion` dans les transitions CSS existantes.

---

## 4. Analyse Responsive (Mobile, Tablette, Desktop)

Les captures d'écran de référence « avant » ont été enregistrées dans `docs/design/screenshots/before/` pour 3 résolutions clés :
- Mobile : **360 × 740 px**
- Tablette : **768 × 1024 px**
- Desktop : **1280 × 800 px**

### Déficits Responsive Relevés :
1. **Menu Public sur Mobile :** La barre de catégories et les contrôles d'authentification débordent ou s'empilent brutalement. Un véritable menu tiroir mobile avec accordéon de catégories est requis.
2. **Tableaux d'Administration et Réservations :** Sur mobile (360px), les tableaux provoquent des défilements horizontaux non maîtrisés ou tronquent les boutons d'action.
3. **Formulaires et Filtres :** Les filtres latéraux du catalogue doivent devenir un tiroir coulissant avec pastilles actives sur mobile.
4. **Cibles Tactiles :** Plusieurs icônes font moins de 32px de zone de clic, sous le seuil WCAG de 44×44 px.

---

## 5. Plan d'Action Phase 12

1. **Direction Artistique & Tokens (`tokens.css`, `themes.css`) :** Définir la palette sémantique unifiée (Bleu Atlas, Zellige, Terracotta, Ambre chaud, Sable/Ivoire), typographie moderne locale WOFF2, mode sombre sans flash.
2. **Design System & Composants (`av-*`) :** Créer la bibliothèque de composants accessibles réutilisables (boutons, champs, modales, toasts, tables, stepper, skeletons).
3. **Refonte Public, Parcours Réservation & Galerie :** Refondre l'accueil, le catalogue avec filtres URL, le détail avec galerie zoom et carte Leaflet, le stepper de réservation en 4 étapes.
4. **Module Avis & Notes (`Review`) :** Développer de bout en bout l'entité `Review`, son service, ses contrôleurs, modération admin et UI.
5. **Pages Utiles & Contact :** Créer `a-propos.html`, `contact.html` (avec endpoint backend), `faq.html`, `404.html`, `500.html`.
6. **Harmonisation des Espaces Privés :** Appliquer `av-app-shell` avec navigation accessible et tiroir mobile sur client, supplier, agent, admin.
7. **Audits Finaux & Non-Régression :** Valider 0 violation axe critique/sérieuse, captures « après » et tests 100% verts.

