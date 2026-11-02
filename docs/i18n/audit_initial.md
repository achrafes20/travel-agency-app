# Audit Initial — Internationalisation (i18n), RTL & Devises (Phase 14)

**Date de l'audit :** 1er novembre 2026  
**Auteur :** Ingénieur Full-Stack Senior spécialisé i18n / l10n / RTL  
**Projet :** Atlas Voyage  

---

## 1. Contexte & Périmètre de l'Audit

Atlas Voyage est une plateforme de voyage marocaine (Hôtels & Riads, Vols, Voitures, Taxis/Transferts, Excursions).  
L'application a été initialement conçue exclusivement en langue française avec des montants libellés en Dirhams Marocains (MAD).

L'objectif de la **Phase 14** est de transformer la plateforme en une application trilingue de référence :
1. **Français (`fr`)** : langue par défaut et langue source (locale `fr-MA`).
2. **Anglais (`en`)** : langue internationale (locale `en-GB`).
3. **Arabe (`ar`)** : langue nationale avec prise en charge intégrale du sens de lecture droite-à-gauche (**RTL**), locale `ar-MA` avec numération latine (`latn`) et calendrier grégorien (`gregory`).
4. **Devises indicatives** : conservation absolue du MAD comme monnaie de référence transactionnelle et légale pour tous les paiements et réservations, et affichage de conversions indicatives en `EUR`, `USD`, `GBP` avec taux dynamiques actualisés et mention légale explicite.

---

## 2. Inventaire Chiffré de l'Existant

### 2.1 Frontend — Chaînes de Caractères Visibles en Dur

| Emplacement / Module | Fichiers concernés | Nombre estimé de chaînes / libellés | Types de contenus |
| :--- | :--- | :---: | :--- |
| **Pages Publiques** | `accueil.html`, `catalogue.html`, `offre.html`, `panier.html`, `js/app.js` | ~160 | En-têtes, recherche, filtres, cartes, détails d'offres, stepper de commande, récapitulatif |
| **Authentification** | `connexion.html`, `js/pages/connexion.page.js` | ~45 | Formulaires connexion/inscription, critères de mot de passe, CGU |
| **Pages Institutionnelles & Erreurs** | `a-propos.html`, `contact.html`, `faq.html`, `404.html`, `500.html` | ~120 | Piliers, accordéons FAQ, formulaire contact, messages d'erreurs HTTP |
| **Pages Légales** | `cgu.html`, `confidentialite.html` | ~60 | Conditions d'utilisation, politique CNDP / RGPD |
| **Espace Client** | `client/index.html`, `client/js/app.js` | ~90 | Réservations, tickets, favoris, historique paiements, profil |
| **Espace Fournisseur** | `supplier/index.html`, `supplier/js/app.js` | ~110 | Wizard 4 étapes d'offres, disponibilités, statistiques, réservations reçues |
| **Espace Agent** | `agent/index.html`, `agent/js/app.js` | ~80 | Bundles, gestion des réservations, validation |
| **Espace Admin** | `admin/index.html`, `admin/js/app.js` | ~130 | Gestion utilisateurs, villes, modération offres/avis, audit log, paramètres système |
| **Composants transverses** | `toast.js`, `modal.js`, `states.js`, `reviews.js`, `format.js` | ~75 | Messages d'état, boutons d'action modales, badges de statut, notations |
| **Total Estimé Frontend** | — | **~870 chaînes** | — |

---

### 2.2 Frontend — Sélecteur de Devises & Formatage Actuels

- **Constantes codées en dur dans `frontend/js/app.js` (lignes 278-284) :**
  ```javascript
  const CUR = { MAD: 1, EUR: 0.092, USD: 0.1 };
  const curCode = () => localStorage.getItem("atlas-cur") || "MAD";
  ```
- **Limites identifiées :**
  - Taux figés arbitrairement sans date de mise à jour ni source.
  - Absence du Livre Sterling (`GBP`).
  - Aucun avertissement clair pour l'utilisateur sur le fait que la transaction bancaire réelle est traitée en MAD.
  - Formatage via `Intl.NumberFormat` utilisant exclusivement la locale `fr-MA` en dur dans `format.js`.

---

### 2.3 Frontend — Propriétés CSS Directionnelles (Impact RTL)

L'audit des feuilles de style révèle **95 occurrences** de propriétés directionnelles absolues non logiques :

| Propriété CSS / Sélecteur | Occurrences | Impact en RTL | Remplacement recommandé |
| :--- | :---: | :--- | :--- |
| `text-align: left` / `right` | 39 | Texte aligné du mauvais côté en arabe | `text-align: start` / `end` |
| `margin-left` | 21 | Décalages et marges inversés en arabe | `margin-inline-start` |
| `margin-right` | 6 | Marges droites non inversées | `margin-inline-end` |
| `padding-left` | 16 | Espacements internes inversés | `padding-inline-start` |
| `padding-right` | 12 | Espacements internes inversés | `padding-inline-end` |
| `float: left` / `right` | 1 | Flottement à inverser | Remplacement par Flexbox logique |
| Icônes directionnelles (flèches, chevrons, stepper) | ~25 | Flèche vers l'avant pointant vers la gauche en RTL | `[dir="rtl"] .av-icon-flip { transform: scaleX(-1); }` |

---

### 2.4 Backend — Messages en Dur & Modèle de Données

1. **Messages d'erreur & Exceptions :**
   - Aucune ressource `messages.properties` dans `backend/src/main/resources/`.
   - Les messages d'exception dans `GlobalExceptionHandler`, `BusinessException`, `AuthRateLimitException` et les validateurs Jakarta (`@NotBlank`, `@Size`, `@Email`) sont exclusivement rédigés en français en dur.
2. **Entité `User` :**
   - Ne dispose pas encore des préférences de langue (`preferredLanguage`) ni de devise (`preferredCurrency`).
3. **Entité `Offer` :**
   - Champs `title` et `description` uniques en français, sans support relationnel pour les traductions en anglais ou arabe.
4. **Entité `City` :**
   - Champ `name` unique en français/canonique, sans table de traduction pour les noms de villes en arabe (ex. « مراكش » pour Marrakech, « فاس » pour Fès, « الدار البيضاء » pour Casablanca) ou en anglais.
5. **Absence de service de taux de change :**
   - Aucun endpoint REST ne fournit les devises et taux de conversion indicatifs avec cache.

---

## 3. Analyse des Risques & Stratégie d'Atténuation

| Risque identifié | Niveau de gravité | Stratégie d'atténuation |
| :--- | :---: | :--- |
| **Altération du montant payé par conversion serveur** | **Critique** | **Règle absolue :** Toutes les entités financières (`Booking`, `Payment`, `Cart`, `PromoCode`) restent à 100% en MAD. Les devises étrangères ne sont calculées qu'à l'affichage avec la mention explicite « indicatif ». |
| **Casse des 390 tests backend existants** | **Élevé** | Maintien du comportement par défaut en français (`Locale.FRENCH`) si aucun en-tête `Accept-Language` ou paramètre `lang` n'est fourni. |
| **Flash de contenu non traduit (FOUT)** | **Moyen** | Chargement bloquant des clés critiques dans `<head>` et positionnement immédiat des attributs `<html lang="..." dir="...">`. |
| **Gestion incorrecte des pluriels en arabe (6 formes)** | **Moyen** | Utilisation de l'API standard `Intl.PluralRules('ar-MA')` prenant en charge nativement : `zero`, `one`, `two`, `few`, `many`, `other`. |
| **Attaques XSS par injection dans les traductions** | **Élevé** | Échappement HTML systématique lors de l'interpolation `{var}` ; liste blanche stricte de balises autorisées (`<strong>, <em>, <a>`) pour les clés HTML déclarées. |
| **Dégradation de l'accessibilité WCAG 2.1 AA en RTL** | **Moyen** | Re-vérification systématique axe-core en `dir="rtl"` avec contraste et navigation clavier garantis. |

