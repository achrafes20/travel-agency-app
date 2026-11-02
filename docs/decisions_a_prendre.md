# Décisions et Arbitrages Ouverts — Atlas Voyage

> **Objet :** Registre des décisions juridiques, de gouvernance, de sécurité et métier devant être formellement tranchées par le propriétaire du produit ou le comité de direction.  
> **Public visé :** Product Owner, Direction Technique, Direction Juridique et RSSI.  
> **Dernière mise à jour :** 1er novembre 2026 | **Version de référence :** 3.0  
> **Statut :** 🟡 En attente de validation propriétaire | **Propriétaire :** Comité Produit Atlas Voyage

---

## 1. Gouvernance et Propriété Intellectuelle

### 1.1 Choix de la Licence Logicielle (`LICENSE`)
- **Situation actuelle :** Le fichier de licence n'est pas encore figé dans le dépôt.
- **Options ouvertes :**
  1. **Licence Propriétaire Exclusive (Recommandée pour produit commercial) :** `Copyright (c) 2026 Atlas Voyage S.A.R.L. Tous droits réservés. Reproduction et redistribution interdites.`
  2. **Licence Open Source Permissive (MIT ou Apache-2.0) :** Permet la réutilisation libre du code du framework, mais expose le code source métier.
  3. **Licence Source-Available (Business Source License - BSL) :** Code public pour consultation et audit mais interdiction d'usage commercial direct par des concurrents.
- **Action requise :** Valider la clause juridique et commiter le fichier `LICENSE` définitif à la racine.

---

## 2. Sécurité et Divulgation Responsable

### 2.1 Canal de Signalement des Vulnérabilités (`SECURITY.md`)
- **Situation actuelle :** Le fichier `SECURITY.md` fait référence à un placeholder d'adresse de contact.
- **Proposition technique :** Créer l'alias de sécurité dédié `security@atlasvoyage.ma` (ou `contact@atlasvoyage.ma`) relié à la boîte du RSSI, avec clé PGP publique optionnelle pour le chiffrement des rapports de vulnérabilité.
- **Engagement de réponse suggéré :** Accusé de réception sous 48 heures ouvrées ; évaluation sous 5 jours ouvrés ; publication de correctif sous 15 jours pour les failles critiques.
- **Action requise :** Confirmer l'adresse e-mail de réception et le délai d'astreinte sécurité.

---

## 3. Politiques Financières et Commerciales

### 3.1 Délais d'Annulation et Frais de Restitution
- **Situation actuelle dans le code :**
  - Annulation gratuite intégrale : jusqu'à 48 heures avant le début de la prestation (`app.booking.cancellation.free-hours=48`).
  - Annulation tardive avec retenue : entre 48 h et 24 h avant la prestation, remboursement à 50% (`app.booking.cancellation.partial-refund-percent=50`).
  - Annulation à moins de 24 h : non remboursable (0%).
- **Arbitrage métier requis :**
  - Confirmer si cette grille s'applique uniformément à tous les types de prestations (notamment les vols qui disposent souvent de règles de non-remboursement strictes imposées par les compagnies partenaires).
  - Décider si les frais de dossier (ex. 50 MAD) doivent être déduits du remboursement ou si le pourcentage s'applique au montant brut.

### 3.2 Taux de Change Indicatifs et Fournisseur de Marché
- **Situation actuelle :** Les taux de conversion indicatifs sont rafraîchis en cache mémoire Caffeine (`EUR`, `USD`, `GBP`). En cas d'indisponibilité réseau, des taux conservateurs fixes sont appliqués.
- **Arbitrage métier requis :**
  - Souscrire un abonnement officiel à un flux de données certifié (Bank Al-Maghrib ou Banque Centrale Européenne API) pour alimenter le service en production.
  - Définir la marge de sécurité indicative (ex: +1.5% pour couvrir la volatilité des devises).

---

## 4. Exploitation et Production

### 4.1 Noms de Domaine et Certificats SSL
- **Domaines de production cibles proposés :**
  - Application publique & portails : `https://atlasvoyage.ma` et `https://www.atlasvoyage.ma`
  - API Backend : `https://api.atlasvoyage.ma`
- **Action requise :** Dépôt des noms de domaine auprès de l'ANRT (.ma) et configuration des enregistrements DNS (Cloudflare / Let's Encrypt).

