# Cahier des Vérifications Humaines Obligatoires — Atlas Voyage

Certaines exigences critiques de qualité, d'ergonomie, de conformité juridique et d'homologation bancaire ne peuvent pas — et ne doivent pas — être simulées par des scripts automatisés.  
Ce document détaille les **5 campagnes de validation humaine indispensables** à planifier avant l'ouverture du service au grand public.

---

## 1. Test d'Installation à Froid par un Lecteur Externe Indépendant

### Objectif
Prouver que la promesse du projet (**« Une personne qui découvre le projet peut l'installer en moins de 10 minutes »**) est réellement tenue en conditions réelles, par un développeur externe n'ayant jamais participé à la conception d'Atlas Voyage.

### Protocole de Test
1. **Sélection de l'évaluateur** : Un ingénieur ou étudiant tiers externe au projet, disposant d'une machine standard (Windows 11, macOS ou Ubuntu) avec Git installé.
2. **Fourniture stricte** : Uniquement l'URL du dépôt Git et le fichier `README.md`. Aucune aide orale ni explicitation informelle.
3. **Chronométrage** : Déclenchement du chronomètre dès le `git clone` jusqu'à l'accès fonctionnel à la page d'accueil avec données affichées.

### Grille d'Évaluation Opérateur
| Étape de Test | Temps Constaté | Statut | Observations de l'Opérateur |
| :--- | :---: | :---: | :--- |
| Clone du dépôt Git | ... min ... s | [ ] Conforme | |
| Vérification des prérequis (Java 21, MySQL) | ... min ... s | [ ] Conforme | |
| Création de la base `travel_agency_db` | ... min ... s | [ ] Conforme | |
| Démarrage backend via `./mvnw spring-boot:run` | ... min ... s | [ ] Conforme | |
| Lancement du serveur frontend (port 5500) | ... min ... s | [ ] Conforme | |
| Affichage de `http://localhost:5500/frontend/accueil.html` | ... min ... s | [ ] Conforme | |
| **TEMPS TOTAL CUMULÉ** | **... min ... s** | **[ ] < 10 MIN** | |

*Note de recette automatisée préliminaire : La compilation et le démarrage mesurés en script s'exécutent en moins de 5 secondes sur poste configuré.*

---

## 2. Campagne de Tests sur Terminaux Mobiles Physiques Réels

### Objectif
Valider les comportements physiques tactiles qu'aucun émulateur Chromium headless ne peut fidèlement reproduire : scrolling inertiel, zoom involontaire lors du focus sur les champs de saisie, occultation de formulaires par le clavier virtuel, encoches d'écran (*notches* et *Dynamic Island*).

### Équipements Cibles Obligatoires
1. **Apple iPhone (iOS 17+)** : Navigateur Safari Mobile (moteur WebKit natif).
2. **Samsung Galaxy / Google Pixel (Android 14+)** : Navigateur Google Chrome Mobile (moteur Blink mobile).
3. **Tablette tactile (iPad 10.9" ou Galaxy Tab)** : Mode portrait et paysage.

### Points de Contrôle Humains
- [ ] **Ergonomie tactile** : Les boutons d'action et liens ont une zone de toucher (*touch target*) d'au moins 44x44 pixels.
- [ ] **Comportement du clavier virtuel** : Lors de la saisie sur `connexion.html` et dans le tunnel de commande, le champ actif reste visible au-dessus du clavier virtuel sans décalage chaotique de l'écran.
- [ ] **Sélecteurs natifs** : Les champs `<input type="date">` et listes déroulantes de dates ouvrent les sélecteurs natifs fluides de l'OS.
- [ ] **Inversion RTL tactile** : En langue arabe sur smartphone, le geste de balayage latéral (*swipe*) et le positionnement du menu burger s'adaptent naturellement.

---

## 3. Audit d'Accessibilité avec Lecteurs d'Écran Réels (NVDA & VoiceOver)

### Objectif
Vérifier l'inclusion numérique de la plateforme pour les personnes aveugles ou malvoyantes en situation réelle d'usage avec des outils d'assistance vocale.

### Scénarios de Navigation 100% Clavier & Synthèse Vocale
1. **Parcours Invité (Recherche et réservation)** :
   - Masquer complètement l'écran physique ou fermer les yeux.
   - Activer **NVDA** (Windows) ou **VoiceOver** (macOS / iOS).
   - Utiliser exclusivement la touche `Tab`, `Maj + Tab`, `Entrée`, `Espace` et les flèches directionnelles.
   - Contrôler que le lien d'évitement initial annonce distinctement : *« Lien : Aller au contenu principal »*.
2. **Formulaire d'inscription & Messages d'alerte** :
   - Tenter une saisie erronée sur `connexion.html`.
   - Vérifier que la synthèse vocale annonce vocalement l'alerte d'erreur via l'attribut `role="alert"` / `aria-live="polite"`.
3. **Dialogue modal et focus trap** :
   - Ouvrir la fenêtre modale de confirmation d'une réservation.
   - Vérifier que le focus clavier est emprisonné dans la modale et ne s'échappe pas sur l'arrière-plan.

---

## 4. Homologation Bancaire & Passage en Production CMI (Centre Monétique Interbancaire)

### Objectif
Basculer de la Sandbox locale vers l'encaissement réel par cartes bancaires marocaines et internationales.

### Démarches Administratives et Techniques
- [ ] **Souscription du Contrat Commerçant VAD** : Signature de la convention de vente à distance auprès d'une banque partenaire marocaine (Attijariwafa Bank, BCP, BMCE Bank of Africa, CIH, etc.).
- [ ] **Raccordement au CMI** : Obtention des identifiants commerçant réels (`Merchant ID`), de la clé de chiffrement secrète HMAC-SHA512 et de l'URL de passerelle de production (`https://pay.cmi.co.ma/...`).
- [ ] **Homologation 3D-Secure 2.0** : Validation par les équipes techniques du CMI de la gestion des retours de transaction :
  - URL de succès (`Callback / OK`).
  - URL d'échec / abandon (`Callback / Fail`).
  - Validation du hachage de contrôle de la réponse serveur à serveur.
- [ ] **Gestion des Rejets et Remboursements** : Test manuel de la procédure d'annulation et de recrédit sur carte bancaire via le portail d'administration CMI.

---

## 5. Déclaration de Conformité CNDP (Protection des Données Personnelles)

### Objectif
Assurer la stricte conformité légale de la plateforme Atlas Voyage avec la **Loi marocaine n° 09-08** relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel.

### Actions Règlementaires Requises
- [ ] **Dépôt du Dossier de Déclaration** : Remplir et déposer auprès de la **CNDP (Commission Nationale de contrôle de la protection des Données à caractère Personnel)** la déclaration préalable de traitement automatisé de données pour la gestion de la clientèle et des réservations de voyage.
- [ ] **Mention Légale CNDP** : Intégrer sur le site public et sur le formulaire d'inscription le numéro de récépissé délivré par la CNDP.
- [ ] **Consentement et information à l'inscription (dispositif retiré le 9 novembre 2026)** : la case à cocher, les pages « Conditions Générales » et « Politique de Confidentialité » et les colonnes `users.consent_at` / `users.consent_version` ont été supprimées ; l'inscription n'archive plus aucune preuve de consentement. Avant l'ouverture commerciale, déterminer avec le conseiller juridique le dispositif d'information et de consentement attendu par la CNDP, puis le rétablir (page d'information, case à cocher, preuve horodatée archivée). Voir l'exigence `REQ-TRA-17` de la matrice de traçabilité.
- [ ] **Procédure de Droit à l'Oubli** : Formaliser la procédure interne permettant à un client d'exiger la suppression ou l'anonymisation de son compte conformément aux directives de la CNDP.

