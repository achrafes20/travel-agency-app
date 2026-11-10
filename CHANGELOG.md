# Changelog — Atlas Voyage

Toutes les modifications notables apportées au projet Atlas Voyage sont documentées dans ce fichier.
Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/), et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

---

## [Non publié] - 2026-11-10 (Revue des interfaces invité, client et fournisseur)

### Ajouté
- **Lien « Toutes les offres »** dans la barre de navigation de toutes les pages publiques (premier élément, icône grille) : il ouvre `catalogue.html` sans filtre de type, alors que les cinq entrées de catégories ouvraient chacune un catalogue filtré et que rien ne menait au catalogue complet. Mis en surbrillance sur le catalogue non filtré ; la barre défile déjà horizontalement sur mobile.
- **Retour sur l'offre après connexion :** un invité qui clique sur « Ajouter au panier » ou « Réserver maintenant » est envoyé vers `connexion.html?redirect=…` avec un message d'invitation ; après connexion ou inscription, il retrouve la même offre avec ses dates et son nombre de voyageurs. Le paramètre `redirect` n'accepte qu'un nom de page du site.
- **Aide à la saisie du mot de passe compacte** (inscription, changement et réinitialisation) : 5 règles visibles, barre à 0/5 au départ, règles rares affichées seulement en cas de violation, texte pour lecteurs d'écran et `aria-describedby`.
- **Script `scripts/migrations/V15__remember_me_and_drop_consent.sql`** (idempotent) : ajoute `refresh_tokens.remember_me`, supprime `users.consent_at` et `users.consent_version`. Voir `docs/migrations.md`.
- **Tests :** `PasswordPolicyTest` (11 caractères refusés partout) et `SecurityPhase10Test.rememberMeChoiceSurvivesTokenRefresh` (cookies de session et persistants, avant et après rafraîchissement) : suite backend à **399 tests**.
- Registre des anomalies : `ANO-07` à `ANO-19` ; exigence `REQ-TRA-17` (consentement) retirée et tracée.

### Modifié
- **Accueil :** bandeau d'avis et de médias, bandeau de réassurance, bandeau d'appel à l'action et séparateur décoratif retirés.
- **Pied de page :** réduit au logo et au lien de connexion (ou d'espace), aligné verticalement, sur toutes les pages ; slogan et mention « © 2026 … Conforme WCAG 2.1 AA » retirés ; pied de page des pages 404 et 500 retiré.
- **Page de connexion :** bandeau « Connexion sécurisée et chiffrée », ligne « Connectez-vous pour accéder à votre espace » et crédit photo retirés ; « Mot de passe oublié ? » placé sur la ligne de « Se souvenir de moi » ; champ mot de passe de l'inscription : placeholder simplifié.
- **Panier :** réservé aux clients ; le lien n'apparaît plus pour les invités ni pour les autres rôles.
- **Mot de passe :** minimum de 12 caractères appliqué dans l'interface (auparavant 10) et centralisé côté serveur dans `PasswordPolicy.MIN_LENGTH`.
- **Espace client (revue du 9 novembre) :**
  - Fiche de réservation (fenêtre « Voir ») : bloc « Paiement de la réservation » (bandeau jaune « MODE SANDBOX — aucun débit réel », carte « PAIEMENT #… », bouton « Historique et opérations »), commentaire « L’annulation client dépend du délai applicable… » et adresse e-mail à côté du nom retirés pour le client ; il ne reste que le statut de paiement déjà affiché dans la fiche et, tant que la réservation est à régler, le bouton « Payer maintenant ». Le bandeau sandbox reste sur la page de paiement. Les espaces fournisseur, agent et administrateur conservent le bloc complet (l'historique y donne accès aux opérations et remboursements).
  - Fiche de réservation, tous espaces : « Méthode » et « Paiement » sont deux éléments séparés (espace de 32 px) au lieu d'une ligne séparée par un point.
  - Tableau de bord : ligne « Du … au … · fuseau · actualisé le … », toutes les mentions « Période précédente : … » (avec ou sans « aucune base de variation »), bouton « Actualiser » (les boutons 7 jours, 30 jours et 12 mois rechargent déjà les données), panneaux « Mon prochain voyage » et « Notifications non lues » retirés ; la ligne de variation (« En hausse de … % ») est conservée ; « Mes dernières réservations » occupe toute la largeur (cinq colonnes visibles sans défilement ni retour à la ligne des statuts).
  - « Mes réservations » : surtitre « VOS VOYAGES ATLAS VOYAGE » et filtre « Tri » retirés (ordre inchangé : plus récentes d'abord, valeur par défaut du serveur).
  - Menu latéral : entrée « Notifications » retirée (la page reste accessible par la cloche, « Voir toutes les notifications ») ; « Mes favoris » placé après « Mon panier ».
  - Panier : sous-titre « Vérifiez les détails avant de poursuivre votre réservation. » et compteur d'articles (« 0 article ») retirés ; le bouton « Découvrir les offres » du panier vide, les boutons « Retour au catalogue » et l'ancienne route `?page=catalogue` ouvrent désormais le catalogue (`catalogue.html`) au lieu de l'accueil.
  - Ces retraits sont limités au rôle client : les tableaux de bord et la liste des réservations des autres rôles partagent le même code (`stats.js`, `bookings.js`) et sont inchangés. L'API `/api/stats/client` renvoie toujours `nextTrip` et `notifications`.
  - **Tailwind retiré de l'espace client** : le script `cdn.tailwindcss.com` n'est plus chargé par `client/index.html` (plus de dépendance à un CDN, et la page fonctionne hors ligne). Les classes utilitaires encore utilisées sont définies localement : `css/tickets.css` (module des tickets, limité à `.tk-ui`, valeurs identiques à celles de Tailwind) et `css/client.css` (`relative`, `hidden`, `p-8`, `text-center`, `text-slate-500`), avec une remise à zéro équivalente à celle de Tailwind (sélecteurs `:where()`, composants `av-*` exclus). Vérifié par comparaison de 23 états de l'espace client (tableau de bord, réservations et leur fiche, panier, favoris, tickets, profil, notifications, menus, version mobile) avant et après : aucun élément déplacé ni redimensionné ; seules différences, voulues : menu des devises lisible, texte blanc du lien d'évitement.
  - Captures `docs/assets/screenshots/client/01-dashboard.png` et `02-reservations.png` refaites avec une vraie session (l'ancienne capture du tableau de bord affichait « Statistiques indisponibles »).
- **Espace fournisseur (revue du 10 novembre) :**
  - **Tailwind retiré de l'espace fournisseur** (`ANO-15`) : le script `cdn.tailwindcss.com` et sa configuration ne sont plus chargés par `supplier/index.html`. Les 265 règles utilitaires réellement employées (couleurs « atlas » comprises, valeurs identiques à celles de Tailwind) sont dans `css/supplier-utilities.css`, chargé en dernier comme l'était la feuille injectée par le CDN, avec la même remise à zéro en `:where()` que l'espace client (composants `av-*` exclus). Vérifié par comparaison de 16 états (pages, fiche de réservation, fenêtre de nouveau ticket, menus, menu replié, mobile) avant et après : seules différences, voulues : menu des devises lisible (le bouton de l'en-tête reste un texte blanc) et texte blanc du lien d'évitement.
  - **Mêmes retraits que pour le client**, par une fonction `lean(role)` (clients et fournisseurs) dans `stats.js` et `bookings.js` : tableau de bord sans ligne de période, sans « Période précédente » ni « Actualiser » ; « Réservations reçues » sans surtitre ni filtre « Tri » ; fiche de réservation sans commentaire sur l'annulation, sans e-mail du client à côté du nom et sans bloc de paiement (le bouton « Payer maintenant » reste réservé au client) ; menu latéral sans « Notifications » (la cloche mène toujours à la page). Les rôles agent et administrateur sont inchangés.
  - **Tableau de bord :** les six cartes (offres actives, offres inactives, réservations de la période, réservations du mois, revenu, disponibilités à vérifier) sont remplacées par quatre : **Revenu de mes prestations**, **Réservations de la période**, **Panier moyen** (revenu ÷ réservations, « — » sans réservation) et **Offres actives** (« 2 sur 2 »). Panneaux « Disponibilités à vérifier » et « Activité récente » retirés ; « Dernières réservations reçues » est placé à côté de « Vos revenus sur six mois » (colonnes 4/7, montants et statuts sur une ligne). L'API `/api/stats/supplier` renvoie toujours les anciens champs.
  - Carte « Besoin d'aide ? » du menu latéral, encadré « Un changement de prix n'affectera jamais les réservations existantes » du formulaire d'offre et mention « Cette fiche contient uniquement vos prestations et les montants qui vous concernent. » de la fiche de réservation retirés.
  - L'écran « Calendrier des disponibilités » devient **« Périodes de disponibilité »** (il n'affiche pas de calendrier : une ligne par offre avec son état, son nombre de périodes et la période en cours ou la prochaine). L'entrée du menu reste « Disponibilités » ; la fenêtre d'administration portant l'ancien titre est inchangée.
  - Message d'erreur des graphiques : « Réessayez en changeant de période » (le bouton « Actualiser » n'existe plus pour le client et le fournisseur).
  - **Données de démonstration conservées :** les 55 périodes de 2 heures (toutes passées) créées par `StatsDemoSeeder` pour l'historique `DEMO-STATS-…` ne peuvent pas être supprimées sans supprimer les 55 réservations de démonstration qui les occupent (et le graphique de revenus qui en dépend).
- **Documentation :** manuel Visiteur réécrit avec de nouvelles captures, règles métier (§3.1, §6), matrice de traçabilité, cahiers de recette, registre des anomalies, rapport et décision de recette (addendums), état des traductions, accessibilité, README, data dictionary (régénéré). Les corrections d'erreurs antérieures de la documentation figurent ci-dessous.

### Supprimé
- Pages `a-propos.html`, `contact.html`, `faq.html`, `cgu.html`, `confidentialite.html`, leurs liens et leurs dictionnaires i18n (`faq`, `contact`, `legal` ; 19 → 16 namespaces), ainsi que les clés devenues inutiles (`common.footer`, `home.socialProof`).
- **Consentement à l'inscription :** case à cocher, champ `consent` (et son `@AssertTrue`), `consentAt` / `consentVersion` (entité, inscription, export RGPD) et leurs colonnes. L'endpoint `/api/contact` est conservé mais n'a plus d'écran.
- Panier invité stocké dans `localStorage` (`atlas-cart`).
- Règles CSS mortes des sections retirées de l'accueil (`.trust*`, `.feature-banner*`, `.social-proof`, `.sp-*`, `.zellige-divider`) : 26 règles de `frontend/css/style.css`. Les gabarits et images zellige, utilisés ailleurs, sont conservés. Vérifié par empreinte de mise en page : accueil, catalogue, offre, panier, 404 et 500 identiques avant et après, à 1280 et 390 px.
- **Nettoyage du dépôt (9 novembre 2026) :**
  - Fichiers inutilisés supprimés : `frontend/images/zellige-vrai.webp` (250 Ko), `docs/design/screenshots/before/test.png` (1 Mo, capture parasite), `CartItemRepository` (aucun usage), `frontend/js/mock/demo-data.js` (exposait `AtlasMockData`, que rien ne lisait ; ses 4 balises `<script>` retirées) et la page de démonstration `frontend/design-system/index.html` (non liée).
  - Doublons de migrations supprimés : `docs/legacy-migrations/` (9 scripts strictement identiques à ceux de `legacy-sql`) et `backend/scripts/migrations/` (4 scripts dont le SQL est équivalent à `scripts/migrations/V3` à `V6`). L'archive `docs/legacy-sql/` devient `docs/archive/sql-historique/`, avec un README corrigé (l'ancien annonçait à tort des migrations Flyway V1 à V10). `docs/migrations.md` pointe désormais vers `scripts/migrations/`.
  - **Documents archivés** dans `docs/archive/`, avec bannière « non maintenu » et liens corrigés : `ETAT_COMPLET_PROJET.md` et les rapports des phases 1 à 6, 9 et 10. L'état courant se lit dans ce CHANGELOG, le README et les documents de référence de `docs/`.
- Scénario E2E `REC-INV-07` : **38 scénarios** au lieu de 39. `REC-INV-04` et `REC-AUT-01` sont réécrits pour contrôler le nouveau comportement.

### Corrigé
- **« Se souvenir de moi » sans effet côté serveur** (`ANO-08`) : la case est envoyée à l'API et le choix est conservé à chaque rotation du refresh token.
- **Minimum du mot de passe incohérent** (`ANO-07`) : l'interface acceptait 10 et 11 caractères, que l'API refusait.
- **Panier invité perdu silencieusement** (`ANO-09`).
- **Titre « Le Maroc vous attend. » de la page de connexion illisible** (texte foncé sur la photo sombre : le design system impose une couleur aux titres) : forcé en blanc.
- **Avis des voyageurs absents de la fiche d'offre** (`ANO-12`) : `frontend/js/shared/reviews.js` importait `{ Api }` depuis `js/core/api.js`, qui n'a aucun export (script classique définissant la constante `api`) ; le module échouait à son chargement et la section d'avis restait vide. L'import est retiré, le module utilise la constante globale `api`.
- **Marqueur de la carte Leaflet en 404** (`ANO-13`) : `marker-icon.png` et `marker-shadow.png` sont déplacés de `frontend/vendor/leaflet/` vers `frontend/vendor/leaflet/images/`, où Leaflet les cherche. Les deux corrections sont vérifiées dans Chrome (invité et client connecté) : aucune erreur JS, aucune réponse 404.
- **Bouton du panier vide déformé** (`ANO-14`) : la règle `.empty-state span` de `client.css` transformait le libellé de tout bouton d'un état vide en pastille de 64 px ; elle est limitée à `.empty-state > span`. Corrige aussi « Réessayer », « Retour au catalogue » et « Réinitialiser les filtres ».
- **Menu du sélecteur de devise illisible dans l'espace client** (`ANO-15`, texte blanc sur fond blanc) : cause levée en retirant Tailwind de cette page (son reset, hors de toute couche CSS, écrasait les styles du design system). **Même correction pour l'espace fournisseur le 10 novembre** (Tailwind retiré, voir ci-dessus). L'espace agent charge encore Tailwind mais son menu est lisible ; l'espace administrateur n'est pas touché.
- **« Réinitialiser » de la liste des réservations laissait le filtre de statut actif** (`ANO-16`) : le champ caché `status` est vidé. Code partagé : corrigé aussi pour les espaces fournisseur, agent et administrateur.
- **Écran des tickets de l'espace administrateur** : l'administrateur ne chargeant pas Tailwind, ses classes utilitaires n'avaient aucun effet (en-tête non aligné, couleurs d'introduction manquantes) ; les nouveaux utilitaires locaux de `tickets.css` lui donnent la mise en page prévue, identique à celle des espaces client et agent. Le tableau reste plus large que l'écran (défilement horizontal), comme avant.
- **Étoiles du module d'avis sans rôle** (`ANO-17`) : `role="img"` ajouté aux conteneurs d'étoiles (note moyenne et avis) de `js/shared/reviews.js` ; axe : 0 violation sur la fiche d'offre, avec et sans avis.
- **Accessibilité** (`ANO-11`) : nom accessible du sélecteur de devise (WCAG 2.5.3) ; audit axe-core rejoué, 0 violation sur 11 pages.
- Affichage de la clé brute `footer.slogan` dans le pied de page (clé i18n sans namespace) ; le pied de page n'utilise plus de traduction.
- Erreurs de la documentation : politique de mot de passe (4 classes obligatoires, et non « 3 sur 4 » ; liste noire de quelques dizaines d'entrées, et non 10 000), fonction `CartService.mergeCart()` citée mais inexistante, lien d'audit pointant vers un disque local, compteurs de traductions.

### Connu / ouvert
- `ANO-10` : la langue est forcée en français et le thème en clair ; aucun sélecteur n'est affiché. Les fonctionnalités trilingue (FR/EN/AR, RTL) et thème sombre annoncées par la documentation ne sont donc pas accessibles dans l'interface (annotées dans le README et les guides).
- `ANO-18` : le script d'audit axe-core n'ouvre pas de session et utilise un identifiant d'offre inexistant : son « 0 violation sur 11 pages » ne couvre ni les espaces connectés (redirigés vers la page de connexion) ni la vraie fiche d'offre. Un balayage de l'espace client y trouve des défauts de contraste sur toutes les pages et deux listes sans nom accessible (tickets). README, `accessibilite.md` et la checklist technique précisent le périmètre ; en attente de décision.
- `ANO-15` : menu du sélecteur de devise illisible dans l'espace **fournisseur** (corrigé pour l'espace client). Tailwind est encore chargé par les espaces fournisseur (une centaine de classes utilitaires par écran : réécriture importante) et agent (7 classes de mise en page, plus le module des tickets) ; à traiter lors de la revue de ces espaces.
- La campagne E2E complète n'a pas été rejouée depuis ces changements ; les captures de `docs/recette/preuves/` datent du 2 novembre.

---

## [1.17.0-rc1] - 2026-11-02 (Phase 17 : Recette Finale & Démonstration)

### Ajouté
- **Plan et méthodologie de recette complète :** Documentation détaillée dans `docs/recette/plan_de_recette.md` fixant les critères d'entrée/sortie, périmètres, risques et outils.
- **Matrice de traçabilité des exigences :** Traçabilité exhaustive des 52 exigences fonctionnelles et techniques dans `docs/recette/matrice_tracabilite.md`.
- **Cahiers de tests détaillés par rôle :** 7 cahiers dans `docs/recette/cas_de_test/` couvrant Invité (`invite.md`), Authentification (`auth.md`), Client (`client.md`), Fournisseur (`fournisseur.md`), Agent (`agent.md`), Administrateur (`admin.md`), et Transverses (`transverses.md`).
- **Campagne E2E Chromium automatisée :** Runner Puppeteer `e2e/recette/runner.mjs` exécutant 39 scénarios fonctionnels avec génération de 39 captures d'écran certifiées dans `docs/recette/preuves/` (taux de succès de 100.0%).
- **Outillage de vérification automatisée :**
  - Contrôle d'intégrité relationnelle et financière BDD (`scripts/recette/check_integrity.mjs`) validant 0 capacité négative, monnaie 100% MAD et 0 orphelin.
  - Détection de fausses données (`scripts/recette/find_mock_data.mjs`) certifiant 0 mock data sur 21 écrans.
  - Mesure du temps d'installation à froid (`scripts/recette/fresh_install_test.mjs`) validant 4,59s (< 10 min requis).
  - Réinitialisation démo idempotente express (`scripts/recette/reset_demo.mjs`) exécutée en 0,44s (< 2 min requis).
  - Orchestrateur global `npm run recette:all` (`scripts/recette/run_all.mjs`).
- **Dossier de démonstration 10 minutes :**
  - Scénario minuté minute par minute avec script oral exact (`docs/demo/scenario_10_min.md`).
  - Référentiel du jeu de données démo et licences Unsplash (`docs/demo/jeu_de_donnees_demo.md`).
  - 4 procédures de secours testées Plan B (`docs/demo/plan_b.md`).
  - Checklist opérationnelle du Jour J (`docs/demo/checklist_jour_j.md`).
  - FAQ d'anticipation de 18 questions techniques du jury (`docs/demo/questions_reponses.md`).
- **Gouvernance et certification :**
  - Registre d'anomalies qualifié (`docs/recette/registre_anomalies.md`).
  - Checklist technique exhaustive (`docs/recette/checklist_technique.md`).
  - Cahier des vérifications humaines obligatoires (`docs/recette/humain_a_realiser.md`).
  - Procès-verbal de décision officielle **GO SOUS CONDITIONS** (`docs/recette/decision_go_no_go.md`).
  - Rapport final de recette (`docs/recette/rapport_final_recette.md`).

### Corrigé
- **Collision de clé unique SQL sur Chefchaouen (ANO-04) :** Correction de la méthode `seedCity()` dans `DataSeeder.java` pour combiner `findByNormalizedName` et `findByNameIgnoreCase`, résolvant l'échec de démarrage sur base existante avec test de non-régression validé.

---

## [1.15.0] - 2026-11-01 (Phase 15 : Documentation & Docs-as-Code)

### Ajouté
- **Portail central de documentation :** Création de `docs/README.md` avec plan d'accès par persona et conventions rédactionnelles (`conventions_documentation.md`).
- **Contrat OpenAPI 3.0.3 complet :** Fichier `docs/api/openapi.yaml` couvrant les **126 endpoints REST** réels extraits du code, avec schémas de données et guide d'intégration HTTP (`docs/api/guide_api.md`).
- **Catalogue des codes d'erreur :** Inventaire exhaustif des 58 codes applicatifs stables (`docs/api/codes_erreur.md`).
- **Collection Postman v2.1 synchronisée :** 18 dossiers, 181 requêtes avec assertions automatiques (`docs/postman/AtlasVoyage.postman_collection.json`) et environnements dev/prod sécurisés.
- **Architecture logicielle & ADRs :** Document d'architecture C4, diagramme Entité-Relation Mermaid de 40 entités JPA, dictionnaire de données complet, 4 diagrammes de flux et 10 décisions d'architecture MADR (`docs/adr/`).
- **Manuels d'exploitation :** Suite opérationnelle dans `docs/exploitation/` (configuration, déploiement systemd/nginx, sauvegardes, supervision Actuator, runbooks d'incidents et calendrier de maintenance).
- **Manuels utilisateurs par rôle :** 6 guides illustrés dans `docs/manuel/` avec captures d'écran automatisées pour Invité, Client, Fournisseur, Agent et Administrateur.
- **Gouvernance & Fichiers communautaires :** `CONTRIBUTING.md`, `CHANGELOG.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` et templates GitHub.
- **Outillage d'assurance qualité Docs-as-Code :** Scripts d'extraction et de validation automatique des liens, Mermaid et endpoints (`npm run docs:check`).

---

## [1.14.0] - 2026-10-31 (Phase 14 : Internationalisation & Devises)

### Ajouté
- Prise en charge trilingue complète : Français (`fr`, référence), Anglais (`en`), Arabe (`ar` avec RTL complet).
- Moteur i18n Vanilla JS sans compilation avec support des 6 formes grammaticales de pluriels arabes via `Intl.PluralRules`.
- 19 namespaces JSON traduits à 100% (`frontend/locales/`).
- Module de devises indicatives (EUR, USD, GBP) avec règle d'or financière MAD stricte (débits 100% en Dirhams).
- Entités JPA `OfferTranslation` et `CityTranslation` pour le contenu multilingue dynamique.

---

## [1.12.0] - 2026-10-30 (Phase 12 : Design System, UX, A11y & Composants)

### Ajouté
- Design system complet avec architecture CSS `@layer` et tokens `--av-*`.
- Palette de couleurs marocaines (Bleu Majorelle, Ambre, Terre Cuite).
- Conformité d'accessibilité certifiée **100% WCAG 2.1 AA** (0 violation sur 14 pages auditées par axe-core).
- Tunnel de réservation interactif en 4 étapes (`av-stepper`).
- Visionneuse plein écran accessible (`lightbox.js`) et carte Leaflet 1.9.4 auto-hébergée.
- Module complet d'avis et notations clients vérifiés après séjour (`Review`) avec modération admin et réponse fournisseur.

---

## [1.10.0] - 2026-10-29 (Phase 10 : Sécurité OWASP Top 10 & Robustesse)

### Ajouté
- Authentification par cookies `HttpOnly`, `Secure`, `SameSite=Lax` (zéro token dans Web Storage).
- Refresh token opaque avec rotation et détection de rejeu révoquant toute la famille de jetons.
- Protection CSRF double-submit avec en-tête `X-XSRF-TOKEN`.
- Rate limiting Bucket4j (HTTP 429 Retry-After) et verrouillage de compte (15 min / 5 échecs).
- Politique de mots de passe stricte (min 12 caractères, liste noire).
- Module RGPD / Loi marocaine 09-08 (export de données personnelles et droit à l'oubli).

---

## [1.9.0] - 2026-10-28 (Phase 9 : Nettoyage des Incohérences & Consolidation)

### Modifié
- Élimination définitive du champ statique hérité `stock` au profit exclusif de `OfferAvailability`.
- Enrichissement de l'entité `City` (pays, aéroport, géocodage Open-Meteo résilient).
- Factorisation des utilitaires Frontend communs (`dom.js`, `format.js`, `toast.js`).

---

## [1.8.0] - 2026-10-27 (Phase 8 : Favoris, Audit & Paramètres)

### Ajouté
- Module Favoris persistant pour les clients.
- Journal d'audit immuable (*append-only*) traçant les événements sensibles avec export CSV.
- Module de configuration globale avec cache atomique et mode maintenance HTTP 503.

---

## [1.7.0] - 2026-10-26 (Phase 7 : Billetterie de Support)

### Ajouté
- Module Tickets de support client/agent/admin avec fil de discussion persistant et notifications temps réel.

---

## [1.6.0] - 2026-10-25 (Phase 6 : Profils, Sécurité & Médias)

### Ajouté
- Profils complets pour les 4 rôles avec informations légales fournisseurs.
- Gestion du téléversement d'avatars et photos avec validation MIME stricte et quotas.

---

## [1.5.0] - 2026-10-24 (Phase 5 : Statistiques & Tableaux de Bord)

### Ajouté
- Quatre dashboards statistiques réels avec graphiques Chart.js et exports comptables CSV.

---

## [1.4.0] - 2026-10-23 (Phase 4 : Notifications & Messagerie)

### Ajouté
- Cloche de notifications in-app, gestion des préférences et support SMTP multipart optionnel.

---

## [1.3.0] - 2026-10-22 (Phase 3 : Paiements Sandbox & Espèces)

### Ajouté
- Paiement carte bancaire sandbox avec idempotence HTTP (`Idempotency-Key`).
- Encaissement des règlements en espèces au guichet par les agents.
- Webhook sécurisé par signature HMAC-SHA256.

---

## [1.2.0] - 2026-10-21 (Phase 2 : Réservations & Vouchers)

### Ajouté
- Réservations transactionnelles atomiques avec verrouillage de capacité.
- Génération de bons d'échange (vouchers) PDF avec QR code signé cryptographiquement.
- Barème d'annulation automatisé (48h / 24h).

---

## [1.1.0] - 2026-10-20 (Phase 1 : Fondations Applicatives)

### Ajouté
- Architecture Single Table Inheritance pour les 5 catégories d'offres touristiques.
- Catalogue public unique, recherche multi-critères, panier connecté et packages multi-offres (bundles).
