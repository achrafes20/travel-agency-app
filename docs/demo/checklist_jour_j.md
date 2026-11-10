# Checklist Opérationnelle du Jour J — Démonstration Atlas Voyage

Cette checklist accompagne l'équipe technique et le présentateur depuis la veille de la soutenance jusqu'à la conclusion de la séance devant le jury.

---

## 1. Phase J-1 (La Veille de la Démonstration)

- [ ] **Synchronisation Git Propre** : S'assurer que le dépôt local est sur la branche principale propre, sans fichiers orphelins ni modifications non commitées (`git status`).
- [ ] **Validation de la Suite Complète** : Exécuter la commande globale de recette :
  ```bash
  npm run recette:all
  ```
  Vérifier que les 5 étapes (compilation backend, reset démo, intégrité SQL, mock check, suite E2E) affichent **✅ SUCCÈS**.
- [ ] **Mise en Cache des Ressources Externes** : Ouvrir Google Chrome, naviguer sur toutes les pages publiques et espaces privés pour mettre en cache les polices Montserrat, le CDN Tailwind (espaces fournisseur et agent seulement : l'espace client n'en dépend plus) et Lucide. Leaflet est hébergé localement.
- [ ] **Préparation de la Machine de Secours (Plan B3)** : Cloner le dépôt sur le second ordinateur portable, tester la compilation et vérifier le bon fonctionnement.
- [ ] **Sauvegarde sur Clé USB** : Copier le dossier `docs/` et les 39 captures d'écran de preuves sur une clé USB prête à l'emploi.

---

## 2. Phase H-1 (Une Heure avant le Passage)

- [ ] **Connectique et Affichage** :
  - Brancher le câble d'alimentation secteur (ne pas compter uniquement sur la batterie).
  - Connecter l'adaptateur vidéo (HDMI / USB-C vers vidéoprojecteur) et tester le mode d'affichage « Dupliquer » ou « Étendre » avec une résolution stable (1920x1080 recommandée).
  - Désactiver les notifications système de l'OS (Mode « Ne pas déranger » activé).
- [ ] **Fermeture des Applications Inutiles** :
  - Fermer Teams, Outlook, Discord, Spotify et tout processus consommateur de bande passante ou de mémoire RAM.
- [ ] **Vérification des Processus Locaux** :
  - Vérifier que MySQL est actif sur le port 3306.
  - Vérifier que le backend Spring Boot répond sur `http://localhost:8080/api/status`.
  - Vérifier que le serveur frontend répond sur `http://localhost:5500/frontend/accueil.html`.
- [ ] **Préparation du Navigateur** :
  - Ouvrir une fenêtre Google Chrome propre en zoom standard 100%.
  - Ouvrir 4 onglets prêts pour la navigation :
    1. Onglet 1 : `http://localhost:5500/frontend/accueil.html` (Site public invité)
    2. Onglet 2 : `http://localhost:5500/frontend/connexion.html` (Écran de connexion)
    3. Onglet 3 : Terminal PowerShell avec la commande de secours `node scripts/recette/reset_demo.mjs` pré-saisie.
    4. Onglet 4 : Fichier `docs/recette/decision_go_no_go.md` prêt pour la conclusion.
- [ ] **Chronomètre** : Poser un smartphone avec chronomètre visible à côté du clavier pour respecter le timing strict de 10 minutes.

---

## 3. Pendant la Démonstration (Déroulé en Direct)

- [ ] **Gestion du Rythme et de la Voix** :
  - Parler d'une voix posée, claire et assurée.
  - Laisser le temps à chaque écran de s'afficher (compter 1 à 2 secondes après chaque clic avant de continuer le discours).
- [ ] **Mouvements de Curseur Délibérés** :
  - Éviter les mouvements erratiques de la souris ; pointer directement sur les éléments décrits oralement (bouton RTL, sélecteur de devises, badges de modération).
- [ ] **Respect des Paliers Minutes** :
  - Minute 01:00 : Fin de l'intro invité & RTL.
  - Minute 02:30 : Fin de l'exploration catalogue.
  - Minute 04:00 : Fin de la commande client.
  - Minute 05:30 : Fin de l'espace fournisseur.
  - Minute 07:00 : Fin de l'espace agent & cash.
  - Minute 08:30 : Fin de l'espace administrateur & audit.
  - Minute 10:00 : Conclusion qualité & passage aux questions.
- [ ] **Gestion des Imprévus** :
  - En cas d'erreur de clic ou d'écran inattendu, ne jamais paniquer ni s'excuser excessivement : recharger la page (`F5`) ou exécuter le Plan B4 en 1 seconde en expliquant calmement la robustesse de l'outillage de remise à zéro.

---

## 4. Phase Post-Démonstration (J+0)

- [ ] **Recueil des Remarques du Jury** : Noter scrupuleusement les questions techniques et suggestions d'amélioration.
- [ ] **Mise à Jour du Registre** : Consigner les éventuelles demandes spécifiques dans le registre de suivi pour la version `v1.0.0` stable.
- [ ] **Arrêt Propre des Daemons** : Clôturer les terminaux et arrêter proprement les services backend et frontend.

