# Rapport de livraison — Phase 2 : Réservations Atlas Voyage

Livraison du 30 octobre 2026. Le dépôt contenait 104 tests après la Phase 1
(les 72 tests initiaux plus 32 fondations). Cette phase ajoute 35 tests :
**139 tests, 0 échec, 0 erreur**. Aucun test antérieur modifié, supprimé ou désactivé.

## Fonctionnalités livrées

- Réservation atomique de tout le panier authentifié : aucune donnée de prix/client
  provenant du navigateur ne fait autorité.
- Référence annuelle BK-AAAA-NNNNNN, table booking_sequence, upsert d'initialisation
  puis verrou pessimiste dans la transaction de création.
- Booking avec montants BigDecimal DECIMAL(12,2), MAD TTC, snapshots promo/prix/titres,
  dates de cycle, contact/note et version optimiste.
- BookingItem pour offre ou bundle, enfants du bundle par offre/fournisseur ;
  répartition du prix unitaire avec reliquat de centimes sur la dernière composante.
- BookingItemAllocation vers une disponibilité persistante et identifiable.
  Décrément effectif, quantités cumulées par période, aucun repli Booking sur stock.
- Paiement ONLINE : PENDING/PENDING et échéance configurable ; PAY_ON_ARRIVAL :
  CONFIRMED/PENDING uniquement si toutes les offres sous-jacentes l'autorisent.
- Validation par type : séjour complet, vol et retour/classe, voiture et âge/restitution,
  participants/passagers positifs, offre active et capacité après verrou.
- Annulation client jusqu'à 48 heures incluses avant le premier service ;
  agent/admin avec motif obligatoire. Restitution exactement une fois.
- Confirmation agent/admin, expiration planifiée et clôture après le dernier service.
  Une transaction par réservation pour les jobs ; verrou en base contre les doubles traitements.
- PDF multi-page avec QR contenant référence et HMAC-SHA256 tronqué à 128 bits ;
  téléchargement authentifié et réservé aux réservations confirmées/terminées.
- Listes paginées en base, filtres, tri en liste blanche, taille plafonnée à 100 ;
  client limité à ses réservations et fournisseur à ses lignes/montants.
- Checkout, confirmation, listes, détails, dialogues et voucher connectés à l'API,
  pour les quatre espaces ; états chargement/vide/erreur et échappement des textes.
- Quatre scénarios de démonstration idempotents pour Sarah, avec allocations cohérentes,
  sans remplacer un panier utilisateur déjà rempli.
- Documentation métier/API/architecture/état complet et collection Postman mises à jour.

## Décisions d'implémentation

### Préserver la Phase 1

Les migrations V1 à V3 existaient déjà. V2 ne pouvait pas être remplacée par
V2__bookings.sql : V4 à V6 ont été ajoutées sans modifier les migrations appliquées.
Dev et prod restent en Flyway + ddl-auto=validate ; H2 test utilise create-drop,
Flyway désactivé. Ce choix conserve la fondation technique déjà vérifiée.

### Disponibilités et concurrence

OfferAvailability était un Embeddable sans identifiant. Il devient une entité
dans la même table, avec une clé primaire. Les anciennes périodes sont conservées.
Une période liée à une allocation ne peut être supprimée, remplacée ou redimensionnée ;
la capacité résiduelle zéro reste valide dans le Backend et les formulaires.

Ordre de création : panier, offres par ID croissant, disponibilités par ID croissant,
séquence annuelle. Les disponibilités sont relues après verrou, y compris lorsqu'elles
étaient déjà présentes dans le contexte JPA. Les allocations portent restored :
annulation/expiration ne peuvent pas restituer deux fois les mêmes unités.

Le verrou du panier protège aussi deux POST de checkout concurrents : le second
retrouve le panier vide après le premier succès. Le bouton Frontend est également
désactivé pendant la requête, mais le contrôle serveur reste déterminant.

### Prix et bundles

BookingPricing partage le calcul avec CartResponse. Le panier existant facture
par unité ; aucun multiplicateur nuit/jour n'a été inventé dans cette phase.
Le bundle applique sa remise à la somme des offres, puis la promo s'applique au
sous-total. BigDecimal et HALF_UP sont utilisés pour les réservations.

Un parent bundle porte le montant facturé, les enfants ses quotes-parts par offre.
Les totaux globaux comptent uniquement les parents/lignes simples ; la vue fournisseur
compte uniquement les enfants/lignes de son compte. Les critères d'autres offres
du bundle sont supprimés des copies de chaque enfant. La promo globale et l'email
du client ne sont pas divulgués à un fournisseur.

### Règles de la mission Phase 2

La nouvelle limite d'annulation client de 48 heures remplace, dans BookingService,
la politique de remboursement partiel préparée en Phase 1. L'ancien utilitaire pur
CancellationPolicy reste conservé et testé ; Booking ne l'utilise pas.

Les paramètres booking.* sont ceux exécutés par ce module ; les paramètres app.booking.*
de Phase 1 restent présents pour compatibilité et sont expliqués dans regles_metier.md.
PaymentStatus conserve PARTIALLY_REFUNDED et PaymentMethod les deux anciennes valeurs
pour compatibilité, mais la création n'accepte que ONLINE/PAY_ON_ARRIVAL et ne produit
pas de remboursement partiel.

### Migration d'une base historique

V4 ajoute les snapshots, items, allocations et séquence et reprend les montants
historiques. V5 complète les composants des anciens bundles pour les fournisseurs.
Faute de date de service historique, createdAt est conservé comme date connue :
ces archives demandent un audit métier si elles représentent des engagements réels.
Aucune capacité n'est recréditée artificiellement pour une ancienne réservation
qui ne possédait pas d'allocation.

La base habituelle possédait des CHECK MariaDB portant des noms réutilisés entre
tables. Le premier essai de V4 a échoué sur cette ambiguïté. Une sauvegarde complète
avait été créée avant cet essai. LegacyBookingCheckCompatibility prépare les
contraintes uniquement avant V4, sans jointure ambiguë ; V6 restaure la contrainte
des dates. Flyway.repair() a retiré uniquement la migration échouée, après audit du
DDL. Aucun historique réussi ni aucune donnée utilisateur supprimé.

La base travel_agency_db a ensuite appliqué V4/V5/V6 et le seeder normalement.
La sauvegarde est locale et ignorée par Git :
backend/target/backup_main_before_phase2.sql.
La réparation ponctuelle n'est pas un comportement automatique de l'application.

## API et écrans

48 endpoints au total, dont 8 nouveaux Booking. Swagger documente Bearer JWT
pour toutes les opérations Booking et le schéma ApiError pour les erreurs principales.
Consulter [api_endpoints.md](api_endpoints.md#réservations--phase-2-8-endpoints).

| Écran | Source |
|---|---|
| Panier client | GET /api/cart, bouton vers checkout réel |
| Checkout public/client | GET /api/cart puis POST /api/bookings |
| Confirmation | GET /api/bookings/{id}, ID d'URL conservé |
| Dashboard et réservations client | GET /api/bookings |
| Dashboard et réservations fournisseur | GET /api/bookings/supplier |
| Dashboard et réservations agent/admin | GET /api/bookings/admin |
| Détail | GET /api/bookings/{id}, serveur filtre la vue fournisseur |
| Voucher | GET /api/bookings/{id}/voucher, fetch authentifié puis blob |

Le module partagé frontend/js/core/bookings.js centralise ces parcours.
Les anciens graphiques et KPI fictifs des dashboards concernés ont été remplacés
par l'activité réelle. Les autres modules de phases suivantes restent explicitement
des maquettes, par exemple tickets et notifications.

## Vérifications exécutées

JDK utilisé : Java 21.0.10. Base locale de validation : MariaDB 10.4.32 via le
connecteur MySQL ; tests automatisés H2 MODE MySQL.

| Commande / contrôle | Résultat |
|---|---|
| cd backend ; .\\mvnw.cmd clean test | 139 tests, 0 échec, 0 erreur |
| .\\mvnw.cmd test après corrections métier/migration | 139 tests, 0 échec, 0 erreur |
| node --check sur les JS modifiés et les scripts | Syntaxe valide ; 16 fichiers JS/MJS contrôlés |
| node scripts/frontend_smoke_test.mjs | 14 pages et les 5 catégories accessibles |
| node scripts/phase2_browser_check.mjs | Parcours catalogue → panier → réservation → PDF → annulation ; listes/détails des 7 comptes personnel/fournisseurs ; aucune erreur JavaScript |
| BOOKING_ISOLATED_TEST=1 node scripts/phase2_api_check.mjs | Sur MariaDB : 8 requêtes/capacité 1 → 1 succès, 7 CAPACITY_EXCEEDED ; références concurrentes uniques et consécutives ; restitution 1/1 et 8/8 |
| Démarrage dev, base vide | Flyway crée le schéma puis validate et seeder |
| Démarrage sur base V1 sans historique Flyway, peuplée | Baseline 1, migration des réservations et paiement ancien COMPLETED vers PAID, données conservées |
| Redémarrage du seeder | Un seul scénario par marqueur demo:booking:phase2 ; capacités non réinitialisées |
| travel_agency_db | V4/V5/V6 appliquées, 8 comptes et 10 offres conservés, 4 scénarios Booking ajoutés |
| Profil prod sans variables | Échec explicite avant connexion |
| Profil prod avec variables générées à l'exécution | Démarrage réussi, /api/status 200, Swagger et /v3/api-docs inaccessibles |
| OpenAPI dev | 48 opérations, 8 routes Booking protégées Bearer |
| git diff --check | Aucune erreur d'espacement |

Les 35 nouveaux tests couvrent création simple/bundle/promo, snapshots, arrivée,
rollback multi-lignes, cumul de capacité, concurrence, références/changement d'année,
annulation/délai exact, personnel/motif, remboursement marqué, expiration/clôture,
ownership, pagination et tri, PDF, vol aller-retour/classe, voiture âge/restitution,
vue fournisseur et idempotence du seeder.

Les scripts navigateur requièrent Chrome et playwright-core, comme le contrôle Phase 1.
Le script API crée des comptes/offres : le réserver à une base isolée et activer
explicitement BOOKING_ISOLATED_TEST=1. Les tokens et mots de passe générés ne sont
jamais affichés. Les logs et dumps locaux sous target ne sont pas versionnés.

## Parcours manuel reproductible

1. Démarrer MySQL, puis depuis backend : .\\mvnw.cmd spring-boot:run (JDK 21).
2. Depuis la racine : node scripts/serve_frontend.mjs, ou Live Server sur 5500.
3. Ouvrir http://127.0.0.1:5500/frontend/connexion.html.
4. Se connecter avec sarah.benali@example.com / password123 (compte local de démo).
5. Choisir un hôtel disponible, ses dates futures et les voyageurs ; ajouter au panier.
6. Cliquer « Finaliser ma réservation », choisir le paiement à l'arrivée si autorisé.
7. Vérifier vraie référence, montants, état CONFIRMED et télécharger le PDF.
8. Ouvrir Mes réservations, le détail puis Annuler : état CANCELLED et capacité restituée.
9. Refaire avec ONLINE : PENDING et échéance réelle. Avec Nadia ou Omar, confirmer
   depuis Réservations ; le paiement reste PENDING tant qu'il n'est pas encaissé.
10. Se connecter avec chaque fournisseur : seules ses prestations sont visibles.
    Un fournisseur imprime sa fiche filtrée et ne reçoit pas le voucher global.

La réservation PENDING de démonstration peut devenir EXPIRED après 30 minutes :
c'est le comportement attendu du job, pas une remise à zéro du seeder.

## Limites et phase suivante

- Aucun débit en ligne, webhook, capture, encaissement ou remboursement externe
  dans cette phase. PAID → REFUNDED est un marquage métier avec TODO explicite.
- Aucun email de confirmation ou notification n'est envoyé/simulé.
- Le endpoint public de vérification QR était optionnel et n'est pas ajouté.
  Le PDF contient bien la référence et sa signature ; la clé doit être conservée
  et gérée comme secret serveur en production.
- MySQL 8/Testcontainers reste recommandé pour la CI ; les essais de concurrence
  réels ici utilisent MariaDB, en complément d'H2.
- Les dates historiques inconnues et la répartition des anciens bundles sont
  documentées dans migrations.md ; aucune disponibilité passée n'est inventée
  pour compenser une consommation historique inconnue.
- Les prix restent ceux du panier actuel par unité ; une nouvelle tarification
  nuit/jour nécessiterait une évolution commune panier/réservation, hors mission.
- Les maquettes Paiements, notifications, tickets, audit et profil enrichi restent
  hors périmètre de cette phase.

## Inventaire exhaustif des fichiers créés/modifiés

- [.env.example](../.env.example)
- [README.md](../README.md)
- [backend/pom.xml](../backend/pom.xml)
- [backend/src/main/java/com/agence/voyage/TravelAgencyApplication.java](../backend/src/main/java/com/agence/voyage/TravelAgencyApplication.java)
- [backend/src/main/java/com/agence/voyage/config/BookingJobsConfig.java](../backend/src/main/java/com/agence/voyage/config/BookingJobsConfig.java)
- [backend/src/main/java/com/agence/voyage/config/BookingModuleProperties.java](../backend/src/main/java/com/agence/voyage/config/BookingModuleProperties.java)
- [backend/src/main/java/com/agence/voyage/config/DataSeeder.java](../backend/src/main/java/com/agence/voyage/config/DataSeeder.java)
- [backend/src/main/java/com/agence/voyage/config/DemoBookingSeeder.java](../backend/src/main/java/com/agence/voyage/config/DemoBookingSeeder.java)
- [backend/src/main/java/com/agence/voyage/config/LegacyBookingCheckCompatibility.java](../backend/src/main/java/com/agence/voyage/config/LegacyBookingCheckCompatibility.java)
- [backend/src/main/java/com/agence/voyage/config/OpenApiConfig.java](../backend/src/main/java/com/agence/voyage/config/OpenApiConfig.java)
- [backend/src/main/java/com/agence/voyage/config/SecurityConfig.java](../backend/src/main/java/com/agence/voyage/config/SecurityConfig.java)
- [backend/src/main/java/com/agence/voyage/controller/BookingController.java](../backend/src/main/java/com/agence/voyage/controller/BookingController.java)
- [backend/src/main/java/com/agence/voyage/dto/BookingItemResponse.java](../backend/src/main/java/com/agence/voyage/dto/BookingItemResponse.java)
- [backend/src/main/java/com/agence/voyage/dto/BookingResponse.java](../backend/src/main/java/com/agence/voyage/dto/BookingResponse.java)
- [backend/src/main/java/com/agence/voyage/dto/BookingSummaryResponse.java](../backend/src/main/java/com/agence/voyage/dto/BookingSummaryResponse.java)
- [backend/src/main/java/com/agence/voyage/dto/CancelBookingRequest.java](../backend/src/main/java/com/agence/voyage/dto/CancelBookingRequest.java)
- [backend/src/main/java/com/agence/voyage/dto/CartResponse.java](../backend/src/main/java/com/agence/voyage/dto/CartResponse.java)
- [backend/src/main/java/com/agence/voyage/dto/CreateBookingRequest.java](../backend/src/main/java/com/agence/voyage/dto/CreateBookingRequest.java)
- [backend/src/main/java/com/agence/voyage/dto/OfferRequest.java](../backend/src/main/java/com/agence/voyage/dto/OfferRequest.java)
- [backend/src/main/java/com/agence/voyage/entity/Booking.java](../backend/src/main/java/com/agence/voyage/entity/Booking.java)
- [backend/src/main/java/com/agence/voyage/entity/BookingItem.java](../backend/src/main/java/com/agence/voyage/entity/BookingItem.java)
- [backend/src/main/java/com/agence/voyage/entity/BookingItemAllocation.java](../backend/src/main/java/com/agence/voyage/entity/BookingItemAllocation.java)
- [backend/src/main/java/com/agence/voyage/entity/BookingSequence.java](../backend/src/main/java/com/agence/voyage/entity/BookingSequence.java)
- [backend/src/main/java/com/agence/voyage/entity/Offer.java](../backend/src/main/java/com/agence/voyage/entity/Offer.java)
- [backend/src/main/java/com/agence/voyage/entity/OfferAvailability.java](../backend/src/main/java/com/agence/voyage/entity/OfferAvailability.java)
- [backend/src/main/java/com/agence/voyage/entity/PaymentMethod.java](../backend/src/main/java/com/agence/voyage/entity/PaymentMethod.java)
- [backend/src/main/java/com/agence/voyage/exception/ErrorCode.java](../backend/src/main/java/com/agence/voyage/exception/ErrorCode.java)
- [backend/src/main/java/com/agence/voyage/repository/BookingAllocationRepository.java](../backend/src/main/java/com/agence/voyage/repository/BookingAllocationRepository.java)
- [backend/src/main/java/com/agence/voyage/repository/BookingItemRepository.java](../backend/src/main/java/com/agence/voyage/repository/BookingItemRepository.java)
- [backend/src/main/java/com/agence/voyage/repository/BookingRepository.java](../backend/src/main/java/com/agence/voyage/repository/BookingRepository.java)
- [backend/src/main/java/com/agence/voyage/repository/BookingSequenceRepository.java](../backend/src/main/java/com/agence/voyage/repository/BookingSequenceRepository.java)
- [backend/src/main/java/com/agence/voyage/repository/CartRepository.java](../backend/src/main/java/com/agence/voyage/repository/CartRepository.java)
- [backend/src/main/java/com/agence/voyage/repository/OfferAvailabilityRepository.java](../backend/src/main/java/com/agence/voyage/repository/OfferAvailabilityRepository.java)
- [backend/src/main/java/com/agence/voyage/repository/OfferRepository.java](../backend/src/main/java/com/agence/voyage/repository/OfferRepository.java)
- [backend/src/main/java/com/agence/voyage/service/BookingJobs.java](../backend/src/main/java/com/agence/voyage/service/BookingJobs.java)
- [backend/src/main/java/com/agence/voyage/service/BookingPricing.java](../backend/src/main/java/com/agence/voyage/service/BookingPricing.java)
- [backend/src/main/java/com/agence/voyage/service/BookingService.java](../backend/src/main/java/com/agence/voyage/service/BookingService.java)
- [backend/src/main/java/com/agence/voyage/service/BookingTravelCriteria.java](../backend/src/main/java/com/agence/voyage/service/BookingTravelCriteria.java)
- [backend/src/main/java/com/agence/voyage/service/BookingVoucherService.java](../backend/src/main/java/com/agence/voyage/service/BookingVoucherService.java)
- [backend/src/main/java/com/agence/voyage/service/CartService.java](../backend/src/main/java/com/agence/voyage/service/CartService.java)
- [backend/src/main/java/com/agence/voyage/service/OfferService.java](../backend/src/main/java/com/agence/voyage/service/OfferService.java)
- [backend/src/main/java/db/migration/V4__bookings.java](../backend/src/main/java/db/migration/V4__bookings.java)
- [backend/src/main/java/db/migration/V5__legacy_bundle_items.java](../backend/src/main/java/db/migration/V5__legacy_bundle_items.java)
- [backend/src/main/java/db/migration/V6__availability_date_constraint.java](../backend/src/main/java/db/migration/V6__availability_date_constraint.java)
- [backend/src/main/resources/application-dev.properties](../backend/src/main/resources/application-dev.properties)
- [backend/src/main/resources/application-prod.properties](../backend/src/main/resources/application-prod.properties)
- [backend/src/main/resources/application-test.properties](../backend/src/main/resources/application-test.properties)
- [backend/src/main/resources/application.properties](../backend/src/main/resources/application.properties)
- [backend/src/test/java/com/agence/voyage/booking/BookingIntegrationTest.java](../backend/src/test/java/com/agence/voyage/booking/BookingIntegrationTest.java)
- [docs/ETAT_COMPLET_PROJET.md](../docs/ETAT_COMPLET_PROJET.md)
- [docs/api_endpoints.md](../docs/api_endpoints.md)
- [docs/architecture.md](../docs/architecture.md)
- [docs/migrations.md](../docs/migrations.md)
- [docs/postman/AtlasVoyage.postman_collection.json](../docs/postman/AtlasVoyage.postman_collection.json)
- [docs/rapport_phase2.md](../docs/rapport_phase2.md)
- [docs/regles_metier.md](../docs/regles_metier.md)
- [frontend/accueil.html](../frontend/accueil.html)
- [frontend/admin/index.html](../frontend/admin/index.html)
- [frontend/admin/js/app.js](../frontend/admin/js/app.js)
- [frontend/agent/index.html](../frontend/agent/index.html)
- [frontend/agent/js/app.js](../frontend/agent/js/app.js)
- [frontend/catalogue.html](../frontend/catalogue.html)
- [frontend/client/index.html](../frontend/client/index.html)
- [frontend/client/js/app.js](../frontend/client/js/app.js)
- [frontend/connexion.html](../frontend/connexion.html)
- [frontend/css/bookings.css](../frontend/css/bookings.css)
- [frontend/js/app.js](../frontend/js/app.js)
- [frontend/js/core/api.js](../frontend/js/core/api.js)
- [frontend/js/core/bookings.js](../frontend/js/core/bookings.js)
- [frontend/js/core/config.js](../frontend/js/core/config.js)
- [frontend/offre.html](../frontend/offre.html)
- [frontend/panier.html](../frontend/panier.html)
- [frontend/supplier/index.html](../frontend/supplier/index.html)
- [frontend/supplier/js/app.js](../frontend/supplier/js/app.js)
- [scripts/frontend_smoke_test.mjs](../scripts/frontend_smoke_test.mjs)
- [scripts/phase2_api_check.mjs](../scripts/phase2_api_check.mjs)
- [scripts/phase2_browser_check.mjs](../scripts/phase2_browser_check.mjs)
- [scripts/serve_frontend.mjs](../scripts/serve_frontend.mjs)
