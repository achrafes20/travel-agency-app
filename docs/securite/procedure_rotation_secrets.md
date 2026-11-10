# Procédure de Rotation des Secrets — Atlas Voyage

Ce document spécifie les étapes opérationnelles pour réaliser la rotation programmée ou d'urgence des différents secrets cryptographiques et identifiants de la plateforme Atlas Voyage, **sans interruption de service** pour les utilisateurs.

---

## 1. Matrice des Secrets et Fréquences de Rotation

| Secret | Emplacement / Variable | Fréquence Recommandée | Impact en cas de Rotation | Procédure |
| :--- | :--- | :--- | :--- | :--- |
| **Clé de signature JWT** | `JWT_SECRET` | 90 jours (ou immédiat si fuite) | Invalidation des access tokens en cours (15 min) | Déploiement rolling / Re-authentification via Refresh Token |
| **Identifiants MySQL** | `DB_USERNAME`, `DB_PASSWORD` | 180 jours | Aucun si double compte temporaire | Double compte MySQL / Bascule applicative |
| **Secret Webhook Paiement** | `PAYMENT_WEBHOOK_SECRET` | Annuel (ou si incident) | Risque de rejet des webhooks entrants si non synchronisé | Mise à jour conjointe dans la console passerelle |
| **Mots de passe Administrateurs** | Table `users` (hash BCrypt) | 90 jours | Re-connexion de l'administrateur | Interface de profil (`PATCH /api/users/me/password`) |
| **Clés API Tiers (SMTP, etc.)** | `SMTP_PASSWORD` | 180 jours | Échec temporaire d'envoi si mal configuré | Rolling update |

---

## 2. Procédure 1 : Rotation du Secret JWT (`JWT_SECRET`)

Le secret JWT sert à signer et vérifier les jetons d'accès de courte durée (15 minutes). Les sessions longues reposent sur les refresh tokens stockés sous forme de condensat SHA-256 en base de données.

### Scénario A : Rotation Programmée (Sans Déconnexion Utilisateur)
Grâce à l'architecture Atlas Voyage (jetons d'accès 15 min + silent refresh automatique via cookie `atlas_refresh_token` de 7 jours) :
1. **Génération du nouveau secret :**
   ```bash
   NEW_JWT_SECRET=$(openssl rand -base64 32)
   echo "Nouveau secret : $NEW_JWT_SECRET"
   ```
2. **Mise à jour de la configuration de production :**
   - Injecter `$NEW_JWT_SECRET` dans le gestionnaire de secrets (ex. Vault / AWS Secrets Manager / `.env.production`).
3. **Redémarrage rolling des instances Spring Boot :**
   - Les instances redémarrent avec le nouveau `JWT_SECRET`.
4. **Comportement transparent côté client :**
   - Le prochain appel API avec l'ancien access token (signé avec l'ancienne clé) retourne un code HTTP `401 Unauthorized`.
   - L'intercepteur frontend `api.js` intercepte automatiquement le 401 et sollicite `/api/auth/refresh`.
   - Le refresh token valide (haché en base de données indépendamment de `JWT_SECRET`) est accepté, et un nouvel access token signé avec le nouveau secret est réémis immédiatement.
   - **L'utilisateur n'est pas déconnecté et ne perçoit aucune interruption.**

### Scénario B : Rotation d'Urgence (Compromission Soupçonnée du Secret)
Si la clé `JWT_SECRET` a fuité :
1. Exécuter immédiatement la mise à jour avec une nouvelle clé forte.
2. Invalider immédiatement tous les refresh tokens en base pour forcer la ré-authentification universelle :
   ```sql
   UPDATE refresh_tokens SET revoked_at = NOW() WHERE revoked_at IS NULL;
   UPDATE users SET token_version = token_version + 1;
   ```
3. Redémarrer immédiatement l'ensemble des conteneurs Spring Boot.

---

## 3. Procédure 2 : Rotation des Identifiants Base de Données (`DB_PASSWORD`)

Pour opérer sans coupure de service, MySQL supporte nativement le mécanisme de double mot de passe ou l'utilisation d'un compte applicatif miroir.

### Étape 1 : Création d'un second compte applicatif temporaire
```sql
-- Connexion avec un compte DBA
CREATE USER 'atlas_app_v2'@'%' IDENTIFIED BY 'NouveauMotDePasseTresFort2026!';
GRANT SELECT, INSERT, UPDATE, DELETE ON travel_agency_db.* TO 'atlas_app_v2'@'%';
FLUSH PRIVILEGES;
```

### Étape 2 : Bascule de l'application
1. Mettre à jour les variables d'environnement dans le cluster de production :
   ```dotenv
   DB_USERNAME=atlas_app_v2
   DB_PASSWORD=NouveauMotDePasseTresFort2026!
   ```
2. Déployer en rolling-update les conteneurs Spring Boot.
3. Vérifier dans les métriques et logs de l'application (`/actuator/health`) que les connexions au pool HikariCP s'établissent correctement.

### Étape 3 : Nettoyage de l'ancien compte
Une fois toutes les instances basculées et stables depuis au moins 24 heures :
```sql
DROP USER 'atlas_app'@'%';
```

---

## 4. Procédure 3 : Rotation du Secret Webhook Paiement (`PAYMENT_WEBHOOK_SECRET`)

Les webhooks de notification de paiement (CMI / Stripe) valident la signature HMAC du payload reçu sur `POST /api/payments/webhook`.

1. Se connecter à l'espace marchand de la passerelle de paiement.
2. Activer la clé de webhook secondaire (ou générer un nouveau secret de webhook).
3. Configurer `PAYMENT_WEBHOOK_SECRET` avec la nouvelle valeur côté Spring Boot.
4. Redémarrer l'application Backend.
5. Déprécier et supprimer l'ancienne clé de webhook dans la console marchand.
6. Valider la réception d'un événement de test ("Ping" / "Simulate Webhook") depuis la console marchand et vérifier le statut `200 OK` dans les logs d'audit.

---

## 5. Procédure 4 : Rotation du Mot de Passe Super-Administrateur

1. L'administrateur connecté accède à son compte ou via API :
   ```http
   PATCH /api/users/me/password
   Content-Type: application/json

   {
     "oldPassword": "AncienMotDePasse123!",
     "newPassword": "NouveauMotDePasseComplexe#2026"
   }
   ```
2. La validation forte `PasswordPolicy` (min 12 caractères, 4 classes obligatoires, exclusion d'identifiants, liste noire) valide le nouveau mot de passe.
3. Le mot de passe est haché avec BCrypt (facteur 12).
4. Le service révoque l'ensemble des sessions actives de cet administrateur pour forcer la ré-authentification avec le nouveau secret.

---

## 6. Journalisation et Traçabilité des Opérations

Toute opération de rotation de secrets doit :
- Faire l'objet d'un ticket de maintenance planifié.
- Être consignée dans le journal d'audit interne avec la mention du responsable et de l'horodatage.
- Ne **JAMAIS** faire figurer la valeur en clair du secret dans les logs, tickets ou conversations d'équipe.

