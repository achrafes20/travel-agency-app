-- Conserve les critères saisis lors de la recherche avec chaque ligne du panier.
ALTER TABLE cart_items
    ADD COLUMN travel_criteria VARCHAR(4000) NULL;
