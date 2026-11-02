# Livraison Phase 4 — Notifications

31 octobre 2026. Point de départ Git : `3679431`.

## Constat initial

Le dépôt différait du prompt : Booking et Payment étaient déjà complets,
avec 59 endpoints et 190 tests. Notification ne contenait que destinataire, message,
état lu et date ; aucun contrôleur/service de notifications. Les quatre espaces
utilisaient des compteurs, listes ou actions locales. Ticket reste absent.

Les réservations et paiements ont donc été **réutilisés**, sans recréer leurs
contrôleurs, altérer leurs prix/capacités ni modifier leurs190 tests.
Leurs services publient maintenant les événements nécessaires.
Résultat : **66 endpoints et 222 tests**.

## Livraison et choix

- Notification enrichie, type/catégorie, dates, référence, lien interne et index.
- Préférences séparées de User, défauts paresseux ; catégories e-mail configurables.
- Marqueurs notification_dispatches distincts des messages : déduplication durable
  même avec inAppEnabled=false ou après suppression d'une notification.
- Listeners AFTER_COMMIT, transaction REQUIRES_NEW par destinataire, panne isolée.
- Publieurs branchés sur AuthService, modération, Booking, Payment et disponibilités.
- Destinataires dédupliqués, archivés exclus ; fournisseur limité à ses prestations.
- JavaMailSender/Thymeleaf, HTML et texte, quatre modèles métier et modèle générique,
  exécuteur dédié et deux tentatives SMTP. Pas de secret SMTP dans le dépôt.
- Sept endpoints privés, propriété dans WHERE, pagination50 maximum, APIError existante.
- Module NotificationsUI partagé : cloche, panneau, page, préférences, accessibilité,
  liens contrôlés, textContent et polling30/60 s sans empilement.
- V8 Flyway, exemples idempotents et documentation/Postman actualisés.

La table de préférences a été choisie pour garder User stable et isoler les règles
de canal. La déduplication ne dépend pas de l'existence d'un message in-app.
Les deux dépendances Mail/Thymeleaf sont celles demandées ; aucune infrastructure
de messagerie externe lourde n'est requise.

Le scheduler reconstitue la capacité initiale depuis le résiduel et les allocations
non restituées. Aucune nouvelle notion de stock n'est introduite.
Les clés distinguent capacité faible/critique et expiration proche/terminée.

La compatibilité des tests @DataJpaTest est conservée : AuthService et OfferService
reçoivent ApplicationEventPublisher de l'infrastructure Spring, sans imposer
l'import du sous-système complet dans leurs contextes réduits.

## Vérifications réellement exécutées

| Vérification | Résultat |
|---|---|
| JDK21, backend/.\\mvnw.cmd -q clean test |222 tests, 0 échec, 0 erreur, 0 ignoré, sortie0 |
| backend/.\\mvnw.cmd -q test après les derniers changements |222 tests, 0 échec, 0 erreur |
| Tests historiques |190 précédents inchangés, dont les 72 d'origine |
| Nouveaux tests |32 NotificationIntegrationTest |
| JaCoCo historique Payment |Seuil81% par service toujours satisfait |
| node --check |9 fichiers JS/MJS créés/modifiés valides |
| scripts/frontend_smoke_test.mjs |21 pages,10 offres,5 catégories, OK |
| scripts/phase 4_api_check.mjs sur 8086 |8 groupes de contrôles API, OK |
| Réception SMTP Mailpit 1.32.0 |5 messages attendus reçus, HTML et texte non vides |
| scripts/phase 4_browser_check.mjs |6 groupes de contrôles, OK |
| Polling réel |Modération admin → compteur/panneau fournisseur mis à jour au cycle suivant |
| Accessibilité |Échap, retour du focus sur la cloche et lecture/navigation, OK |
| Pages des 4 rôles |Filtres et préférences sauvegardées, pas d'erreur JS remontée |
| Nettoyage polling |Plus de timer30/60 s après arrêt explicite, vérifié par instrumentation du script |
| scripts/phase 3_browser_check.mjs |7 parcours de paiement/voucher/refus/reprise/cash/remboursement/fournisseur, OK |
| scripts/phase 1_browser_check.mjs |8 comptes, formulaires/listes et 5 catégories, OK |
| JSON Postman |7 requêtes ajoutées ;119 scripts et 65 corps JSON valides |
| OpenAPI |66 opérations,7 routes Notifications ; Bearer déclaré aussi sur la liste |
| Base vide |V1→V8, validation Hibernate et seeders, OK |
| Base existante |V7→V8 sur travel_agency_db après sauvegarde, OK |
| Redémarrage |16 notifications,8 préférences,8 réservations,8 paiements, sans doublon |
| git diff --check |OK |

Les contrôles API et navigateur créent des fixtures et utilisent une base isolée.
Ils doivent être exécutés **séquentiellement** : deux suites simultanées créant des
événements pour le même fournisseur peuvent déplacer un message hors des 10 derniers
du panneau. Ce comportement ne change pas la présence du message dans la page complète.

### Couverture fonctionnelle des 32 tests

Destinataires de chaque événement, confidentialité fournisseur, utilisateur archivé,
destinataire cumulant plusieurs raisons, déduplication concurrente, rollback métier,
panne de notification lors d'une vraie inscription, panne SMTP avec deux tentatives,
préférences in-app/e-mail/catégorie et exception ACCOUNT, absence d'envoi réel lorsque
désactivé, contenu multipart/échappement, API et propriété404, authentification401,
lecture idempotente, tout lire/supprimer, validation des préférences, liens malveillants,
pagination/filtres, seuils/alertes et scans répétés, purge aux bornes, inscription et
modération réelles, seeder répété et notifyMany.

## Bases, migration et environnement

V8__notifications.sql est appliquée et figée. Les migrations V1–V7 n'ont pas changé.
Le schéma reste géré par Flyway avec ddl-auto=validate en dev/prod.
H2 crée son schéma uniquement en test, sans Flyway.

Sur la base existante, sauvegarde avant V8 :
backend/target/backup_main_before_phase4.sql (ignorée par Git).
Les 8 comptes,10 offres,8 réservations et 8 paiements de travail sont conservés.
Les notifications minimales historiques sont reprises en SYSTEM, sans perte de
message/date/état. Les noms de FK hérités sont détectés avant modification.

La base vide isolée atlas_phase4_empty_20261031 a été créée par V1–V8.
Elle a servi aux tests SMTP et aux contrôles créant des offres/réservations.
Les tests MySQL ont utilisé MariaDB10.4.32 via le pilote MySQL ; ils ne prétendent
pas valider un moteur MySQL8. Les tests H2 complètent ces vérifications.

Le service MySQL local était arrêté pendant la vérification ; il a été relancé
normalement. Son avertissement préexistant concernant la table système mysql.db
n'a pas été réparé dans cette mission. Aucun fichier de données système n'a été
supprimé ou réinitialisé. Le serveur a néanmoins permis les migrations et contrôles.
Une maintenance séparée de cette installation XAMPP reste recommandée.

Mailpit est un binaire temporaire de contrôle, non versionné, lié uniquement sur
127.0.0.1:1025 et 127.0.0.1:8025. Les messages ne sont pas relayés à l'extérieur.
MAIL_ENABLED reste false sur le serveur de travail par défaut.

## Vérification manuelle

1. Démarrer MySQL puis backend/.\\mvnw.cmd spring-boot:run.
   Depuis la racine : node scripts/serve_frontend.mjs.
2. Ouvrir http://127.0.0.1:5500/frontend/connexion.html.
   Comptes inchangés, mot de passe `password123` :
   Sarah `sarah.benali@example.com`, Karim `karim.idrissi@atlasvoyage.ma`,
   Nadia `nadia.elfassi@atlasvoyage.ma`, Omar `omar.tazi@atlasvoyage.ma`.
   Les 4 autres fournisseurs du README disposent aussi des notifications.
3. Dans chaque espace, ouvrir la cloche puis « Voir toutes les notifications ».
   Vérifier filtres, état lu, suppression, tout lire et préférences ; recharger
   pour constater la persistance. Les messages des autres comptes sont invisibles.
4. Connecter Karim dans un navigateur et Omar dans un autre. Désactiver une offre
   de Karim avec motif depuis Offres admin. Sous30 s lorsque l'onglet est visible,
   la cloche fournisseur augmente. Ouvrir le message puis vérifier sa lecture.
   Un autre fournisseur et l'admin ne reçoivent pas cet événement.
5. Avec Sarah, créer une réservation puis payer en sandbox. Consulter les
   notifications de création/confirmation/paiement. Annuler ou rembourser
   totalement depuis l'admin pour obtenir l'annulation avec auteur.
6. Pour les e-mails : lancer Mailpit et exporter MAIL_ENABLED=true,
   SMTP_HOST=localhost et SMTP_PORT=1025 avant redémarrage Backend.
   Créer un compte depuis Connexion/Inscription. Sa cloche contient la bienvenue ;
   http://127.0.0.1:8025 montre les versions HTML et texte.
7. Désactiver un e-mail de catégorie dans les préférences puis reproduire
   l'événement correspondant. La notification in-app reste selon son interrupteur ;
   les e-mails de compte restent obligatoires tant que SMTP est globalement activé.

Commandes isolées :

```powershell
$env:API_BASE="http://localhost:8086"
$env:DEMO_PASSWORD="password123"
$env:NOTIFICATION_ISOLATED_TEST="1"
node scripts/phase4_api_check.mjs
node scripts/phase4_browser_check.mjs
```

Le serveur isolé doit avoir sa propre DB_URL, MAIL_ENABLED=true et Mailpit actif.
Ne pas utiliser ces scripts de création de fixtures sur une base de production.

## Branchement restant et limites explicites

**Booking et Payment : aucun branchement restant dans le périmètre demandé.**
Les services réels publient déjà les événements. Les paiements restent sandbox,
comme avant cette phase.

**Ticket seulement** : le futur TicketService.reply, transactionnel, publiera
TicketRepliedEvent après sauvegarde de la réponse, avec :
eventId stable lié au message, ticketId, référence, requesterId, assignedId,
authorId, sujet et aperçu. Le listener existant exclut l'auteur et choisit
demandeur/assigné. Voir l'exemple exact dans [notifications.md](notifications.md#futur-module-ticket--branchement-exact).

Le traitement suit AFTER_COMMIT et une file asynchrone locale, conformément à la
mission. Il ne fournit pas d'outbox durable après arrêt brutal du processus.
Après deux échecs SMTP, pas de reprise automatique persistée : avertissement de log,
notification in-app conservée et opération métier réussie. Les marqueurs restent
pour empêcher un rejeu du même événement. Le seeder ne génère aucun e-mail artificiel.

## Inventaire des fichiers

Comparaison avec `3679431`, rapports/artefacts de test et sauvegardes exclus.
**94 fichiers créés ou modifiés**, regroupés ci-dessous.

### Backend et tests

- `backend/pom.xml`
- `backend/src/main/java/com/agence/voyage/config/DataSeeder.java`
- `backend/src/main/java/com/agence/voyage/config/OpenApiConfig.java`
- `backend/src/main/java/com/agence/voyage/config/SecurityConfig.java`
- `backend/src/main/java/com/agence/voyage/entity/Notification.java`
- `backend/src/main/java/com/agence/voyage/repository/BookingAllocationRepository.java`
- `backend/src/main/java/com/agence/voyage/repository/NotificationRepository.java`
- `backend/src/main/java/com/agence/voyage/repository/OfferAvailabilityRepository.java`
- `backend/src/main/java/com/agence/voyage/repository/UserRepository.java`
- `backend/src/main/java/com/agence/voyage/service/AuthService.java`
- `backend/src/main/java/com/agence/voyage/service/BookingService.java`
- `backend/src/main/java/com/agence/voyage/service/OfferService.java`
- `backend/src/main/java/com/agence/voyage/service/PaymentLedger.java`
- `backend/src/main/java/com/agence/voyage/service/PaymentTransactions.java`
- `backend/src/main/java/com/agence/voyage/service/PaymentWebhookService.java`
- `backend/src/main/resources/application-test.properties`
- `backend/src/main/resources/application.properties`
- `backend/src/main/java/com/agence/voyage/config/FrontendProperties.java`
- `backend/src/main/java/com/agence/voyage/config/NotificationConfig.java`
- `backend/src/main/java/com/agence/voyage/config/NotificationMailProperties.java`
- `backend/src/main/java/com/agence/voyage/config/NotificationProperties.java`
- `backend/src/main/java/com/agence/voyage/controller/NotificationController.java`
- `backend/src/main/java/com/agence/voyage/dto/NotificationPreferenceRequest.java`
- `backend/src/main/java/com/agence/voyage/dto/NotificationPreferenceResponse.java`
- `backend/src/main/java/com/agence/voyage/dto/NotificationResponse.java`
- `backend/src/main/java/com/agence/voyage/dto/UnreadCountResponse.java`
- `backend/src/main/java/com/agence/voyage/entity/NotificationCategory.java`
- `backend/src/main/java/com/agence/voyage/entity/NotificationDispatch.java`
- `backend/src/main/java/com/agence/voyage/entity/NotificationPreference.java`
- `backend/src/main/java/com/agence/voyage/entity/NotificationType.java`
- `backend/src/main/java/com/agence/voyage/event/AvailabilityExpiredEvent.java`
- `backend/src/main/java/com/agence/voyage/event/AvailabilityLowEvent.java`
- `backend/src/main/java/com/agence/voyage/event/BookingCancelledEvent.java`
- `backend/src/main/java/com/agence/voyage/event/BookingConfirmedEvent.java`
- `backend/src/main/java/com/agence/voyage/event/BookingCreatedEvent.java`
- `backend/src/main/java/com/agence/voyage/event/BookingNotice.java`
- `backend/src/main/java/com/agence/voyage/event/EmailNotificationEvent.java`
- `backend/src/main/java/com/agence/voyage/event/OfferModerationChangedEvent.java`
- `backend/src/main/java/com/agence/voyage/event/PaymentFailedEvent.java`
- `backend/src/main/java/com/agence/voyage/event/PaymentReceivedEvent.java`
- `backend/src/main/java/com/agence/voyage/event/TicketRepliedEvent.java`
- `backend/src/main/java/com/agence/voyage/event/UserRegisteredEvent.java`
- `backend/src/main/java/com/agence/voyage/repository/NotificationDispatchRepository.java`
- `backend/src/main/java/com/agence/voyage/repository/NotificationPreferenceRepository.java`
- `backend/src/main/java/com/agence/voyage/service/AvailabilityAlertScheduler.java`
- `backend/src/main/java/com/agence/voyage/service/AvailabilityAlertService.java`
- `backend/src/main/java/com/agence/voyage/service/EmailService.java`
- `backend/src/main/java/com/agence/voyage/service/NotificationDemoSeeder.java`
- `backend/src/main/java/com/agence/voyage/service/NotificationEmailListener.java`
- `backend/src/main/java/com/agence/voyage/service/NotificationEventListener.java`
- `backend/src/main/java/com/agence/voyage/service/NotificationEvents.java`
- `backend/src/main/java/com/agence/voyage/service/NotificationLinks.java`
- `backend/src/main/java/com/agence/voyage/service/NotificationService.java`
- `backend/src/main/resources/templates/mail/base.html`
- `backend/src/main/resources/templates/mail/booking-text.txt`
- `backend/src/main/resources/templates/mail/booking.html`
- `backend/src/main/resources/templates/mail/cancellation-text.txt`
- `backend/src/main/resources/templates/mail/cancellation.html`
- `backend/src/main/resources/templates/mail/generic-text.txt`
- `backend/src/main/resources/templates/mail/generic.html`
- `backend/src/main/resources/templates/mail/payment-text.txt`
- `backend/src/main/resources/templates/mail/payment.html`
- `backend/src/main/resources/templates/mail/welcome-text.txt`
- `backend/src/main/resources/templates/mail/welcome.html`
- `backend/src/test/java/com/agence/voyage/notification/NotificationIntegrationTest.java`

### Migration

- `backend/src/main/resources/db/migration/V8__notifications.sql`

### Frontend et scripts de contrôle

- `frontend/accueil.html`
- `frontend/admin/index.html`
- `frontend/admin/js/app.js`
- `frontend/agent/index.html`
- `frontend/agent/js/app.js`
- `frontend/catalogue.html`
- `frontend/client/index.html`
- `frontend/client/js/app.js`
- `frontend/connexion.html`
- `frontend/js/core/auth.js`
- `frontend/offre.html`
- `frontend/panier.html`
- `frontend/supplier/index.html`
- `frontend/supplier/js/app.js`
- `scripts/frontend_smoke_test.mjs`
- `frontend/css/notifications.css`
- `frontend/js/core/notifications.js`
- `scripts/phase4_api_check.mjs`
- `scripts/phase4_browser_check.mjs`

### Documentation et configuration d'exemple

- `.env.example`
- `README.md`
- `docs/ETAT_COMPLET_PROJET.md`
- `docs/api_endpoints.md`
- `docs/architecture.md`
- `docs/migrations.md`
- `docs/postman/AtlasVoyage.postman_collection.json`
- `docs/notifications.md`
- `docs/rapport_phase4.md`


Références : [notifications.md](notifications.md), [API](api_endpoints.md#notifications--phase-4-7-endpoints),
[migrations](migrations.md#phase-4--v8-notifications), [Postman](postman/AtlasVoyage.postman_collection.json).
