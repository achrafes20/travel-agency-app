# Rapport de livraison — Phase 5 : dashboards réels

> **Archive — document historique.** Ce document décrit l'état et le travail réalisés à une date donnée. Il est conservé tel quel (hors liens corrigés lors de son déplacement le 9 novembre 2026) et **n'est plus mis à jour**. Pour l'état courant : [README](../../README.md), [règles métier](../regles_metier.md), [architecture](../architecture.md), [CHANGELOG](../../CHANGELOG.md).

31 octobre 2026. Référence avant travaux : commit `4b80555` (Phase 4).

## Résultat

Les dashboards admin, fournisseur, agent et client utilisent de vrais agrégats
SQL exposés par six routes sécurisées. Graphiques Chart.js, comparaisons,
sélecteur de période, cache admin, exports CSV et historique DEMO sont reliés.
Le catalogue public, panier, réservation, paiement et notifications sont conservés.
Le schéma reste géré par Flyway avec Hibernate validate en dev/prod.

**248 tests passent : 222 antérieurs inchangés + 26 nouveaux, zéro échec,
zéro erreur, zéro test ignoré.** Le résultat comprend les 72 tests d'origine.
OpenAPI expose **72 opérations**, dont les quatre statistiques et deux CSV.

## Audit et décisions

Le dépôt réel dépassait le contexte initial : Booking, BookingItem, allocations,
Payment, événements, Notification et préférences étaient déjà opérationnels.
Les anciens dashboards avaient été remplacés par des listes Booking réelles.
Le travail ajoute les agrégats et graphiques, sans recréer ces modules.

| Point | Décision retenue |
|---|---|
| Schéma | V9 Java Flyway selon les migrations d'adoption existantes ; aucun script manuel parallèle, aucun retour à ddl-auto=update |
| Timestamps | Créations en UTC ; frontières calendaires Casablanca calculées par Java, sans dépendre des tables de fuseaux SQL |
| Périodes | 7/30 dates incluant aujourd'hui ; 12 mois calendaires incluant le mois courant, comparaison au bloc précédent |
| CA agence | Booking.total CONFIRMED/COMPLETED, cohorte de création et statut actuel ; ce n'est pas un journal d'encaissement |
| CA fournisseur | unitPrice × quantity de ses seules lignes d'offres, avant promo globale ; parent bundle exclu |
| CA des tops | Remise globale répartie au prorata des prix des lignes, arrondie après agrégation ; possible écart d'un centime entre groupes |
| Dépenses client | Paiements capturés moins remboursements ; espèces non encaissées exclues ; totaux à vie et période distincts |
| Anciens utilisateurs | createdAtEstimated signale la date technique d'adoption ; ces comptes ne deviennent pas de nouvelles inscriptions |
| Agent | Attente sur la période ; créations du jour vs veille ; espèces à encaisser tous horizons, y compris retard, triées par service |
| Activité fournisseur | Cinq dernières notifications métier du sujet connecté, événements réellement persistés |
| Tickets | available=false, count=0, items=[] : aucune entité Ticket persistante ; « Bientôt disponible » |
| Cache | Caffeine admin local, clé période, TTL 2 min, trois entrées ; autorisation avant cache ; autres rôles sans cache |
| Seeder | Import DEMO dev indépendant, exécuté après DataSeeder, sans appel bancaire ou e-mail artificiel |

Le [document statistiques](../statistiques.md) détaille les contrats, seuils,
snapshots, comparaisons et limites. Les règles sont aussi dans
[regles_metier.md](../regles_metier.md#statistiques--phase-5).

## Sécurité et performance

- Rôles explicitement contrôlés dans SecurityConfig et identité revalidée dans
  StatsService avant le cache. Aucun supplierId/clientId de requête n'élargit le
  périmètre. JWT archivé toujours refusé. Pas d'e-mail ou secret dans les tops.
- Agrégats SQL scalaires et requêtes groupées, pas de chargement d'entités pour
  compter/sommer et pas d'appel repository par réservation. Series bornées,
  complétées par zéro. Tops/listes bornés à 5, alertes détaillées à 20.
- CSV : UTF-8 BOM, ;, guillemets doublés, apostrophe anti-formule, CRLF,
  montants à deux décimales, dates ISO, attachment horodaté. Curseur JDBC en flux,
  limite SQL 50 000, flush toutes les 500 lignes. Plages validées ≤24 mois.
- La reprise ASYNC d'un export n'est autorisée qu'avec un attribut serveur posé
  après l'autorisation ADMIN initiale. Les contrôles HTTP réels ont détecté et
  permis de corriger une interruption que le premier MockMvc masquait.
- Toutes les réponses stats privées portent no-store. L'en-tête d'export n'est
  posé qu'une fois. Les exports authentifiés sont téléchargés par fetch/blob.
- DOM dynamique par textContent. AbortController et génération de requête,
  destruction des graphiques, chargement/vide/erreur/Réessayer, repli CDN,
  sélecteur accessible et URL mémorisée. Cadre compact mobile limité aux dashboards.
- Badges numériques fictifs retirés des menus admin/agent. Les pages Tickets et
  profils hors périmètre conservent leurs maquettes explicitement documentées.

## Migration et données vérifiées

V9 ajoute User.createdAt, createdAtEstimated et les index statistiques aux noms
physiques existants. V1–V8 restent inchangées. Les annotations d'index concordent
avec les tables réelles ; H2 conserve create-drop et Flyway désactivé pour les tests.

Vérifications sur MariaDB **10.4.32**, via le pilote MySQL déjà présent :

1. Base vide isolée `atlas_phase5_empty_20261031` : V1→V9 appliquées, validation
   Hibernate réussie, API et seeder fonctionnels.
2. Redémarrages isolés : version 9 à jour, `stats_demo_ready bookingsAdded=0`,
   aucun doublon. 59 exemples sur cette base : une disponibilité existante sans
   capacité empêche un exemple supplémentaire, sans augmenter la capacité.
3. Base de travail `travel_agency_db` : arrêt, sauvegarde puis V8→V9 réussie ;
   60 nouveaux exemples historiques, huit comptes originaux préservés et second
   client DEMO ajouté. Contrôle SQL : 68 réservations, 68 paiements, 72 allocations,
   zéro incohérence de montant DEMO, capacité minimale zéro (jamais négative).

Sauvegarde locale hors Git et hors target :
`%TEMP%/atlas-phase5-before-v9-20261031-063815.sql`.
Ne pas rejouer manuellement V9 ; toute évolution suivante doit être V10.

## Vérifications exécutées

| Commande / contrôle | Résultat |
|---|---|
| .\mvnw.cmd test, étapes fondations puis agrégats | 222 tests antérieurs verts |
| .\mvnw.cmd -Dtest=StatsIntegrationTest test | 26 tests statistiques verts après correction du merge du seeder |
| .\mvnw.cmd test | 248 tests verts |
| .\mvnw.cmd clean test | 248 tests, 0 échec, 0 erreur, 0 ignoré ; seuil JaCoCo paiement conservé |
| node --check, module stats + quatre app.js + trois scripts de contrôle | Syntaxe valide |
| node scripts/frontend_smoke_test.mjs | 25 pages, 10 offres, cinq catégories |
| scripts/phase5_api_check.mjs sur 8087 isolé | Six routes, rôles/401/403/no-store, mutation réelle, capacité, CSV et périodes OK |
| scripts/phase5_browser_check.mjs sur 8087 isolé | Quatre dashboards, graphiques réels, périodes, export, XSS, réponse tardive, erreur/réessai, vrai compte vide, CDN bloqué et mobile OK |
| scripts/phase5_browser_check.mjs sur 8080, base de travail | Quatre dashboards, graphiques, CSV, droits de navigation et mobile OK après migration |
| scripts/phase3_browser_check.mjs sur 8087 isolé | Checkout/paiement/confirmation/voucher, refus/reprise, réponse perdue, espèces agent et remboursements admin OK |
| scripts/phase4_browser_check.mjs sur 8087 isolé | Polling après modération, lecture/navigation, Échap/focus, quatre pages et préférences, arrêt du polling OK |
| /api/status et /v3/api-docs sur 8080 | Santé OK, 72 opérations dont six stats/CSV |

Les 26 tests StatsIntegrationTest couvrent notamment mutation de statut/montant,
cohortes et statuts, bundle/panier mixte sans fuite fournisseur, dépenses nettes,
séries sans trous, frontières Casablanca/Ramadan, variations, matrice de sécurité,
usurpation de paramètres, compte archivé, cache et invalidation après commit,
dates estimées, disponibilités, encaissements, notifications, tops, promotions,
CSV en flux/échappement/formules, seeder idempotent/montants/allocations/périodes.

Les captures de contrôle locales sont sous `backend/target/phase5-browser/`
(admin, fournisseur, agent, client sur mobile). Les rapports Surefire sont dans
`backend/target/surefire-reports/`, le dernier journal Maven est
`backend/target-phase5-clean-test.log`. Ces artefacts sont ignorés par Git.

## Tester manuellement

Java 21 et MySQL/MariaDB démarrés :

```powershell
cd backend
.\mvnw.cmd spring-boot:run
# Dans un autre terminal, racine du dépôt :
node scripts/serve_frontend.mjs
```

Si les serveurs laissés actifs utilisent déjà 8080/5500, ouvrir directement
http://127.0.0.1:5500/frontend/connexion.html.

Mot de passe de développement commun : `password123` (ou DEMO_PASSWORD).

| Compte | Dashboard |
|---|---|
| omar.tazi@atlasvoyage.ma | /frontend/admin/index.html?page=dashboard |
| karim.idrissi@atlasvoyage.ma | /frontend/supplier/index.html?page=dashboard |
| nadia.elfassi@atlasvoyage.ma | /frontend/agent/index.html?page=dashboard |
| sarah.benali@example.com | /frontend/client/index.html?page=dashboard |
| client.stats.demo@atlasvoyage.test | Second client pour constater l'isolation |

1. Se connecter successivement avec les quatre rôles ; sélectionner 7 jours,
   30 jours, 12 mois, recharger : l'URL conserve la période.
2. Admin : vérifier KPI, deux répartitions, CA, tops et promotions ; exporter les
   deux CSV et ouvrir avec Excel FR. Tester une plage trop longue : erreur lisible.
3. Fournisseur : cliquer une disponibilité à vérifier, constater le filtre offerId,
   puis Réinitialiser. Comparer avec le compte vols@atlasvoyage.ma.
4. Client : réserver une offre disponible depuis le catalogue public ; ONLINE
   augmente l'attente, une capture sandbox confirme et ajoute le CA ; une annulation
   autorisée le retire. Les écritures métier principales invalident le cache.
5. Agent : encaisser un paiement espèces ; le compteur/montant diminuent au
   prochain chargement. Tickets affiche « Bientôt disponible ».
6. Couper l'API et Actualiser : erreurs avec Réessayer. Bloquer le CDN Chart.js
   et recharger : message de graphique indisponible, cartes/listes accessibles.

Pour rejouer les contrôles qui créent des fixtures, utiliser une base **isolée** :

```powershell
$env:API_BASE='http://localhost:8087'
$env:DEMO_PASSWORD='password123'
$env:STATS_ISOLATED_TEST='1'
node scripts/phase5_api_check.mjs
node scripts/phase5_browser_check.mjs
```

Le contrôle navigateur utilise playwright-core et Chrome locaux, comme les
scripts précédents ; le module est recherché sous
`%TEMP%/atlas-phase1-browser-tools/node_modules`. Aucune dépendance de production
Frontend supplémentaire n'est installée.

## Limites et suite

- Tickets, profils enrichis, paramètres globaux et UI d'audit restent hors périmètre.
- Les paiements bancaires réels restent à intégrer ; la sandbox n'effectue pas
  de débit bancaire. Le module Paiements/Notifications existant est conservé.
- Cache local : une autre instance ou une écriture SQL directe peut mettre deux
  minutes à apparaître. Pour plusieurs instances, prévoir invalidation partagée.
- CA commercial par statut actuel, pas une clôture comptable ni un historique
  « tel qu'il était ». Villes/titres des tops reflètent les offres actuelles.
- Date réelle de création des anciens comptes irrécupérable sans source externe.
- Historique DEMO importé, clairement marqué ; il ne prouve pas une émission de
  billet ni un service passé réel. Pas de revalidation des anciens critères contre
  une offre modifiée. L'exemple PENDING peut expirer sous l'effet du job normal.
- MariaDB local a réussi ; une CI Testcontainers MySQL 8 reste recommandée pour
  tester le DDL et les plans SQL sur le moteur cible de production.
- Le CDN peut être indisponible : repli visible prévu, pas de graphique fictif.

## Fichiers créés ou modifiés

Inventaire des **46 fichiers** par rapport à `4b80555` ci-dessous.

- `backend/pom.xml`
- `backend/src/main/java/com/agence/voyage/config/DataSeeder.java`
- `backend/src/main/java/com/agence/voyage/config/OpenApiConfig.java`
- `backend/src/main/java/com/agence/voyage/config/SecurityConfig.java`
- `backend/src/main/java/com/agence/voyage/config/StatsCacheControlFilter.java`
- `backend/src/main/java/com/agence/voyage/config/StatsConfig.java`
- `backend/src/main/java/com/agence/voyage/config/StatsDemoSeeder.java`
- `backend/src/main/java/com/agence/voyage/controller/StatsController.java`
- `backend/src/main/java/com/agence/voyage/dto/stats/StatsDtos.java`
- `backend/src/main/java/com/agence/voyage/entity/Booking.java`
- `backend/src/main/java/com/agence/voyage/entity/Offer.java`
- `backend/src/main/java/com/agence/voyage/entity/OfferAvailability.java`
- `backend/src/main/java/com/agence/voyage/entity/Payment.java`
- `backend/src/main/java/com/agence/voyage/entity/User.java`
- `backend/src/main/java/com/agence/voyage/repository/StatsRepository.java`
- `backend/src/main/java/com/agence/voyage/service/BookingService.java`
- `backend/src/main/java/com/agence/voyage/service/StatsAdminCache.java`
- `backend/src/main/java/com/agence/voyage/service/StatsAdminCalculator.java`
- `backend/src/main/java/com/agence/voyage/service/StatsCacheInvalidation.java`
- `backend/src/main/java/com/agence/voyage/service/StatsCsvService.java`
- `backend/src/main/java/com/agence/voyage/service/StatsPeriod.java`
- `backend/src/main/java/com/agence/voyage/service/StatsService.java`
- `backend/src/main/java/db/migration/V9__stats_indexes.java`
- `backend/src/test/java/com/agence/voyage/stats/StatsIntegrationTest.java`
- `docs/api_endpoints.md`
- `docs/architecture.md`
- `docs/ETAT_COMPLET_PROJET.md`
- `docs/migrations.md`
- `docs/postman/AtlasVoyage.postman_collection.json`
- `docs/rapport_phase5.md`
- `docs/regles_metier.md`
- `docs/statistiques.md`
- `frontend/admin/index.html`
- `frontend/admin/js/app.js`
- `frontend/agent/index.html`
- `frontend/agent/js/app.js`
- `frontend/client/index.html`
- `frontend/client/js/app.js`
- `frontend/css/stats.css`
- `frontend/js/core/stats.js`
- `frontend/supplier/index.html`
- `frontend/supplier/js/app.js`
- `README.md`
- `scripts/frontend_smoke_test.mjs`
- `scripts/phase5_api_check.mjs`
- `scripts/phase5_browser_check.mjs`
