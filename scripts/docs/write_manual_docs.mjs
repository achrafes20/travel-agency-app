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
| [**Guide Visiteur & Invité**](invite.md) | Grand public non authentifié | [\`/frontend/accueil.html\`](http://127.0.0.1:5500/frontend/accueil.html) | Découverte du catalogue, filtres, consultation détaillée, devise d'affichage, connexion et création de compte. |
| [**Manuel Client**](client.md) | Voyageur particulier (\`CLIENT\`) | [\`/frontend/client/index.html\`](http://127.0.0.1:5500/frontend/client/index.html) | Panier connecté, tunnel de commande en 4 étapes, téléchargement des vouchers PDF avec QR code, billetterie support SAV, avis après séjour, gestion du profil et RGPD. |
| [**Manuel Fournisseur**](fournisseur.md) | Partenaire hôtelier, aérien, loueur, transporteur, guide (\`SUPPLIER\`) | [\`/frontend/supplier/index.html\`](http://127.0.0.1:5500/frontend/supplier/index.html) | Wizard de création d'offres en 4 étapes, gestion fine du calendrier des disponibilités datées, réponse aux avis clients, tableau de bord des ventes et export CSV. |
| [**Manuel Agent**](agent.md) | Conseiller commercial en agence (\`AGENT\`) | [\`/frontend/agent/index.html\`](http://127.0.0.1:5500/frontend/agent/index.html) | Encaissement d'espèces en agence (avec reçu comptable), création et gestion des packages touristiques (bundles), assistance client et traitement des tickets SAV. |
| [**Manuel Administrateur**](admin.md) | Superviseur & Manager (\`ADMIN\`) | [\`/frontend/admin/index.html\`](http://127.0.0.1:5500/frontend/admin/index.html) | Gestion et déverrouillage des comptes utilisateurs, modération des offres et avis signalés, consultation du journal d'audit immuable, paramétrage global et mode maintenance. |

---

## 3. Matrice des Droits d'Accès par Écran

| Écran / Page | Invité | Client | Fournisseur | Agent | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Consultation Catalogue & Détail Offre | ✅ | ✅ | ✅ | ✅ | ✅ |
| Panier & Finalisation Réservation | ❌ (redirigé vers la connexion) | ✅ | ❌ | ❌ | ❌ |
| Téléchargement Voucher PDF & QR | ❌ | ✅ (ses commandes) | ❌ | ✅ | ✅ |
| Création & Modification d'Offres | ❌ | ❌ | ✅ (sa catégorie) | ❌ | ✅ (modération) |
| Encaissement Espèces en Agence | ❌ | ❌ | ❌ | ✅ | ✅ |
| Composition de Bundles | ❌ | ❌ | ❌ | ✅ | ✅ |
| Journal d'Audit & Paramètres Système | ❌ | ❌ | ❌ | ❌ | ✅ |
`;

// 2. invite.md
const invite = `# Guide Utilisateur — Visiteur & Invité

> **Statut :** ✅ Implémenté  
> **Date de mise à jour :** 2026-11-09  
> **Profil :** Visiteur non authentifié (Grand Public)  
> **Point d'entrée :** \`http://127.0.0.1:5500/frontend/accueil.html\`

---

## 1. Parcours de Découverte

En tant que visiteur d'Atlas Voyage, vous pouvez explorer librement l'intégralité du catalogue touristique marocain sans créer de compte. Un compte client n'est nécessaire qu'au moment de réserver (voir §4).

![Page d'accueil Atlas Voyage](../assets/screenshots/invite/01-accueil.png)

### Ce que propose l'accueil :
1. **Barre de navigation :** « Toutes les offres » ouvre le catalogue complet (toutes les offres, avec les filtres de prix, de type, d'étoiles et de ville) ; Hôtels & Riads, Vols, Location de voiture, Taxi/Transferts et Excursions ouvrent le catalogue filtré sur la catégorie choisie.
2. **Cartes de catégories :** les mêmes catégories sous forme de grandes cartes, juste sous l'image d'accueil.
3. **Offres disponibles :** un aperçu des offres actives pour les hôtels et riads, les vols, les locations de voiture et les taxis/transferts, avec un lien « Voir toutes les offres » vers le catalogue.
4. **Sélecteur de devise :** en haut à droite, choisissez la devise d'affichage indicative (MAD, EUR, USD ou GBP). Le paiement reste toujours en dirhams (MAD).
5. **Connexion :** le bouton « Se connecter » donne accès à votre compte ; une fois connecté, il devient le raccourci vers votre espace.

Le pied de page se limite au logo et au lien de connexion.

> **À savoir :** l'interface est actuellement affichée en **français** et en **thème clair** uniquement. Le moteur de traduction (FR / EN / AR avec affichage de droite à gauche) et le thème sombre existent dans le code mais sont désactivés (\`detectInitialLang\` dans \`frontend/js/shared/i18n.js\`, \`frontend/js/shared/theme.js\`) : aucun sélecteur de langue ni bouton de thème n'est affiché aux visiteurs.

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
3. **Disponibilités :** La fiche indique la prochaine période disponible ; seules les dates disposant d'une capacité sont réservables.
4. **Réserver :** Choisissez vos dates et le nombre de voyageurs, puis cliquez sur **« Ajouter au panier »** ou **« Réserver maintenant »**. Ces deux actions sont **réservées aux comptes clients** : en tant que visiteur, vous êtes dirigé vers la page de connexion (voir §4).

---

## 4. Réserver : se connecter ou créer un compte

Il n'existe **pas de panier pour les visiteurs** : le lien « Panier » n'apparaît dans l'en-tête qu'une fois connecté avec un compte client.

Lorsque vous cliquez sur « Ajouter au panier » ou « Réserver maintenant » sans être connecté, la plateforme vous envoie vers la page de connexion avec le message « Connectez-vous ou créez un compte pour réserver cette offre ».

![Connexion depuis une offre](../assets/screenshots/invite/04-connexion-reservation.png)

Une fois connecté (ou votre compte créé), vous êtes **ramené sur la même offre**, avec les dates et le nombre de voyageurs que vous aviez saisis, et vous pouvez alors l'ajouter à votre panier.

### Page de connexion

![Écran de connexion](../assets/screenshots/invite/05-connexion.png)

- **Se souvenir de moi** (cochée par défaut) : votre session est conservée **7 jours** (durée par défaut, paramétrable côté serveur), y compris après la fermeture du navigateur. Décochée, la session n'est pas conservée : elle prend fin à la fermeture du navigateur, et l'interface vous déconnecte dès la fermeture de l'onglet. À décocher sur un ordinateur partagé.
- **Mot de passe oublié ?** : ce lien, placé à droite de « Se souvenir de moi », mène à la demande de réinitialisation du mot de passe, envoyée par e-mail.
- Après cinq échecs de connexion consécutifs, le compte est verrouillé temporairement.

---

## 5. Créer un compte

![Création de compte avec l'aide à la saisie du mot de passe](../assets/screenshots/invite/06-inscription.png)

L'onglet **« Créer un compte »** demande votre nom complet, votre adresse e-mail et un mot de passe. Aucune case à cocher n'est demandée à l'inscription.

Le mot de passe doit respecter les règles suivantes :
- **12 caractères minimum** ;
- au moins **une minuscule**, **une majuscule**, **un chiffre** et **un caractère spécial**.

Une aide apparaît dès que vous cliquez dans le champ : la barre se remplit et chaque règle passe au vert (✓) quand elle est respectée. Trois autres règles ne s'affichent que si elles sont enfreintes, en rouge sous la liste : le mot de passe ne doit pas contenir votre adresse e-mail, ne doit pas être un mot de passe courant, et ne doit pas dépasser 72 octets.

Le bouton « Créer mon compte » vous connecte immédiatement : vous arrivez dans votre espace client, ou sur l'offre que vous consultiez si vous veniez de la page d'une offre.
`;

// 3. client.md
const client = `# Manuel Utilisateur — Espace Client

> **Statut :** ✅ Implémenté  
> **Date de mise à jour :** 2026-11-09  
> **Profil :** Voyageur particulier (\`ROLE_CLIENT\`)  
> **Point d'entrée :** \`http://127.0.0.1:5500/frontend/client/index.html\`

---

## 1. Tableau de Bord Client

Dès votre connexion, votre espace client vous présente une vue synthétique de votre activité :

![Tableau de bord Client](../assets/screenshots/client/01-dashboard.png)

- **Indicateurs clés :** nombre total de réservations et montant net payé, puis, pour la période choisie (**7 jours**, **30 jours** ou **12 mois**), nombre de réservations et montant net payé, avec la variation par rapport à la période précédente lorsqu'elle existe.
- **Mes dernières réservations :** les cinq plus récentes (référence, date de service, statut, montant TTC) ; la référence ouvre le détail de la réservation.
- **Cloche de notifications :** alertes de confirmation de commande, rappels de séjour à J-3 et réponses du support client. **« Voir toutes les notifications »** ouvre la page complète, qui contient aussi vos préférences d'e-mail (le menu latéral n'a pas d'entrée « Notifications »).

---

## 2. Gestion des Réservations & Bons d'Échange (Vouchers)

![Mes Réservations](../assets/screenshots/client/02-reservations.png)

Dans l'onglet **« Mes Réservations »**, la liste est triée de la plus récente à la plus ancienne ; vous pouvez la filtrer par statut (onglets), par référence et par plage de dates :
1. **Détail de la commande :** Référence unique (\`BK-AAAA-NNNNNN\`), liste des prestations, dates exactes, méthode et statut de paiement. Tant que la réservation est à régler, le bouton **« Payer maintenant »** apparaît sous la fiche.
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
- **Sécurité :** Changement de mot de passe renforcé (12 caractères minimum, 4 classes obligatoires : minuscule, majuscule, chiffre, caractère spécial).
- **Protection des données (Loi 09-08 / RGPD) :**
  - **Exportation des données :** Téléchargez une copie intégrale au format JSON de toutes vos informations enregistrées.
  - **Suppression du compte :** Demandez l'anonymisation irréversible et la suppression de votre compte conformément à la loi.
`;

// 4. fournisseur.md
const fournisseur = `# Manuel Utilisateur — Espace Fournisseur

> **Statut :** ✅ Implémenté  
> **Date de mise à jour :** 2026-11-10  
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

Le tableau de bord présente quatre indicateurs, recalculés selon la période choisie (7 jours, 30 jours ou 12 mois) :
- **Revenu de mes prestations :** somme des prix de vos lignes confirmées ou terminées.
- **Réservations de la période.**
- **Panier moyen :** revenu divisé par le nombre de réservations.
- **Offres actives :** par exemple « 2 sur 2 ».

Dessous, le graphique « Vos revenus sur six mois » et la liste « Dernières réservations reçues » (référence, client, date de service, statut, montant).

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

## 3. Périodes de Disponibilité

![Périodes de disponibilité](../assets/screenshots/fournisseur/04-disponibilites.png)

- L'écran « Périodes de disponibilité » (menu « Disponibilités ») est en lecture seule : une ligne par offre, avec son état, son nombre de périodes et la période en cours ou la prochaine ; il se filtre par type, ville, statut et période.
- La capacité d'une période est le stock restant à vendre (chambres, sièges, véhicules) : chaque réservation la diminue, une annulation la rend. Une réservation doit tenir entièrement dans une seule période.
- Les périodes se définissent à l'étape 4 du formulaire d'offre.
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

