-- Données de démonstration : rend le code ETE2026 expiré.
-- L'API refuse de créer un code déjà expiré (règle métier), donc le seed le crée avec une date future
-- et ce script recule la date en base. À lancer une fois, après scripts/seed_demo_data.py :
--     mysql -u root travel_agency_db < scripts/demo_expire_promo.sql
USE travel_agency_db;

UPDATE promo_codes SET expiry_date = DATE_SUB(CURDATE(), INTERVAL 5 DAY) WHERE code = 'ETE2026';
