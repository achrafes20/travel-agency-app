# Tests Postman — Atlas Voyage

Collection : [`AtlasVoyage.postman_collection.json`](AtlasVoyage.postman_collection.json) (Postman Collection v2.1).

Elle teste l'API REST du backend (`http://localhost:8080`) : **utilisateurs, offres (5 types) et bundles**. La liste des endpoints est dans [`../api_endpoints.md`](../api_endpoints.md).

## Contenu (31 requêtes, 63 vérifications)

| Dossier | Contenu |
|---|---|
| `00 - Statut` | `GET /api/status` |
| `01 - Utilisateurs` | Liste, création, détail, modification, archivage, suppression |
| `02 - Offres` | Création des 5 types (hôtel, vol, voiture, taxi, excursion), liste et filtres, détail, modification, puis suppression des offres créées |
| `03 - Bundles` | Création de deux offres, puis bundle : création, prix final et stock dynamique, liste, détail, modification, suppression ; enfin suppression des deux offres |

Chaque requête contient des tests (code HTTP, contenu de la réponse). Chaque dossier est **autonome** : il crée ses propres données et les supprime à la fin, donc il peut être lancé seul, dans n'importe quel ordre, et laisse la base propre. Les identifiants créés (`userId`, `hotelId`, `bundleId`…) sont mémorisés dans les **variables de la collection** ; les comptes client / fournisseur / agent sont retrouvés par leur rôle grâce à un script au niveau de la collection.

## Prérequis

1. MySQL démarré (XAMPP) et backend lancé (`backend/` → `./mvnw spring-boot:run`).
2. Une ville existante : la variable `cityId` vaut `1` par défaut (les villes de référence sont créées au démarrage). À adapter si la ville 1 a été supprimée.
3. Les comptes de test créés au démarrage (client, fournisseur, agent).

## Utilisation dans l'extension Postman de VS Code

1. Ouvrir la vue **Postman** (icône dans la barre d'activité) et se connecter.
2. **Import** → choisir `docs/postman/AtlasVoyage.postman_collection.json`. Après une modification du fichier, supprimer l'ancienne collection puis la réimporter.
3. Ouvrir la collection « Atlas Voyage - API REST » : la variable `baseUrl` est déjà réglée sur `http://localhost:8080`.
4. Lancer un dossier ou toute la collection avec **Run** (Runner), ou les requêtes une par une avec **Send**. L'onglet **Test Results** affiche les vérifications.

Résultat attendu : 31 requêtes, 63 vérifications, 0 échec (la collection entière comme chaque dossier pris seul).
