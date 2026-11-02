# ADR-0009 : Internationalisation runtime Vanilla JavaScript sans étape de compilation

> **Date :** 1er novembre 2026 | **Statut :** Accepté  
> **Décideurs :** Équipe d'Ingénierie & Architecture Atlas Voyage  
> **Contexte de référence :** Phases 1 à 14

---

## 1. Contexte et Problématique

Atlas Voyage doit supporter le Français, l'Anglais et l'Arabe (avec RTL et 6 formes de pluriel) sans rompre le principe fondateur du frontend Vanilla JS (zéro étape de build obligatoire, fichiers HTML directement exécutables via serveur statique local).

---

## 2. Décision Prise

Implémenter un moteur i18n natif en JavaScript moderne (`frontend/js/shared/i18n.js`) chargeant des dictionnaires JSON modulaires (`frontend/locales/{lang}/{ns}.json`) à la volée avec mise en cache mémoire.
Utiliser l'API standard `Intl.PluralRules` pour la gestion des pluriels arabes et des sélecteurs déclaratifs (`data-i18n`, `data-i18n-attr`).

---

## 3. Conséquences

Avantages :
- Zéro dépendance à Webpack, Vite ou un compilateur.
- Modification instantanée des traductions visible au simple rafraîchissement (`F5`).
- Prise en charge native et accessible du mode RTL.
Inconvénients :
- Légère latence de chargement réseau des fichiers JSON au premier affichage (compensée par le cache navigateur et Caffeine côté serveur).

---

## 4. Alternatives Envisagées et Raisons du Rejet

1. i18next compilé : Rejeté car imposait une étape de bundling Node.js.
2. Pages HTML dupliquées par langue (`accueil_fr.html`, `accueil_ar.html`) : Rejeté pour démultiplication ingérable de la maintenance.
