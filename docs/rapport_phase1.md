# Rapport de livraison — Phase 1 Atlas Voyage

Date : 30 octobre 2026. Périmètre : décisions métier et fondations techniques.
Les réservations, encaissements, expirations planifiées, remboursements et
notifications des phases suivantes n'ont pas été implémentés.

## Résultat

**104 tests exécutés sous Java 21.0.10 : 0 échec, 0 erreur, 0 ignoré.**
Les 72 tests existants sont conservés ; 32 nouveaux tests couvrent les fondations.
Les contrôles navigateur et HTTP sont également réussis.

## 1. Décisions métier

Création de [regles_metier.md](regles_metier.md) :
glossaire, tableau de décisions justifiées, MAD TTC, cycles de réservation et
paiement, trois diagrammes Mermaid, matrice des rôles, capacité des bundles,
restitution atomique, ordre de verrouillage, annulation avec exemples de
1 000 MAD à 60/48/36/24/10 heures et catalogue des codes d'erreur.
Les paramètres configurables sont explicités et les liens ajoutés à la documentation.

## 2. Configuration

- Profils dev/test/prod, configuration commune et variables externalisées.
- AppProperties et BookingProperties typées, liées et validées.
- Aucun @Value dispersé restant dans les sources principales.
- Secret JWT public de développement limité au fichier application-dev.properties.
- Secret de test généré par contexte ; aucune clé de production versionnée.
- ProductionEnvironmentValidator refuse les variables obligatoires absentes
  avant la connexion SQL et n'affiche que leurs noms.
- DB_PASSWORD doit être fourni explicitement ; le contrôle sur le compte SQL
  local sans mot de passe utilise une valeur vide explicitement passée en argument.
  Cela ne crée aucun défaut dans application-prod.properties.
- Paramètres SMTP/paiement réservés, sans intégration active.
- Seeder désactivé en prod/test ; mot de passe démo de développement externalisé
  sans changement des comptes ou des mots de passe déjà présents.
- .gitignore vérifié pour .env, .env.production, application-local.properties,
  uploads et target ; .env.example reste versionné.

## 3. Flyway

- Dépendances flyway-core et flyway-mysql gérées par Spring Boot.
- V1 : schéma consolidé des 14 tables existantes, contraintes, relations et index.
- V2 : statut EXPIRED et statuts paiement définitifs ; conversion COMPLETED → PAID.
- V3 : migration Java ajoutant les index manquants aux schémas adoptés.
- Aucune table métier supplémentaire hors périmètre.
- Dev/prod : ddl-auto=validate.
- Base existante : baseline automatique version 1 en dev, explicite en prod.
- Anciens scripts SQL déplacés, sans suppression de leur contenu, dans
  docs/legacy-migrations.
- Procédure documentée dans [migrations.md](migrations.md).
- H2 test : create-drop et Flyway désactivé ; limites documentées.

V1 n'a pas été modifiée après sa première application. V2 et V3 ont été ajoutées
comme nouvelles migrations.

### Vérifications SQL réelles

Environnement disponible : **MariaDB 10.4.32 / XAMPP**, connecteur JDBC MySQL.

| Cas | Vérification | Résultat |
|---|---|---|
| Base vide atlas_phase1_final_20261030 | V1 SQL, V2 SQL, V3 JDBC, puis Hibernate validate et seeder | OK |
| Base existante travel_agency_db | V1 BASELINE, V2 SQL, V3 JDBC | OK |
| Données de démonstration de la base existante | 8 comptes, 10 offres avant/après | Conservées |
| Ancien paiement de test COMPLETED dans atlas_phase1_empty_20261030 | Mise à niveau de V1 vers V2/V3 | PAID après migration |
| Idempotence seeder | Plusieurs redémarrages | Toujours 8 comptes et 10 offres |

Les deux bases isolées de vérification sont conservées pour inspection.
atlas_phase1_empty_20261030 contient une réservation et un paiement artificiels
utilisés uniquement pour le contrôle de migration. La base principale n'a reçu
aucune réservation de test.

## 4. Erreurs uniformes

ApiError expose exactement timestamp, status, code, message, details, path,
correlationId. details contient des objets field/message ou null.
Les exceptions métier portent ErrorCode et HttpStatus.
Les statuts HTTP historiques des règles déjà testées sont conservés.
Les erreurs de sécurité, validation, JSON, types, paramètres, contraintes SQL,
routes absentes, méthodes, formats et erreurs internes sont traitées.
Les refus CORS suivent aussi ce contrat.
Les 500 renvoient un message générique ; le serveur journalise l'erreur avec
la corrélation. Le Frontend garde son traitement 401 et lit message/details.

## 5. Pagination

PageResponse contient content, page, size, totalElements, totalPages, first,
last, sort. Taille par défaut 20 et maximum 100 ; tris en liste blanche.

Compatibilité choisie : tableau brut avec ordre historique si aucun paramètre
page/size/sort n'est fourni. Avec page ou size : enveloppe standard.
Un sort seul trie le tableau brut.
La recherche conserve typeCounts, maxPrice et les alias recent/price_asc/price_desc.
Les pages hors limites sont vides et les calculs évitent le débordement d'entiers.

Le contrat est appliqué aux listes utilisateurs, villes, offres, bundles,
promotions et à la recherche publique.

## 6. Corrélation et logs

- X-Correlation-Id : réutilisé si valide, UUID sinon.
- Validation : alphanumériques/tirets, 1–64 caractères.
- Réponse HTTP et ApiError portent le même identifiant.
- userId ajouté au MDC après authentification.
- Nettoyage garanti en finally.
- Journal d'accès : méthode, chemin, statut et durée, sans corps/query/token.
- Logs lisibles en dev, WARN en test, JSON INFO en prod.
- Utilisation de SLF4J dans les services et handlers.
- Aucun System.out ou printStackTrace restant dans les sources principales.

## 7. OpenAPI et contrats

- springdoc 2.6.0, compatible avec Spring Boot 3.3.x.
- Titre Atlas Voyage API, version, contact, serveur relatif et Bearer JWT.
- Tous les contrôleurs annotés avec tags, opérations, rôles et erreurs ApiError.
- Swagger dev : HTTP 200.
- OpenAPI réel : **40 opérations**, chemins et verbes exposés.
- Prod : documentation désactivée et routes refusées ; 401 anonyme, 403 authentifié.
- docs/api_endpoints.md réaligné sur les contrats actuels.
- Collection Postman complétée par un dossier Fondations Phase 1 ;
  le JSON a été validé. La collection historique entière n'a pas été exécutée
  par Newman dans cette livraison.

## 8. Préparation du domaine

- BookingStatus : PENDING, CONFIRMED, COMPLETED, CANCELLED, EXPIRED.
- PaymentStatus : PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED.
- CancellationPolicy utilise BigDecimal et Clock injectable, sans effet de bord.
- Seuils testés : 60 h, 48 h pile, 36 h, 24 h pile, 10 h et service commencé.
- Contrôles supplémentaires : seconde avant les seuils, montant nul à l'arrivée,
  arrondi monétaire et paramètres personnalisés.
- BookingStateMachine et PaymentStateMachine testent toutes les paires d'états.
- Toute transition interdite produit INVALID_STATE_TRANSITION.

## Commandes et résultats

| Commande / contrôle | Résultat |
|---|---|
| Backend : mvnw.cmd test avant modification | 72 tests verts |
| Tests après configuration et fondations intermédiaires | Verts après corrections |
| JAVA_HOME JDK 21.0.10 ; mvnw.cmd clean test | **104 tests verts** |
| mvnw.cmd spring-boot:run en dev | Santé HTTP 200, schéma validé |
| mvnw.cmd spring-boot:run en prod sans variables | Échec attendu, code sortie 1, noms des variables manquantes |
| mvnw.cmd spring-boot:run en prod avec valeurs fournies | Santé HTTP 200 |
| Logs prod | JSON INFO avec correlationId et userId |
| node --check frontend/js/app.js | OK |
| node --check frontend/supplier/js/app.js | OK |
| node --check frontend/admin/js/app.js | OK |
| node --check frontend/js/core/api.js | OK |
| node scripts/frontend_smoke_test.mjs | 8 pages, 10 offres, 5 catégories : OK |
| scripts/phase1_browser_check.mjs | Connexions et pages des 8 comptes + 5 catégories : OK |
| JSON de la collection Postman | Valide |
| git diff --check | OK |

Pour reproduire les tests Java sur Windows :

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.10"
cd backend
.\mvnw.cmd clean test
```

Le contrôle navigateur utilise Chrome local et playwright-core installé dans
un dossier temporaire, sans dépendance npm ajoutée au projet :

```powershell
npm install --prefix "$env:TEMP/atlas-phase1-browser-tools" --no-package-lock playwright-core
$env:DEMO_PASSWORD = "password123"
node scripts/phase1_browser_check.mjs
```

Le script relève les erreurs JavaScript et réponses API en échec ; il ne teste
pas exhaustivement les fonctionnalités futures des maquettes.

## Vérifications navigateur détaillées

- Admin : connexion, utilisateurs, offres, codes promo.
- Fournisseur hôtel : offres, disponibilités, création.
- Fournisseurs vol/voiture/taxi/excursion : offres et création.
- Agent : connexion et bundles.
- Client : connexion et panier.
- Catalogue public : les cinq recherches spécialisées.
- Aucun échec JavaScript ou API relevé dans ces parcours.

## Incidents rencontrés et résolution

1. Ancienne application-test.properties persistante dans target/test-classes :
   résolu par clean et déplacement de la configuration test.
2. JAR de contrôle verrouillé par une instance temporaire pendant clean :
   instance arrêtée, puis clean test réussi.
3. Variable DEBUG héritée de l'environnement : niveaux explicites prod/test et
   vérifications finales avec DEBUG=false ; les logs prod courants sont INFO.
4. La création d'un compte SQL temporaire a signalé une table système mysql.db
   corrompue dans XAMPP. Aucun repair système n'a été exécuté et le compte de test
   a été supprimé. Le schéma applicatif fonctionne et passe validate.
5. Le contrôle automatique d'exécution a rejeté le lancement d'une instance
   MariaDB isolée (« blocked by policy », sans autre motif fourni).
   Une alternative a permis le contrôle prod sur la base locale existante,
   avec DB_PASSWORD explicitement fourni et JWT éphémère.

## Limites et suite

- La pagination est actuellement réalisée après lecture/filtrage en mémoire.
  Passer à Pageable SQL pour de gros volumes, en conservant le contrat.
- H2 ne certifie pas le DDL MySQL ; automatiser les contrôles réels avec
  Testcontainers MySQL en CI.
- La vérification SQL de cette livraison porte sur MariaDB 10.4.32.
  Un passage CI MySQL 8 reste recommandé.
- La maintenance de la table système XAMPP signalée relève de l'environnement
  local et n'a pas été entreprise.
- Aucun workflow de réservation/paiement, restitution réelle de capacité,
  job d'expiration, webhook, notification ou e-mail n'a été ajouté.
- Les nouveaux paramètres sont prêts ; Phase 2 devra raccorder les politiques,
  transactions, autorisations, idempotence et journal de consommations.

## Commits

Le travail préexistant a été conservé dans 1c25f5b avant les commits Phase 1 :
4a6f38a (règles), 6e6d0f8 (profils), 2462be8 (Flyway), 47338a9
(erreurs/pagination/logs), 89470e6 (OpenAPI/listes), e4777a7 (domaine),
ec5e5a9 (validation configuration et contrats). Le dernier commit de documentation
contient ce rapport et les vérifications navigateur.

## Inventaire complet des fichiers

A : ajouté ; M : modifié ; D : déplacé/supprimé à l'ancien emplacement ;
R100 : déplacement sans modification du contenu.

```text
A	.env.example
M	.gitignore
M	README.md
M	backend/pom.xml
M	backend/src/main/java/com/agence/voyage/TravelAgencyApplication.java
A	backend/src/main/java/com/agence/voyage/config/AppProperties.java
A	backend/src/main/java/com/agence/voyage/config/BookingProperties.java
A	backend/src/main/java/com/agence/voyage/config/CorrelationIdFilter.java
M	backend/src/main/java/com/agence/voyage/config/DataSeeder.java
A	backend/src/main/java/com/agence/voyage/config/DomainConfig.java
A	backend/src/main/java/com/agence/voyage/config/OpenApiConfig.java
A	backend/src/main/java/com/agence/voyage/config/ProductionEnvironmentValidator.java
M	backend/src/main/java/com/agence/voyage/config/SecurityConfig.java
M	backend/src/main/java/com/agence/voyage/controller/AuthController.java
M	backend/src/main/java/com/agence/voyage/controller/BundleController.java
M	backend/src/main/java/com/agence/voyage/controller/CartController.java
M	backend/src/main/java/com/agence/voyage/controller/CityController.java
M	backend/src/main/java/com/agence/voyage/controller/OfferController.java
M	backend/src/main/java/com/agence/voyage/controller/PromoCodeController.java
M	backend/src/main/java/com/agence/voyage/controller/StatusController.java
M	backend/src/main/java/com/agence/voyage/controller/UserController.java
A	backend/src/main/java/com/agence/voyage/domain/BookingStateMachine.java
A	backend/src/main/java/com/agence/voyage/domain/CancellationPolicy.java
A	backend/src/main/java/com/agence/voyage/domain/PaymentStateMachine.java
A	backend/src/main/java/com/agence/voyage/dto/ApiError.java
M	backend/src/main/java/com/agence/voyage/dto/OfferSearchResponse.java
A	backend/src/main/java/com/agence/voyage/dto/PageResponse.java
M	backend/src/main/java/com/agence/voyage/entity/BookingStatus.java
M	backend/src/main/java/com/agence/voyage/entity/PaymentStatus.java
M	backend/src/main/java/com/agence/voyage/exception/BusinessException.java
A	backend/src/main/java/com/agence/voyage/exception/ErrorCode.java
M	backend/src/main/java/com/agence/voyage/exception/ForbiddenException.java
M	backend/src/main/java/com/agence/voyage/exception/GlobalExceptionHandler.java
M	backend/src/main/java/com/agence/voyage/exception/ResourceNotFoundException.java
M	backend/src/main/java/com/agence/voyage/exception/UnauthorizedException.java
A	backend/src/main/java/com/agence/voyage/security/ApiSecurityErrorHandler.java
M	backend/src/main/java/com/agence/voyage/security/JwtAuthenticationFilter.java
M	backend/src/main/java/com/agence/voyage/security/JwtService.java
M	backend/src/main/java/com/agence/voyage/service/AuthService.java
M	backend/src/main/java/com/agence/voyage/service/BundleService.java
M	backend/src/main/java/com/agence/voyage/service/CartService.java
M	backend/src/main/java/com/agence/voyage/service/CityService.java
M	backend/src/main/java/com/agence/voyage/service/OfferService.java
A	backend/src/main/java/com/agence/voyage/service/PaginationSupport.java
M	backend/src/main/java/com/agence/voyage/service/PromoCodeService.java
M	backend/src/main/java/com/agence/voyage/service/UserService.java
A	backend/src/main/java/db/migration/V3__adopt_legacy_indexes.java
A	backend/src/main/resources/META-INF/spring.factories
A	backend/src/main/resources/application-dev.properties
A	backend/src/main/resources/application-prod.properties
A	backend/src/main/resources/application-test.properties
M	backend/src/main/resources/application.properties
A	backend/src/main/resources/db/migration/V1__baseline_schema.sql
A	backend/src/main/resources/db/migration/V2__booking_payment_foundation.sql
A	backend/src/main/resources/logback-spring.xml
A	backend/src/test/java/com/agence/voyage/domain/CancellationPolicyTest.java
A	backend/src/test/java/com/agence/voyage/domain/StateMachineTest.java
A	backend/src/test/java/com/agence/voyage/foundation/ConfigurationPropertiesTest.java
A	backend/src/test/java/com/agence/voyage/foundation/ErrorContractTest.java
A	backend/src/test/java/com/agence/voyage/foundation/PaginationContractTest.java
A	backend/src/test/java/com/agence/voyage/foundation/PaginationTest.java
A	backend/src/test/java/com/agence/voyage/foundation/ProductionEnvironmentValidatorTest.java
M	backend/src/test/java/com/agence/voyage/persistence/SchemaCreationTest.java
M	backend/src/test/java/com/agence/voyage/service/AuthServiceTest.java
M	backend/src/test/java/com/agence/voyage/service/BundleServiceTest.java
M	backend/src/test/java/com/agence/voyage/service/CartServiceTest.java
M	backend/src/test/java/com/agence/voyage/service/CityServiceTest.java
M	backend/src/test/java/com/agence/voyage/service/OfferSearchTest.java
M	backend/src/test/java/com/agence/voyage/service/OfferServiceTest.java
M	backend/src/test/java/com/agence/voyage/service/PromoCodeServiceTest.java
M	backend/src/test/java/com/agence/voyage/service/UserServiceTest.java
D	backend/src/test/resources/application-test.properties
M	docs/ETAT_COMPLET_PROJET.md
M	docs/api_endpoints.md
M	docs/architecture.md
A	docs/legacy-migrations/README.md
R100	scripts/migration_car_multiple_dropoffs.sql	docs/legacy-migrations/migration_car_multiple_dropoffs.sql
R100	scripts/migration_car_search_criteria.sql	docs/legacy-migrations/migration_car_search_criteria.sql
R100	scripts/migration_cart_travel_criteria.sql	docs/legacy-migrations/migration_cart_travel_criteria.sql
R100	scripts/migration_flight_search_criteria.sql	docs/legacy-migrations/migration_flight_search_criteria.sql
R100	scripts/migration_offer_availabilities.sql	docs/legacy-migrations/migration_offer_availabilities.sql
R100	scripts/migration_offer_moderation.sql	docs/legacy-migrations/migration_offer_moderation.sql
R100	scripts/migration_promo_code_constraints.sql	docs/legacy-migrations/migration_promo_code_constraints.sql
R100	scripts/migration_remove_destination.sql	docs/legacy-migrations/migration_remove_destination.sql
R100	scripts/migration_supplier_categories.sql	docs/legacy-migrations/migration_supplier_categories.sql
A	docs/migrations.md
M	docs/postman/AtlasVoyage.postman_collection.json
A	docs/regles_metier.md
M	frontend/js/app.js
M	frontend/js/core/api.js
A	docs/rapport_phase1.md
A	scripts/phase1_browser_check.mjs
```
