# Architecture Financière et Gestion des Devises Indicatives — Atlas Voyage

## 1. Principe Légal et Règle d'Or Non Négociable

Atlas Voyage est une entreprise de droit marocain dont le siège et les opérations financières sont situés au Maroc.

> **Règle d'Or Financière :**
> **Tous les prix en base de données, toutes les réservations, tous les paniers et tous les règlements bancaires sont EXCLUSIVEMENT calculés et débités en Dirhams Marocains (MAD).**
> **Aucune transaction réelle n'est jamais exécutée dans une devise étrangère.**

Toute devise étrangère affichée sur le site (Euro `EUR`, Dollar américain `USD`, Livre sterling `GBP`) est **strictement indicative**.
Elle a pour seul but de faciliter l'évaluation du budget par les voyageurs internationaux.

---

## 2. Mentions Légales et Disclaimers Obligatoires

Conformément à la réglementation de l'Office des Changes marocain et aux normes de protection du consommateur en ligne :

1. **Astérisque ou Badge Indicatif** :
   Chaque fois qu'un montant est affiché dans une devise étrangère (ex. `120.50 €`), il est obligatoirement accompagné d'un astérisque ou d'une mention :
   `* Montant indicatif calculé au taux du jour. Paiement prélevé en MAD.`

2. **Étape du Paiement et Récapitulatif de Commande** :
   Sur les pages Panier (`panier.html`) et Règlement (`checkout`), le montant total est **toujours affiché en gros caractères en Dirhams Marocains (MAD)**, avec le montant indicatif entre parenthèses.
   La mention suivante est visible avant validation :
   *« Vous serez prélevé en Dirhams Marocains (MAD) pour un montant total de X MAD. Votre banque émettrice peut appliquer des frais de conversion selon votre contrat porteur. »*

---

## 3. Architecture Technique Backend

### 3.1 Service de Taux de Change (`CurrencyService.java`)

Le backend Spring Boot fournit les taux de change via :
`GET /api/currencies/rates` (endpoint public accessible sans authentification).

Format de réponse standardisé :
```json
{
  "baseCurrency": "MAD",
  "rates": {
    "MAD": 1.0,
    "EUR": 0.092,
    "USD": 0.100,
    "GBP": 0.078
  },
  "updatedAt": "2026-11-01T20:00:00Z",
  "source": "Bank Al-Maghrib / European Central Bank Reference",
  "disclaimer": "Les taux sont fournis à titre strictement indicatif. Toutes les transactions financières s'effectuent en Dirhams Marocains (MAD)."
}
```

### 3.2 Cache Haute Performance (Caffeine)

- La méthode `CurrencyService.getExchangeRates()` est annotée avec `@Cacheable("currencyRates")`.
- Configuration dans `StatsConfig.java` :
  - Mise en cache en mémoire vive avec expiration configurable (12 à 24 heures).
  - Évite les appels réseau répétitifs et garantit un temps de réponse < 2 ms pour l'endpoint `/api/currencies/rates`.

---

## 4. Architecture Frontend (`frontend/js/shared/currency.js`)

### 4.1 Devises Prises en Charge

| Code ISO | Nom | Symbole | Rôle |
| :--- | :--- | :--- | :--- |
| **MAD** | Dirham marocain | **MAD** | **Devise légale et base de facturation** |
| **EUR** | Euro | **€** | Devise d'affichage indicative |
| **USD** | Dollar américain | **$** | Devise d'affichage indicative |
| **GBP** | Livre sterling | **£** | Devise d'affichage indicative |

### 4.2 Résolution de la Devise Active

La devise sélectionnée par le client est résolue selon l'ordre suivant :
1. `localStorage.getItem('atlas-currency')`
2. Cookie `atlas_currency`
3. Champ `user.preferredCurrency` si le voyageur est connecté
4. Repli par défaut : `'MAD'`.

### 4.3 Fonctions Clés de l'API JavaScript

#### `AtlasCurrency.convertFromMad(amountMad, targetCurrency)`
Convertit un montant de base en MAD vers la devise cible en appliquant le taux de change en cache.
```javascript
const eurAmount = AtlasCurrency.convertFromMad(1500, 'EUR'); // ~138.00 €
```

#### `AtlasCurrency.formatPrice(amountMad, targetCurrency, options)`
Formate élégamment le prix selon la locale active et ajoute l'astérisque légal si une devise étrangère est sélectionnée :
```javascript
const html = AtlasCurrency.formatPrice(1500); 
// En MAD : "1 500 MAD"
// En EUR : "138,00 € <span class='av-currency-indicative' title='...'>*</span>"
```

#### `AtlasCurrency.renderCurrencySwitcher()`
Génère le composant dropdown accessible respectant WCAG 2.1 AA :
- Contrôle au clavier (touches Flèches Haut/Bas, Entrée, Échap).
- Attributs ARIA (`aria-haspopup="true"`, `aria-expanded="false"`, `role="menu"`).

### 4.4 Synchronisation avec le Profil Voyageur

Lorsque le client sélectionne une devise différente, l'événement global `currency:change` est émis :
```javascript
window.addEventListener('currency:change', (event) => {
  console.log('Nouvelle devise :', event.detail.currency);
  // Rafraîchissement automatique des cartes d'offres et des totaux du panier
});
```
Si le client est authentifié, sa préférence est automatiquement synchronisée en base de données via :
`PUT /api/users/me/preferences` (`preferredCurrency: "EUR"`).

---

## 5. Résilience et Sécurité

1. **Mode Hors Ligne / Défaillance API** :
   Si l'API `/api/currencies/rates` est indisponible, `currency.js` bascule instantanément sur un jeu de taux de repli garantis (Fallback Rates conservateurs). L'interface utilisateur ne bloque jamais.
2. **Intégrité des Commandes** :
   Les requêtes `POST /api/cart/items` et `POST /api/bookings` n'acceptent AUCUN montant client dans leur payload : le prix unitaire est recalculé côté serveur à partir du prix officiel de l'offre en MAD enregistré dans la base MySQL. Aucune falsification de montant par injection de devises côté client n'est possible.

