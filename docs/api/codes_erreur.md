# Catalogue des Codes d'Erreur Métier — Atlas Voyage

> **Objet :** Référentiel exhaustif des codes d'erreur stables renvoyés par l'API REST Atlas Voyage.  
> **Public visé :** Développeurs frontend, intégrateurs, développeurs d'applications tierces.  
> **Dernière mise à jour :** 1er novembre 2026 | **Version de référence :** 3.0.0  
> **Statut :** ✅ Stable | **Propriétaire :** Équipe d'Ingénierie API

---

## 1. Format Standardisé de Réponse d'Erreur (`ApiError`)

Toutes les erreurs renvoyées par l'API sont normalisées et sérialisées sous la structure suivante :

```json
{
  "timestamp": "2026-11-01T22:00:00Z",
  "status": 400,
  "code": "CAPACITY_EXCEEDED",
  "message": "La capacité maximale de cette offre pour la période sélectionnée est dépassée.",
  "details": [
    "Capacité disponible : 2 place(s), demandée(s) : 4"
  ],
  "requestId": "req-8f4b23c1-0123"
}
```

- **`timestamp`** : Date et heure ISO-8601 UTC de survenance de l'erreur.
- **`status`** : Code de statut HTTP standard.
- **`code`** : Identifiant d'erreur textuel stable garanti par le contrat d'API (`ErrorCode`).
- **`message`** : Message explicatif rédigé dans la langue demandée via `Accept-Language` (ou français par défaut).
- **`details`** : Tableau optionnel d'informations complémentaires ou d'erreurs de validation par champ.
- **`requestId`** : Identifiant de corrélation pour le traçage dans les journaux d'audit.

---

## 2. Répertoire des Codes par Domaine

### 2.1 Erreurs Générales et Validation

| Code Métier | HTTP | Signification | Action Recommandée |
| :--- | :---: | :--- | :--- |
| `VALIDATION_ERROR` | `400` | Un ou plusieurs champs du corps JSON ne respectent pas les contraintes Jakarta Validation. | Corriger les champs listés dans `details`. |
| `BAD_REQUEST` | `400` | Requête mal formée ou paramètre manquant. | Vérifier la structure de l'appel HTTP. |
| `NOT_FOUND` | `404` | La ressource demandée n'existe pas ou l'utilisateur n'y a pas accès. | Vérifier l'identifiant dans l'URL. |
| `CONFLICT` | `409` | Conflit d'état ou collision sur une contrainte unique. | Rafraîchir les données et réessayer. |
| `DUPLICATE_RESOURCE` | `409` | Ressource déjà existante (ex. ville de même nom, e-mail déjà utilisé). | Modifier la valeur dupliquée. |
| `INTERNAL_ERROR` | `500` | Erreur non interceptée sur le serveur. | Contacter le support avec le `requestId`. |

### 2.2 Authentification et Sécurité

| Code Métier | HTTP | Signification | Action Recommandée |
| :--- | :---: | :--- | :--- |
| `UNAUTHORIZED` | `401` | Jeton d'accès absent, expiré ou invalide. | Renouveler via `/api/auth/refresh` ou se reconnecter. |
| `INVALID_CREDENTIALS` | `401` | Couple email / mot de passe erroné. | Vérifier la saisie du mot de passe. |
| `TOKEN_EXPIRED` | `401` | Le jeton d'accès ou de rafraîchissement a expiré. | Réexécuter le flux de connexion. |
| `TOKEN_REVOKED` | `401` | Le jeton a été explicitement révoqué lors d'une déconnexion. | Se reconnecter. |
| `TOKEN_REUSED` | `401` | Détection de rejeu d'un Refresh Token (attaque suspectée). | La famille de jetons est invalidée : reconnexion forcée. |
| `FORBIDDEN` | `403` | Rôle utilisateur insuffisant pour l'opération. | Vérifier les privilèges requis (`Role`). |
| `ACCOUNT_ARCHIVED` | `403` | Compte utilisateur désactivé ou archivé par l'administration. | Contacter l'administrateur système. |
| `ACCOUNT_LOCKED` | `423` | Compte verrouillé temporairement suite à 5 échecs consécutifs. | Patienter 15 minutes ou contacter l'admin pour déblocage. |
| `EMAIL_NOT_VERIFIED` | `403` | L'adresse e-mail n'a pas encore été confirmée. | Cliquer sur le lien reçu par e-mail ou demander renvoi. |
| `AUTH_RATE_LIMITED` | `429` | Trop de tentatives d'authentification par minute. | Respecter le délai `Retry-After`. |
| `RATE_LIMIT_EXCEEDED` | `429` | Seuil global de requêtes par minute dépassé. | Espacer les requêtes. |

### 2.3 Offres et Disponibilités

| Code Métier | HTTP | Signification | Action Recommandée |
| :--- | :---: | :--- | :--- |
| `OFFER_INACTIVE` | `400` | L'offre touristique a été désactivée par le fournisseur ou modérée. | Choisir une autre offre active. |
| `OFFER_NOT_AVAILABLE` | `400` | L'offre ne dispose d'aucune disponibilité pour la période demandée. | Modifier les dates de séjour. |
| `CAPACITY_EXCEEDED` | `400` | Le nombre de places ou chambres restantes est inférieur à la demande. | Réduire le nombre de voyageurs. |
| `AVAILABILITY_OVERLAP` | `400` | Deux périodes de disponibilité se chevauchent pour une même offre. | Corriger le calendrier de disponibilité. |
| `AVAILABILITY_NOT_COVERED` | `400` | L'intervalle de réservation dépasse la période de disponibilité. | Sélectionner des dates couvertes. |
| `SUPPLIER_CATEGORY_MISMATCH` | `403` | Le fournisseur tente de publier une offre hors de sa spécialité. | Publier une offre conforme à sa catégorie. |
| `NOT_OWNER` | `403` | Le fournisseur tente de modifier une offre ne lui appartenant pas. | Accès strictement restreint au propriétaire. |

### 2.4 Panier, Codes Promo et Réservations

| Code Métier | HTTP | Signification | Action Recommandée |
| :--- | :---: | :--- | :--- |
| `CART_EMPTY` | `400` | Tentative de validation d'un panier ne contenant aucun article. | Ajouter une prestation au panier. |
| `PROMO_INVALID` | `400` | Code promotionnel inexistant ou conditions d'application non remplies. | Vérifier le code promo saisi. |
| `PROMO_EXPIRED` | `400` | La date de validité du code promo est dépassée. | Retirer le code promo expiré. |
| `INVALID_TRAVEL_CRITERIA` | `400` | Critères incohérents (ex: date retour antérieure à la date aller). | Corriger les dates du voyage. |
| `PAY_ON_ARRIVAL_NOT_ALLOWED` | `400` | Le paiement à l'arrivée a été choisi alors que l'offre l'interdit. | Payer par carte bancaire. |
| `BOOKING_NOT_FOUND` | `404` | Réservation introuvable avec la référence fournie. | Vérifier le numéro de réservation. |
| `BOOKING_NOT_CANCELLABLE` | `400` | La réservation ne peut être annulée (statut non éligible). | Consulter le statut de la réservation. |
| `BOOKING_ALREADY_CANCELLED` | `400` | La réservation a déjà été annulée précédemment. | Aucune action nécessaire. |
| `CANCELLATION_DEADLINE_PASSED` | `400` | Le délai limite d'annulation (48 h) est dépassé. | Contacter le support client. |
| `INVALID_STATE_TRANSITION` | `409` | Transition de statut interdite par la machine à états finis. | Vérifier le cycle de vie de la réservation. |

### 2.5 Paiements et Caisse

| Code Métier | HTTP | Signification | Action Recommandée |
| :--- | :---: | :--- | :--- |
| `PAYMENT_NOT_FOUND` | `404` | Paiement introuvable pour l'identifiant fourni. | Vérifier la référence du paiement. |
| `PAYMENT_NOT_ALLOWED` | `400` | Paiement non autorisé sur cette réservation. | Vérifier le statut de la commande. |
| `PAYMENT_ALREADY_PAID` | `409` | La réservation a déjà été entièrement réglée. | Aucune action requise. |
| `PAYMENT_IN_PROGRESS` | `409` | Une transaction est déjà en cours d'autorisation. | Patienter jusqu'à la fin du traitement. |
| `PAYMENT_FAILED` | `402` | Le paiement bancaire sandbox a été rejeté. | Vérifier les numéros de carte sandbox. |
| `INVALID_AMOUNT` | `400` | Montant du paiement différent du reste à payer en MAD. | Ajuster le montant exact. |
| `REFUND_EXCEEDS_PAID` | `400` | Le montant du remboursement dépasse le montant total perçu. | Ajuster le montant remboursable. |
| `IDEMPOTENCY_KEY_REQUIRED` | `400` | En-tête obligatoire `Idempotency-Key` absent. | Transmettre un UUID unique dans l'en-tête. |
| `IDEMPOTENCY_KEY_REUSED` | `422` | La même clé d'idempotence a été réutilisée avec un corps différent. | Générer une nouvelle clé pour une opération distincte. |
| `INVALID_WEBHOOK_SIGNATURE` | `401` | La signature HMAC-SHA256 du webhook de paiement est invalide. | Vérifier la clé secrète partagée. |
| `CASH_PAYMENT_NOT_ALLOWED` | `403` | Seul un agent ou administrateur peut enregistrer un paiement en espèces. | Opération réservée aux agents agréés. |

### 2.6 Profils, Sécurité du Compte et Fichiers

| Code Métier | HTTP | Signification | Action Recommandée |
| :--- | :---: | :--- | :--- |
| `INVALID_CURRENT_PASSWORD` | `400` | Le mot de passe actuel fourni est incorrect. | Vérifier le mot de passe actuel. |
| `PASSWORD_POLICY_VIOLATION` | `400` | Le nouveau mot de passe ne respecte pas les critères de sécurité (min 12 car., complexité). | Consulter la politique de sécurité. |
| `PASSWORD_CONFIRMATION_MISMATCH` | `400` | Le mot de passe et sa confirmation ne correspondent pas. | Retaper le mot de passe à l'identique. |
| `INVALID_OR_EXPIRED_TOKEN` | `400` | Le jeton de réinitialisation ou de vérification est expiré ou corrompu. | Demander un nouveau lien par e-mail. |
| `EMAIL_NOT_EDITABLE` | `400` | L'adresse e-mail est l'identifiant du compte et ne peut être altérée directement. | Contacter l'administrateur. |
| `INVALID_IMAGE` | `400` | Fichier non reconnu comme image JPEG/PNG ou corrompu. | Sélectionner un fichier `.jpg` ou `.png` valide. |
| `UPLOAD_TOO_LARGE` | `413` | L'image dépasse la taille limite autorisée (5 Mo). | Compresser l'image avant l'envoi. |
| `FILE_QUOTA_EXCEEDED` | `400` | Nombre maximal d'images par offre atteint (5 max). | Supprimer une image existante. |
| `FILE_ATTACHED` | `400` | Fichier déjà rattaché à une autre entité active. | Téléverser une nouvelle image distincte. |

