# Rapport Phase 6 — Profils, mots de passe et images

Livraison du 31 octobre 2026, à partir de la Phase 5 (`747acb2`).
**85 opérations REST ; 310 tests JUnit, 0 échec, 0 erreur, 0 ignoré.**
Les détails fonctionnels/configuration sont dans
[profils_securite_images.md](profils_securite_images.md), les contrats dans
[api_endpoints.md](api_endpoints.md) et la procédure SQL dans [migrations.md](migrations.md).

## Résultat livré

### 6.1 Profils

User conserve les rôles/spécialités et reçoit téléphone, pays, avatar, vérification
d'e-mail, version des JWT et dates. Les DTO restent distincts des entités.
Profil personnel sécurisé pour tous les rôles ; e-mail immuable et mass-assignment
refusé. SupplierProfile unique par fournisseur, lecture/création à la demande,
écriture personnelle et lecture ADMIN, données légales et ville avec coordonnées.
Les quatre interfaces enregistrent réellement et rechargent les données ; avatar
et nom apparaissent dans l'en-tête. Aucune modification du catalogue client.

### 6.2 Sécurité

PasswordPolicy centralise la complexité à toutes les écritures ; les logins
historiques restent compatibles. Changement avec ancien mot de passe et nouveau
JWT ; révocation des autres sessions par claim `tv`, également lors du reset et
de l'archivage. Jetons historiques sans tv refusés (reconnexion).

Oubli anti-énumération, reset/vérification par jetons cryptographiques à usage
unique stockés SHA-256, TTL configurables, concurrence contrôlée et purge quotidienne.
Limiteur en mémoire 5/15 min IP + identité, 429/Retry-After. SMTP multipart
asynchrone après commit ou journal de développement hors prod. Pas de lien secret
journalisé en prod. Pages oubli/reset/vérification réelles, retrait du token de
l'URL, indicateur de force et bandeau de vérification dans les espaces et le public.

### 6.3 Images

Stockage local découplé par interface, UUID, lecture publique contrôlée et suppression
par propriétaire/ADMIN. Validation conteneur/signature/décodage, limites taille et
dimensions avant décompression, quota et concurrence limitée. Réorientation EXIF,
réencodage sans métadonnées, original et miniature. JPEG, PNG et WebP acceptés ;
sortie JPEG 85/PNG documentée. Rattachement atomique aux profils/offres, propre au
propriétaire/purpose, cinq images maximum, conservation des images historiques.
Nettoyage TEMP après 24 h et réconciliation disque/base, avec dry-run.

L'uploader réutilisable remplace les saisies d'images du wizard et gère aperçu,
progression XHR, annulation, réessai, suppression et ordre souris/clavier. Les
transferts bloquent le passage à l'étape suivante. Les quatre profils utilisent
le même composant pour avatar/logo. Données utilisateur rendues via textContent
ou échappement ; URL des images limitée au stockage prévu par le serveur.

## Choix d'implémentation et compatibilité

1. **Pas de nouvelle migration Flyway** : exigence explicite Phase 6. Les V1–V9
   existantes ne sont pas modifiées/supprimées. Dev passe à `update`, prod conserve
   `validate`. Quatre scripts manuels conditionnels dans backend/scripts/migrations.
   Leur exécution précède le premier démarrage sur une base historique pour conserver
   emailVerified=true des utilisateurs déjà présents. Pas de mise à true globale
   aux répétitions, ni remise à zéro de tokenVersion.
2. **Cinq fournisseurs réels** dans ce dépôt, et non six : cinq profils initialisés.
   Huit comptes initiaux + client statistiques déjà existant, aucun compte supprimé
   et aucun mot de passe de démonstration modifié.
3. **WebP** : lecteur Java pur TwelveMonkeys ; pas d'encodeur natif déployé.
   JPEG qualité 85/PNG constitue le repli demandé. Fixture WebP originale locale ;
   JPEG/PNG générés avec ImageIO dans les tests. Orientation testée par fixture EXIF.
4. **Rattachement** : un asset pour une ressource, suppression directe de tout
   ATTACHED refusée, même avatar/logo/offre inactive ; détacher d'abord évite les
   liens cassés. `orphanedAt` redémarre le délai sans falsifier createdAt.
5. **Événements de mail distincts** : AccountRegisteredEvent pour la vérification,
   UserRegisteredEvent historique pour bienvenue. Un événement de notification
   rejoué ne recrée pas un jeton de sécurité. Échec SMTP sans rollback métier.
6. **JWT** : réponse change-password remplace le stockage actuel ; garde contre
   une ancienne requête 401 qui arriverait après émission du nouveau jeton.
   Les écritures administratives utilisent le même verrou utilisateur que change/reset
   pour ne pas écraser une incrémentation concurrente de tokenVersion.
7. **Option e-mail vérifié** : blocage de login si activée, conformément à la demande ;
   aucune nouvelle politique globale d'autorisation ajoutée aux autres endpoints.
8. **Protection des anciennes images** : lecture et conservation à l'identique
   autorisées ; seules les nouvelles images exigent un upload appartenant au fournisseur.

## Vérifications exécutées

| Commande / contrôle | Résultat |
|---|---|
| `cd backend; .\mvnw.cmd test` après profils | 261 tests, 0 échec/erreur |
| Même commande après sécurité des comptes | 288 tests, 0 échec/erreur |
| Tests ciblés FileUploadIntegrationTest | 18 tests images, verts |
| `cd backend; .\mvnw.cmd clean test` après intégration | 310 tests, 0 échec, 0 erreur, 0 ignoré |
| Dernier `cd backend; .\mvnw.cmd test` (`target-phase6-acceptance-test.log`) | 310 tests, 0 échec, 0 erreur, 0 ignoré |
| `node --check` sur les 19 JS concernés (noyau, quatre apps, pages et scripts) | Tous valides |
| `node scripts/frontend_smoke_test.mjs` | 32 pages, 10 offres principales, cinq catégories, OK |
| `node scripts/phase6_api_check.mjs` sur base isolée | Profils, propriété, cinq images/offre, faux JPEG, change/reset/verify et révocation : OK |
| Huit mises à jour ADMIN simultanées d'un compte de test | Huit incréments tv conservés, ancien JWT 401 ; aucune révocation perdue |
| `node scripts/phase6_browser_check.mjs` (Chrome/Playwright) | Quatre profils persistants, logo WebP, wizard cinq images, réessai après erreur, avatar, authentification complète : OK ; aucune erreur JS |
| `node scripts/phase3_api_check.mjs` sur base isolée | Paiements concurrents/idempotents, remboursements, cash, webhook et droits : OK |
| `node scripts/phase2_api_check.mjs` sur base isolée | Capacité 1 : 1 succès/7 refus, références séquentielles et restitution exacte : OK |
| `node scripts/phase5_browser_check.mjs` | Dashboards quatre rôles, graphiques, CSV, mobile, XSS et panne CDN : OK |
| `node scripts/phase5_api_check.mjs` sur base isolée | Six routes stats, rôles, vraie réservation/paiement/annulation, CSV et cache : OK |
| `node scripts/phase4_api_check.mjs` avec SMTP Mailpit local | Notifications, préférences, remboursement ; six e-mails réels HTML/texte dont vérification : OK |
| Second démarrage avec `--spring.jpa.hibernate.ddl-auto=validate` | Schéma Phase 6 existant validé, serveur 8089 démarré |
| Upload HTTP multipart réel dépassant 6 MiB | 413 au format ApiError avec correlationId |
| SMTP sécurité réel sur Mailpit | Liens verify/reset utilisables, HTML/texte présents et nom HTML échappé |
| HTTP `/api/status`, `/v3/api-docs` | 200, 85 opérations OpenAPI |
| Démarrage dev sur nouvelle base MariaDB | V1–V9 + JPA update + seeders : OK |
| Mise à niveau de travel_agency_db existante | Sauvegarde, quatre scripts SQL, démarrage : OK |
| Répétition des quatre scripts sur deux bases | OK ; versions JWT et nouveaux utilisateurs non vérifiés strictement préservés |
| `git diff --check` | Aucun défaut d'espacement |

Les logs de tests restent dans backend/target-phase6-*.log (ignorés par Git).
La capture du profil client est générée sous backend/target/phase6-browser/.
Les scripts navigateur exigent un Chrome local et playwright-core dans
`%TEMP%/atlas-phase1-browser-tools/node_modules` ; ils ne téléchargent pas de
dépendance dans le projet. En CI, installer Playwright dans un environnement
de test dédié ou adapter ce chemin.

### Tests ajoutés et adaptations légitimes

- ProfileIntegrationTest : **13** cas (dont paramètres invalides), droits, immuabilité,
  profils, avatars et fournisseur archivé lisible par ADMIN.
- PasswordPolicyTest : **13** cas, y compris absence du transport de logs en prod.
- AccountSecurityIntegrationTest : **17** cas, Clock déterministe, mail capturé,
  BCrypt/JWT, TTL, usage unique, limite, vérification, purge et quatre resets
  simultanés avec exactement un succès.
- FileUploadIntegrationTest : **18** cas, JPEG/PNG/WebP, dimensions/taille, EXIF,
  faux types, noms malveillants, droits, quota, cinq/six images, rattachement,
  libération et nettoyage/réconciliation dry-run/réel.
- ProfileDemoSeederTest : **1** cas de redémarrage : champs explicitement effacés,
  nom personnel, hash du mot de passe et version JWT révoquée conservés.

La limitation inclut une assertion CORS : Retry-After doit être lisible depuis le
Frontend. Le navigateur vérifie aussi l'ObjectURL avant la réponse serveur,
l'annulation puis le réessai après une erreur 503 simulée. Le nettoyage et la
suppression relisent directement les assets sous verrou, sans état TEMP préchargé
avant un rattachement concurrent ; acquisition ordonnée par nom de fichier.

Les **248 tests antérieurs** sont conservés. Seules adaptations nécessaires :
AuthServiceTest/UserServiceTest utilisent un mot de passe fort pour les créations ;
NotificationIntegrationTest utilise une création forte et attend deux e-mails
(bienvenue + vérification) pour une inscription réelle. Les quatre tests JPA
d'offres/panier/bundles importent le nouveau service de rattachement et ses
propriétés de test. Aucun test supprimé, ignoré ou désactivé ; les logins de démo
restent `password123`. Les scripts API Phases 2–5 et exemples Postman de création
ont aussi des mots de passe forts ; les requêtes de login démo restent inchangées.
L'assertion du remboursement concurrent affiche maintenant ses résultats en cas
d'échec, sans modifier le résultat attendu : un passage complet a échoué sur ce
cas, puis le contrôle ciblé des sept tests PaymentConcurrencyTest est passé.
La dernière suite complète de 310 tests est également passée, sans nouvel échec.
Ce point doit rester surveillé en CI : l'attente de rejeu de paiement existante
est bornée à cinq secondes et les scénarios très chargés peuvent nécessiter un
nouveau rejeu avec la même clé. La logique de paiement n'est pas modifiée en Phase 6.

## Données et exécution locale

Avant adoption de la base principale, une sauvegarde a été créée hors Git sous
`%TEMP%/atlas-phase6-before-profiles-20261031-213842.sql`. Contrôle après mise à
niveau : **9 utilisateurs, 5 profils fournisseurs, 68 réservations, 68 paiements**.
Les comptes/écritures de test sont confinés à `atlas_phase6_empty_20261031`, port
8088 et volume `%TEMP%/atlas-phase6-isolated-uploads`. Le seuil de rate-limit y a
été augmenté à 100 pour les répétitions E2E ; le défaut produit reste 5 et les
tests JUnit vérifient la limite par défaut.

Pour rejouer les parcours sur une base isolée :

```powershell
$env:PROFILE_ISOLATED_TEST="1"
$env:API_BASE="http://localhost:8088"
$env:DEMO_PASSWORD="password123"
# Adapter au log du serveur de développement utilisé :
$env:ACCOUNT_MAIL_LOG="backend/target-phase6-empty-final.log"
node scripts/phase6_api_check.mjs
node scripts/phase6_browser_check.mjs
```

Ces scripts créent des comptes et des images et modifient des fixtures de démo :
ne pas les pointer vers la base principale/production. Les noms modifiés pour le
contrôle des quatre profils sont restaurés ; les images/ICE de l'offre de test
restent sur la base isolée. Aucun e-mail vers un service externe.

## Parcours manuel

1. Appliquer la procédure SQL si base existante, puis démarrer backend et
   `node scripts/serve_frontend.mjs`. Connexion depuis /frontend/connexion.html.
2. Sarah/password123 : Mon profil → nom/téléphone/pays/avatar ; enregistrer,
   recharger puis se reconnecter et constater la persistance. Même contrôle dans
   les espaces Omar (ADMIN), Nadia (AGENT) et Karim (SUPPLIER).
3. Karim → Profil fournisseur : sélectionner une suggestion de ville, société,
   ICE de démo 15 chiffres et logo ; enregistrer/recharger. Nouvelle offre → étape
   3 : déposer JPEG/PNG/WebP, réordonner au clavier/souris, enregistrer et ouvrir
   l'offre publique. Un sixième fichier est refusé.
4. Créer un **nouveau compte de test**, mot de passe fort : vérifier le bandeau,
   récupérer le lien dans les logs dev, ouvrir vérification. Ne pas changer les
   mots de passe des comptes de démo pour ce contrôle.
5. Sur ce compte de test : changer le mot de passe dans Sécurité, puis tester
   l'ancien JWT (401). Déconnexion → Mot de passe oublié → lien des logs → reset
   → reconnexion. Réutiliser le même lien doit échouer.
6. Tester SVG/faux JPEG/URL externe/avatar d'un autre compte : refus lisible,
   aucune valeur interdite persistée. Retirer une image d'une ressource avant
   suppression ; activer dry-run pour observer le nettoyage sans suppression.

## Limites connues et suite

- S3/Cloudinary non implémenté ; local nécessite volume persistant, sauvegarde,
  accès disque cohérent entre instances et surveillance d'espace.
- Limiteur mémoire par instance ; Redis et stratégie de proxy fiables à prévoir
  pour un déploiement distribué. SMTP réel, DNS et délivrabilité à configurer.
- Les lecteurs d'image et la validation stricte réduisent les risques ; garder
  les dépendances à jour. Aucun filtre ne garantit tous les polyglottes imaginables.
- H2 ne prouve pas tous les comportements DDL/verrous MySQL. Les contrôles locaux
  sont faits avec MariaDB 10.4.32 ; une CI MySQL 8/Testcontainers reste recommandée.
  Le dialecte MySQL signale un avertissement de version sur ce MariaDB local ancien.
- Tickets, paramètres globaux et audit visuel hors paiement restent à implémenter ;
  prestataire bancaire réel reste hors périmètre. Les profils/images ne sont plus
  des maquettes. Aucun stock ni second catalogue n'a été introduit.

## Inventaire des fichiers créés/modifiés

Les chemins ci-dessous constituent l'inventaire Phase 6 par rapport à `747acb2`.

<!-- phase6-file-inventory -->

### Backend — configuration, sécurité et démarrage

- [`backend/pom.xml`](../backend/pom.xml)
- [`backend/src/main/java/com/agence/voyage/config/AccountJobs.java`](../backend/src/main/java/com/agence/voyage/config/AccountJobs.java)
- [`backend/src/main/java/com/agence/voyage/config/AuthAccountProperties.java`](../backend/src/main/java/com/agence/voyage/config/AuthAccountProperties.java)
- [`backend/src/main/java/com/agence/voyage/config/DataSeeder.java`](../backend/src/main/java/com/agence/voyage/config/DataSeeder.java)
- [`backend/src/main/java/com/agence/voyage/config/FileCleanupJob.java`](../backend/src/main/java/com/agence/voyage/config/FileCleanupJob.java)
- [`backend/src/main/java/com/agence/voyage/config/NotificationMailProperties.java`](../backend/src/main/java/com/agence/voyage/config/NotificationMailProperties.java)
- [`backend/src/main/java/com/agence/voyage/config/OpenApiConfig.java`](../backend/src/main/java/com/agence/voyage/config/OpenApiConfig.java)
- [`backend/src/main/java/com/agence/voyage/config/ProfileConfig.java`](../backend/src/main/java/com/agence/voyage/config/ProfileConfig.java)
- [`backend/src/main/java/com/agence/voyage/config/ProfileDemoSeeder.java`](../backend/src/main/java/com/agence/voyage/config/ProfileDemoSeeder.java)
- [`backend/src/main/java/com/agence/voyage/config/SecurityConfig.java`](../backend/src/main/java/com/agence/voyage/config/SecurityConfig.java)
- [`backend/src/main/java/com/agence/voyage/config/StatsDemoSeeder.java`](../backend/src/main/java/com/agence/voyage/config/StatsDemoSeeder.java)
- [`backend/src/main/java/com/agence/voyage/config/StorageProperties.java`](../backend/src/main/java/com/agence/voyage/config/StorageProperties.java)
- [`backend/src/main/java/com/agence/voyage/config/UploadProperties.java`](../backend/src/main/java/com/agence/voyage/config/UploadProperties.java)
- [`backend/src/main/java/com/agence/voyage/security/ApiSecurityErrorHandler.java`](../backend/src/main/java/com/agence/voyage/security/ApiSecurityErrorHandler.java)
- [`backend/src/main/java/com/agence/voyage/security/AppUserDetails.java`](../backend/src/main/java/com/agence/voyage/security/AppUserDetails.java)
- [`backend/src/main/java/com/agence/voyage/security/JwtAuthenticationFilter.java`](../backend/src/main/java/com/agence/voyage/security/JwtAuthenticationFilter.java)
- [`backend/src/main/java/com/agence/voyage/security/JwtService.java`](../backend/src/main/java/com/agence/voyage/security/JwtService.java)
- [`backend/src/main/java/com/agence/voyage/security/PasswordPolicy.java`](../backend/src/main/java/com/agence/voyage/security/PasswordPolicy.java)
- [`backend/src/main/resources/application-dev.properties`](../backend/src/main/resources/application-dev.properties)
- [`backend/src/main/resources/application-test.properties`](../backend/src/main/resources/application-test.properties)
- [`backend/src/main/resources/application.properties`](../backend/src/main/resources/application.properties)

### Backend — contrôleurs, DTO, entités, repositories et services

- [`backend/src/main/java/com/agence/voyage/controller/AccountSecurityController.java`](../backend/src/main/java/com/agence/voyage/controller/AccountSecurityController.java)
- [`backend/src/main/java/com/agence/voyage/controller/FileController.java`](../backend/src/main/java/com/agence/voyage/controller/FileController.java)
- [`backend/src/main/java/com/agence/voyage/controller/ProfileController.java`](../backend/src/main/java/com/agence/voyage/controller/ProfileController.java)
- [`backend/src/main/java/com/agence/voyage/dto/AccountRequests.java`](../backend/src/main/java/com/agence/voyage/dto/AccountRequests.java)
- [`backend/src/main/java/com/agence/voyage/dto/FileResponse.java`](../backend/src/main/java/com/agence/voyage/dto/FileResponse.java)
- [`backend/src/main/java/com/agence/voyage/dto/ProfileOptions.java`](../backend/src/main/java/com/agence/voyage/dto/ProfileOptions.java)
- [`backend/src/main/java/com/agence/voyage/dto/RegisterRequest.java`](../backend/src/main/java/com/agence/voyage/dto/RegisterRequest.java)
- [`backend/src/main/java/com/agence/voyage/dto/SupplierProfileRequest.java`](../backend/src/main/java/com/agence/voyage/dto/SupplierProfileRequest.java)
- [`backend/src/main/java/com/agence/voyage/dto/SupplierProfileResponse.java`](../backend/src/main/java/com/agence/voyage/dto/SupplierProfileResponse.java)
- [`backend/src/main/java/com/agence/voyage/dto/UpdateProfileRequest.java`](../backend/src/main/java/com/agence/voyage/dto/UpdateProfileRequest.java)
- [`backend/src/main/java/com/agence/voyage/dto/UserRequest.java`](../backend/src/main/java/com/agence/voyage/dto/UserRequest.java)
- [`backend/src/main/java/com/agence/voyage/dto/UserResponse.java`](../backend/src/main/java/com/agence/voyage/dto/UserResponse.java)
- [`backend/src/main/java/com/agence/voyage/entity/EmailVerificationToken.java`](../backend/src/main/java/com/agence/voyage/entity/EmailVerificationToken.java)
- [`backend/src/main/java/com/agence/voyage/entity/FileAsset.java`](../backend/src/main/java/com/agence/voyage/entity/FileAsset.java)
- [`backend/src/main/java/com/agence/voyage/entity/FilePurpose.java`](../backend/src/main/java/com/agence/voyage/entity/FilePurpose.java)
- [`backend/src/main/java/com/agence/voyage/entity/PasswordResetToken.java`](../backend/src/main/java/com/agence/voyage/entity/PasswordResetToken.java)
- [`backend/src/main/java/com/agence/voyage/entity/SupplierProfile.java`](../backend/src/main/java/com/agence/voyage/entity/SupplierProfile.java)
- [`backend/src/main/java/com/agence/voyage/entity/User.java`](../backend/src/main/java/com/agence/voyage/entity/User.java)
- [`backend/src/main/java/com/agence/voyage/event/AccountMailEvent.java`](../backend/src/main/java/com/agence/voyage/event/AccountMailEvent.java)
- [`backend/src/main/java/com/agence/voyage/event/AccountRegisteredEvent.java`](../backend/src/main/java/com/agence/voyage/event/AccountRegisteredEvent.java)
- [`backend/src/main/java/com/agence/voyage/exception/AuthRateLimitException.java`](../backend/src/main/java/com/agence/voyage/exception/AuthRateLimitException.java)
- [`backend/src/main/java/com/agence/voyage/exception/ErrorCode.java`](../backend/src/main/java/com/agence/voyage/exception/ErrorCode.java)
- [`backend/src/main/java/com/agence/voyage/exception/GlobalExceptionHandler.java`](../backend/src/main/java/com/agence/voyage/exception/GlobalExceptionHandler.java)
- [`backend/src/main/java/com/agence/voyage/exception/PasswordPolicyException.java`](../backend/src/main/java/com/agence/voyage/exception/PasswordPolicyException.java)
- [`backend/src/main/java/com/agence/voyage/repository/EmailVerificationTokenRepository.java`](../backend/src/main/java/com/agence/voyage/repository/EmailVerificationTokenRepository.java)
- [`backend/src/main/java/com/agence/voyage/repository/FileAssetRepository.java`](../backend/src/main/java/com/agence/voyage/repository/FileAssetRepository.java)
- [`backend/src/main/java/com/agence/voyage/repository/PasswordResetTokenRepository.java`](../backend/src/main/java/com/agence/voyage/repository/PasswordResetTokenRepository.java)
- [`backend/src/main/java/com/agence/voyage/repository/SupplierProfileRepository.java`](../backend/src/main/java/com/agence/voyage/repository/SupplierProfileRepository.java)
- [`backend/src/main/java/com/agence/voyage/service/AccountMailListener.java`](../backend/src/main/java/com/agence/voyage/service/AccountMailListener.java)
- [`backend/src/main/java/com/agence/voyage/service/AccountSecurityService.java`](../backend/src/main/java/com/agence/voyage/service/AccountSecurityService.java)
- [`backend/src/main/java/com/agence/voyage/service/AccountTokens.java`](../backend/src/main/java/com/agence/voyage/service/AccountTokens.java)
- [`backend/src/main/java/com/agence/voyage/service/AssetAttachmentService.java`](../backend/src/main/java/com/agence/voyage/service/AssetAttachmentService.java)
- [`backend/src/main/java/com/agence/voyage/service/AuthRequestLimiter.java`](../backend/src/main/java/com/agence/voyage/service/AuthRequestLimiter.java)
- [`backend/src/main/java/com/agence/voyage/service/AuthService.java`](../backend/src/main/java/com/agence/voyage/service/AuthService.java)
- [`backend/src/main/java/com/agence/voyage/service/DisabledProductionMailService.java`](../backend/src/main/java/com/agence/voyage/service/DisabledProductionMailService.java)
- [`backend/src/main/java/com/agence/voyage/service/FileCleanupService.java`](../backend/src/main/java/com/agence/voyage/service/FileCleanupService.java)
- [`backend/src/main/java/com/agence/voyage/service/FileStorageService.java`](../backend/src/main/java/com/agence/voyage/service/FileStorageService.java)
- [`backend/src/main/java/com/agence/voyage/service/FileUploadService.java`](../backend/src/main/java/com/agence/voyage/service/FileUploadService.java)
- [`backend/src/main/java/com/agence/voyage/service/ImageProcessor.java`](../backend/src/main/java/com/agence/voyage/service/ImageProcessor.java)
- [`backend/src/main/java/com/agence/voyage/service/LocalFileStorageService.java`](../backend/src/main/java/com/agence/voyage/service/LocalFileStorageService.java)
- [`backend/src/main/java/com/agence/voyage/service/LoggingMailService.java`](../backend/src/main/java/com/agence/voyage/service/LoggingMailService.java)
- [`backend/src/main/java/com/agence/voyage/service/MailService.java`](../backend/src/main/java/com/agence/voyage/service/MailService.java)
- [`backend/src/main/java/com/agence/voyage/service/MemoryAuthRequestLimiter.java`](../backend/src/main/java/com/agence/voyage/service/MemoryAuthRequestLimiter.java)
- [`backend/src/main/java/com/agence/voyage/service/OfferService.java`](../backend/src/main/java/com/agence/voyage/service/OfferService.java)
- [`backend/src/main/java/com/agence/voyage/service/ProfileService.java`](../backend/src/main/java/com/agence/voyage/service/ProfileService.java)
- [`backend/src/main/java/com/agence/voyage/service/SmtpMailService.java`](../backend/src/main/java/com/agence/voyage/service/SmtpMailService.java)
- [`backend/src/main/java/com/agence/voyage/service/SupplierProfileService.java`](../backend/src/main/java/com/agence/voyage/service/SupplierProfileService.java)
- [`backend/src/main/java/com/agence/voyage/service/UserService.java`](../backend/src/main/java/com/agence/voyage/service/UserService.java)

### Schéma et tests

- [`backend/scripts/migrations/migration_file_assets.sql`](../backend/scripts/migrations/migration_file_assets.sql)
- [`backend/scripts/migrations/migration_password_reset_email_verification.sql`](../backend/scripts/migrations/migration_password_reset_email_verification.sql)
- [`backend/scripts/migrations/migration_supplier_profile.sql`](../backend/scripts/migrations/migration_supplier_profile.sql)
- [`backend/scripts/migrations/migration_user_profile_security.sql`](../backend/scripts/migrations/migration_user_profile_security.sql)
- [`backend/src/test/java/com/agence/voyage/notification/NotificationIntegrationTest.java`](../backend/src/test/java/com/agence/voyage/notification/NotificationIntegrationTest.java)
- [`backend/src/test/java/com/agence/voyage/payment/PaymentConcurrencyTest.java`](../backend/src/test/java/com/agence/voyage/payment/PaymentConcurrencyTest.java)
- [`backend/src/test/java/com/agence/voyage/profile/AccountSecurityIntegrationTest.java`](../backend/src/test/java/com/agence/voyage/profile/AccountSecurityIntegrationTest.java)
- [`backend/src/test/java/com/agence/voyage/profile/AssetTestConfiguration.java`](../backend/src/test/java/com/agence/voyage/profile/AssetTestConfiguration.java)
- [`backend/src/test/java/com/agence/voyage/profile/FileUploadIntegrationTest.java`](../backend/src/test/java/com/agence/voyage/profile/FileUploadIntegrationTest.java)
- [`backend/src/test/java/com/agence/voyage/profile/PasswordPolicyTest.java`](../backend/src/test/java/com/agence/voyage/profile/PasswordPolicyTest.java)
- [`backend/src/test/java/com/agence/voyage/profile/ProfileDemoSeederTest.java`](../backend/src/test/java/com/agence/voyage/profile/ProfileDemoSeederTest.java)
- [`backend/src/test/java/com/agence/voyage/profile/ProfileIntegrationTest.java`](../backend/src/test/java/com/agence/voyage/profile/ProfileIntegrationTest.java)
- [`backend/src/test/java/com/agence/voyage/service/AuthServiceTest.java`](../backend/src/test/java/com/agence/voyage/service/AuthServiceTest.java)
- [`backend/src/test/java/com/agence/voyage/service/BundleServiceTest.java`](../backend/src/test/java/com/agence/voyage/service/BundleServiceTest.java)
- [`backend/src/test/java/com/agence/voyage/service/CartServiceTest.java`](../backend/src/test/java/com/agence/voyage/service/CartServiceTest.java)
- [`backend/src/test/java/com/agence/voyage/service/OfferSearchTest.java`](../backend/src/test/java/com/agence/voyage/service/OfferSearchTest.java)
- [`backend/src/test/java/com/agence/voyage/service/OfferServiceTest.java`](../backend/src/test/java/com/agence/voyage/service/OfferServiceTest.java)
- [`backend/src/test/java/com/agence/voyage/service/UserServiceTest.java`](../backend/src/test/java/com/agence/voyage/service/UserServiceTest.java)
- [`backend/src/test/resources/images/README.md`](../backend/src/test/resources/images/README.md)
- [`backend/src/test/resources/images/atlas-fixture.webp`](../backend/src/test/resources/images/atlas-fixture.webp)

### Frontend

- [`frontend/accueil.html`](../frontend/accueil.html)
- [`frontend/admin/index.html`](../frontend/admin/index.html)
- [`frontend/admin/js/app.js`](../frontend/admin/js/app.js)
- [`frontend/agent/index.html`](../frontend/agent/index.html)
- [`frontend/agent/js/app.js`](../frontend/agent/js/app.js)
- [`frontend/catalogue.html`](../frontend/catalogue.html)
- [`frontend/client/index.html`](../frontend/client/index.html)
- [`frontend/client/js/app.js`](../frontend/client/js/app.js)
- [`frontend/connexion.html`](../frontend/connexion.html)
- [`frontend/css/account.css`](../frontend/css/account.css)
- [`frontend/js/core/account.js`](../frontend/js/core/account.js)
- [`frontend/js/core/api.js`](../frontend/js/core/api.js)
- [`frontend/js/core/auth.js`](../frontend/js/core/auth.js)
- [`frontend/js/core/uploader.js`](../frontend/js/core/uploader.js)
- [`frontend/js/pages/account-auth.page.js`](../frontend/js/pages/account-auth.page.js)
- [`frontend/js/pages/connexion.page.js`](../frontend/js/pages/connexion.page.js)
- [`frontend/mot-de-passe-oublie.html`](../frontend/mot-de-passe-oublie.html)
- [`frontend/offre.html`](../frontend/offre.html)
- [`frontend/panier.html`](../frontend/panier.html)
- [`frontend/reinitialiser-mot-de-passe.html`](../frontend/reinitialiser-mot-de-passe.html)
- [`frontend/supplier/index.html`](../frontend/supplier/index.html)
- [`frontend/supplier/js/app.js`](../frontend/supplier/js/app.js)
- [`frontend/verification-email.html`](../frontend/verification-email.html)

### Scripts de contrôle

- [`scripts/frontend_smoke_test.mjs`](../scripts/frontend_smoke_test.mjs)
- [`scripts/phase2_api_check.mjs`](../scripts/phase2_api_check.mjs)
- [`scripts/phase3_api_check.mjs`](../scripts/phase3_api_check.mjs)
- [`scripts/phase4_api_check.mjs`](../scripts/phase4_api_check.mjs)
- [`scripts/phase5_api_check.mjs`](../scripts/phase5_api_check.mjs)
- [`scripts/phase5_browser_check.mjs`](../scripts/phase5_browser_check.mjs)
- [`scripts/phase6_api_check.mjs`](../scripts/phase6_api_check.mjs)
- [`scripts/phase6_browser_check.mjs`](../scripts/phase6_browser_check.mjs)

### Documentation et configuration racine

- [`.env.example`](../.env.example)
- [`README.md`](../README.md)
- [`docs/ETAT_COMPLET_PROJET.md`](../docs/ETAT_COMPLET_PROJET.md)
- [`docs/api_endpoints.md`](../docs/api_endpoints.md)
- [`docs/migrations.md`](../docs/migrations.md)
- [`docs/postman/AtlasVoyage.postman_collection.json`](../docs/postman/AtlasVoyage.postman_collection.json)
- [`docs/profils_securite_images.md`](../docs/profils_securite_images.md)
- [`docs/rapport_phase6.md`](../docs/rapport_phase6.md)
- [`docs/regles_metier.md`](../docs/regles_metier.md)
