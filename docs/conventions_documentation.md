# Conventions de Documentation et « Definition of Done » — Atlas Voyage

> **Objet :** Standardisation des formats, règles de rédaction et exigences de qualité applicables à l'ensemble de la documentation du projet.  
> **Public visé :** Rédacteurs techniques, développeurs, mainteneurs et contributeurs.  
> **Dernière mise à jour :** 1er novembre 2026 | **Version de référence :** 3.0  
> **Statut :** ✅ Stable | **Propriétaire :** Équipe d'Ingénierie Atlas Voyage

---

## 1. Principes Directeurs « Docs-as-Code »

1. **La documentation ne ment jamais :** Aucune affirmation non vérifiée dans le code source ou non exécutée ne peut figurer comme un fait établi. Si une information est manquante ou incertaine, elle porte la mention explicite `À confirmer` ou `À décider par le métier`.
2. **Versionnage continu :** La documentation réside dans le même dépôt Git que le code applicatif (`docs/`). Toute modification du comportement du système doit être accompagnée de la mise à jour documentaire dans la même Pull Request.
3. **Format ouvert et lisibilité native :** Tous les documents utilisent le Markdown GitHub-Flavored (GFM). Les diagrammes sont rédigés en syntaxe Mermaid native sans recours à des binaires propriétaires.

---

## 2. En-tête Normalisé Obligatoire

Chaque document situé sous `docs/` doit impérativement débuter par le cartouche normalisé suivant :

```markdown
# [Titre Explicite du Document]

> **Objet :** [Description concise en une phrase de l'objectif du document].  
> **Public visé :** [Ex: Développeurs, Exploitants, Clients, Fournisseurs].  
> **Dernière mise à jour :** [Date au format JJ Mois AAAA, ex: 1er novembre 2026] | **Version de référence :** [Ex: 3.0]  
> **Statut :** [✅ Stable / 🟡 En cours de révision / 🔲 Conception cible] | **Propriétaire :** [Rôle ou Équipe, jamais de nom personnel]

---
```

---

## 3. Statuts Explicites d'Implémentation

Pour lever toute ambiguïté sur ce qui est réellement en production par rapport aux fonctionnalités prévues :

| Symbole | Statut | Signification |
| :---: | :--- | :--- |
| `✅` | **Implémenté** | Fonctionnalité codée, testée en intégration, fonctionnelle et vérifiable dans le code actuel. |
| `🟡` | **Partiel** | Fonctionnalité commencée ou opérationnelle avec des restrictions expressément documentées. |
| `🔲` | **Prévu** | Spécification ou conception cible pour une phase ultérieure. Le document ne prétend pas qu'elle fonctionne. |

> **Règle stricte :** Le terme « maquette » est formellement interdit pour désigner des écrans ou services désormais branchés à l'API backend.

---

## 4. Conventions Mermaid

Les schémas d'architecture et de processus doivent respecter les règles suivantes :
- **Types de diagrammes autorisés :**
  - Diagrammes de flux : `flowchart TD` ou `flowchart LR`.
  - Diagrammes de séquence : `sequenceDiagram`.
  - Modèles Entité-Relation : `erDiagram`.
  - Diagrammes d'états : `stateDiagram-v2`.
- **Échappement des libellés :** Tout label comportant des parenthèses, crochets ou caractères spéciaux doit être rigoureusement entouré de guillemets doubles (ex : `id["Paiement à l'arrivée (Espèces)"]`).
- **Validation automatique :** Tous les blocs Mermaid doivent compiler sans avertissement via le script de vérification `npm run docs:check`.

---

## 5. Conventions pour les Captures d'Écran

- **Génération automatique par script :** Les captures d'écran des manuels utilisateurs sont produites automatiquement par le script Playwright / Puppeteer (`npm run docs:screenshots`). Aucune capture manuelle floue ou désynchronisée n'est tolérée.
- **Déterminisme visuel :**
  - Résolution d'écran fixe : Desktop `1440x900` px ; Mobile `390x844` px.
  - Thème clair par défaut (sauf illustration explicite du mode sombre).
  - Données de démo fixes (aucun compte personnel, aucun e-mail ou téléphone réel).
  - Horodatages et animations neutralisés avant la prise de vue.
- **Budget de poids :** Chaque capture est compressée (PNG optimisé) et ne doit pas dépasser 250 Ko.
- **Accessibilité :** Chaque image référencée doit disposer d'un attribut `alt` descriptif et signifiant :
  `![Formulaire de création d'une offre hôtelière en 4 étapes](assets/screenshots/fournisseur/02-wizard-offre.png)`

---

## 6. Protection des Données et Secrets

- **Tolérance Zéro Secret :** Aucun mot de passe de production, clé API, jeton JWT réel, certificat SSL ou chaîne de connexion privée ne doit être commité.
- **Placeholders normalisés :** Utiliser systématiquement `<YOUR_JWT_SECRET>`, `<DATABASE_PASSWORD>`, `change-me`, `https://example.ma`.
- **Comptes de démonstration :** Les comptes de test (`sarah.benali@example.com`, `omar.tazi@atlasvoyage.ma`, mot de passe `password123`) ne doivent être cités que dans le strict cadre du profil de développement local `dev`, assortis d'un avertissement de sécurité.

---

## 7. « Definition of Done » (DoD) Documentaire

Une tâche de développement ou une Pull Request n'est considérée comme **terminée** que si la liste de contrôle suivante est validée :

- [ ] Tout nouvel endpoint REST est documenté dans OpenAPI (`openapi.yaml`) et référencé dans `docs/api_endpoints.md`.
- [ ] Toute nouvelle entité ou modification du modèle relationnel est répercutée dans `docs/architecture.md` (schéma ER).
- [ ] Toute nouvelle variable d'environnement est consignée dans `.env.example` et `docs/exploitation/configuration.md`.
- [ ] Tout changement impactant l'utilisateur est reporté dans le manuel du rôle concerné (`docs/manuel/`).
- [ ] Les compteurs statistiques et chiffres de tests cités dans la documentation sont à jour.
- [ ] Le script de contrôle `npm run docs:check` s'exécute avec succès (0 lien brisé, 0 secret, 0 syntaxe Mermaid invalide).
