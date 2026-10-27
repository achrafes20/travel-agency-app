# Tests Postman — Atlas Voyage

Collection : [`AtlasVoyage.postman_collection.json`](AtlasVoyage.postman_collection.json) (Postman Collection v2.1).

Elle teste l'API REST du backend (`http://localhost:8080`) : **authentification, utilisateurs, offres (5 types), bundles, panier et codes promo**. La liste des endpoints est dans [`../api_endpoints.md`](../api_endpoints.md).

## Contenu (101 requêtes, 169 vérifications)

| Dossier | Contenu |
|---|---|
| `00 - Statut` | `GET /api/status` |
| `01 - Utilisateurs` | Liste, création, détail, modification, archivage, suppression |
| `02 - Offres` | Création des 5 types (hôtel, vol, voiture, taxi, excursion), liste et filtres, détail, modification, puis suppression des offres créées |
| `03 - Bundles` | Création de deux offres, puis bundle : création, prix final et stock dynamique, liste, détail, modification, suppression ; enfin suppression des deux offres |
| `04 - Authentification et droits` | Connexion (succès, mauvais mot de passe, email inconnu), inscription (rôle forcé à `CLIENT`, doublon, mot de passe trop court), `GET /api/auth/me`, accès sans jeton (`401`) ou avec un mauvais rôle (`403`), propriété des offres entre deux fournisseurs, compte archivé (jeton et connexion refusés), puis nettoyage |
| `05 - Panier et codes promo` | Création d'un hôtel, d'une excursion et d'un bundle ; panier (sans jeton, mauvais rôle, vide), ajout et fusion des lignes, stock dépassé, quantité, paiement à l'arrivée selon le contenu, bundle remisé ; CRUD des codes promo (droits, doublon, pourcentage > 100, date passée) ; application, retrait, désactivation et suppression d'un code ; puis nettoyage |

Chaque requête contient des tests (code HTTP, contenu de la réponse). Chaque dossier est **autonome** : il crée ses propres données et les supprime à la fin, donc il peut être lancé seul, dans n'importe quel ordre, et laisse la base propre. Les identifiants créés (`userId`, `hotelId`, `bundleId`…) sont mémorisés dans les **variables de la collection** ; un script au niveau de la collection **connecte automatiquement** les comptes de test (client, fournisseur, agent, admin ; mot de passe `password123`) et mémorise leurs jetons (`clientToken`, `supplierToken`, `agentToken`, `adminToken`). Chaque requête utilise le jeton du rôle requis (onglet *Authorization* → *Bearer Token*).

## Prérequis

1. MySQL démarré (XAMPP) et backend lancé (`backend/` → `./mvnw spring-boot:run`).
2. Une ville existante : la variable `cityId` vaut `1` par défaut (les villes de référence sont créées au démarrage). À adapter si la ville 1 a été supprimée.
3. Les comptes de test créés au démarrage (client, fournisseur, agent, admin) : leurs mots de passe doivent être `password123`.

## Utilisation dans l'extension Postman de VS Code

1. Ouvrir la vue **Postman** (icône dans la barre d'activité) et se connecter.
2. **Import** → choisir `docs/postman/AtlasVoyage.postman_collection.json`. Après une modification du fichier, supprimer l'ancienne collection puis la réimporter.
3. Ouvrir la collection « Atlas Voyage - API REST » : la variable `baseUrl` est déjà réglée sur `http://localhost:8080`.
4. Lancer un dossier ou toute la collection avec **Run** (Runner), ou les requêtes une par une avec **Send**. L'onglet **Test Results** affiche les vérifications.

Résultat attendu : 101 requêtes, 169 vérifications, 0 échec (la collection entière comme chaque dossier pris seul).
