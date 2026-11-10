-- Un fournisseur est limité à une seule famille d'offres.
ALTER TABLE users ADD COLUMN supplier_category VARCHAR(40) NULL;

UPDATE users
SET supplier_category = 'HOTEL'
WHERE role = 'SUPPLIER' AND supplier_category IS NULL;
