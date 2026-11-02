# FAQ Technique et Anticipation des Questions du Jury — Atlas Voyage

Ce document rassemble les **18 questions techniques les plus probables** susceptibles d'être posées par les membres du jury ou des auditeurs d'architecture, accompagnées des réponses argumentées et précises.

---

### Q1 : Pourquoi avoir choisi la stratégie Single Table Inheritance (STI) pour les offres plutôt que `JOINED` ou `TABLE_PER_CLASS` ?
**Réponse** :  
La plateforme propose 5 typologies de prestations (Hôtels, Vols, Voitures, Taxis, Excursions) partageant un socle commun très fort (titre, description, ville, prix de base, statut actif, photos, fournisseur).  
La stratégie `SINGLE_TABLE` regroupe toutes les offres dans la table `offers` avec un discriminant `offer_type`. Ce choix technique élimine totalement le besoin de jointures SQL complexes (`JOIN`) lors de la consultation du catalogue global ou lors de recherches multi-types (ex : recherche transversale à Marrakech). Les performances de lecture sur le catalogue public sont ainsi optimales. Les champs spécifiques à chaque catégorie (ex : `stars` pour les hôtels, `flight_number` pour les vols) sont simplement gérés sous forme de colonnes nullable gérées proprement par les DTOs polymorphiques Jackson.

---

### Q2 : Comment empêchez-vous concrètement la surréservation (overselling) lorsque deux clients réservent simultanément la dernière place ?
**Réponse** :  
Nous appliquons un verrouillage pessimiste au niveau de la base de données via Spring Data JPA. Dans `BookingService.java`, la sélection des créneaux de disponibilité dans la table `offer_availabilities` s'effectue avec l'annotation `@Lock(LockModeType.PESSIMISTIC_WRITE)`.  
Lorsqu'une transaction de réservation débute, MySQL pose un verrou exclusif sur la ligne (`SELECT ... FOR UPDATE`). La seconde transaction concurrente est mise en attente. Lorsque la première transaction valide et décrémente la capacité restante, la seconde se réveille, constate que la capacité restante est désormais égale à 0, et lève immédiatement une exception métier `AvailabilitySoldOutException`, empêchant toute survente sans conflit d'intégrité.

---

### Q3 : Pourquoi avoir développé le frontend en JavaScript vanilla plutôt que d'utiliser un framework comme React, Vue ou Angular ?
**Réponse** :  
Ce choix répond à un triple objectif d'architecture :
1. **Zéro étape de build obligatoire** : Le code source est directement interprétable par le navigateur, sans compilation Webpack/Vite intermédiaire, ce qui garantit une installation et un démarrage en moins de 10 minutes pour tout développeur ou auditeur.
2. **Performances pures et légèreté** : L'empreinte mémoire est minime, le DOM n'est pas alourdi par un Virtual DOM abstrait, et le chargement initial s'effectue en quelques millisecondes même sur connexion mobile 3G.
3. **Pérennité et robustesse** : Le JavaScript vanilla moderne (ES6+ avec modules natifs, Intl API, Fetch API, CSS logique) garantit une compatibilité durable sans obsolescence de dépendances npm.

---

### Q4 : Pourquoi le CSRF est-il désactivé dans votre configuration Spring Security ? Est-ce une faille ?
**Réponse** :  
Non, ce n'est absolument pas une faille dans le contexte de notre architecture.  
La protection CSRF classique est indispensable pour les applications web monolithiques avec état (stateful) utilisant des sessions HTTP basées sur des cookies de session soumis automatiquement par le navigateur.  
Atlas Voyage dispose d'une **API REST strictement stateless**. Chaque requête sensible est authentifiée soit par un en-tête `Authorization: Bearer <token>`, soit par des cookies configurés avec `SameSite=Lax` et `HttpOnly`. L'absence totale de session HTTP côté serveur (`SessionCreationPolicy.STATELESS`) et le contrôle strict des origines CORS rendent les attaques CSRF inopérantes selon les recommandations officielles de l'OWASP.

---

### Q5 : Comment fonctionne le Rate Limiting et comment avez-vous calibré les seuils pour ne pas pénaliser les utilisateurs normaux ?
**Réponse** :  
Le Rate Limiting est implémenté via la bibliothèque Bucket4j et un filtre servlet `RateLimitingFilter.java`.  
Nous avons appliqué un cloisonnement stratégique :
- Sur les routes d'authentification (`/api/auth/*`), le seau autorise **20 requêtes par minute par IP**, avec un rechargement progressif. Cela neutralise les attaques par dictionnaire ou force brute tout en permettant à une famille ou un utilisateur de se tromper 3 ou 4 fois sans être bloqué.
- Sur les routes d'API standard (`/api/*`), la limite est de **200 requêtes par minute**, ce qui est très largement suffisant pour une navigation humaine fluide et réactive. En cas de dépassement, l'API renvoie un statut HTTP 429 avec l'en-tête `Retry-After`.

---

### Q6 : Comment gérez-vous l'affichage en devises étrangères (EUR, USD) alors que les prix en base sont 100% en MAD ?
**Réponse** :  
Par principe d'intégrité comptable et monétaire, **le Dirham Marocain (MAD) est l'unique monnaie de référence et de transaction de la plateforme**. Tous les enregistrements en base (`base_price`, `total_amount`) sont stockés exclusivement en MAD.  
Le module frontend `currency.js` interroge le backend ou son cache de taux de change pour appliquer une conversion purement **indicative** lors de la navigation (ex : affichage d'un tarif approximatif en EUR pour un touriste européen). Lors de l'encaissement et de la génération du contrat de réservation, la facturation et le débit bancaire sont obligatoirement scellés en Dirhams Marocains, conformément à la réglementation de l'Office des Changes marocain.

---

### Q7 : Pourquoi prononcez-vous une décision « GO SOUS CONDITIONS » et non pas un « GO inconditionnel » ?
**Réponse** :  
En tant qu'ingénieurs et release managers responsables, nous nous interdisons de mentir ou d'embellir la réalité technique.  
Bien que la totalité des fonctionnalités applicatives (Phases 1 à 10, 12, 14, 15) soient 100% opérationnelles avec 397 tests JUnit verts, notre audit honnête a révélé que trois chantiers d'industrialisation (Phase 11 CI/CD, Phase 13 bundling production, et Phase 16 Docker compose) ne sont pas présents dans le dépôt.  
Déclarer un « Go » inconditionnel serait contraire à l'éthique d'ingénierie logicielle. Le **GO SOUS CONDITIONS** autorise la démonstration et le déploiement en préproduction tout en liant le passage en production finale à la livraison de ces trois composants sous 10 à 14 jours.

---

### Q8 : Quel est l'impact réel des trois phases manquantes pour l'utilisateur final ?
**Réponse** :  
L'impact pour l'utilisateur final est **nul**.  
Le serveur backend démarre parfaitement sous Java 21 standard, le frontend est déjà très rapide et optimisé (< 500 Ko) sans bundling, et l'expérience utilisateur est complète.  
L'impact est uniquement opérationnel pour l'équipe technique : absence d'automatisation des tests sur GitHub (compensation par l'exécution locale `npm run recette:all`) et déploiement manuel plutôt que conteneurisé.

---

### Q9 : Quelle était l'origine du bug bloquant sur Chefchaouen dans `DataSeeder.java` et comment a-t-il été résolu ?
**Réponse** :  
L'anomalie `ANO-04` était liée à l'évolution du modèle de données en Phase 9. La colonne `normalized_name` avait été introduite avec une contrainte unique sur la table `cities`. Sur une base existante contenant déjà « Chefchaouen » avec une valeur `normalized_name` vide, le `DataSeeder` exécutait `findByNormalizedName("chefchaouen")`. Ne trouvant aucun enregistrement, il instanciat une nouvelle entité `City` avec le nom brut « Chefchaouen », ce qui déclenchait une violation de clé unique SQL au moment du `save()`.  
Le correctif a consisté à modifier la recherche pour combiner le nom normalisé et le nom brut insensible à la casse (`findByNameIgnoreCase`), permettant de mettre à jour la ligne existante au lieu de tenter une insertion dupliquée illégale.

---

### Q10 : Comment assurez-vous l'immuabilité du journal d'audit (Audit Log) ?
**Réponse** :  
L'entité `AuditLog` est architecturée selon le paradigme *Append-Only* :
- Dans le code Java, aucun endpoint REST ne permet d'exécuter un `PUT` ou un `DELETE` sur les journaux d'audit. Seules les opérations de lecture (`GET /api/audit-logs`) et d'insertion interne par événements métier sont exposées.
- Au niveau de la base de données, la table `audit_logs` ne dispose pas de trigger de mise à jour et un utilisateur de base de données applicatif restreint ne possède que les privilèges `SELECT` et `INSERT` sur cette table.

---

### Q11 : Comment la plateforme respecte-t-elle la Loi marocaine 09-08 sur la protection des données personnelles ?
**Réponse** :  
Notre conformité repose sur quatre piliers techniques :
1. **Consentement explicite** : Case à cocher obligatoire et non pré-cochée lors de l'inscription pour l'acceptation des CGU et de la politique de traitement des données.
2. **Minimisation des données** : Seules les données indispensables à la réservation touristique sont collectées (nom, email, téléphone).
3. **Droit d'accès et de portabilité** : Présence dans l'espace client d'un bouton d'export des données personnelles au format structuré JSON/CSV.
4. **Droit à l'oubli** : Procédure documentée de désactivation et d'anonymisation du compte sur demande.

---

### Q12 : Pourquoi maintenir un guichet d'encaissement d'espèces (Cash) au lieu d'imposer le 100% carte bancaire ?
**Réponse** :  
C'est une décision d'ingénierie produit ancrée dans la réalité du marché marocain. Bien que le paiement par carte bancaire progresse rapidement, une proportion substantielle des voyageurs nationaux et des touristes de passage préfère régler leur hébergement ou leur excursion en espèces lors de leur arrivée à l'agence ou à l'hôtel.  
Atlas Voyage supporte nativement l'option `payOnArrival`. La commande réserve les places en base, et l'agent d'accueil valide l'encaissement physique au guichet en émettant un reçu numéroté officiel qui passe la réservation à l'état `PAID`.

---

### Q13 : Comment garantissez-vous l'étanchéité multi-tenant entre deux fournisseurs concurrents ?
**Réponse** :  
La sécurité est garantie au niveau du **Service Java Backend** et non pas uniquement dans l'interface graphique :
Dans `OfferService.java` et `BookingService.java`, chaque requête de consultation ou de modification exécutée par un utilisateur ayant le rôle `SUPPLIER` extrait l'identifiant du fournisseur connecté depuis le jeton JWT authentifié (`SecurityContext`).  
La requête SQL générée filtre systématiquement par `WHERE supplier_id = :currentSupplierId`. Si un prestataire tente d'accéder à l'ID d'une offre concurrente, le service lève immédiatement une exception `AccessDeniedException` (HTTP 403).

---

### Q14 : Comment avez-vous géré l'inversion RTL en langue arabe sans réécrire l'ensemble des feuilles de style ?
**Réponse** :  
Nous avons banni les propriétés CSS directionnelles physiques classiques (`left`, `right`, `margin-left`, `padding-right`) au profit des **propriétés logiques CSS modernes** : `margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `text-align: start`.  
Ainsi, lorsque le sélecteur de langue active l'attribut `dir="rtl"` sur la balise `<html>`, le moteur de rendu du navigateur effectue automatiquement l'inversion symétrique de tous les espacements, marges, boutons et grilles sans aucune surcharge de code spécifique.

---

### Q15 : Que se passe-t-il si le backend Spring Boot redémarre pendant qu'un utilisateur remplit son panier ?
**Réponse** :  
L'utilisateur ne subit **aucune perte de données**.  
Le panier d'achats est synchronisé en continu dans le `localStorage` du navigateur client. Si le backend redémarre temporairement, l'utilisateur conserve ses articles, ses dates choisies et son calcul TTC. Dès que le backend est rétabli, la soumission de la commande s'exécute normalement car l'API est sans état (stateless) et ne dépend d'aucune session mémoire volatile sur le serveur.

---

### Q16 : Pourquoi votre script de recette vérifie-t-il l'absence de capacité négative, alors qu'une capacité de 0 est tout à fait normale ?
**Réponse** :  
Une capacité égale à 0 signifie simplement qu'une prestation ou une chambre est **complète** (sold out), ce qui est un état métier légitime.  
En revanche, une capacité **strictement négative** (`capacity < 0`) traduirait une anomalie critique de survente (overselling) où le système aurait alloué plus de places qu'il n'en existait réellement. Le test automatisé `scripts/recette/check_integrity.mjs` vérifie que le nombre d'enregistrements avec `capacity < 0` est rigoureusement égal à 0 sur l'ensemble de la base.

---

### Q17 : Quels sont les chiffres clés de la suite de tests et de la compilation du projet ?
**Réponse** :  
- **Suite Backend** : 397 tests automatisés JUnit 5 / Spring Boot Test, 100% passants en 2,3 minutes avec base H2 en mémoire.
- **Compilation Propre** : `mvnw.cmd clean compile` exécutée en **4,59 secondes** sous Java 21 LTS.
- **Réinitialisation BDD Démo** : Remise à zéro complète et idempotente en **0,44 seconde** via `reset_demo.mjs`.
- **Suite E2E Fonctionnelle** : 39 cas de test automatisés sous Chromium avec capture de preuves, 100% de réussite.

---

### Q18 : Quelles sont les étapes concrètes pour passer de la Sandbox de paiement au mode bancaire réel ?
**Réponse** :  
Le passage en production bancaire nécessite :
1. La signature du contrat commerçant VAD avec une banque acquéreur marocaine et le raccordement au Centre Monétique Interbancaire (CMI).
2. La configuration dans les variables d'environnement Spring Boot des clés réelles fournies par le CMI (`cmi.merchant.id`, `cmi.store.key`).
3. L'activation de l'URL de production de la passerelle de paiement 3D-Secure (`https://pay.cmi.co.ma/fim/est3Dgate`).  
Le code de notre service de paiement `PaymentService.java` est déjà architecturé pour recevoir ces paramètres par injection sans modifier la moindre ligne de code métier.

