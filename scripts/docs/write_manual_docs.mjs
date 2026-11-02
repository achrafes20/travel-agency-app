import fs from 'node:fs';
import path from 'node:path';

const manDir = path.resolve('docs/manuel');
if (!fs.existsSync(manDir)) {
  fs.mkdirSync(manDir, { recursive: true });
}

// 1. README.md
const readme = `# Manuels Utilisateurs par Rôle — Atlas Voyage

> **Statut :** ✅ Implémenté  
> **Date de mise à jour :** 2026-11-01  
> **Auteur :** Équipe Docs-as-Code & Produit Atlas Voyage  
> **Source de vérité :** Interfaces SPA (\`frontend/\`), Contrôleurs Spring Boot 3.3.4

---

## 1. Introduction

Atlas Voyage propose une expérience adaptée à chaque profil d'utilisateur au travers d'un portail public et de quatre espaces de travail dédiés (SPA avec routage par paramètre \`?page=...\`).

Ce dossier rassemble les guides opératoires complets, illustrés par des captures d'écran réelles, décrivant le fonctionnement pas-à-pas de la plateforme selon le rôle de l'utilisateur.

---

## 2. Sommaire des Guides par Rôle

| Manuel | Rôle Cible | Accès URL | Fonctionnalités Clés |
|---|---|---|---|
| [**Guide Visiteur & Invité**](invite.md) | Grand public non authentifié | [\`/frontend/accueil.html\`](http://127.0.0.1:5500/frontend/accueil.html) | Découverte du catalogue, recherche multi-critères, consultation détaillée, sélection de dates, devises et langues. |
| [**Manuel Client**](client.md) | Voyageur particulier (\`CLIENT\`) | [\`/frontend/client/index.html\`](http://127.0.0.1:5500/frontend/client/index.html) | Panier connecté, tunnel de commande en 4 étapes, téléchargement des vouchers PDF avec QR code, billetterie support SAV, avis après séjour, gestion du profil et RGPD. |
| [**Manuel Fournisseur**](fournisseur.md) | Partenaire hôtelier, aérien, loueur, transporteur, guide (\`SUPPLIER\`) | [\`/frontend/supplier/index.html\`](http://127.0.0.1:5500/frontend/supplier/index.html) | Wizard de création d'offres en 4 étapes, gestion fine du calendrier des disponibilités datées, réponse aux avis clients, tableau de bord des ventes et export CSV. |
| [**Manuel Agent**](agent.md) | Conseiller commercial en agence (\`AGENT\`) | [\`/frontend/agent/index.html\`](http://127.0.0.1:5500/frontend/agent/index.html) | Encaissement d'espèces en agence (avec reçu comptable), création et gestion des packages touristiques (bundles), assistance client et traitement des tickets SAV. |
| [**Manuel Administrateur**](admin.md) | Superviseur & Manager (\`ADMIN\`) | [\`/frontend/admin/index.html\`](http://127.0.0.1:5500/frontend/admin/index.html) | Gestion et déverrouillage des comptes utilisateurs, modération des offres et avis signalés, consultation du journal d'audit immuable, paramétrage global et mode maintenance. |

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
`;

// 2. invite.md
const invite = `# Guide Utilisateur — Visiteur & Invité

> **Statut :** ✅ Implémenté  
> **Date de mise à jour :** 2026-11-01  
> **Profil :** Visiteur non authentifié (Grand Public)  
> **Point d'entrée :** \`http://127.0.0.1:5500/frontend/accueil.html\`

---

## 1. Parcours de Découverte

En tant que visiteur d'Atlas Voyage, vous pouvez explorer librement l'intégralité du catalogue touristique marocain sans obligation de créer un compte préalable.

![Page d'accueil Atlas Voyage](../assets/screenshots/invite/01-accueil.png)

### Actions Principales depuis l'Accueil :
1. **Recherche rapide :** Sélectionnez votre destination (Marrakech, Agadir, Fès, Tanger, Casablanca...), votre type de séjour et vos dates de voyage.
2. **Sélecteur de langue & devise :** En haut à droite, basculez entre Français (\`FR\`), Anglais (\`EN\`) ou Arabe (\`AR\` avec affichage RTL) et choisissez votre devise indicative de consultation (MAD, EUR, USD, GBP).
3. **Thème d'affichage :** Activez le mode sombre (icône Lune) ou clair selon votre confort visuel.

---

## 2. Exploration du Catalogue & Filtres

![Catalogue des Offres Touristiques](../assets/screenshots/invite/02-catalogue.png)

Le catalogue regroupe l'ensemble des offres publiées et validées par les modérateurs :
- **Filtres par catégorie :** Hôtels & Riads, Vols, Locations de Voitures, Taxis & Transferts, Excursions.
- **Filtres par facettes :** Fourchette de prix en MAD, note moyenne minimale (étoiles), ville ou aéroport de départ.
- **Tri dynamique :** Par popularité, prix croissant, prix décroissant ou note des voyageurs.

---

## 3. Consultation d'une Offre & Disponibilités

![Fiche détaillée d'une offre](../assets/screenshots/invite/03-detail-offre.png)

Sur la fiche détaillée de la prestation :
1. **Galerie photos & Lightbox :** Cliquez sur les images pour ouvrir la visionneuse plein écran avec zoom et défilement clavier/tactile.
2. **Carte interactive (Leaflet) :** Localisez précisément l'hôtel ou le point de départ de l'excursion.
3. **Sélection de période :** Le calendrier interactif affiche uniquement les dates disposant d'une capacité disponible.
4. **Ajout au panier :** Choisissez le nombre de personnes et cliquez sur **« Ajouter au panier »**.

---

## 4. Panier & Connexion

![Panier d'achats](../assets/screenshots/invite/04-panier.png)

Le panier conserve vos articles sélectionnés. Pour valider votre commande et procéder au paiement ou à la réservation avec paiement sur place, la plateforme vous invite à vous connecter ou à créer votre compte en 1 minute.

![Écran de connexion et inscription](../assets/screenshots/invite/05-connexion.png)
`;

// 3. client.md
const client = `# Manuel Utilisateur — Espace Client

> **Statut :** ✅ Implémenté  
> **Date de mise à jour :** 2026-11-01  
> **Profil :** Voyageur particulier (\`ROLE_CLIENT\`)  
> **Point d'entrée :** \`http://127.0.0.1:5500/frontend/client/index.html\`

---

## 1. Tableau de Bord Client

Dès votre connexion, votre espace client vous présente une vue synthétique de vos projets de voyage :

![Tableau de bord Client](../assets/screenshots/client/01-dashboard.png)

- **Indicateurs clés :** Nombre de réservations à venir, séjours terminés, solde des devis et points d'attention.
- **Raccourcis rapides :** Accès direct au catalogue, à vos vouchers PDF et à vos tickets de support.
- **Cloche de notifications :** Alertes de confirmation de commande, rappels de séjour à J-3 et réponses du support client.

---

## 2. Gestion des Réservations & Bons d'Échange (Vouchers)

![Mes Réservations](../assets/screenshots/client/02-reservations.png)

Dans l'onglet **« Mes Réservations »** :
1. **Détail de la commande :** Référence unique (\`BK-AAAA-NNNNNN\`), liste des prestations, dates exactes et statut financier.
2. **Téléchargement du Voucher PDF :** Cliquez sur l'icône Document pour générer votre bon d'échange officiel avec QR code signé cryptographiquement. À présenter au fournisseur lors de votre arrivée.
3. **Annulation en ligne :**
   - **> 48 heures avant le début :** Annulation gratuite avec remboursement intégral automatique.
   - **Entre 24h et 48h :** Indemnité forfaitaire de 50%, remboursement du solde.
   - **< 24 heures :** Aucun remboursement (frais de 100%).

---

## 3. Tunnel de Commande en 4 Étapes

![Tunnel de Commande Checkout](../assets/screenshots/client/03-checkout.png)

Le tunnel interactif sécurisé (\`av-stepper\`) guide la finalisation :
1. **Étape 1 - Panier :** Récapitulatif des articles, ajustement des quantités et application d'un code promotionnel éventuel.
2. **Étape 2 - Coordonnées :** Vérification des informations des voyageurs et contact d'urgence.
3. **Étape 3 - Options :** Sélection du mode de règlement (Carte bancaire immédiate ou Espèces en agence / Paiement à l'arrivée si autorisé par les prestataires).
4. **Étape 4 - Règlement sécurisé :** Paiement en ligne simulé (environnement de démonstration Sandbox sans débit bancaire réel).

---

## 4. Billetterie de Support (SAV)

![Mes Tickets de Support](../assets/screenshots/client/04-tickets.png)

En cas de question ou de demande de modification sur un voyage :
- Cliquez sur **« Nouveau ticket »**, renseignez le sujet, la catégorie (Réservation, Paiement, Réclamation) et le message.
- Échangez directement avec les conseillers Atlas Voyage au sein d'un fil de discussion persistant et horodaté.
- Recevez une notification instantanée dès qu'un agent ou administrateur vous répond.

---

## 5. Profil, Sécurité & Droits RGPD

![Gestion du Profil Client](../assets/screenshots/client/05-profil.png)

Dans l'onglet **« Mon Compte »** :
- **Préférences régionales :** Choisissez votre langue préférée (FR, EN, AR) et devise par défaut.
- **Sécurité :** Changement de mot de passe renforcé (12 caractères minimum, 3 classes).
- **Protection des données (Loi 09-08 / RGPD) :**
  - **Exportation des données :** Téléchargez une copie intégrale au format JSON de toutes vos informations enregistrées.
  - **Suppression du compte :** Demandez l'anonymisation irréversible et la suppression de votre compte conformément à la loi.
`;

// 4. fournisseur.md
const fournisseur = `# Manuel Utilisateur — Espace Fournisseur

> **Statut :** ✅ Implémenté  
> **Date de mise à jour :** 2026-11-01  
> **Profil :** Prestataire Touristique Spécialisé (\`ROLE_SUPPLIER\`)  
> **Point d'entrée :** \`http://127.0.0.1:5500/frontend/supplier/index.html\`

---

## 1. Spécialisation Métier & Tableau de Bord

Chaque fournisseur est rattaché à une catégorie exclusive déterminée lors de son inscription :
- **HÔTELS & RIADS :** Hébergements touristiques, chambres d'hôtes.
- **VOLS :** Liaisons aériennes intérieures et internationales.
- **VOITURES :** Flottes de location de véhicules.
- **TAXIS / TRANSFERTS :** Navettes privées et transferts aéroports.
- **EXCURSIONS / ACTIVITÉS :** Randonnées, circuits guidés, sports et bien-être.

![Tableau de bord Fournisseur](../assets/screenshots/fournisseur/01-dashboard.png)

Le tableau de bord présente en temps réel :
- Le nombre total d'offres en ligne et en attente de modération.
- Le taux d'occupation et les réservations récentes associées à vos prestations.
- Les alertes de stock faible lorsque la capacité disponible passe sous le seuil critique.

---

## 2. Création d'Offre — Le Wizard en 4 Étapes

![Wizard de création d'offre](../assets/screenshots/fournisseur/02-wizard-offre.png)

Pour publier une nouvelle prestation, cliquez sur **« Déposer une offre »** :
1. **Étape 1 - Informations Générales & Traductions :**
   - Titre, description détaillée et ville d'exécution.
   - Saisie multilingue optionnelle (Français, Anglais, Arabe) via les onglets dédiés.
2. **Étape 2 - Tarification & Attributs Spécifiques :**
   - Prix de base en MAD TTC.
   - Attributs selon spécialité : nombre d'étoiles et type de chambre (Hôtel), aéroport et compagnie (Vol), catégorie de véhicule et carburant (Voiture), itinéraire (Taxi), durée et niveau de difficulté (Excursion).
3. **Étape 3 - Galerie Photos & Médias :**
   - Téléversement d'images haute définition (max 5 Mo par photo).
4. **Étape 4 - Périodes de Disponibilité :**
   - Définition des plages de dates (ex. du 01/12 au 15/12) et de la capacité maximale réservable par créneau.

> [!NOTE]
> Une fois soumise, l'offre passe au statut \`PENDING\` pour validation administrative. Vous êtes notifié dès sa mise en ligne.

---

## 3. Gestion des Disponibilités & Calendrier

![Calendrier des Disponibilités](../assets/screenshots/fournisseur/04-disponibilites.png)

- Visualisez les périodes actives pour chacune de vos prestations.
- Ajustez les capacités restantes ou bloquez exceptionnellement des dates en cas d'indisponibilité.
- Le système garantit l'absence totale de surréservation (overbooking) grâce à son verrouillage transactionnel strict.

---

## 4. Statistiques de Ventes & Réponse aux Avis

![Statistiques Commerciales](../assets/screenshots/fournisseur/05-stats.png)

- **Indicateurs financiers :** Chiffre d'affaires généré en MAD, volume de nuitées/places vendues, panier moyen.
- **Gestion de la réputation :** Consultez les notes et commentaires déposés par les clients ayant séjourné chez vous.
- **Droit de réponse :** Déposez une réponse officielle visible publiquement sous l'avis client.
`;

// 5. agent.md
const agent = `# Manuel Utilisateur — Espace Agent de Voyage

> **Statut :** ✅ Implémenté  
> **Date de mise à jour :** 2026-11-01  
> **Profil :** Conseiller Commercial & Gestionnaire Guichet (\`ROLE_AGENT\`)  
> **Point d'entrée :** \`http://127.0.0.1:5500/frontend/agent/index.html\`

---

## 1. Rôle & Missions de l'Agent

L'agent de voyage est le pivot opérationnel d'Atlas Voyage en agence physique ou support client centralisé :
1. **Encaissement des paiements en espèces au guichet.**
2. **Création et commercialisation de packages touristiques (Bundles combinés).**
3. **Assistance clientèle de niveau 1 & 2 via la billetterie de support.**

![Tableau de bord Agent](../assets/screenshots/agent/01-dashboard.png)

---

## 2. Encaissement des Paiements en Espèces (Cash Payment)

![Guichet d'encaissement d'espèces](../assets/screenshots/agent/02-encaissement.png)

Lorsqu'un voyageur se présente en agence avec une réservation en attente de paiement à l'arrivée :
1. Ouvrez l'onglet **« Paiements Espèces »**.
2. Recherchez le dossier par **nom du client** ou **référence de réservation** (\`BK-AAAA-NNNNNN\`).
3. Vérifiez le montant exact dû en Dirhams Marocains (MAD TTC).
4. Cliquez sur **« Encaisser le règlement »** :
   - Le système valide instantanément la transaction (\`PAID\`).
   - Le statut de la réservation bascule en \`CONFIRMED\`.
   - Le reçu d'encaissement et le voucher définitif sont envoyés au client par notification.

---

## 3. Composition de Packages Touristiques (Bundles)

![Gestion des Packages Bundles](../assets/screenshots/agent/03-bundles.png)

Pour composer une offre promotionnelle clé en main (ex. « Pack Escapade Marrakech : Riad de Charme + Vol AR + Excursion Ourika ») :
1. Cliquez sur **« Créer un Bundle »**.
2. Sélectionnez au moins deux offres validées de fournisseurs différents.
3. Définissez le pourcentage de réduction consenti sur l'ensemble.
4. Le système calcule automatiquement le prix remisé et ajuste le stock dynamique selon la capacité minimale des offres composantes.

---

## 4. Support Client & Traitement des Réclamations

![Billetterie de Support Agent](../assets/screenshots/agent/04-support.png)

- Accédez à la file d'attente des tickets clients classés par priorité.
- Répondez aux sollicitations, modifiez les dates de réservation si nécessaire ou escaladez le dossier à un administrateur en cas de litige financier.
`;

// 6. admin.md
const admin = `# Manuel Utilisateur — Espace Administrateur

> **Statut :** ✅ Implémenté  
> **Date de mise à jour :** 2026-11-01  
> **Profil :** Superviseur & Administrateur Global (\`ROLE_ADMIN\`)  
> **Point d'entrée :** \`http://127.0.0.1:5500/frontend/admin/index.html\`

---

## 1. Vue d'Ensemble & Supervision Globale

Le tableau de bord administrateur consolide l'activité de l'ensemble de la plateforme :

![Tableau de bord Administrateur](../assets/screenshots/admin/01-dashboard.png)

- Volume d'utilisateurs actifs par rôle (\`CLIENT\`, \`SUPPLIER\`, \`AGENT\`, \`ADMIN\`).
- File des offres touristiques soumises en attente d'approbation.
- Chiffre d'affaires global de la plateforme, commissions prélevées et volume d'annulations.
- Accès direct au journal des alertes de sécurité.

---

## 2. Gestion des Utilisateurs & Déverrouillage de Compte

![Gestion des Utilisateurs](../assets/screenshots/admin/02-utilisateurs.png)

Dans l'onglet **« Utilisateurs »** :
- **Recherche & Filtrage :** Filtrez par rôle, statut de compte (\`ACTIVE\`, \`ARCHIVED\`, \`LOCKED\`) ou adresse email.
- **Création d'agents et administrateurs :** Provisionnez de nouveaux collaborateurs avec affectation stricte des privilèges.
- **Déverrouillage anti-brute-force :** Si un utilisateur est bloqué suite à 5 tentatives de mot de passe infructueuses, cliquez sur le bouton **« Déverrouiller le compte »** pour réinitialiser son compteur immédiatement.

---

## 3. Modération des Offres & Avis Clients

![Modération des Offres](../assets/screenshots/admin/03-moderation.png)

- **Offres en attente (\`PENDING\`) :** Vérifiez l'adéquation des tarifs, la qualité des photos et la cohérence des disponibilités avant validation (\`APPROVED\`) ou rejet avec motif explicatif (\`REJECTED\`).
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

## 5. Paramètres Système & Mode Maintenance

![Paramètres Globaux du Système](../assets/screenshots/admin/05-parametres.png)

- **Taux de commission plateforme :** Définissez le pourcentage prélevé sur les ventes des fournisseurs partenaires.
- **Coordonnées officielles :** Email de contact, téléphone du support et mentions légales affichées sur le site public.
- **Mode Maintenance :** En cas d'intervention technique programmée, activez le mode maintenance en 1 clic : les utilisateurs reçoivent poliment un écran explicatif tout en conservant l'accès d'administration.
`;

fs.writeFileSync(path.join(manDir, 'README.md'), readme, 'utf8');
fs.writeFileSync(path.join(manDir, 'invite.md'), invite, 'utf8');
fs.writeFileSync(path.join(manDir, 'client.md'), client, 'utf8');
fs.writeFileSync(path.join(manDir, 'fournisseur.md'), fournisseur, 'utf8');
fs.writeFileSync(path.join(manDir, 'agent.md'), agent, 'utf8');
fs.writeFileSync(path.join(manDir, 'admin.md'), admin, 'utf8');

console.log('Successfully generated all 6 user manual files in docs/manuel/!');

