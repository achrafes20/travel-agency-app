# Guide d'Architecture et d'Utilisation de l'Internationalisation (i18n) — Atlas Voyage

## 1. Principes Fondamentaux et Vision Produit

Atlas Voyage est une plateforme marocaine de réservation touristique conçue pour rayonner à l'international tout en conservant une identité locale forte.
Le système d'internationalisation (i18n) repose sur les piliers suivants :

1. **Français (`fr`) comme langue source de référence** :
   - Tous les contrats légaux, libellés originaux et messages de base sont définis en français.
   - Les versions anglaise (`en`) et arabe (`ar`) sont des traductions complètes.
2. **Arabe (`ar`) avec support RTL intégral** :
   - Arabe standard moderne adapté au contexte marocain (ex. « فندق », « رياض », « درهم مغربي »).
   - Utilisation de la locale `ar-MA-u-nu-latn-ca-gregory` : chiffres arabes occidentaux (0-9) et calendrier grégorien conformément aux standards de billetterie et bancaires marocains.
   - Respect rigoureux des 6 formes grammaticales du pluriel arabe via l'API standard `Intl.PluralRules`.
3. **Zéro régression et tolérance aux pannes** :
   - Architecture sans étape de compilation obligatoire (Vanilla JavaScript moderne).
   - Chargement modulaire des dictionnaires par namespaces (19 namespaces).
   - Repli gracieux à 3 niveaux : Clé demandée dans la langue active -> Clé dans la langue source `fr` -> Code brut de la clé (`namespace.field`).
4. **Pseudo-localisation (`en-XA`) intégrée** :
   - Activée à tout instant en ajoutant `?pseudo=1` dans l'URL. Permet aux développeurs de repérer immédiatement toute chaîne codée en dur dans le HTML ou le JS et de valider la tolérance aux débordements visuels (+30% de longueur).

---

## 2. Architecture Technique

### 2.1 Côté Frontend

Le module central réside dans `frontend/js/shared/i18n.js`. Il expose un objet global `I18n` (ou exportable ES module / AMD).

```
frontend/
├── locales/
│   ├── fr/                 # Dictionnaires source (19 fichiers JSON)
│   ├── en/                 # Dictionnaires anglais (parité 100%)
│   └── ar/                 # Dictionnaires arabe (parité 100%, 6 pluriels)
├── js/
│   └── shared/
│       ├── i18n.js         # Moteur i18n frontend
│       ├── currency.js     # Gestion des devises indicatives
│       └── format.js       # Formatage dates, durées, montants via Intl API
└── css/
    ├── av.css              # Feuille de styles maîtresse (Design System)
    └── rtl.css             # Adaptations RTL, inversion d'icônes et typographie arabe
```

### 2.2 Détection et Résolution de la Langue

Lors du chargement de chaque page, la langue est résolue selon l'ordre de priorité strict suivant :
1. **Paramètre d'URL `?lang=`** (priorité absolue, permet le partage d'URL multilingues et le référencement SEO).
2. **Préférence enregistrée dans `localStorage.getItem('atlas-lang')`**.
3. **Cookie HTTP `atlas_lang`** (max-age 1 an, `SameSite=Lax`).
4. **Préférence du compte utilisateur connecté** (`user.preferredLanguage` issu de `/api/auth/me`).
5. **Langue du navigateur client** (`navigator.language`).
6. **Repli par défaut** : `'fr'`.

### 2.3 Côté Backend (Spring Boot 3.3.4 / Java 21)

Le backend respecte la configuration définie dans `I18nConfig.java` :
- `LocaleResolver` : extrait la locale depuis le paramètre de requête `?lang=...`, l'en-tête `Accept-Language`, ou replie sur `Locale.FRENCH`.
- `MessageSource` : `ReloadableResourceBundleMessageSource` pointant sur `classpath:messages` encodé en UTF-8 (`messages_fr.properties`, `messages_en.properties`, `messages_ar.properties`).
- `Content-Language` & `Vary: Accept-Language` : injectés automatiquement par un intercepteur HTTP pour chaque réponse de l'API.
- `GlobalExceptionHandler` : résout dynamiquement les messages d'erreur et de validation de chaque exception (`ResourceNotFoundException`, `BadRequestException`, `ValidationException`, `ForbiddenException`, etc.) selon la locale résolue du client.

---

## 3. Guide Pratique pour les Développeurs

### 3.1 Initialisation dans une page

Dans tout fichier HTML ou contrôleur JavaScript :
```javascript
await I18n.init({
  namespaces: ['common', 'nav', 'catalog', 'status', 'errors']
});
```

### 3.2 Traduction simple : `I18n.t(key, params)`

```javascript
// Traduction brute
const label = I18n.t('common.actions.save'); // "Enregistrer" / "Save" / "حفظ"

// Avec interpolation de variables sécurisée (anti-XSS)
const welcome = I18n.t('client.dashboard.greeting', { name: user.firstName });
```

### 3.3 Gestion des pluriels : `I18n.plural(keyPrefix, count, params)`

Pour gérer les pluriels sans concaténation fragile :
```javascript
// En français / anglais : résout vers keyPrefix.one ou keyPrefix.other
// En arabe : résout selon la règle grammaticale exacte (zero, one, two, few, many, other)
const message = I18n.plural('catalog.resultsCount', offers.length, { count: offers.length });
```

Exemple de structure JSON correspondante :
```json
// locales/fr/catalog.json
{
  "resultsCount": {
    "one": "{count} offre disponible",
    "other": "{count} offres disponibles"
  }
}

// locales/ar/catalog.json
{
  "resultsCount": {
    "zero": "لا توجد عروض متاحة",
    "one": "عرض واحد متاح",
    "two": "عرضان متاحان",
    "few": "{count} عروض متاحة",
    "many": "{count} عرضاً متاحاً",
    "other": "{count} عرض متاح"
  }
}
```

### 3.4 Liaison déclarative dans le DOM HTML

Pour traduire des interfaces sans JavaScript verbeux :

```html
<!-- 1. Remplacement du texte interne -->
<h1 data-i18n="home.hero.title">Le Maroc vous attend</h1>

<!-- 2. Remplacement d'attributs HTML (placeholder, aria-label, title) -->
<input type="search" data-i18n-attr="placeholder:catalog.searchPlaceholder;aria-label:catalog.searchAria" />

<!-- 3. Injection sécurisée de HTML avec balises autorisées (strong, em, a, br) -->
<p data-i18n-html="checkout.guarantee"></p>
```

Pour déclencher la mise à jour :
```javascript
I18n.applyTranslations(document);
```

### 3.5 Composant Sélecteur de Langue

Pour insérer le sélecteur accessible dans un en-tête ou un menu :
```javascript
const container = document.getElementById('header-i18n-container');
container.innerHTML = I18n.renderLanguageSwitcher();
I18n.bindLanguageSwitcher(container);
```

---

## 4. Traduction Dynamique des Entités Métier (Offres & Villes)

### 4.1 Offres Touristiques (`OfferTranslation`)

Table SQL : `offer_translations` (`offer_id`, `locale`, `title`, `description`, `created_at`, `updated_at`).
Contrainte d'unicité : `(offer_id, locale)`.

- **Lecture** :
  `GET /api/offers/{id}?lang=ar`
  Si une traduction arabe existe, le titre et la description renvoyés dans le DTO sont automatiquement remplacés. Le DTO renvoie également le champ `availableLanguages: ["fr", "en", "ar"]`.
- **Édition Fournisseur / Admin** :
  - `GET /api/offers/{id}/translations` : liste toutes les traductions existantes.
  - `PUT /api/offers/{id}/translations/{locale}` : enregistre le titre et la description dans la langue ciblée.
  - `DELETE /api/offers/{id}/translations/{locale}` : supprime la traduction (revient au français).

### 4.2 Villes Marocaines (`CityTranslation`)

Table SQL : `city_translations` (`city_id`, `locale`, `name`).
Contrainte d'unicité : `(city_id, locale)`.

- `GET /api/cities?lang=ar` renvoie `CityResponse` avec le champ `localizedName` (ex. « مراكش » pour Marrakech, « فاس » pour Fès, « طنجة » pour Tanger).
- Le composant `GeocodingClient` frontend tient compte de la langue active pour afficher les noms de villes traduits.

---

## 5. Comment Ajouter une Nouvelle Langue (ex. Espagnol `es`)

1. **Frontend** :
   - Ajouter le code `'es'` dans `SUPPORTED_LANGS` dans `frontend/js/shared/i18n.js`.
   - Créer le dossier `frontend/locales/es/`.
   - Exécuter le script de synchronisation : `node scripts/i18n/sync.mjs`.
   - Traduire les 19 fichiers JSON du dossier `frontend/locales/es/`.
   - Valider la conformité via : `node scripts/i18n/check.mjs`.
2. **Backend** :
   - Créer `backend/src/main/resources/messages_es.properties`.
   - Déclarer `new Locale("es")` dans `I18nConfig.java`.
   - Ajouter le support dans la migration SQL si nécessaire.
3. **Tests** :
   - Exécuter la suite de tests complète : `mvn test`.

