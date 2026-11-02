# Rapport de Contrôle d'Intégrité des Données SQL

> **Date d'exécution :** 2026-11-02T08:20:29.991Z  
> **Base de données testée :** `travel_agency_db` (MariaDB 10.4.32 / MySQL 8.0)  
> **Statut global :** ✅ 0 violation (Intégrité parfaite)  
> **Auteur :** Équipe QA & Release Management Atlas Voyage

---

## 1. Tableau Synthétique des Contrôles d'Intégrité

| Règle / Identifiant | Description de la Règle | Requête SQL Validée | Violations | Statut |
|---|---|---|:---:|:---:|
| **INT-01** | Absence de capacité résiduelle négative (Aucune survente possible) | `Conforme` | **0** | ✅ Réussi |
| **INT-02** | Cohérence des allocations actives (Réservations non annulées avec restored=0) | `Conforme` | **0** | ✅ Réussi |
| **INT-03** | Restitution systématique des capacités sur réservations annulées (restored=1) | `Conforme` | **0** | ✅ Réussi |
| **INT-04** | Absence de paiements orphelins sans réservation associée | `Conforme` | **0** | ✅ Réussi |
| **INT-05** | Règle d or financière : 100% des paiements libellés en Dirhams Marocains (MAD) | `Conforme` | **0** | ✅ Réussi |
| **INT-06** | Validité stricte des rôles applicatifs (RBAC) | `Conforme` | **0** | ✅ Réussi |
| **INT-07** | Spécialité obligatoire pour tous les comptes fournisseurs (SUPPLIER) | `Conforme` | **0** | ✅ Réussi |
| **INT-08** | Unicité et normalisation stricte des villes touristiques | `Conforme` | **0** | ✅ Réussi |
| **INT-09** | Absence de réservations avec un montant total incohérent ou négatif | `Conforme` | **0** | ✅ Réussi |

---

## 2. Démonstration de Non-Survente & Verrouillage Transactionnel

La règle d'or d'Atlas Voyage interdit formellement la surréservation. Le moteur JPA utilise un verrouillage pessimiste (`LockModeType.PESSIMISTIC_WRITE`) lors de la sélection des créneaux dans `BookingService`.

- Chaque réservation active décrémente directement le champ `capacity` de `OfferAvailability`.
- Une réservation est refusée dès que la capacité restante est inférieure à la demande (`ErrorCode.CAPACITY_EXCEEDED`).
- Lors d'une annulation, la capacité est intégralement restituée (`Math.addExact`) et l'allocation marquée `restored = 1`.

Résultat certifié en base : **0 disponibilité négative**, **0 incohérence d'allocation**.

---

## 3. Détail des Requêtes SQL Exécutées

```sql
-- INT-01 : Non-survente (aucun stock négatif)
SELECT id, offer_id, capacity, available_from, available_until FROM offer_availabilities WHERE capacity < 0;

-- INT-03 : Restitution des capacités après annulation
SELECT ba.id, ba.booking_item_id, b.status 
            FROM booking_allocations ba 
            JOIN booking_items bi ON bi.id = ba.booking_item_id 
            JOIN bookings b ON b.id = bi.booking_id 
            WHERE b.status = 'CANCELLED' AND ba.restored = 0;

-- INT-05 : Règle d'or financière MAD
SELECT id, booking_id, amount, currency FROM payments WHERE currency IS NOT NULL AND currency != 'MAD';

-- INT-07 : Fournisseurs spécialisés par catégorie
SELECT id, email, role FROM users WHERE role = 'SUPPLIER' AND supplier_category IS NULL;

-- INT-08 : Normalisation anti-doublon des villes
SELECT normalized_name, COUNT(*) as cnt FROM cities WHERE normalized_name IS NOT NULL AND normalized_name != '' GROUP BY normalized_name HAVING cnt > 1;
```
