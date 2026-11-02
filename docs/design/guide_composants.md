# Guide des Composants Atlas Voyage Design System

Ce document détaille l'ensemble des composants d'interface du design system **Atlas Voyage** (`av-*`), leur structure HTML accessible, leurs variantes de style, ainsi que les règles d'intégration et d'accessibilité WCAG 2.1 AA associées.

---

## 1. Principes d'architecture CSS

Le design system repose sur l'architecture CSS moderne avec `@layer` définie dans `frontend/css/av.css` :

```css
@layer tokens, reset, base, components, utilities, legacy;
```

Tous les composants utilisent des classes préfixées par `av-` pour garantir une parfaite isolation et éviter tout conflit avec les styles existants ou des frameworks utilitaires.

---

## 2. Bibliothèque des composants

### 2.1 Boutons (`.av-btn`)

Le composant bouton supporte 4 variantes visuelles et 3 tailles, avec focus outline visible standardisé (`--av-focus-ring`).

#### Structure HTML
```html
<!-- Bouton primaire avec icône -->
<button type="button" class="av-btn av-btn--primary">
  <i data-lucide="compass" aria-hidden="true"></i>
  <span>Explorer les offres</span>
</button>

<!-- Bouton secondaire (terre cuite) -->
<button type="button" class="av-btn av-btn--secondary">Réserver</button>

<!-- Bouton outline -->
<button type="button" class="av-btn av-btn--outline">Détails</button>

<!-- Bouton fantôme -->
<button type="button" class="av-btn av-btn--ghost">Annuler</button>

<!-- Bouton danger -->
<button type="button" class="av-btn av-btn--danger">Supprimer</button>
```

#### Tailles disponibles
- `.av-btn--sm` : padding `0.375rem 0.75rem`, police `0.875rem`
- standard : padding `0.625rem 1.25rem`, police `1rem`
- `.av-btn--lg` : padding `0.875rem 1.75rem`, police `1.125rem`

---

### 2.2 Champs de saisie & Formulaires (`.av-field`)

Conteneur accessible associant label, champ de saisie, message d'aide et message d'erreur reliés par `aria-describedby` et `aria-invalid`.

#### Structure HTML
```html
<div class="av-field">
  <label for="search-city" class="av-field__label">
    Destination au Maroc <span class="av-required" aria-hidden="true">*</span>
  </label>
  <div class="av-field__control">
    <i data-lucide="map-pin" class="av-field__icon" aria-hidden="true"></i>
    <input type="text" id="search-city" class="av-input" 
           placeholder="Ex: Marrakech, Chefchaouen..." 
           required aria-describedby="search-city-hint">
  </div>
  <p id="search-city-hint" class="av-field__hint">Sélectionnez parmi plus de 50 villes marocaines.</p>
  <p id="search-city-error" class="av-field__error" role="alert" style="display:none;"></p>
</div>
```

---

### 2.3 Badges (`.av-badge`)

Indicateurs d'état sémantiques conformes au ratio de contraste WCAG AA ≥ 4.5:1.

#### Structure HTML & Variantes
```html
<span class="av-badge av-badge--primary">En vedette</span>
<span class="av-badge av-badge--success">Confirmé</span>
<span class="av-badge av-badge--warning">En attente</span>
<span class="av-badge av-badge--danger">Annulé</span>
<span class="av-badge av-badge--info">Nouveau</span>
<span class="av-badge av-badge--neutral">Brouillon</span>
```

---

### 2.4 Cartes (`.av-card`)

Conteneurs visuels avec élévation douce et transition fluide au survol.

#### Structure HTML
```html
<article class="av-card">
  <header class="av-card__header">
    <h3 class="av-card__title">Riad Dar Bensouda</h3>
    <span class="av-badge av-badge--success">Disponible</span>
  </header>
  <div class="av-card__body">
    <p>Au cœur de la médina de Fès, un riad d'exception avec patio traditionnel.</p>
  </div>
  <footer class="av-card__footer">
    <span class="av-card__price"><strong>1 200 MAD</strong> / nuit</span>
    <button class="av-btn av-btn--sm av-btn--primary">Voir l'offre</button>
  </footer>
</article>
```

---

### 2.5 Tableaux de données (`.av-table`)

Tableaux responsives avec défilement horizontal fluide et contraste de bordure soigné.

#### Structure HTML
```html
<div class="av-table-container" tabindex="0" role="region" aria-label="Historique des réservations">
  <table class="av-table">
    <thead>
      <tr>
        <th scope="col">Référence</th>
        <th scope="col">Offre</th>
        <th scope="col">Dates</th>
        <th scope="col">Montant</th>
        <th scope="col">Statut</th>
        <th scope="col" class="av-text-right">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>#BK-9024</strong></td>
        <td>Excursion Désert Merzouga</td>
        <td>15/11/2026 - 18/11/2026</td>
        <td>3 450 MAD</td>
        <td><span class="av-badge av-badge--success">Confirmé</span></td>
        <td class="av-text-right">
          <button class="av-btn av-btn--sm av-btn--ghost" aria-label="Voir la réservation #BK-9024">
            <i data-lucide="eye" aria-hidden="true"></i>
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### 2.6 Modales accessibles (`.av-modal`)

Modales avec gestion de focus (focus trap), touche Échap, backdrop cliquable et attributs WAI-ARIA `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.

#### Structure HTML
```html
<div id="demo-modal" class="av-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" style="display:none;">
  <div class="av-modal__backdrop" data-close-modal></div>
  <div class="av-modal__dialog">
    <header class="av-modal__header">
      <h2 id="modal-title" class="av-modal__title">Confirmer la réservation</h2>
      <button type="button" class="av-modal__close" aria-label="Fermer la boîte de dialogue" data-close-modal>
        <i data-lucide="x" aria-hidden="true"></i>
      </button>
    </header>
    <div class="av-modal__body">
      <p>Souhaitez-vous valider votre réservation pour le Riad Fès ?</p>
    </div>
    <footer class="av-modal__footer">
      <button type="button" class="av-btn av-btn--ghost" data-close-modal>Annuler</button>
      <button type="button" class="av-btn av-btn--primary">Confirmer</button>
    </footer>
  </div>
</div>
```

---

### 2.7 Tiroir latéral (`.av-drawer`)

Panneau coulissant idéal pour filtres mobiles, panier rapide ou navigation secondaire.

```html
<aside id="filters-drawer" class="av-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" style="display:none;">
  <div class="av-drawer__backdrop" data-close-drawer></div>
  <div class="av-drawer__content">
    <header class="av-drawer__header">
      <h2 id="drawer-title" class="av-drawer__title">Filtrer les offres</h2>
      <button type="button" class="av-drawer__close" aria-label="Fermer le tiroir" data-close-drawer>
        <i data-lucide="x" aria-hidden="true"></i>
      </button>
    </header>
    <div class="av-drawer__body">
      <!-- Filtres -->
    </div>
  </div>
</aside>
```

---

### 2.8 Toasts de notification (`.av-toast`)

Système de notifications flottantes non intrusives avec `role="status"` ou `role="alert"`.

```javascript
// Déclenchement via toast vanilla
showToast('Votre avis a été soumis avec succès !', 'success');
```

---

### 2.9 Stepper de réservation (`.av-stepper`)

Indicateur d'étapes interactif utilisé dans le tunnel de commande (`panier.html`).

#### Structure HTML
```html
<nav class="av-stepper" aria-label="Étapes de la réservation">
  <ol class="av-stepper__list">
    <li class="av-stepper__item is-completed">
      <div class="av-stepper__circle"><i data-lucide="check" aria-hidden="true"></i></div>
      <span class="av-stepper__label">1. Panier</span>
    </li>
    <li class="av-stepper__item is-active" aria-current="step">
      <div class="av-stepper__circle">2</div>
      <span class="av-stepper__label">2. Coordonnées</span>
    </li>
    <li class="av-stepper__item">
      <div class="av-stepper__circle">3</div>
      <span class="av-stepper__label">3. Options</span>
    </li>
    <li class="av-stepper__item">
      <div class="av-stepper__circle">4</div>
      <span class="av-stepper__label">4. Paiement</span>
    </li>
  </ol>
</nav>
```

---

### 2.10 Squelettes de chargement (`.av-skeleton`)

Placeholders animés pour un chargement fluide sans saut d'affichage (CLS = 0).

```html
<div class="av-card">
  <div class="av-skeleton av-skeleton--image"></div>
  <div style="padding: 1rem;">
    <div class="av-skeleton av-skeleton--text" style="width: 70%;"></div>
    <div class="av-skeleton av-skeleton--text" style="width: 40%;"></div>
  </div>
</div>
```

---

### 2.11 Étoiles de notation (`.av-stars`)

Composant d'affichage et de saisie accessible des notes d'avis (1 à 5 étoiles).

```html
<!-- Affichage statique accessible -->
<div class="av-stars" aria-label="Note de 4.8 sur 5 basée sur 42 avis">
  <i data-lucide="star" class="is-filled" aria-hidden="true"></i>
  <i data-lucide="star" class="is-filled" aria-hidden="true"></i>
  <i data-lucide="star" class="is-filled" aria-hidden="true"></i>
  <i data-lucide="star" class="is-filled" aria-hidden="true"></i>
  <i data-lucide="star" class="is-half" aria-hidden="true"></i>
  <span class="av-stars__score" aria-hidden="true">4.8</span>
  <span class="av-stars__count" aria-hidden="true">(42)</span>
</div>
```

---

### 2.12 Galerie d'images & Lightbox (`.av-lightbox`)

Composant modulaire défini dans `frontend/js/shared/lightbox.js`.
- Navigation clavier : flèches `Gauche` / `Droite`, zoom `+` / `-`, fermeture `Échap`.
- Touch swipe sur smartphones et tablettes.
- Piège de focus automatique et restauration du focus à la fermeture.

---

### 2.13 Carte géographique interactive Leaflet (`.av-map`)

Composant cartographique défini dans `frontend/js/shared/map.js` utilisant Leaflet hébergé localement (`frontend/vendor/leaflet/`).
- Initialisation avec coordonnées réelles de la ville marocaine.
- Marqueur personnalisé avec popup descriptive.
- Alternative textuelle accessible fournie pour les lecteurs d'écran.

