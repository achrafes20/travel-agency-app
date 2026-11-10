# Rapport de livraison — Phase 3 Paiements

> **Archive — document historique.** Ce document décrit l'état et le travail réalisés à une date donnée. Il est conservé tel quel (hors liens corrigés lors de son déplacement le 9 novembre 2026) et **n'est plus mis à jour**. Pour l'état courant : [README](../../README.md), [règles métier](../regles_metier.md), [architecture](../architecture.md), [CHANGELOG](../../CHANGELOG.md).

Livraison du 31 octobre 2026. Référence Git avant Phase 3 : `6b5b65f`.
La Phase 2 était déjà complète : réutilisation de Booking, allocations, prix figés,
voucher et contrôles de propriété. Aucun second catalogue, aucune consommation de stock.

## Résultat livré

- 11 nouvelles opérations Payment, **59 endpoints OpenAPI** au total.
- Carte sandbox, refus/fonds insuffisants/erreur, nouvel essai et reprise réseau.
- Paiement à l'arrivée confirmé, encaissement AGENT/ADMIN exact et tracé.
- Remboursements ADMIN partiels/cumulés/totaux avec réservation concurrente du solde.
- Idempotence durable en base (24 h), clé utilisateur unique, réponse figée.
- Webhook public HMAC horodaté, dédupliqué, sans régression d'état.
- PaymentEvent/AuditLog append-only, y compris triggers SQL.
- Expiration des réservations impayées et restitution de capacité une seule fois.
- Écrans client, agent, admin et statut fournisseur branchés sur les données réelles.
- Quatre scénarios Sarah idempotents, documentation et collection Postman actualisées.

**Le prestataire est SANDBOX. Aucun débit bancaire réel n'est effectué.**

## Architecture et décisions

### Transactions et concurrence

PaymentService n'est pas transactionnel. PaymentTransactions prépare sous verrou
pessimiste Booking puis Payment, libère la transaction, puis le gateway est appelé.
Une transaction finale applique le résultat, le journal et l'état Booking ensemble.
Payment porte @Version ; active_booking_id unique nullable empêche plusieurs
tentatives actives/capturées. PAID et PARTIALLY_REFUNDED comptent comme capturés.
Les réservations de remboursement empêchent un dépassement concurrent du solde.

Le rejeu retourne le snapshot de réponse, pas l'état courant modifié après coup.
GET /api/payments/{id} restitue l'état actuel. Une correction de refresh explicite
a été ajoutée après détection d'une entité IdempotencyRecord périmée dans le contexte
Open-EntityManager-in-View lors de requêtes HTTP concurrentes. Un test MockMvc dédié
et le contrôle MariaDB couvrent cette régression.

Le sandbox déduplique également ses appels gateway en mémoire ; les transactions,
contraintes et clés en base restent les protections applicatives durables.
Une capture tardive après annulation est enregistrée puis compensée. Si la compensation
échoue, le paiement reste traçable avec REFUND_PENDING pour vérification ADMIN.

### Compatibilité métier

- Un ONLINE impayé ne peut plus être confirmé manuellement : BOOKING_NOT_PAYABLE.
- Une annulation ne fabrique plus un remboursement : PAID reste PAID jusqu'au
  résultat du remboursement ADMIN via gateway.
- Les 72 tests d'origine sont inchangés. Quatre tests Phase 2 sont adaptés :
  confirmation manuelle, annulation payée, voucher après capture et démonstration.
  Aucun test n'a été supprimé ou désactivé.
- Les 100 % de promo restent acceptés : paiement COMPLIMENTARY de 0 MAD,
  PAID sans appel gateway. Exception explicite au montant positif des paiements ordinaires.
- Booking garde ONLINE/PAY_ON_ARRIVAL ; Payment utilise CARD/CASH_ON_ARRIVAL.
- Prix uniquement issus du total Booking figé ; BigDecimal, MAD, deux décimales.
- Le fournisseur lit seulement ses Booking filtrés et leur statut ; aucun accès
  direct Payment, aucune donnée carte dans sa vue.
- Références de démonstration conformes BK-AAAA-NNNNNN, marqueur de notes demo:*
  et badge Démonstration, plutôt qu'une seconde convention BK-DEMO.

### Migration et reprise

Flyway et ddl-auto=validate sont conservés en dev/prod ; H2 create-drop en test.
V7 Java complète le schéma et reprend les historiques sans supprimer de données.
Les anciens ONLINE confirmés manuellement sont repris PAID, avec événement MIGRATED,
comme décision d'import historique ; aucune preuve de débit bancaire n'est inventée.

Base vide isolée atlas_phase3_empty_20261030 : migration V1→V7 réussie.
Base existante travel_agency_db : sauvegarde single-transaction dans
backend/target/backup_main_before_phase3.sql (ignorée par Git), migration V6→V7,
validation Hibernate puis démarrage réussi. Après ajout des exemples : 8 utilisateurs,
10 offres, 8 réservations et 8 paiements ; mêmes nombres après redémarrage.
Les quatre exemples Phase 2 présents ont été préservés.

V7 a été appliquée et n'a plus été modifiée ensuite. Toute évolution suivante
doit être une V8. Voir [migrations.md](../migrations.md).

### Sécurité

Aucun PAN/CVC ni jeton de carte n'est persisté. Payment ne contient que marque et
quatre chiffres ; idempotence = empreinte, pas corps sensible.
PaymentRequestAdvice rejette PAN Luhn et clés cvv/cvc avant DTO. Les champs carte
du navigateur sont effacés avant fetch ; sessionStorage conserve seulement clé,
bookingId, méthode, jeton public sandbox et carte masquée.
Les réponses Payment sont no-store, y compris les erreurs.
Le corps, les signatures et Authorization ne sont pas journalisés.
Comparaison HMAC en temps constant ; corps brut jamais sauvegardé par WebhookEvent.
La limitation de débit est par utilisateur et en mémoire, configurable.

Le profil prod refuse sandbox, les clés dev et les variables sensibles absentes.
Le validateur ne révèle que les noms des variables ou une erreur générique.

## Vérifications exécutées

| Commande / contrôle | Résultat réel |
|---|---|
| JDK21 : cd backend ; .\\mvnw.cmd -q clean test | **190 tests, 0 échec, 0 erreur, 0 ignoré**, sortie0 |
| JaCoCo report + check pendant test | Toutes les classes de service nouvelles au-dessus de 80 %, seuil automatisé81 % |
| node --check sur les JS/MJS modifiés | **11 fichiers**, tous valides |
| node scripts/frontend_smoke_test.mjs | **17 pages, 10 offres, 5 catégories**, OK |
| scripts/phase3_api_check.mjs sur8084/base isolée | 10 requêtes même clé → un paiement ; 10 clés différentes → un succès et9conflits ; remboursements, cash, webhook, droits : OK |
| scripts/phase3_browser_check.mjs, Chrome headless | **7 parcours**, OK, aucune erreur JS remontée |
| scripts/phase1_browser_check.mjs sur8080 | **8 comptes**, formulaires/listes existants et5catégories : OK |
| scripts/phase2_api_check.mjs sur8084 | 1 succès/7 CAPACITY_EXCEEDED ; 8 références annuelles séquentielles ; restitution1/1 et8/8 : OK |
| scripts/phase2_browser_check.mjs sur8084 | Catalogue, checkout cash, voucher, annulation et listes des7comptes professionnels : OK |
| Swagger /v3/api-docs sur8080 | **59 opérations**, dont11 Payment |
| V7 sur base vide et base existante | Démarrages et validation schéma : OK |
| Redémarrage / seeder | Aucun doublon, compteurs8/10/8/8 inchangés |
| UPDATE audit_logs et DELETE payment_events, base isolée | Refus SQLSTATE45000 Historique append-only ;4triggers présents |
| Profil prod sans variables | Échec attendu avant connexionSQL, noms manquants seulement |
| Profil prod avec sandbox | Échec attendu : fournisseur sandbox interdit |
| Profil prod avec clé dev et fournisseur réel demandé | Échec attendu : clé dédiée exigée |
| Postman JSON, corps et scripts | **13 requêtes d'exemple Payment** pour11routes ; JSON valide ;117scripts et62corps valides |
| git diff --check | OK |
| Recherche des PAN sandbox complets et de la clé webhook dev dans les journaux Phase3 | Aucune occurrence |

Les commandes Maven ont été lancées avec JAVA_HOME pointant vers
C:\\Program Files\\Java\\jdk-21.0.10. La JVM par défaut du poste est différente.
Les erreurs attendues de production et de triggers sont des contrôles négatifs,
pas des échecs de livraison.

Le script navigateur Phase 2 a été adapté au passage par la page Paiement et aux
listes fournisseur vides légitimes ; le contrôle Phase 3 crée sa propre disponibilité
pour rester répétable sans épuiser les exemples existants.

### Couverture de lignes des nouveaux services

| Classe | Couverture |
|---|---|
| PaymentIdempotency | 90,32 % |
| PaymentTransactions | 94,39 % |
| PaymentWebhookService | 93,22 % |
| PaymentService | 97,22 % |
| PaymentQueries | 100 % |
| PaymentLedger | 100 % |
| PaymentDataGuard | 100 % |
| PaymentRateLimiter | 100 % |
| PaymentExpirationJob | 100 % |
| SandboxPaymentGateway | 100 % |
| AuditService | 100 % |

Rapport HTML local : backend/target/site/jacoco/index.html.
Classes de tests nouvelles : PaymentIntegrationTest29, PaymentWebhookTest11,
PaymentConcurrencyTest7, PaymentFoundationTest4 =51. Les 139 tests précédents restent
présents. PaymentTestSupport partage horloge déterministe, fixtures et gateway espion.

### Commandes des contrôles isolés

```powershell
# Backend isolé préalablement lancé sur8084 avec sa propre DB_URL.
$env:API_BASE="http://localhost:8084"
$env:PAYMENT_ISOLATED_TEST="1"
$env:BOOKING_ISOLATED_TEST="1"
$env:DEMO_PASSWORD="password123"
# Exporter PAYMENT_WEBHOOK_SECRET avec la valeur du serveur isolé.
node scripts/phase3_api_check.mjs
node scripts/phase3_browser_check.mjs
node scripts/phase2_api_check.mjs
node scripts/phase2_browser_check.mjs
```

Les scripts créent des fixtures dans la base isolée. Ne pas les exécuter sur des
données de production. Le contrôle Phase1 est un contrôle de navigation du serveur
de travail et n'injecte pas de réservation.

## Parcours manuel

Mot de passe de démonstration : password123. Huit comptes existants inchangés.

1. Démarrer MySQL/MariaDB, puis backend/.\\mvnw.cmd spring-boot:run.
   Depuis la racine, node scripts/serve_frontend.mjs.
2. Ouvrir http://127.0.0.1:5500/frontend/connexion.html et connecter
   sarah.benali@example.com.
3. Dans Hôtels & Riads, choisir une offre avec disponibilité future, renseigner
   dates et voyageurs, ajouter au panier puis aller au checkout ONLINE.
4. Sur Paiement, vérifier référence, total et compte à rebours. Saisir la carte
   sandbox4242 4242 4242 4242, un titulaire fictif, expiration12/30 et CVC123.
   Confirmer : reçu PAID, Booking CONFIRMED, voucher téléchargeable.
5. Pour un refus, nouveau Booking et carte4000 0000 0000 0002. Le statut devient
   FAILED ; cliquer Nouvelle tentative, utiliser4242. Une erreur réseau doit être
   reprise avec Réessayer la même demande.
6. Créer une réservation PAY_ON_ARRIVAL (offres toutes compatibles), confirmer son
   choix cash. Connecter nadia.elfassi@atlasvoyage.ma, Paiements → À encaisser →
   Détail/Encaisser. Le montant exact est non modifiable ; valider et consulter Historique.
7. Connecter omar.tazi@atlasvoyage.ma, Paiements → un paiement PAID → Rembourser.
   Saisir250 MAD et motif ; vérifier PARTIALLY_REFUNDED et l'événement. Rembourser
   le solde : REFUNDED, réservation annulée et capacité restituée une seule fois.
8. Connecter karim.idrissi@atlasvoyage.ma, Réservations reçues : statut réel et
   seulement ses lignes, aucune marque/quatre chiffres de carte.
9. Tester aussi les exemples Sarah marqués Démonstration et Swagger
   http://localhost:8080/swagger-ui.html.

## Limites et suites

- **Stripe/CMI réel non branché** : ajouter un adaptateur PaymentGateway audité,
  tokenisation hébergée et tests contractuels. Le profil prod ne peut donc pas
  démarrer un prestataire réel dans cette livraison ; refus volontaire du sandbox.
- Gateway sandbox synchrone : les reprises après arrêt brutal entre préparation
  et finalisation exigent une réconciliation durable pour un futur prestataire réel.
  Une tentative PROCESSING interrompue reste bloquée jusqu'à expiration/annulation
  ou intervention ; aucune nouvelle capture concurrente n'est autorisée.
- Déduplication du sandbox et limiteur de débit en mémoire : centraliser pour un
  déploiement multi-instance. Les protections SQL restent communes aux instances.
- Un webhook signé incorrect est conservé FAILED et un eventId existant est ignoré ;
  sa correction passe par un nouvel eventId, pas une modification d'historique.
- Vérifications DDL/concurrence sur **MariaDB10.4.32**, pilote MySQL. H2 ne remplace
  pas un MySQL8 réel ; Testcontainers MySQL8 recommandé pour la CI.
- Aucun e-mail de reçu, notification métier ou interface globale d'audit : phases
  suivantes. L'audit paiement existe en base et l'historique Payment est visible.
- La classe CancellationPolicy historique48/24/50 est conservée, mais Booking
  applique le délai client48h et les remboursements ADMIN explicites de la mission.
- L'import MIGRATED des anciennes confirmations ONLINE est une reprise comptable
  de démonstration, sans preuve de capture bancaire ; à auditer avant toute production.

## Fichiers créés ou modifiés

Inventaire relatif à `6b5b65f` (les rapports de test, logs et sauvegardes restent ignorés) :

- `.env.example`
- `README.md`
- `backend/pom.xml`
- `backend/src/main/java/com/agence/voyage/config/DemoBookingSeeder.java`
- `backend/src/main/java/com/agence/voyage/config/OpenApiConfig.java`
- `backend/src/main/java/com/agence/voyage/config/PaymentCacheFilter.java`
- `backend/src/main/java/com/agence/voyage/config/PaymentConfig.java`
- `backend/src/main/java/com/agence/voyage/config/PaymentProperties.java`
- `backend/src/main/java/com/agence/voyage/config/PaymentRequestAdvice.java`
- `backend/src/main/java/com/agence/voyage/config/ProductionEnvironmentValidator.java`
- `backend/src/main/java/com/agence/voyage/config/SecurityConfig.java`
- `backend/src/main/java/com/agence/voyage/controller/PaymentController.java`
- `backend/src/main/java/com/agence/voyage/controller/PaymentWebhookController.java`
- `backend/src/main/java/com/agence/voyage/domain/PaymentTransitions.java`
- `backend/src/main/java/com/agence/voyage/dto/BookingResponse.java`
- `backend/src/main/java/com/agence/voyage/dto/BookingSummaryResponse.java`
- `backend/src/main/java/com/agence/voyage/dto/CashCollectionRequest.java`
- `backend/src/main/java/com/agence/voyage/dto/PaymentCreateRequest.java`
- `backend/src/main/java/com/agence/voyage/dto/PaymentEventResponse.java`
- `backend/src/main/java/com/agence/voyage/dto/PaymentRefundRequest.java`
- `backend/src/main/java/com/agence/voyage/dto/PaymentReply.java`
- `backend/src/main/java/com/agence/voyage/dto/PaymentResponse.java`
- `backend/src/main/java/com/agence/voyage/entity/AuditLog.java`
- `backend/src/main/java/com/agence/voyage/entity/Booking.java`
- `backend/src/main/java/com/agence/voyage/entity/IdempotencyRecord.java`
- `backend/src/main/java/com/agence/voyage/entity/Payment.java`
- `backend/src/main/java/com/agence/voyage/entity/PaymentEvent.java`
- `backend/src/main/java/com/agence/voyage/entity/PaymentMethod.java`
- `backend/src/main/java/com/agence/voyage/entity/PaymentStatus.java`
- `backend/src/main/java/com/agence/voyage/entity/WebhookEvent.java`
- `backend/src/main/java/com/agence/voyage/exception/ErrorCode.java`
- `backend/src/main/java/com/agence/voyage/repository/AuditLogRepository.java`
- `backend/src/main/java/com/agence/voyage/repository/IdempotencyRecordRepository.java`
- `backend/src/main/java/com/agence/voyage/repository/PaymentEventRepository.java`
- `backend/src/main/java/com/agence/voyage/repository/PaymentRepository.java`
- `backend/src/main/java/com/agence/voyage/repository/WebhookEventRepository.java`
- `backend/src/main/java/com/agence/voyage/service/AuditService.java`
- `backend/src/main/java/com/agence/voyage/service/BookingJobs.java`
- `backend/src/main/java/com/agence/voyage/service/BookingService.java`
- `backend/src/main/java/com/agence/voyage/service/BookingVoucherService.java`
- `backend/src/main/java/com/agence/voyage/service/PaymentDataGuard.java`
- `backend/src/main/java/com/agence/voyage/service/PaymentExpirationJob.java`
- `backend/src/main/java/com/agence/voyage/service/PaymentGateway.java`
- `backend/src/main/java/com/agence/voyage/service/PaymentIdempotency.java`
- `backend/src/main/java/com/agence/voyage/service/PaymentLedger.java`
- `backend/src/main/java/com/agence/voyage/service/PaymentQueries.java`
- `backend/src/main/java/com/agence/voyage/service/PaymentRateLimiter.java`
- `backend/src/main/java/com/agence/voyage/service/PaymentService.java`
- `backend/src/main/java/com/agence/voyage/service/PaymentTransactions.java`
- `backend/src/main/java/com/agence/voyage/service/PaymentWebhookService.java`
- `backend/src/main/java/com/agence/voyage/service/SandboxPaymentGateway.java`
- `backend/src/main/java/db/migration/V7__payments.java`
- `backend/src/main/resources/application-dev.properties`
- `backend/src/main/resources/application-prod.properties`
- `backend/src/main/resources/application-test.properties`
- `backend/src/main/resources/application.properties`
- `backend/src/test/java/com/agence/voyage/booking/BookingIntegrationTest.java`
- `docs/ETAT_COMPLET_PROJET.md`
- `docs/api_endpoints.md`
- `docs/architecture.md`
- `docs/migrations.md`
- `docs/postman/AtlasVoyage.postman_collection.json`
- `docs/regles_metier.md`
- `frontend/admin/index.html`
- `frontend/admin/js/app.js`
- `frontend/agent/index.html`
- `frontend/agent/js/app.js`
- `frontend/client/index.html`
- `frontend/client/js/app.js`
- `frontend/connexion.html`
- `frontend/js/core/api.js`
- `frontend/js/core/bookings.js`
- `frontend/panier.html`
- `frontend/supplier/index.html`
- `scripts/frontend_smoke_test.mjs`
- `scripts/phase2_browser_check.mjs`
- `backend/src/test/java/com/agence/voyage/payment/PaymentConcurrencyTest.java`
- `backend/src/test/java/com/agence/voyage/payment/PaymentFoundationTest.java`
- `backend/src/test/java/com/agence/voyage/payment/PaymentIntegrationTest.java`
- `backend/src/test/java/com/agence/voyage/payment/PaymentTestSupport.java`
- `backend/src/test/java/com/agence/voyage/payment/PaymentWebhookTest.java`
- `frontend/css/payments.css`
- `frontend/js/core/payments.js`
- `scripts/phase3_api_check.mjs`
- `scripts/phase3_browser_check.mjs`
- `scripts/sign_payment_webhook.mjs`
- `docs/rapport_phase3.md`

## Références

- [Contrat API](../api_endpoints.md#paiements--phase-3-11-endpoints)
- [Règles métier](../regles_metier.md)
- [Migrations](../migrations.md#phase-3--v7-paiements)
- [Architecture et séquence](../architecture.md)
- [Collection Postman](../postman/AtlasVoyage.postman_collection.json)

