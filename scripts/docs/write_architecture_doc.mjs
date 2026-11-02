import fs from 'fs';

const erContent = fs.readFileSync('scripts/docs/extracted_er.mermaid', 'utf8');
const dataDictContent = fs.readFileSync('scripts/docs/extracted_data_dict.md', 'utf8');

const archDoc = `# Architecture Technique et Système — Atlas Voyage

> **Objet :** Description formelle de l'architecture logicielle, des modèles de données, des flux d'interaction et des choix structurants de la plateforme Atlas Voyage.  
> **Public visé :** Architectes logiciels, ingénieurs full-stack, auditeurs techniques et nouveaux développeurs.  
> **Dernière mise à jour :** 1er novembre 2026 | **Version de référence :** 3.0.0 (Phases 1 à 14)  
> **Statut :** ✅ Stable (100% vérifié dans le code) | **Propriétaire :** Équipe d'Architecture Atlas Voyage

---

## 1. Principes Fondamentaux et Règles d'Or

Atlas Voyage est conçu selon une architecture en couches étanche (**Layered Architecture**), orientée domaine et conforme aux principes **RESTful stateless** :

1. **Règle d'or de flux strict :**
   \`Controller -> Service -> Repository -> Base de données MySQL\`
   - Le contrôleur valide l'entrée (Jakarta Validation) et délègue au service.
   - Les entités JPA internes ne franchissent **JAMAIS** la frontière du contrôleur : toutes les communications entrantes et sortantes utilisent exclusivement des **DTOs immuables**.
2. **Règle d'or financière (MAD exclusif) :**
   - Tous les calculs, montants en base de données, réservations, factures et encaissements sont **strictement formulés en Dirhams Marocains (MAD TTC)**.
   - Les devises étrangères (\`EUR\`, \`USD\`, \`GBP\`) sont calculées côté client à titre strictement indicatif sans impact transactionnel.
3. **Ségrégation stricte des rôles (RBAC) :**
   - 4 rôles majeurs : \`ADMIN\`, \`SUPPLIER\` (spécialisé par catégorie), \`AGENT\` et \`CLIENT\`.
   - Contrôle d'accès à double niveau : niveau URL (\`SecurityConfig\`) et niveau méthode (\`@PreAuthorize\`).

---

## 2. Modèle C4 — Niveau 1 : Diagramme de Contexte

Le diagramme de contexte situe Atlas Voyage au milieu de son écosystème d'utilisateurs et de services tiers :

\`\`\`mermaid
flowchart TB
    subgraph Utilisateurs
        Guest["Visiteur Invité<br/>(Navigateur Web)"]
        ClientUser["Voyageur Client<br/>(Compte CLIENT)"]
        SupplierUser["Prestataire Fournisseur<br/>(Hôtelier, Loueur, Transporteur)"]
        AgentUser["Agent d'Agence<br/>(Compte AGENT)"]
        AdminUser["Administrateur Système<br/>(Compte ADMIN)"]
    end

    subgraph AtlasVoyageSystem["Plateforme Atlas Voyage"]
        App["Application Atlas Voyage<br/>(Site Web Public, Espaces SPA & API REST Spring Boot)"]
    end

    subgraph SystemesExternes["Systèmes & Partenaires Externes"]
        OpenMeteo["API Open-Meteo<br/>(Géocodage mondial & Météo)"]
        BankGateway["Passerelle Bancaire Sandbox<br/>(Simulateur CMI / Carte Bancaire)"]
        SmtpServer["Serveur SMTP / Mailpit<br/>(E-mails transactionnels)"]
        LeafletOSM["OpenStreetMap / Leaflet<br/>(Tuiles cartographiques)"]
    end

    Guest -->|Consulte le catalogue et remplit son panier| App
    ClientUser -->|Réserve, paie, consulte ses billets et avis| App
    SupplierUser -->|Publie ses offres, disponibilités et répond aux avis| App
    AgentUser -->|Compose des bundles et encaisse les espèces| App
    AdminUser -->|Modère les offres, administre les comptes et audite| App

    App -->|Recherche de coordonnées GPS| OpenMeteo
    App -->|Autorisation et capture de paiement sandbox| BankGateway
    App -->|Notification et vérification de compte| SmtpServer
    App -->|Affichage des cartes interactives| LeafletOSM
\`\`\`

---

## 3. Modèle C4 — Niveau 2 : Diagramme des Conteneurs

Le diagramme des conteneurs détaille la répartition physique et logique des composants en exécution :

\`\`\`mermaid
flowchart LR
    subgraph ClientLayer["Poste Client (Navigateur Web)"]
        SPA["Frontend Statique<br/>HTML5 / CSS3 / Vanilla JS<br/>Port 5500"]
    end

    subgraph ServerLayer["Serveur d'Application Atlas Voyage"]
        API["Backend API REST<br/>Java 21 / Spring Boot 3.3.4<br/>Port 8080"]
        Cache["Cache Mémoire<br/>Caffeine<br/>(Stats: 2 min, Devises: 12 h)"]
        LocalStorage["Système de Fichiers Local<br/>./uploads/<br/>(Images & Vouchers)"]
    end

    subgraph DataLayer["Persistance & Données"]
        DB[("Base de Données Relationnelle<br/>MySQL 8 / MariaDB<br/>Port 3306")]
    end

    SPA -->|HTTPS / REST JSON<br/>Cookies HttpOnly & Bearer| API
    API -->|Mise en cache rapide| Cache
    API -->|Stockage des médias| LocalStorage
    API -->|JDBC / HikariCP Pool<br/>JPA / Hibernate| DB
\`\`\`

---

## 4. Modèle C4 — Niveau 3 : Diagramme des Composants Backend

Le backend est structuré en modules découplés selon le standard Spring Boot :

\`\`\`mermaid
flowchart TD
    subgraph Web["Couche Web & Sécurité"]
        Security["SecurityConfig<br/>(Filtres JWT, RateLimit, CSRF)"]
        Controllers["23 Contrôleurs REST<br/>(@RestController)"]
    end

    subgraph Core["Couche Métier (Service)"]
        Services["20+ Services Métier<br/>(@Service, @Transactional)"]
        Policies["Politiques Métier<br/>(PasswordPolicy, CancellationPolicy)"]
    end

    subgraph DataAccess["Couche d'Accès aux Données"]
        Repositories["Spring Data JPA Repositories<br/>(@Repository)"]
        Entities["40 Entités JPA<br/>(@Entity)"]
    end

    Security --> Controllers
    Controllers --> Services
    Services --> Policies
    Services --> Repositories
    Repositories --> Entities
\`\`\`

---

## 5. Modèle de Données Entité-Relation (ER)

Atlas Voyage s'appuie sur un schéma relationnel robuste de **40 entités JPA**. Les offres touristiques utilisent l'héritage \`SINGLE_TABLE\` (\`offer_type\`).

\`\`\`mermaid
${erContent}
\`\`\`

${dataDictContent}

---

## 6. Diagrammes de Séquence des Parcours Clés

### 6.1 Authentification avec Détection de Rejeu (Refresh Token Rotation)

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor User as Voyageur
    participant API as AuthController
    participant Sec as AccountSecurityService
    participant TokenSvc as RefreshTokenService
    participant DB as Base de Données

    User->>API: POST /api/auth/login { email, password }
    API->>Sec: authenticate(email, password)
    Sec->>DB: Recherche User par email
    Sec->>Sec: Vérification BCrypt (12 rounds) & compte actif
    Sec->>TokenSvc: createRefreshToken(user)
    TokenSvc->>DB: Sauvegarde RefreshToken chiffré
    API-->>User: 200 OK + Set-Cookie (atlas_access_token, atlas_refresh_token, XSRF-TOKEN)

    Note over User,API: Expiration du jeton d'accès (après 15 min)
    User->>API: POST /api/auth/refresh (Cookie atlas_refresh_token)
    API->>TokenSvc: rotateRefreshToken(rawToken)
    alt Jeton valide et non révoqué
        TokenSvc->>DB: Révocation de l'ancien jeton + création du nouveau
        API-->>User: 200 OK + Nouveaux cookies émis
    else Détection de jeton déjà réutilisé (attaque suspectée)
        TokenSvc->>DB: Révocation immédiate de TOUTE la famille de jetons
        API-->>User: 401 Unauthorized (TOKEN_REUSED - Session invalidée)
    end
\`\`\`

### 6.2 Réservation Atomique du Panier avec Verrouillage Pessimiste

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as Client Connecté
    participant Cart as CartController
    participant BookingSvc as BookingService
    participant DB as Base de Données (MySQL)

    Client->>Cart: POST /api/bookings { cartId }
    Cart->>BookingSvc: createBookingFromCart(userId, cartId)
    activate BookingSvc
    Note over BookingSvc,DB: Début de transaction @Transactional(isolation = READ_COMMITTED)
    BookingSvc->>DB: Verrouillage pessimiste SELECT ... FOR UPDATE sur OfferAvailability
    alt Capacité disponible suffisante
        BookingSvc->>DB: Décrémentation de la capacité résiduelle
        BookingSvc->>DB: Insertion Booking (statut PENDING) & BookingItems
        BookingSvc->>DB: Nettoyage du panier
        Note over BookingSvc,DB: Commit de la transaction
        BookingSvc-->>Cart: BookingResponse (Référence BK-...)
        Cart-->>Client: 201 Created { bookingId, reference, totalAmount }
    else Capacité insuffisante sur l'un des articles
        Note over BookingSvc,DB: Rollback automatique de la transaction
        BookingSvc-->>Cart: Exception CAPACITY_EXCEEDED (HTTP 400)
        Cart-->>Client: 400 Bad Request { code: "CAPACITY_EXCEEDED" }
    end
    deactivate BookingSvc
\`\`\`

### 6.3 Paiement Sécurisé & Idempotence

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as Voyageur
    participant Pay as PaymentController
    participant PaySvc as PaymentService
    participant Gateway as CMI Sandbox Gateway
    participant DB as Base de Données

    Client->>Pay: POST /api/payments { bookingId, paymentMethod: "CARD", idempotencyKey }
    Pay->>PaySvc: processPayment(...)
    PaySvc->>DB: Vérification de l'idempotence (IdempotencyRecord)
    alt Clé déjà traitée avec succès
        PaySvc-->>Pay: Renvoi du résultat mis en cache (snapshot identique)
        Pay-->>Client: 200 OK (Réponse idempotente sans second débit)
    else Nouveau paiement
        PaySvc->>Gateway: Appel bancaire sandbox (autorisation)
        Gateway-->>PaySvc: Autorisation accordée (Transaction TX-12345)
        PaySvc->>DB: Insertion Payment (statut SUCCEEDED)
        PaySvc->>DB: Mise à jour Booking (statut CONFIRMED)
        PaySvc->>DB: Sauvegarde IdempotencyRecord
        Pay-->>Client: 200 OK { paymentId, status: "SUCCEEDED" }
    end
\`\`\`

### 6.4 Annulation de Réservation & Restitution de Capacité

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as Voyageur Client
    participant BookingCtrl as BookingController
    participant BookingSvc as BookingService
    participant DB as Base de Données

    Client->>BookingCtrl: POST /api/bookings/{id}/cancel
    BookingCtrl->>BookingSvc: cancelBooking(userId, bookingId)
    BookingSvc->>DB: Recherche de la réservation
    BookingSvc->>BookingSvc: Vérification du délai limite (app.booking.cancellation.free-hours >= 48 h)
    alt Annulation dans les délais autorisés
        BookingSvc->>DB: Verrouillage de la disponibilité associée
        BookingSvc->>DB: Restitution intégrale de la capacité (+N)
        BookingSvc->>DB: Mise à jour du statut Booking en CANCELLED
        BookingSvc-->>BookingCtrl: BookingResponse (statut CANCELLED)
        BookingCtrl-->>Client: 200 OK { message: "Réservation annulée, capacité restituée." }
    else Délai limite de 48 heures dépassé
        BookingSvc-->>BookingCtrl: Exception CANCELLATION_DEADLINE_PASSED (HTTP 400)
        BookingCtrl-->>Client: 400 Bad Request { code: "CANCELLATION_DEADLINE_PASSED" }
    end
\`\`\`

---

## 7. Diagrammes d'États des Cycles de Vie Métier

### 7.1 Cycle de Vie d'une Réservation (\`Booking\`)

\`\`\`mermaid
stateDiagram-v2
    [*] --> PENDING : Réservation créée depuis le panier
    PENDING --> CONFIRMED : Paiement par carte réussi ou acompte validé
    PENDING --> EXPIRED : Délai de règlement dépassé (30 min)
    PENDING --> CANCELLED : Annulation par le client
    CONFIRMED --> COMPLETED : Séjour / Prestation achevée
    CONFIRMED --> CANCELLED : Annulation client (>= 48 h) ou annulation agent
    EXPIRED --> [*]
    CANCELLED --> [*]
    COMPLETED --> [*]
\`\`\`

### 7.2 Cycle de Vie d'un Paiement (\`Payment\`)

\`\`\`mermaid
stateDiagram-v2
    [*] --> PENDING : Transaction initiée
    PENDING --> SUCCEEDED : Autorisation bancaire ou espèces encaissées
    PENDING --> FAILED : Rejet bancaire ou timeout
    SUCCEEDED --> PARTIALLY_REFUNDED : Remboursement partiel par l'administrateur
    SUCCEEDED --> REFUNDED : Remboursement intégral par l'administrateur
    PARTIALLY_REFUNDED --> REFUNDED : Solde remboursé
    FAILED --> [*]
    REFUNDED --> [*]
\`\`\`

### 7.3 Cycle de Vie d'un Ticket de Support (\`Ticket\`)

\`\`\`mermaid
stateDiagram-v2
    [*] --> OPEN : Ticket ouvert par le client
    OPEN --> IN_PROGRESS : Prise en charge par un agent
    IN_PROGRESS --> WAITING_FOR_USER : Demande d'informations complémentaires
    WAITING_FOR_USER --> IN_PROGRESS : Réponse du client
    IN_PROGRESS --> RESOLVED : Solution apportée par l'équipe
    RESOLVED --> CLOSED : Confirmation du client ou clôture automatique (7 j)
    CLOSED --> [*]
\`\`\`

### 7.4 Cycle de Vie d'un Avis Client (\`Review\`)

\`\`\`mermaid
stateDiagram-v2
    [*] --> PENDING : Avis déposé après séjour (mots sensibles détectés)
    [*] --> APPROVED : Avis déposé sans mot sensible
    PENDING --> APPROVED : Validation par l'administrateur
    PENDING --> REJECTED : Rejet par l'administrateur
    APPROVED --> PENDING : Bascule automatique si >= 3 signalements
    REJECTED --> [*]
    APPROVED --> [*]
\`\`\`

---

## 8. Index des Décisions d'Architecture (ADR)

Les choix technologiques majeurs sont documentés selon le format MADR sous [\`docs/adr/\`](adr/) :

- [\`ADR-0001\`](adr/0001-single-table-inheritance-offres.md) : Stratégie d'héritage \`SINGLE_TABLE\` pour les offres touristiques.
- [\`ADR-0002\`](adr/0002-disponibilites-par-periodes-vs-stock.md) : Disponibilités par périodes datées plutôt qu'un stock statique.
- [\`ADR-0003\`](adr/0003-fournisseurs-specialises-par-categorie.md) : Spécialisation stricte des comptes fournisseurs par catégorie.
- [\`ADR-0004\`](adr/0004-dirham-marocain-reference-devises-indicatives.md) : Dirham Marocain (MAD) comme devise unique de référence.
- [\`ADR-0005\`](adr/0005-authentification-jwt-cookies-httponly-rotation-refresh.md) : Authentification double support (Cookies HttpOnly et Bearer).
- [\`ADR-0006\`](adr/0006-flyway-et-migrations-sql-idempotentes.md) : Gestion des migrations de base de données.
- [\`ADR-0007\`](adr/0007-geocodage-resilient-open-meteo.md) : Géocodage résilient mondial sans clé API payante.
- [\`ADR-0008\`](adr/0008-catalogue-public-unique.md) : Catalogue public unique partagé.
- [\`ADR-0009\`](adr/0009-i18n-runtime-vanilla-vs-build-time.md) : Moteur d'internationalisation runtime Vanilla JS.
- [\`ADR-0010\`](adr/0010-cache-caffeine-mono-instance.md) : Mise en cache mémoire locale Caffeine.
`;

fs.writeFileSync('docs/architecture.md', archDoc, 'utf8');
console.log('Successfully generated docs/architecture.md with C4, ER, Data Dictionary, Sequences, States and ADR index.');

