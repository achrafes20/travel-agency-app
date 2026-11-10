# Tableaux de bord réels — Phase 5

Les quatre espaces utilisent `frontend/js/core/stats.js` et les données de
`GET /api/stats/{admin,supplier,agent,client}`. Booking, Payment et Notification
étaient déjà opérationnels : aucun second module métier n'a été créé.
Les pages Réservations conservent leurs listes complètes et leurs actions.

## Contrats

| GET | Accès | Résultat |
|---|---|---|
| /api/stats/admin | ADMIN | Utilisateurs, réservations, CA, tops, promos, alertes |
| /api/stats/supplier | SUPPLIER | Offres et lignes du sujet JWT uniquement |
| /api/stats/agent | AGENT ou ADMIN | Réservations et encaissements opérationnels |
| /api/stats/client | CLIENT | Voyages, dépenses et notifications personnels |
| /api/stats/admin/export/bookings.csv | ADMIN | Réservations filtrées |
| /api/stats/admin/export/revenue.csv | ADMIN | Série du CA complète |

Toutes acceptent `period=7d|30d|12m`, défaut `30d` ; autre valeur : 400 BAD_REQUEST.
Chaque JSON contient `period`, `from`, `to` (dates inclusives), `generatedAt`
(ISO avec décalage), `timezone: Africa/Casablanca`, `currency: MAD`.
Les erreurs utilisent ApiError ; les réponses privées, y compris 401/403,
portent `Cache-Control: no-store`. L'identité provient exclusivement du JWT.

Un KPI est `{value,previous,changePercent}`. La variation est null si la base
vaut zéro ou est inconnue. Un point est `{key,label,bookings,revenue}`.

- Admin : `users.{total,newUsers,byRole,active,archived,estimatedCreationDates}`,
  `bookings.{total,byStatus,series}`, `revenue.{total,pendingRevenue,averageOrder,series}`,
  `topDestinations[]`, `topOffers[]`, `promoCodes[]`, `alerts[]`.
- Fournisseur : `fullName`, `offers.{total,active,inactive}`, `bookings`,
  `bookingsThisMonth`, `revenue`, `revenueSixMonths[]`,
  `availabilityChecks.{count,items[]}`, `recentBookings[]`, `recentActivity[]`.
- Agent : `pendingBookings`, `cashPendingCount`, `cashPendingAmount`,
  `tickets.{available,count,items}`, `bookingsToday`, `recentBookings[]`,
  `upcomingPayments[]`.
- Client : `fullName`, `nextTrip` ou null, `recentBookings[]`,
  `notifications.{available,count,items[]}`, `totals.{bookings,spent}`,
  `bookingsInPeriod`, `spentInPeriod`.

Listes récentes et tops : cinq éléments ; promos et disponibilités : vingt.
`availabilityChecks.count` reste le total complet. Aucun e-mail, mot de passe
ou token n'apparaît dans les DTO statistiques.

## Performance et cache

StatsRepository utilise des agrégats SQL scalaires COUNT DISTINCT/SUM/GROUP BY,
sans charger d'entités pour compter ou sommer et sans requête par ligne.
Les frontières UTC des tranches sont calculées par les règles Java du fuseau
Casablanca ; aucune table de fuseaux SQL n'est requise.

Cache Caffeine `adminStats` : trois entrées, clé période, TTL deux minutes après
écriture, calcul simultané mutualisé. Le service vérifie rôle/compte avant
l'accès au cache. Aucun cache client/fournisseur/agent. Invalidation après commit
sur créations/confirmations/annulations, paiements réussis/échoués, inscriptions
et modérations ; invalidation aussi à la clôture. Autres modifications et SQL
direct : délai maximal deux minutes. Actualiser ne contourne pas le TTL.
Le cache est local à l'instance, sans cohérence distribuée immédiate.

## CSV sûrs

bookings.csv accepte `from=YYYY-MM-DD`, `to=YYYY-MM-DD` et un `status` Booking
valide. Dates inclusives, ordonnées, au plus 24 mois ; dates absentes remplacées
par celles de period. Validation avant de démarrer le flux.

- UTF-8 BOM, séparateur `;`, CRLF, en-têtes français, dates ISO, MAD TTC à deux
  décimales avec point. Toutes les cellules sont citées ; guillemets doublés.
- Textes commençant par =, +, -, @, tabulation, CR ou LF préfixés d'une apostrophe,
  y compris après espaces. Montants numériques conservés comme nombres.
- Attachment horodaté, `X-Export-Max-Rows: 50000`, maximum 50 000 réservations
  triées par création/id. Curseur JDBC forward-only, streaming MySQL, flush 500.
  Pas de liste complète en mémoire ; export CA borné à 7/30/12 points.
- La prestation exportée est un titre représentatif (premier alphabétique),
  pas un détail de toutes les lignes du panier.
- Le navigateur utilise Bearer, fetch puis blob ; les erreurs restent visibles.

## Interface

Chart.js **4.4.8** est épinglé sur jsDelivr ([version officielle](https://github.com/chartjs/Chart.js/releases/tag/v4.4.8)). Instances détruites au changement
de période ou de page. AbortController et numéro de requête empêchent une
ancienne réponse d'écraser la nouvelle. Sélecteur 7 j/30 j/12 mois dans l'URL,
boutons natifs au clavier, aria-pressed, aria-busy, Actualiser.

DOM dynamique par textContent, graphiques adaptatifs, cartes empilées sur mobile,
tableaux défilants et variations avec flèche/texte. Squelettes de chargement,
états vides explicites, erreurs avec Réessayer. Échec CDN : message local au
graphique, cartes et listes conservées. Tickets : `available:false`, zéro,
liste vide et **Bientôt disponible** car aucune entité Ticket n'existe.
Notifications : `available:true`, vraies données du module Phase 4.

Tableau de bord **client** (9 novembre 2026) : l'écran n'affiche que les quatre cartes
d'indicateurs et la liste « Mes dernières réservations » en pleine largeur. La ligne
« Du … au … · fuseau · actualisé le … » et les mentions « aucune base de variation » sont
masquées pour ce rôle, de même que toutes les mentions « Période précédente : … » et le bouton
« Actualiser » (les boutons 7 jours / 30 jours / 12 mois rechargent déjà les données) ; la
ligne de variation (« En hausse de … % ») reste affichée. Les panneaux « Mon prochain voyage »
et « Notifications non lues » sont retirés. L'API `GET /api/stats/client` renvoie toujours `nextTrip` et `notifications`
(contrat inchangé) ; l'interface ne les lit plus. Les trois autres rôles gardent leur affichage.

## Migration et exemples

V9 ajoute dates utilisateur et index ; [procédure Flyway](migrations.md).
`ddl-auto=validate` reste la règle dev/prod.

StatsDemoSeeder est exécuté après DataSeeder, uniquement en dev avec
`app.seed.enabled=true`. Cinq réservations par mois sur les douze derniers mois
(jusqu'à 60 au premier lancement selon la capacité) : références `DEMO-STATS-YYYYMM-i`, notes uniques
`demo:stats:YYYY-MM:i`. Aucun doublon au redémarrage ; un nouveau mois ajoute ses
cinq exemples sans effacer l'historique. Deux promos DEMO sont ajoutées.
Un second client `client.stats.demo@atlasvoyage.test` utilise le mot de passe
démo configuré (password123 par défaut). Les huit anciens comptes sont conservés.

L'import historique ne revalide pas les dates passées contre les critères actuels
des offres/vols. Snapshots, montants Booking/lignes/Payment et allocations sont
cohérents. Les périodes existantes sont réutilisées sans chevauchement ; manque
de capacité : exemple ignoré, sans augmenter une capacité existante. Annulés et
expirés ont leurs allocations restituées. Les paiements restent SANDBOX avec
événements/audit DEMO, sans appel bancaire ni e-mail artificiel. Les jobs normaux
peuvent ensuite expirer l'exemple PENDING.

## Contrôles

StatsIntegrationTest couvre calculs, mutations, périodes, sécurité, isolation,
cache, CSV et idempotence du seeder. Scripts Phase 5 : API et navigateur sur base
MySQL/MariaDB isolée. Commandes, résultats et fichiers dans
[rapport_phase5.md](archive/rapport_phase5.md).
