# Migrations Flyway

## Source du schéma

Historique Phases 1–5 : Flyway gère le schéma avec Hibernate `validate`.
**Phase 6 : scripts manuels et `update` en dev ; `validate` conservé en prod.**
La procédure Phase 6 ci-dessous complète V1–V9 sans modifier leurs checksums.
`V1__baseline_schema.sql` consolide les entités existantes et les anciens scripts.
Les noms réels des disponibilités sont `available_from` et `available_until`.
MySQL 8 et MariaDB sont les cibles ; sauvegarder avant toute migration.

## Convention

Fichiers `backend/src/main/resources/db/migration/V<n>__description.sql`.
Les migrations Java éventuelles sont sous `db.migration`.
V2 élargit les statuts et convertit les paiements COMPLETED en PAID.
V3 ajoute les index manquants aux bases adoptées, sans dupliquer les index nommés.
Ne jamais modifier une migration déjà appliquée : ajouter une version suivante.
Conserver contraintes, index et conversions de données dans les migrations.
Flyway valide leurs checksums ; ne pas utiliser repair pour masquer une divergence.

## Base vide

Créer la base (ou utiliser createDatabaseIfNotExist en dev), configurer DB_URL,
puis démarrer. Flyway applique V1 et les versions suivantes avant Hibernate.
Le seeder de développement complète les données de manière idempotente.

## Adoption d'une base existante

1. Arrêter l'ancienne application et sauvegarder la base avec mysqldump.
2. Vérifier qu'elle correspond à l'ancienne version des entités (14 tables,
   disponibilités, modération, catégories, vols, voitures, restitution multiple,
   travel_criteria et discount_value). Une base plus ancienne nécessite d'abord
   une mise à niveau contrôlée à partir des archives.
3. Le profil dev active baseline-on-migrate=true, baseline-version=1.
   Sur un schéma non vide sans historique Flyway, V1 est marquée BASELINE,
   sans rejouer les CREATE TABLE et sans supprimer les données.
4. Les versions supérieures à 1 sont appliquées normalement.
5. Pour les phases historiques, Hibernate valide les colonnes. Appliquer ensuite
   les scripts Phase 6 avant de lancer cette version ; `update` est propre au dev.
6. Contrôler flyway_schema_history, les comptes et le nombre d'offres.

Prod n'effectue pas de baseline automatique : réaliser une opération Flyway
baseline explicite après audit/sauvegarde, puis déployer avec validate.
Baseline ne répare pas une base incomplète.

## Création d'une nouvelle migration

Ajouter une version supérieure, tester sur une base vide et une copie de la base
existante, exécuter validate, les tests et le smoke test. Documenter le rollback.

## Rollback manuel

Flyway Community n'exécute pas de migration descendante automatiquement.
Arrêter les écritures, sauvegarder, restaurer un snapshot testé ou appliquer
une migration compensatoire nouvelle. Pour les statuts de paiement, restaurer
les anciennes valeurs seulement si aucun statut nouveau n'est déjà utilisé.
Ne pas supprimer une entrée d'historique pour rejouer une migration.

## Tests H2

Le profil test utilise H2 MODE=MySQL avec create-drop et Flyway désactivé :
les ENUM/ALTER et métadonnées MySQL ne sont pas reproduits fidèlement par H2.
Les tests de service ne prouvent donc pas la validité de V1 sur MySQL.
Les vérifications d'intégration MySQL/MariaDB de Phase 1 couvrent cette limite.
Testcontainers MySQL est recommandé pour automatiser ces vérifications en CI.

## Archives

Voir [archive/sql-historique/README.md](archive/sql-historique/README.md).
Les scripts historiques ne doivent plus être exécutés sur une base gérée par Flyway.
Les quatre scripts Phase 6 constituent l'exception manuelle demandée pour cette phase :
ils se trouvent désormais dans `scripts/migrations/` sous les noms `V3__user_profiles_security.sql`,
`V4__supplier_profiles.sql`, `V5__password_reset_and_verify.sql` et `V6__file_assets.sql`
(numérotation propre à ce dossier, sans lien avec Flyway). Le dossier `backend/scripts/migrations`,
qui en contenait une copie au SQL équivalent, a été supprimé le 9 novembre 2026.

## Phase 6 — profils, comptes et images (scripts manuels)

Aucune V10 n'est ajoutée et les V1–V9 appliquées restent inchangées. La mission
Phase 6 demande JPA `ddl-auto=update` et des scripts SQL ; le profil dev suit cette
décision. Prod reste `validate`, test H2 `create-drop` et Flyway désactivé.

### Base existante

1. Arrêter l'application pour éviter des écritures concurrentes. Sauvegarder la
   base et le volume d'uploads, vérifier la restauration sur une copie.
   (Les scripts ci-dessous sont à exécuter **avant** le premier démarrage Phase 6
   sur une base existante ; ils ne modifient aucune migration Flyway V1 à V9.)
2. Depuis la racine, exécuter avec le client MySQL/MariaDB, dans cet ordre :

```powershell
# -p demande le mot de passe ; omettre -p seulement pour le compte local sans mot de passe.
mysql -u root -p travel_agency_db
```

Puis dans le client SQL :

```sql
SOURCE scripts/migrations/V3__user_profiles_security.sql;
SOURCE scripts/migrations/V4__supplier_profiles.sql;
SOURCE scripts/migrations/V6__file_assets.sql;
SOURCE scripts/migrations/V5__password_reset_and_verify.sql;
```

3. Le premier script ajoute les colonnes personnelles, marque **uniquement les
   utilisateurs déjà présents lors de l'ajout d'email_verified** comme vérifiés,
   initialise token_version seulement à la création de la colonne et conserve
   les mots de passe. Il doit précéder le premier démarrage Hibernate Phase 6.
4. Les suivants créent supplier_profiles, file_assets et les deux tables de jetons
   avec unicités/index/FK. Le script file_assets sait compléter orphaned_at si
   une version intermédiaire de la table existait déjà.
5. Démarrer en dev. Les seeders complètent les cinq profils fournisseurs ; les
   huit comptes initiaux et le client statistiques existant restent accessibles.
6. Contrôler les quatre profils, les comptes non vérifiés créés après migration,
   les versions de JWT et les volumes historiques de réservations/paiements.

Les scripts utilisent information_schema / CREATE TABLE IF NOT EXISTS et sont
répétables sur le schéma prévu. Leur commentaire « Ne pas exécuter deux fois sans
vérifier le schéma » reste applicable : inspecter les types/FK avant toute reprise.
Une répétition ne doit ni vérifier de nouveaux comptes, ni remettre token_version
à zéro. Ils ne sont pas destinés à rattraper une base historique arbitrairement ancienne.

Si Hibernate a déjà créé email_verified avant le script, la date de migration
ne permet plus de distinguer les comptes historiques des nouvelles inscriptions :
ne pas exécuter un UPDATE global ; identifier les comptes historiques depuis la
sauvegarde puis les vérifier explicitement. Les comptes de démo sont connus du seeder.

### Base vide et production

En dev, V1–V9 créent le schéma antérieur, Hibernate update ajoute la Phase 6, puis
les seeders idempotents peuplent les données. Pour une base de production vide,
préparer V1–V9 et les quatre scripts sur une base de pré-déploiement avant de
démarrer avec validate ; aucun contournement de validation en prod.
L'intégration bancaire de production reste une étape indépendante (sandbox interdit
en prod), comme dans la Phase 3.

### Retour arrière

Pas de suppression automatique de colonnes ni de jetons. Arrêter les écritures,
sauvegarder base + uploads, restaurer un snapshot cohérent ou déployer une correction
compatible. Les nouveaux JWT portent `tv` ; après restauration d'une ancienne
version, forcer une reconnexion et ne pas réutiliser de liens de sécurité.

## Phase 2 : V4 et V5

V1/V2/V3 existaient et restent inchangées. La mission demandait V2__bookings.sql :
ce numéro était déjà appliqué ; les nouvelles migrations sont donc des migrations
Java Flyway conditionnelles, V4__bookings et V5__legacy_bundle_items.

V4 utilise les métadonnées JDBC avant d'ajouter une colonne/index et CREATE TABLE
IF NOT EXISTS pour les nouvelles tables. Elle transforme les disponibilités
embarquées en lignes identifiées, autorise une capacité nulle, retire l'ancien
CHECK offre/bundle de Booking et ajoute snapshots, allocations et séquence.
Les colonnes historiques restent conservées et deviennent facultatives.

Les anciennes réservations reçoivent une référence, leurs montants et les dates
historiques connues (createdAt faute d'autre date). Les paiements sont repris.
Aucune allocation fictive n'est créée pour les anciennes réservations : l'ancien
module ne consommait pas ces disponibilités. Leur annulation ne doit donc pas
créditer une capacité jamais consommée. V5 ajoute les lignes fournisseur des
anciens bundles : le prix parent est conservé, réparti à l'adoption selon les
poids des offres disponibles à cette date, puis figé. Les nouvelles réservations
conservent leurs vrais snapshots et allocations dès la création.

Validation effectuée sur une base vide et une base reconstruite avec V1 sans
historique Flyway, peuplée d'une réservation et d'un paiement ancien COMPLETED.
Le baseline est 1, puis V2 à V5 s'appliquent, Hibernate reste en validate.
Le seeder peut être désactivé par APP_SEED_ENABLED=false pour un audit de copie.

Attention : MySQL/MariaDB peut valider le DDL immédiatement (commit implicite).
En cas de migration interrompue : sauvegarde/audit, terminer les opérations
conditionnelles contrôlées, puis procédure Flyway repair encadrée ; ne pas
supprimer l'historique pour rejouer une migration déjà réussie. Le retour à
l'ancienne application exige une restauration cohérente de sauvegarde, car
l'ancien Booking ne sait pas interpréter le panier multi-lignes.

### Contraintes historiques MariaDB et V6

Certaines bases créées par Hibernate possèdent plusieurs CHECK nommés
CONSTRAINT_1 dans des tables différentes. Une jointure de métadonnées par nom
seul peut alors retourner des doublons. LegacyBookingCheckCompatibility est un
callback Flyway exécuté uniquement AVANT V4 : il retire les anciens CHECK des
deux tables concernées avec une sélection par table, sans toucher les clés
étrangères. V4 ajoute la capacité non négative et V6 rétablit la contrainte
available_until > available_from si elle n'existe pas. Les versions V1 à V5
déjà appliquées ne sont pas modifiées.

Sur travel_agency_db, le premier essai a échoué avant création des réservations,
sur cette ambiguïté. Après sauvegarde, audit du DDL partiellement appliqué et
ajout du callback, Flyway.repair() a retiré l'entrée échouée (aucune migration
réussie supprimée). Le redémarrage a ensuite appliqué V4/V5/V6 normalement.
Cette réparation était ponctuelle et n'est pas exécutée automatiquement par
l'application. Sauvegarde locale ignorée par Git : backend/target/backup_main_before_phase2.sql.

## Phase 3 : V7 paiements

V7__payments.java est une migration Flyway Java JDBC compatible avec les tables
existantes. Elle détecte colonnes/index avant évolution, remplace l'ancienne
unicité Payment/Booking (OneToOne) par ManyToOne, convertit les montants en
DECIMAL(12,2), ajoute tentatives, réservations de remboursement, versions et dates.

Nouvelles tables : payment_events, webhook_events, idempotency_records, audit_logs.
Index : booking, statut, dates, provider_reference unique, couple client/key,
active_booking_id unique nullable ; contraintes de montant et de solde.
Triggers BEFORE UPDATE/DELETE sur événements/audit : historique append-only,
y compris hors JPA. L'utilisateur de migration doit avoir le droit CREATE TRIGGER.
Un compte de runtime dédié sans droits DDL est recommandé pour la production.

V7 crée un paiement cohérent pour toute réservation historique qui n'en a pas.
Les anciens ONLINE confirmés manuellement sont repris PAID avec marqueur MIGRATED
dans les événements ; cela reprend une décision historique, sans appel ni preuve
de débit bancaire. Les données de démonstration restent SANDBOX.
Les réservations en attente ont un placeholder PENDING, les expirées/annulées
non encaissées un paiement annulé. Une réservation gratuite est COMPLIMENTARY.
Les anciens champs de paiement reconnus sont conservés/convertis ; aucun compte
ou réservation n'est supprimé.

**Ne pas modifier V7 après application.** Toute correction ultérieure devient V8.
Ne pas exécuter de script manuel équivalent. ddl-auto=validate reste la règle
en dev/prod ; H2 test conserve create-drop sans Flyway.

Vérifications livraison : migration V1→V7 sur base vide isolée ; migration V6→V7
sur travel_agency_db après sauvegarde single-transaction ; redémarrage sans
duplication des quatre nouveaux exemples Sarah. MariaDB 10.4.32 via pilote MySQL
a été utilisé localement. CI MySQL 8 / Testcontainers reste recommandée.
Une restauration nécessite sauvegarde avant migration et arrêt de l'application :
les triggers protègent volontairement l'historique d'une suppression manuelle.

## Phase 4 : V8 notifications

V8__notifications.sql enrichit la table minimale existante : type, titre, lien,
read_at, référence et clé de déduplication, puis ajoute les index de lecture.
Les anciens messages sont conservés avec type SYSTEM et titre générique ;
l'état lu et les dates sont repris. La FK utilisateur est découverte par métadonnées
information_schema avant remplacement : son nom diffère entre Hibernate et V1.

Nouvelles tables : notification_preferences et notification_dispatches.
Unicités utilisateur/clé sur notification et dispatch. La suppression définitive
autorisée d'un compte cascade ses notifications, préférences et marqueurs.

Flyway applique V8 une seule fois. Les CREATE TABLE sont IF NOT EXISTS ; les ALTER
sont versionnés, pas à rejouer manuellement. V8 a été vérifiée sur base vide
atlas_phase4_empty_20261031 et base V7 existante travel_agency_db, sauvegardée avant
l'opération. Schéma toujours validate en dev/prod. Les tests H2 restent create-drop
sans Flyway. Le seeder répété ne duplique pas les notifications.

V8 est appliquée : ne pas la modifier.

## Phase 5 : V9 statistiques

`backend/src/main/java/db/migration/V9__stats_indexes.java` suit les migrations
Java d'adoption V3–V7 déjà en place. Elle vérifie colonnes/index par métadonnées
avant ajout ; aucun script manuel parallèle n'est à exécuter.

- users.created_at DATETIME(6) non nul ; les lignes anciennes sans date reçoivent
  l'instant UTC d'adoption et created_at_estimated=true. Ce marqueur empêche de
  présenter cette date technique comme une inscription réelle.
- users.created_at_estimated BIT non nul, défaut false pour les nouvelles lignes.
- Index users(role,created_at), bookings(status,created_at), bookings(client_id),
  booking_items(supplier_id), booking_items(offer_id), payments(status),
  offers(supplier_id,active), offer_availabilities(offer_id,available_until).
  Les noms physiques pluriels et available_until correspondent au schéma réel.
  Un index existant de même nom est conservé. Les entités portent les annotations
  correspondantes ; Hibernate reste en validate en dev/prod.

Avant adoption : sauvegarde single-transaction puis arrêt du Backend ; redémarrer
pour appliquer V9 et vérifier flyway_schema_history et /api/status. Une base vide
reçoit V1→V9 ; une base V8 reçoit seulement V9. Les tests H2 restent create-drop,
Flyway désactivé. Les anciennes migrations appliquées ne sont pas modifiées.
Rollback : restaurer la sauvegarde avec l'ancienne version de l'application,
ou créer une migration corrective ultérieure. Ne pas effacer l'historique Flyway.

V9 appliquée : toute correction ultérieure doit être une nouvelle migration V10.

## Scripts manuels de production (`scripts/migrations/`)

Depuis la Phase 6, aucune migration Flyway V10 ou supérieure n'a été créée : la chaîne Flyway (`db/migration` et `db.migration`) s'arrête à **V9**. Le schéma de production reste en `ddl-auto=validate` (ADR-0006) ; ses évolutions sont livrées sous forme de **scripts SQL manuels et idempotents**, rejouables sans erreur, exécutés dans l'ordre avant le déploiement de l'application. Leurs numéros sont propres au dossier `scripts/migrations/` et ne sont pas inscrits dans `flyway_schema_history`.

En développement, `ddl-auto=update` applique automatiquement les changements d'entités mais **ne supprime jamais de colonne** : un retrait de champ exige donc aussi un script.

| Script | Objet |
| :--- | :--- |
| V1 à V9 | Scripts historiques des phases 1 à 8 (numérotation propre à ce dossier, sans lien avec les migrations Flyway du même numéro). |
| `V10__enrich_city_and_remove_stock.sql` | Phase 9 : villes enrichies, normalisation sans doublons, suppression du stock. |
| `V11__security_refresh_tokens_and_lock.sql` | Phase 10 : table `refresh_tokens`, verrouillage de compte, colonnes `consent_at` et `consent_version` (retirées par V15), `marketing_opt_in`. |
| `V12__reviews_ratings_and_contact.sql` | Avis et notations, messages de contact. |
| `V14__i18n_user_preferences_offer_and_city_translations.sql` | Préférences de langue et devise, traductions d'offres et de villes. |
| `V15__remember_me_and_drop_consent.sql` | Ajoute `refresh_tokens.remember_me` ; supprime `users.consent_at` et `users.consent_version`. |

Il n'existe pas de V13.

### V15 — « Se souvenir de moi » et retrait du consentement (9 novembre 2026)

- **Pourquoi :** le choix « Se souvenir de moi » est conservé avec le refresh token à chaque rotation (`remember_me BOOLEAN NOT NULL DEFAULT TRUE`, donc les sessions déjà ouvertes restent persistantes) ; le consentement à l'inscription n'est plus recueilli, ses deux colonnes n'ont plus d'entité correspondante.
- **Exécution :** sauvegarder la base (`mysqldump`), puis `mysql -u <utilisateur> -p <base> < scripts/migrations/V15__remember_me_and_drop_consent.sql`. Le script s'appuie sur `information_schema` et peut être rejoué ; il a été exécuté (deux fois de suite) sur MariaDB via XAMPP, avec une syntaxe standard également compatible MySQL 8.
- **Ordre de déploiement :** exécuter V15 **avant** de démarrer la nouvelle version de l'application. En production (`validate`), la colonne `refresh_tokens.remember_me` doit exister, sans quoi le démarrage échoue. En développement, Hibernate crée seul `remember_me` ; seul V15 supprime les anciennes colonnes de consentement, qui restent sinon en base, inoffensives (nullables).
- **Retour arrière :** `ALTER TABLE users ADD COLUMN consent_at DATETIME(6) NULL, ADD COLUMN consent_version VARCHAR(50) NULL; ALTER TABLE refresh_tokens DROP COLUMN remember_me;` ne restaure que la structure : les valeurs de consentement supprimées ne sont pas récupérables autrement que par la sauvegarde.
