# Référentiel du Jeu de Données de Démonstration — Atlas Voyage

Ce document recense les comptes utilisateurs, les données touristiques représentatives et les mentions de licences graphiques exploitées lors des recettes et démonstrations officielles d'Atlas Voyage.

---

## 1. Comptes de Démonstration Préconfigurés

Tous les comptes ci-dessous sont injectés de manière reproductible et idempotente par le composant `DataSeeder.java` et réinitialisables via `scripts/recette/reset_demo.mjs`.

| Rôle Applicatif | Adresse E-mail | Mot de Passe | Nom Complet Affiché | Entité / Attributions |
| :--- | :--- | :--- | :--- | :--- |
| **Administrateur** | `omar.tazi@atlasvoyage.ma` | `password123` | **Omar Tazi** | Direction des Opérations Atlas Voyage — Droits totaux de supervision, modération et audit. |
| **Fournisseur** | `karim.idrissi@atlasvoyage.ma` | `password123` | **Karim Idrissi** | Gérant « Atlas Hospitality Group » (Riads & Hôtels à Marrakech et Fès). |
| **Agent de Voyage** | `nadia.elfassi@atlasvoyage.ma` | `password123` | **Nadia El Fassi** | Conseillère Comptoir — Agence Centrale Casablanca (Encaissements espèces, bundles). |
| **Client Voyageur** | `sarah.benali@example.com` | `password123` | **Sarah Benali** | Voyageuse enregistrée (Historique de réservations actives, favoris enregistrés). |

> [!NOTE]
> Le mot de passe uniforme `password123` est strictement réservé aux environnements de test, de recette et de démonstration locale. En production, la politique de mot de passe zxcvbn force un score de robustesse élevé.

---

## 2. Données Touristiques Réalistes Injectées

### 2.1 Référentiel des Villes Marocaines
Le catalogue s'appuie sur le patrimoine touristique marocain avec des coordonnées géographiques réelles (WGS84) et normalisation des noms :
- **Marrakech** (`RAK` / Menara) : Coordonnées 31.6295, -7.9811 (Aéroport international : Oui)
- **Casablanca** (`CMN` / Mohammed V) : Coordonnées 33.5731, -7.5898 (Aéroport international : Oui)
- **Fès** (`FEZ` / Saïss) : Coordonnées 34.0181, -5.0078 (Aéroport international : Oui)
- **Tanger** (`TNG` / Ibn Battouta) : Coordonnées 35.7595, -5.8340 (Aéroport international : Oui)
- **Chefchaouen** : Coordonnées 35.1716, -5.2697 (Perle bleue du Rif, aéroport : Non)
- **Agadir** (`AGA` / Al Massira) : Coordonnées 30.4278, -9.5981 (Station balnéaire, aéroport : Oui)
- **Merzouga / Erg Chebbi** : Coordonnées 31.0993, -4.0118 (Dunes sahariennes, aéroport : Non)
- **Ouarzazate** (`OZZ`) : Coordonnées 30.9335, -6.9370 (Porte du désert et studios de cinéma)

### 2.2 Exemples d'Offres de Démonstration
1. **Hôtel & Riad** : *« Riad Al Jazira — Médina de Marrakech »* (ID 1)
   - Tarif de base : 1 200,00 MAD / nuit.
   - Prestations : Patio avec piscine, petit-déjeuner beldi inclus, spa traditionnel.
2. **Vol National / International** : *« Vol Casablanca (CMN) → Marrakech (RAK) »*
   - Tarif de base : 650,00 MAD / passager.
   - Compagnie nationale, classe économique, franchise bagage 23 kg.
3. **Location de Voiture** : *« Dacia Duster 4x4 Diesel »*
   - Tarif de base : 450,00 MAD / jour.
   - Climatisation, boîte manuelle, kilométrage illimité, franchise standard.
4. **Excursion & Aventure** : *« Bivouac de Luxe & Coucher de Soleil dans les Dunes de Merzouga »*
   - Tarif de base : 1 800,00 MAD / personne.
   - Balade à dos de dromadaire, dîner sous tente caïdale, observation astronomique avec guide local.

---

## 3. Licences Graphiques et Photographies

Toutes les photographies intégrées dans l'interface proviennent de photographes de la communauté **Unsplash** sous licence libre de droits (**Unsplash License**) autorisant l'utilisation commerciale et non-commerciale sans redevance :
- Photographie d'accueil (Porte de Médina) : **Alex Azabache** sur Unsplash. *(Le crédit n'est plus affiché sur la page de connexion depuis le 9 novembre 2026 ; la licence Unsplash n'impose pas la mention du photographe, qui reste consignée ici.)*
- Photographie Riad & Architecture zellige : **Annie Spratt** sur Unsplash.
- Photographie Désert & Dunes : **Toa Heftiba** sur Unsplash.
- Photographies de Chefchaouen : **Heidi Kaden** sur Unsplash.

**Garantie Juridique** :  
Aucune image protégée par un copyright restrictif ni aucune donnée personnelle réelle (PII) n'est présente dans les jeux de données d'Atlas Voyage.

