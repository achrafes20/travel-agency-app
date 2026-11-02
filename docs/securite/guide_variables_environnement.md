# Guide des Variables d'Environnement de Production — Atlas Voyage

Ce document recense l'intégralité des variables d'environnement requises et recommandées pour le déploiement en environnement de production de la plateforme Atlas Voyage.

---

## 1. Principe de Sécurité « Fail-Safe » au Démarrage

En profil de production (`SPRING_PROFILES_ACTIVE=prod`), la classe `ProductionEnvironmentValidator` valide l'intégrité de la configuration dès l'initialisation de l'application. Si l'un des critères ci-dessous n'est pas satisfait, **le serveur refuse de démarrer (sortie en code 1)** pour prévenir toute mise en service vulnérable :

1. `JWT_SECRET` est défini et mesure **au moins 32 caractères** (256 bits).
2. `JWT_SECRET` ne contient pas de valeur de repli triviale de test (ex. `atlas-voyage-dev-secret...` ou `changeme`).
3. `CORS_ALLOWED_ORIGINS` ne contient pas de joker universel (`*`) et ne pointe pas vers `localhost` ou `127.0.0.1`.
4. `SPRING_FLYWAY_ENABLED` est activé (`true`).
5. `APP_SEED_ENABLED` est désactivé (`false`).
6. Le compte administrateur de bootstrap (`ADMIN_BOOTSTRAP_EMAIL` et `ADMIN_BOOTSTRAP_PASSWORD`) n'utilise pas de mot de passe par défaut faible.
7. L'utilisateur de base de données n'est pas `root` sans mot de passe.
8. Les cookies d'authentification sont marqués `Secure` et le repli par en-tête Bearer est désactivé.

---

## 2. Inventaire Exhaustif des Variables d'Environnement

### 2.1 Variables d'Environnement Critiques (Obligatoires en Prod)

| Variable | Description | Règle / Format attendu | Exemple en Production |
| :--- | :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Profil Spring actif | `prod` obligatoire en exploitation | `prod` |
| `SERVER_PORT` | Port d'écoute du serveur HTTP interne | Port réseau non privilégié | `8080` |
| `DB_URL` | URL JDBC de connexion à MySQL | `jdbc:mysql://<host>:<port>/<db>?useSSL=true&requireSSL=true` | `jdbc:mysql://db-prod.internal:3306/travel_agency_db?useSSL=true` |
| `DB_USERNAME` | Nom d'utilisateur MySQL applicatif | Compte restreint (moindre privilège, voir `mysql_app_user.sql`) | `atlas_app` |
| `DB_PASSWORD` | Mot de passe de connexion à MySQL | Alphanumérique fort, min 24 caractères | `V@l1d_StR0ng_Db_P@ssw0rd_2026!` |
| `JWT_SECRET` | Clé secrète de signature HMAC-SHA256 des JWT | Aléatoire cryptographique, min 32 caractères (Base64 ou texte brut) | *(Voir commande de génération)* |
| `CORS_ALLOWED_ORIGINS` | Liste des domaines frontaux autorisés (séparés par virgule) | URLs complètes HTTPS sans wildcard | `https://atlasvoyage.ma,https://www.atlasvoyage.ma` |
| `PAYMENT_WEBHOOK_SECRET` | Secret de signature des webhooks de paiement | Aléatoire cryptographique, min 32 caractères | *(Voir commande de génération)* |

---

### 2.2 Variables d'Initialisation Administrative (Bootstrap)

| Variable | Description | Règle / Format | Exemple |
| :--- | :--- | :--- | :--- |
| `ADMIN_BOOTSTRAP_EMAIL` | Email de l'administrateur principal créé au premier boot | Format email valide de l'organisation | `admin@atlasvoyage.ma` |
| `ADMIN_BOOTSTRAP_PASSWORD` | Mot de passe du premier compte admin | Conforme à la politique forte (min 12 chars, 3/4 catégories) | `Atlas!MasterAdmin2026#Secure` |

---

### 2.3 Variables Recommandées (Messagerie, Stockage & Sécurité)

| Variable | Description | Valeur par défaut / Format | Recommandation Prod |
| :--- | :--- | :--- | :--- |
| `STORAGE_TYPE` | Type de stockage des fichiers (avatars, justificatifs) | `local` | `local` (ou volume monté sécurisé) |
| `UPLOAD_ROOT` | Répertoire racine de stockage des fichiers téléversés | `./uploads` | `/var/atlas/uploads` |
| `APP_BASE_URL` | URL publique du frontend | `http://localhost:5500/frontend` | `https://atlasvoyage.ma` |
| `API_BASE_URL` | URL publique de l'API | `http://localhost:8080` | `https://api.atlasvoyage.ma` |
| `SMTP_HOST` | Hôte du serveur SMTP de notification | `localhost` | `smtp.sendgrid.net` ou SMTP d'entreprise |
| `SMTP_PORT` | Port du serveur SMTP | `1025` | `587` |
| `SMTP_USERNAME` | Utilisateur SMTP authentifié | - | `apikey` |
| `SMTP_PASSWORD` | Mot de passe ou clé API SMTP | - | Clé secrète SMTP |
| `SMTP_STARTTLS` | Activer STARTTLS pour le chiffrement SMTP | `false` | `true` |
| `MAIL_FROM` | Adresse d'expédition des courriels | `noreply@atlasvoyage.test` | `noreply@atlasvoyage.ma` |
| `MAIL_ENABLED` | Activation de l'envoi effectif des emails | `false` | `true` |
| `APP_SECURITY_ALLOW_BEARER_HEADER` | Autoriser l'en-tête `Authorization: Bearer` en repli des cookies | `false` | `false` en production web |
| `APP_SECURITY_COOKIE_SECURE` | Envoyer le cookie d'authentification uniquement via HTTPS | `true` | `true` obligatoire en production |
| `BCRYPT_COST` | Facteur de travail de hachage BCrypt | `12` | `12` (compromis optimal sécurité / latence) |

---

## 3. Commandes de Génération des Secrets

Pour générer des secrets cryptographiquement sûrs, exécutez les commandes suivantes dans un terminal sécurisé :

### 3.1 Génération du JWT_SECRET (256 bits / 32 octets aléatoires)
```bash
openssl rand -base64 32
# Exemple généré :
# zQ9vF+Wj6X0z9lX5Pz7mBq5U1KxL9w7E2rT4yV6bN8c=
```

### 3.2 Génération du PAYMENT_WEBHOOK_SECRET
```bash
openssl rand -hex 32
# Exemple généré :
# 8f9b2d3c4e5a6f7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b
```

### 3.3 Génération de Mot de Passe pour la Base de Données
```bash
openssl rand -base64 24 | tr -dc 'a-zA-Z0-9!@#%^&*' | head -c 24; echo
```

---

## 4. Exemple de Fichier d'Environnement de Référence (`.env.production`)

> [!CAUTION]
> Ce fichier ne doit **JAMAIS** être versionné dans le dépôt Git. Il doit être injecté via un gestionnaire de secrets sécurisé (Vault, Docker Secrets, Kubernetes Secrets, ou AWS Secrets Manager).

```dotenv
# ==============================================================================
# ATLAS VOYAGE — CONFIGURATION DE PRODUCTION
# ==============================================================================
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080

# Base de Données
DB_URL=jdbc:mysql://db-prod.internal:3306/travel_agency_db?useSSL=true&requireSSL=true&characterEncoding=UTF-8&serverTimezone=UTC
DB_USERNAME=atlas_app
DB_PASSWORD=ChangeThisPassword_Prod2026_Secure!

# Secrets Cryptographiques
JWT_SECRET=zQ9vF+Wj6X0z9lX5Pz7mBq5U1KxL9w7E2rT4yV6bN8c=
PAYMENT_WEBHOOK_SECRET=8f9b2d3c4e5a6f7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b

# Domaines Autorisés (CORS)
CORS_ALLOWED_ORIGINS=https://atlasvoyage.ma,https://www.atlasvoyage.ma

# Bootstrap Administrateur
ADMIN_BOOTSTRAP_EMAIL=admin@atlasvoyage.ma
ADMIN_BOOTSTRAP_PASSWORD=Atlas!ProdMasterAdmin#2026

# Sécurité & Cookies
APP_SECURITY_ALLOW_BEARER_HEADER=false
APP_SECURITY_COOKIE_SECURE=true
BCRYPT_COST=12

# URLs Publiques
APP_BASE_URL=https://atlasvoyage.ma
API_BASE_URL=https://atlasvoyage.ma/api
UPLOAD_ROOT=/var/atlas/uploads

# Messagerie SMTP
MAIL_ENABLED=true
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=postmaster@atlasvoyage.ma
SMTP_PASSWORD=prod-smtp-secret-key
SMTP_STARTTLS=true
MAIL_FROM=noreply@atlasvoyage.ma
```

