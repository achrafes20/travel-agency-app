# Procédures Opérationnelles de Secours (Plan B) — Démonstration Atlas Voyage

Une démonstration professionnelle exige d'anticiper les défaillances techniques imprévues.  
Ce document formalise les **4 procédures de repli (Plan B)** testées et validées pour garantir la continuité de la présentation en toute circonstance.

---

## Plan B1 : Conflit de Port Local (Ports 8080 ou 5500 Occupés)

### Symptôme
Le backend refuse de démarrer avec l'erreur `Port 8080 was already in use` ou le serveur frontend indique `EADDRINUSE: address already in use :::5500`.

### Procédure d'Atténuation Express (< 15 secondes)
1. **Identification et libération des ports via PowerShell** :
   ```powershell
   # Libération du port 8080 (Backend Spring Boot)
   Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force

   # Libération du port 5500 (Frontend)
   Get-Process -Id (Get-NetTCPConnection -LocalPort 5500).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force
   ```
2. **Relance immédiate des services** :
   - Démarrer le frontend : `node scripts/serve_frontend.mjs`
   - Démarrer le backend : `.\mvnw.cmd spring-boot:run`
3. **Alternative port dynamique** :
   - Si le port 8080 reste verrouillé par un processus système, démarrer le backend sur le port alternatif :  
     `.\mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"`  
     (et mettre à jour `frontend/js/core/config.js` avec `API_BASE: 'http://localhost:8081'`).

---

## Plan B2 : Coupure Totale d'Accès Internet (Mode Hors Ligne / Offline)

### Symptôme
Le réseau Wi-Fi de la salle de présentation est indisponible ou instable, provoquant des lenteurs sur les CDN externes (Tailwind pour les espaces fournisseur et agent seulement, Lucide, Google Fonts ; Leaflet est hébergé localement).

### Procédure d'Atténuation Express (< 5 secondes)
1. **Architecture Locale Autonome** :
   - Le backend et la base MySQL tournent en pur local (`localhost:8080` et `localhost:3306`), sans aucune dépendance vers des APIs externes.
2. **Cache Agressif du Navigateur** :
   - Les bibliothèques CDN (Tailwind CDN pour les espaces fournisseur et agent, Lucide 0.468) et polices Montserrat ont été préalablement mises en cache par Chrome lors des répétitions.
   - Ne pas ouvrir la console de développement avec l'option « Disable cache » cochée.
3. **Cartographie Offline** :
   - Si les tuiles OpenStreetMap distantes ne se chargent pas, la carte Leaflet reste fonctionnelle avec les marqueurs GPS d'origine et la vue vectorielle de repli.
4. **Partage de Connexion Mobile 4G/5G** :
   - Téléphone portable du présentateur configuré en point d'accès Wi-Fi de secours prêt à être activé en 1 clic.

---

## Plan B3 : Défaillance Matérielle ou Vidéoprojecteur (Panne Poste)

### Symptôme
L'ordinateur principal plante, s'éteint inopinément ou le vidéoprojecteur refuse la résolution d'affichage.

### Procédure d'Atténuation Express (< 30 secondes)
1. **Machine de Secours (Binôme)** :
   - Un second ordinateur portable est maintenu allumé avec le dépôt cloné, le JDK 21 et le serveur prêt à prendre le relais.
2. **Support Visuel Statique Haute Définition** :
   - Toutes les captures d'écran certifiées de la recette E2E sont archivées en haute résolution dans le dossier :  
     `docs/recette/preuves/` (39 captures d'écran couvrant chaque écran clé).
3. **Diaporama de Repli PDF / Clé USB** :
   - Une clé USB contenant le dossier `docs/` et la présentation complète en PDF autonome est insérée sur le poste de secours. Le présentateur peut commenter le parcours pas-à-pas à partir des captures réelles.

---

## Plan B4 : Altération ou Corruption Inattendue de la Base de Données

### Symptôme
Durant une manipulation en direct, une fausse manipulation ou une suppression involontaire altère l'état de la démonstration (suppression d'une offre clé, réservation manquante, etc.).

### Procédure d'Atténuation Express (< 2 secondes)
1. **Exécution du Script de Réinitialisation Démo Idempotente** :
   Ouvrir un terminal et lancer immédiatement :
   ```bash
   node scripts/recette/reset_demo.mjs
   ```
2. **Résultat Garanti** :
   - En **0,44 seconde**, le script purge les tables transactionnelles, réinjecte les 4 comptes de test (`omar.tazi`, `karim.idrissi`, `nadia.elfassi`, `sarah.benali`), restaure les offres phares à Marrakech, Casablanca et Fès, et réinitialise les disponibilités.
3. **Reprise de Démonstration** :
   - Actualiser simplement la page du navigateur (`F5`). L'état est restauré à la perfection sans redémarrer le serveur Spring Boot.

