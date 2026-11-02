# ADR-0002 : Gestion des disponibilités par périodes datées plutôt qu'un stock statique

> **Date :** 1er novembre 2026 | **Statut :** Accepté  
> **Décideurs :** Équipe d'Ingénierie & Architecture Atlas Voyage  
> **Contexte de référence :** Phases 1 à 14

---

## 1. Contexte et Problématique

Le voyage est un produit périssable par nature : une chambre d'hôtel ou un siège de vol n'a de valeur qu'à une date et heure données.
L'ancien modèle utilisant un entier `stock` créait des conflits majeurs : vendre une chambre le 15 août ne devait pas bloquer la réservation de la même chambre le 20 août.

---

## 2. Décision Prise

Supprimer tout décompte par stock global et introduire l'entité `OfferAvailability` associant chaque offre à des intervalles temporels [startAt, endAt] dotés d'une capacité numérique unitaire. Le champ historique `stock` est définitivement retiré (Phase 9).

---

## 3. Conséquences

Avantages :
- Modèle temporel rigoureux et réaliste pour l'industrie du voyage.
- Vérification instantanée de capacité résiduelle sans survente.
- Support natif des périodes de haute et basse saison.
Inconvénients :
- Requêtes de réservation nécessitant une vérification de chevauchement d'intervalles et verrouillage pessimiste (`PESSIMISTIC_WRITE`).

---

## 4. Alternatives Envisagées et Raisons du Rejet

1. Stock statique : Rejeté pour incompatibilité absolue avec la notion de calendrier touristique.
2. Système de créneaux fixes par jour (Allotement hôtelier pur) : Moins flexible pour les circuits ou transferts à l'heure.
