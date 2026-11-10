# Manuel Utilisateur — Espace Administrateur

> **Statut :** ✅ Implémenté  
> **Date de mise à jour :** 2026-11-10  
> **Profil :** Superviseur & Administrateur Global (`ROLE_ADMIN`)  
> **Point d'entrée :** `http://127.0.0.1:5500/frontend/admin/index.html`

---

## 1. Vue d'Ensemble & Supervision Globale

Le tableau de bord administrateur consolide l'activité de l'ensemble de la plateforme sur une période au choix (7 jours, 30 jours ou 12 mois) :

![Tableau de bord Administrateur](../assets/screenshots/admin/01-dashboard.png)

- Trois indicateurs : **Utilisateurs**, **Chiffre d'affaires TTC** et **Panier moyen confirmé**, avec leur variation.
- Répartition des utilisateurs par rôle (`CLIENT`, `SUPPLIER`, `AGENT`, `ADMIN`) et des réservations par statut.
- Destinations et offres les plus réservées sur la période.
- Panneau **« Exporter les données »** : export CSV des réservations (période et statut au choix).

**Navigation :** l'en-tête bleu regroupe le menu, le logo, la devise, la cloche des notifications et le compte ; le menu latéral, titré « ESPACE ADMINISTRATEUR », est organisé en Pilotage, Gestion, Activité et Système. Un clic sur votre nom ouvre un menu de raccourcis (Tableau de bord, Réservations, Paiements, Tickets de support, Mon profil) avec **Déconnexion**.

---

## 2. Gestion des Utilisateurs & Déverrouillage de Compte

![Gestion des Utilisateurs](../assets/screenshots/admin/02-utilisateurs.png)

Dans l'onglet **« Utilisateurs »** :
- **Recherche & Filtrage :** Filtrez par rôle, statut de compte (`ACTIVE`, `ARCHIVED`, `LOCKED`) ou adresse email.
- **Création d'agents et administrateurs :** Provisionnez de nouveaux collaborateurs avec affectation stricte des privilèges.
- **Déverrouillage anti-brute-force :** Si un utilisateur est bloqué suite à 5 tentatives de mot de passe infructueuses, cliquez sur le bouton **« Déverrouiller le compte »** pour réinitialiser son compteur immédiatement.

---

## 3. Modération des Offres & Avis Clients

![Modération des Offres](../assets/screenshots/admin/03-moderation.png)

- **Offres en attente (`PENDING`) :** Vérifiez l'adéquation des tarifs, la qualité des photos et la cohérence des disponibilités avant validation (`APPROVED`) ou rejet avec motif explicatif (`REJECTED`).
- **Avis signalés par la communauté :** Lorsqu'un commentaire est jugé déplacé ou injurieux, arbitrez la publication ou la censure de l'avis. Chaque action de modération est consignée dans l'audit.

---

## 4. Journal d'Audit Immuable (Audit Log)

![Journal d'Audit Immuable](../assets/screenshots/admin/04-audit.png)

Le journal d'audit enregistre de façon irréversible (*append-only*) toute action sensible réalisée sur la plateforme :
- Authentifications, échecs répétés et verrouillages.
- Modifications de tarifs ou de statuts d'offres.
- Remboursements bancaires partiels ou totaux.
- Changements de paramètres système.
- **Export CSV sécurisé :** Téléchargez l'historique complet pour transmission aux commissaires aux comptes ou auditeurs de sécurité.

---

## 5. Réservations, Paiements & Tickets

- **Réservations :** filtrez par statut, par « Référence ou client », par dates, par statut de paiement et par fournisseur ; « Voir » ouvre la fiche (chronologie, prestations, totaux, annulation ou confirmation). Les remboursements ne se font pas depuis la fiche.
- **Paiements :** le détail d'un paiement payé propose **« Rembourser »** (total ou partiel, avec motif) ; un paiement à l'arrivée en attente propose **« Encaisser »**.
- **Tickets :** vue d'ensemble de toutes les demandes, assignation à un agent et changement de statut ; une note interne est repérée par le libellé « Note interne » et n'est jamais visible du demandeur.

---

## 6. Paramètres Système & Mode Maintenance

![Paramètres Globaux du Système](../assets/screenshots/admin/05-parametres.png)

La page **« Paramètres globaux »** regroupe six règles ; chacune s'enregistre avec « Sauvegarder », ou toutes ensemble avec « Enregistrer tout » (« Annuler » restaure les valeurs enregistrées). Chaque modification est journalisée dans l'audit et prend effet immédiatement :
- **Délai d'annulation client** (en heures, de 0 à 720) ;
- **Paiement à l'arrivée (Espèces)** : autorise ou non ce mode de règlement ;
- **Devise par défaut de la plateforme** ;
- **Nombre maximum d'images par offre** (de 1 à 10) ;
- **Mode maintenance global** et **message de maintenance** : en cas d'intervention technique programmée, activez le mode maintenance en 1 clic ; les utilisateurs reçoivent un écran explicatif tout en conservant l'accès d'administration.
