# Manuels Utilisateurs par Rôle — Atlas Voyage

> **Statut :** ✅ Implémenté  
> **Date de mise à jour :** 2026-11-01  
> **Auteur :** Équipe Docs-as-Code & Produit Atlas Voyage  
> **Source de vérité :** Interfaces SPA (`frontend/`), Contrôleurs Spring Boot 3.3.4

---

## 1. Introduction

Atlas Voyage propose une expérience adaptée à chaque profil d'utilisateur au travers d'un portail public et de quatre espaces de travail dédiés (SPA avec routage par paramètre `?page=...`).

Ce dossier rassemble les guides opératoires complets, illustrés par des captures d'écran réelles, décrivant le fonctionnement pas-à-pas de la plateforme selon le rôle de l'utilisateur.

---

## 2. Sommaire des Guides par Rôle

| Manuel | Rôle Cible | Accès URL | Fonctionnalités Clés |
|---|---|---|---|
| [**Guide Visiteur & Invité**](invite.md) | Grand public non authentifié | [`/frontend/accueil.html`](http://127.0.0.1:5500/frontend/accueil.html) | Découverte du catalogue, recherche multi-critères, consultation détaillée, sélection de dates, devises et langues. |
| [**Manuel Client**](client.md) | Voyageur particulier (`CLIENT`) | [`/frontend/client/index.html`](http://127.0.0.1:5500/frontend/client/index.html) | Panier connecté, tunnel de commande en 4 étapes, téléchargement des vouchers PDF avec QR code, billetterie support SAV, avis après séjour, gestion du profil et RGPD. |
| [**Manuel Fournisseur**](fournisseur.md) | Partenaire hôtelier, aérien, loueur, transporteur, guide (`SUPPLIER`) | [`/frontend/supplier/index.html`](http://127.0.0.1:5500/frontend/supplier/index.html) | Wizard de création d'offres en 4 étapes, gestion fine du calendrier des disponibilités datées, réponse aux avis clients, tableau de bord des ventes et export CSV. |
| [**Manuel Agent**](agent.md) | Conseiller commercial en agence (`AGENT`) | [`/frontend/agent/index.html`](http://127.0.0.1:5500/frontend/agent/index.html) | Encaissement d'espèces en agence (avec reçu comptable), création et gestion des packages touristiques (bundles), assistance client et traitement des tickets SAV. |
| [**Manuel Administrateur**](admin.md) | Superviseur & Manager (`ADMIN`) | [`/frontend/admin/index.html`](http://127.0.0.1:5500/frontend/admin/index.html) | Gestion et déverrouillage des comptes utilisateurs, modération des offres et avis signalés, consultation du journal d'audit immuable, paramétrage global et mode maintenance. |

---

## 3. Matrice des Droits d'Accès par Écran

| Écran / Page | Invité | Client | Fournisseur | Agent | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Consultation Catalogue & Détail Offre | ✅ | ✅ | ✅ | ✅ | ✅ |
| Panier & Finalisation Réservation | ✅ (invite) | ✅ | ❌ | ❌ | ❌ |
| Téléchargement Voucher PDF & QR | ❌ | ✅ (ses commandes) | ❌ | ✅ | ✅ |
| Création & Modification d'Offres | ❌ | ❌ | ✅ (sa catégorie) | ❌ | ✅ (modération) |
| Encaissement Espèces en Agence | ❌ | ❌ | ❌ | ✅ | ✅ |
| Composition de Bundles | ❌ | ❌ | ❌ | ✅ | ✅ |
| Journal d'Audit & Paramètres Système | ❌ | ❌ | ❌ | ❌ | ✅ |
