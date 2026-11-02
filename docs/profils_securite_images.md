# Phase 6 — Profils, sécurité des comptes et images

État livré le 31 octobre 2026. Java 21 / Spring Boot 3.3.4, JavaScript vanilla.
Les contrats complets sont dans [api_endpoints.md](api_endpoints.md) et la collection
Postman. Le rapport de vérification est [rapport_phase6.md](rapport_phase6.md).

## Profils personnels et fournisseurs

Les quatre espaces utilisent `frontend/js/core/account.js`, `uploader.js` et
`frontend/css/account.css`. Les onglets Profil et Sécurité chargent réellement
l'utilisateur connecté ; chargement, erreur avec nouvel essai et succès sont gérés.
Le nom et l'avatar de l'en-tête suivent les modifications et le rechargement.
Sans avatar utilisable, les initiales servent de repli.

`PUT /api/auth/profile` exige un nom de 2 à 100 caractères après trim, sans caractère
de contrôle. Téléphone facultatif normalisé E.164 (8 à 15 chiffres, indicatif non
nul) ; pays facultatif ISO alpha-2, renvoyé en majuscules. Chaîne vide : suppression
du téléphone, pays ou avatar. L'e-mail reste immuable : même e-mail accepté,
autre valeur refusée par `EMAIL_NOT_EDITABLE`. Les champs inconnus, notamment
`role`, `supplierCategory` et `archived`, sont rejetés : aucun mass-assignment.

`GET /api/auth/profile-options` fournit les pays traduits et les limites d'images
effectives, afin que les formulaires ne maintiennent pas une seconde liste.
Les DTO utilisateur d'authentification et d'administration exposent les champs
du profil, `emailVerified`, les dates de création/mise à jour/changement de mot de
passe. Ils n'exposent ni mot de passe, ni `tokenVersion`, ni hash de jeton.

`SupplierProfile` est une table distincte liée de façon unique à `User`. Un GET
personnel crée à la demande un profil vide. Les écritures concernent exclusivement
le fournisseur connecté ; ADMIN dispose d'une lecture par identifiant, y compris
pour un fournisseur archivé. Société, téléphone, ville, adresse, description
(2 000 caractères), logo, forme juridique, RC, ICE, IF et notes légales sont persistés.
L'ICE facultatif comporte exactement 15 chiffres. Le formulaire exige une suggestion
Open-Meteo sélectionnée et en conserve latitude/longitude. Le serveur réutilise la
ville identifiée ou crée une ville avec nom et coordonnées validés ; il ne fait
pas confiance à un simple libellé sans coordonnées.

Le dépôt contient **cinq fournisseurs spécialisés**, pas six. Le seeder crée leurs
cinq profils cohérents (villes marocaines, coordonnées et identifiants de démo).
Les comptes existants gardent leur mot de passe. `tokenVersion=0` vaut seulement
à la création : le redémarrage ne réactive jamais un ancien JWT révoqué.
Les valeurs de démonstration téléphone/pays ne rétablissent pas un champ que
l'utilisateur a volontairement supprimé après la mise à niveau.

## Mot de passe et sessions

`PasswordPolicy` est la source serveur unique : au moins 10 caractères Unicode,
une minuscule, une majuscule, un chiffre, un caractère spécial, au plus **72 octets
UTF-8**, aucun caractère de contrôle, ni e-mail/partie locale de l'e-mail, ni mot
de passe trivial. Inscription, création/modification administrative, changement
et réinitialisation appliquent la même politique. Les violations sont détaillées
dans `ApiError.details`. Exemple pour un compte dont l'e-mail ne contient pas
« Atlas » : `Voyage!Securise42` ; choisir une valeur personnelle en utilisation réelle.

La connexion conserve BCrypt sans règle de complexité : les comptes de démo
`password123` restent utilisables. Changement : ancien mot de passe obligatoire,
confirmation identique, nouveau différent ; incrément atomique de `tokenVersion`,
date de modification et nouveau JWT pour la session courante. Les autres JWT
deviennent invalides. Les JWT historiques sans claim `tv` sont également refusés
avec 401 : une reconnexion suffit. Le Frontend remplace le JWT dans le même type
de stockage (session ou persistant) et évite qu'une requête ancienne en 401 efface
le nouveau jeton.

## Oubli, réinitialisation et vérification d'e-mail

Un jeton brut contient 32 octets aléatoires cryptographiques encodés Base64URL.
Seul son SHA-256 est en base, dans `password_reset_tokens` ou
`email_verification_tokens`. Réinitialisation : 30 minutes ; vérification : 24 heures.
Ces jetons sont à usage unique, vérifiés sous verrou transactionnel ; une nouvelle
demande invalide les précédents. Une réinitialisation réussie incrémente aussi la
version des JWT. Une tâche quotidienne à 03:15 UTC purge les jetons utilisés/expirés.

L'oubli répond par le même HTTP 200 et le même message pour un compte connu,
inconnu ou archivé. Aucun jeton brut ne revient en JSON. Le renvoi de vérification
envoie également le lien exclusivement par e-mail. Le limiteur en mémoire utilise
une fenêtre glissante : 5 demandes / 15 minutes, par IP et identité, avec 429 et
`Retry-After`. L'interface `AuthRequestLimiter` permet un remplacement Redis ;
la limite actuelle est locale à chaque instance. Derrière un proxy, configurer
explicitement la chaîne de confiance avant d'exploiter les en-têtes d'IP.

Inscription publique : CLIENT imposé, e-mail non vérifié, JWT émis et e-mail de
vérification. Par défaut la connexion reste possible, avec un bandeau de renvoi
dans le site public et les quatre espaces. `REQUIRE_EMAIL_VERIFICATION=true`
refuse la **connexion** non vérifiée avec `EMAIL_NOT_VERIFIED`. Ce paramètre ne
transforme pas les endpoints existants en contrôle global d'autorisation par e-mail.
Les utilisateurs créés par ADMIN et les comptes de démo sont vérifiés.

Les liens utilisent `APP_BASE_URL`, qui inclut déjà `/frontend` :
`.../reinitialiser-mot-de-passe.html?token=...` et
`.../verification-email.html?token=...`. Les pages retirent immédiatement le jeton
de l'URL avec `history.replaceState`, déclarent `no-referrer` et n'utilisent pas
de CDN. Après reset, l'utilisateur se reconnecte ; aucune confirmation simulée.

### E-mails

`MailService` sépare SMTP et transport de développement. `MAIL_ENABLED=true` :
JavaMailSender, HTML bleu Atlas Voyage + texte brut, nom utilisateur échappé.
L'envoi se fait après commit sur l'exécuteur asynchrone ; une panne SMTP ne fait
échouer ni inscription ni demande de reset. Les notifications Phase 4 restent
actives : une inscription peut envoyer bienvenue **et** vérification.

`MAIL_ENABLED=false`, hors profil prod : `LoggingMailService` écrit le contenu
complet et le lien dans les logs de développement. Ces logs donnent accès aux
comptes de test : les conserver localement. En prod ce transport n'existe pas ;
sans SMTP, le transport désactivé ne journalise aucun lien. Configurer SMTP avant
de proposer oubli/vérification aux utilisateurs en production. Aucun véritable
destinataire externe n'est nécessaire pour les tests (Mailpit local possible).

## Stockage et validation des images

`FileStorageService` découple stockage et logique métier. Seule l'implémentation
locale est livrée. `STORAGE_TYPE=s3` est réservé : échec explicite tant qu'aucune
implémentation S3/Cloudinary n'est installée. `UPLOAD_ROOT=./uploads` est résolu
depuis le répertoire de lancement du backend, hors du Frontend et exclu de Git.
En déploiement, utiliser un volume persistant sauvegardé avec la base.

`POST /api/files/images`, multipart avec **un seul** champ `file` et `purpose` :

| Purpose | Droits | Rattachement |
|---|---|---|
| AVATAR | Tous les comptes authentifiés | Profil personnel |
| SUPPLIER_LOGO | SUPPLIER | Profil société |
| OFFER_IMAGE | SUPPLIER | Offre du même fournisseur |

Le serveur vérifie avant décodage la taille (5 MiB), signature et conteneur réel,
dimensions minimales 200×200, maximales 6000×6000 et au plus 20 millions de pixels.
Deux décodages simultanés au maximum ; quota de 200 TEMP par utilisateur.
Extension et Content-Type envoyés ne font pas autorité. JPEG, PNG et WebP sont
décodés réellement ; GIF, SVG, HTML, PDF, animations, données ajoutées après la
fin du conteneur et signatures de charges polyglottes reconnues sont rejetés.
Cette validation stricte peut refuser certaines images atypiques : réexporter
alors une image standard. Un filtre ne constitue pas une preuve universelle
contre tous les formats polyglottes ; le réencodage élimine aussi la charge d'origine.

Orientation EXIF corrigée, puis pixels seuls réencodés, sans EXIF/GPS. Original
redimensionné à 1920 px et miniature à 480 px sur le grand côté, sans agrandissement.
Le lecteur WebP **TwelveMonkeys 3.13.1** fonctionne en Java pur sous Java 21.
La sortie utilise le repli autorisé JPEG qualité 85 ou PNG si transparence,
sans encodeur WebP natif. Les tests JPEG/PNG sont générés avec ImageIO ; le WebP
est une fixture originale locale (ImageIO de Java n'a pas d'encodeur WebP natif).
Références : [TwelveMonkeys](https://github.com/haraldk/TwelveMonkeys),
[metadata-extractor](https://github.com/drewnoakes/metadata-extractor).

Les noms d'origine ne sont jamais réutilisés : UUID canonique + `.jpg`/`.png`.
Résolution normalisée sous la racine et refus des liens symboliques. Les lectures
publiques requièrent une ligne `FileAsset`, y compris pour une miniature ; un chemin
arbitraire n'est pas servi. En-têtes : Content-Type réel, `nosniff`, inline et cache
public immutable d'un an. Les avatars/logos sont donc des **images publiques**.

## Rattachement, compatibilité et nettoyage

Un upload crée TEMP. Seules ses URLs générées (base `API_BASE_URL`, sans query ni
fragment), son propriétaire, son purpose et sa destination de rattachement sont
acceptés. Une image ne peut être partagée entre ressources ; après enregistrement
elle devient ATTACHED avec clé de ressource. Avatar/logo externes refusés.
Une offre peut conserver ses anciennes URLs exactes mais pas en introduire de
nouvelles arbitraires ; cinq images maximum, ordre conservé et première principale.
Le catalogue et les anciennes images seedées restent lisibles.

Remplacement/détachement : TEMP avec `orphanedAt`, sans modifier `createdAt`.
Le délai de 24 h repart au détachement. La suppression directe de **tout** ATTACHED
est refusée (409 `FILE_ATTACHED`), y compris avatar/logo/offre inactive, afin de
préserver les références ; enlever d'abord l'image de la ressource, puis DELETE.
Suppression propriétaire ou ADMIN seulement. Le disque est supprimé après commit ;
un rollback d'upload nettoie ses fichiers. Après échec disque, la réconciliation
peut reprendre les fichiers sans ligne.

Job horaire : jusqu'à 200 TEMP expirés par passage, puis parcours des fichiers
UUID gérés sans ligne de base, vieux d'au moins 24 h (protection des écritures en
cours). Ignore noms étrangers et liens symboliques. `FILE_CLEANUP_DRY_RUN=true`
compte/journalise les suppressions prévues sans les effectuer. Nettoyage des jetons
et images désactivable par `ACCOUNT_JOBS_ENABLED=false` ; indépendant des jobs
Booking/Notifications existants.

L'uploader vanilla propose glisser-déposer, aperçu local immédiatement libéré,
progression XHR, annulation, réessai, suppression et réordonnancement souris ou
boutons accessibles au clavier. Le wizard interdit de continuer/sauvegarder
pendant un transfert. Les images retirées d'un brouillon deviennent nettoyables.

## Paramètres

| Propriété | Défaut / variable |
|---|---|
| app.frontend-base-url | http://127.0.0.1:5500/frontend / APP_BASE_URL |
| app.mail.enabled, from, from-name | false, noreply@atlasvoyage.test, Atlas Voyage / MAIL_ENABLED, MAIL_FROM, MAIL_FROM_NAME |
| app.auth.require-email-verification | false / REQUIRE_EMAIL_VERIFICATION |
| app.auth.reset-token-ttl-minutes | 30 |
| app.auth.verify-token-ttl-hours | 24 |
| app.auth.requests-per-window, rate-window-minutes | 5, 15 |
| app.storage.type, local.root | local, ./uploads / STORAGE_TYPE, UPLOAD_ROOT |
| app.storage.public-base-url | http://localhost:8080 / API_BASE_URL |
| app.upload.max-size-bytes | 5242880 / UPLOAD_MAX_SIZE_BYTES |
| app.upload.max-temp-files, max-pixels, max-concurrent | 200, 20000000, 2 |
| spring.servlet.multipart.max-file-size | app.upload.max-size-bytes en octets |
| spring.servlet.multipart.max-request-size | 6MB / UPLOAD_MAX_REQUEST_SIZE |
| app.jobs.enabled | true / ACCOUNT_JOBS_ENABLED |
| app.jobs.account-token-purge-cron | 0 15 3 * * *, UTC |
| app.jobs.file-cleanup-delay-ms | 3600000 |
| app.jobs.file-cleanup-dry-run | false / FILE_CLEANUP_DRY_RUN |

Augmenter conjointement limites image et requête multipart si nécessaire (la
requête ajoute un léger surcoût). Les autres paramètres Spring peuvent être
surchargés par leurs noms d'environnement normalisés. Aucun `.env` n'est chargé
automatiquement. CORS de développement et contrats antérieurs sont conservés.
`Retry-After` est exposé à CORS pour afficher le délai d'attente dans le navigateur.

## Schéma et mise à niveau

Cette phase n'ajoute **aucune migration Flyway**. V1–V9 restent inchangées pour
l'historique des phases précédentes. Dev revient à `ddl-auto=update` suivant la
mission ; prod conserve `validate` et nécessite les scripts manuels avant déploiement.
Voir [migrations.md](migrations.md#phase-6--profils-comptes-et-images-scripts-manuels).
Exécuter les quatre scripts **avant le premier démarrage Phase 6 sur une base
existante** pour marquer les comptes historiques comme vérifiés. Les répétitions
préservent les nouveaux comptes non vérifiés et les versions de jetons révoqués.
