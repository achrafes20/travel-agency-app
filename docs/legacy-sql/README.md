# Scripts SQL d'archive (Migrations Manuelles Historiques)

Ce répertoire conserve les anciens scripts SQL manuels utilisés avant la consolidation des migrations ordonnées dans Flyway (`V1` à `V10`).

> [!NOTE]
> **Source unique de vérité pour les migrations :**
> Toutes les migrations officielles sont désormais versionnées et exécutées automatiquement par Flyway dans :
> `backend/src/main/resources/db/migration/`
> - `V1__baseline_schema.sql` : Schéma de base consolidé
> - `V2__booking_payment_foundation.sql` : Réservations et socle paiements
> - `V3__user_profiles_security.sql` : Profils utilisateurs et sécurité avancée
> - `V4__supplier_profiles.sql` : Profils détaillés fournisseurs
> - `V5__password_reset_and_verify.sql` : Jetons de reset et vérification email
> - `V6__file_assets.sql` : Gestion des fichiers et quotas
> - `V7__tickets.sql` : Tickets de support et messages
> - `V8__notifications.sql` : Notifications et préférences
> - `V9__favorites_audit_settings.sql` : Favoris, audit logs et paramètres système
> - `V10__enrich_city_and_remove_stock.sql` : Référentiel villes enrichi, normalisation anti-doublon, suppression de stock et destinations

## Contenu de cette archive
- Migrations initiales de modération, critères de recherche vols/voitures et contraintes promo.
- Scripts de migration individuels de phases 6, 7 et 8 consolidés dans Flyway.
- Ces fichiers ne doivent plus être exécutés directement en production.

