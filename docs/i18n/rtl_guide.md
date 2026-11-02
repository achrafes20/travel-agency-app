# Guide de Conception et d'Intégration RTL (Right-to-Left) — Atlas Voyage

## 1. Contexte et Enjeux

L'arabe est une langue officielle du Royaume du Maroc et constitue l'un des piliers culturels et linguistiques d'Atlas Voyage.
L'affichage en arabe requiert une inversion complète du flux de lecture et d'interaction (Right-to-Left, RTL).
Ce guide expose les règles CSS, les conventions ergonomiques et les choix typographiques mis en œuvre pour garantir une expérience fluide, naturelle et conforme aux critères d'accessibilité WCAG 2.1 Niveau AA.

---

## 2. Principes Fondamentaux de la Mise en Page RTL

### 2.1 Attributs HTML Racine

Lorsque l'arabe est sélectionné, le moteur `I18n` applique automatiquement sur l'élément racine :
```html
<html lang="ar" dir="rtl" class="rtl">
```

Effets immédiats du navigateur :
- Flux de texte inversé : commence à droite et s'écoule vers la gauche.
- Colonnes flexbox et grilles CSS standard : l'ordre des éléments visuels s'inverse naturellement selon le flux logique.
- Barres de défilement : placées à gauche de l'écran dans les interfaces utilisateur conformes.

### 2.2 Remplacement des Propriétés Physiques par des Propriétés Logiques

Pour éviter les duplications fastidieuses de code CSS, les styles modernes du projet s'appuient sur les **propriétés logiques CSS** :

| Ancienne propriété physique (à proscrire) | Propriété logique recommandée | Comportement en LTR | Comportement en RTL |
| :--- | :--- | :--- | :--- |
| `margin-left: 1rem;` | `margin-inline-start: 1rem;` | Marge à gauche | Marge à droite |
| `margin-right: 1rem;` | `margin-inline-end: 1rem;` | Marge à droite | Marge à gauche |
| `padding-left: 1.5rem;` | `padding-inline-start: 1.5rem;` | Rembourrage à gauche | Rembourrage à droite |
| `padding-right: 1.5rem;` | `padding-inline-end: 1.5rem;` | Rembourrage à droite | Rembourrage à gauche |
| `left: 0;` | `inset-inline-start: 0;` | Calé à gauche | Calé à droite |
| `right: 0;` | `inset-inline-end: 0;` | Calé à droite | Calé à gauche |
| `text-align: left;` | `text-align: start;` | Aligné à gauche | Aligné à droite |
| `text-align: right;` | `text-align: end;` | Aligné à droite | Aligné à gauche |
| `border-left: 2px solid;` | `border-inline-start: 2px solid;` | Bordure à gauche | Bordure à droite |

---

## 3. Typographie et Lisibilité en Arabe

### 3.1 Cascade de Polices (Font Stack)

La lecture de la calligraphie arabe requiert des hauteurs de ligne et des graisses adaptées :
```css
[dir="rtl"] {
  font-family: 'Cairo', 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif;
  line-height: 1.7; /* Légèrement supérieur au LTR pour éviter le chevauchement des diacritiques */
}
```

- **Cairo** : Police moderne, claire et hautement lisible sur écrans retina et basse résolution.
- **Noto Sans Arabic** : Repli universel Google respectant la calligraphie naskh contemporaine.

### 3.2 Numérotation et Ponctuation

- **Chiffres Arabes Occidentaux (0-9)** :
  Au Maroc, l'administration, le secteur bancaire et les compagnies aériennes utilisent quasi-exclusivement les chiffres occidentaux (1, 2, 3...) plutôt que les chiffres orientaux (١، ٢، ٣...).
  La locale configurée dans `format.js` est explicitement :
  `ar-MA-u-nu-latn-ca-gregory`
- **Ponctuation Arabe Conforme** :
  - Virgule inversée : `،` (U+060C) au lieu de `,`
  - Point-virgule inversé : `؛` (U+061B) au lieu de `;`
  - Point d'interrogation inversé : `؟` (U+061F) au lieu de `?`

---

## 4. Règles d'Inversion des Icônes et Éléments Graphiques

Toutes les icônes ne doivent **pas** être inversées en RTL. Une mauvaise inversion brise le modèle mental de l'utilisateur :

### 4.1 Icônes à Inverser Impérativement (Miroir Horizontal)
Ce sont les icônes qui symbolisent un déplacement temporel, une navigation directionnelle ou un flux :
- **Flèches directionnelles** : `arrow-left`, `arrow-right`, `chevron-left`, `chevron-right`
- **Bouton retour en arrière** : `undo`, `back`
- **Indicateurs d'étapes (steppers)** : Les lignes reliant les étapes 1 -> 2 -> 3 doivent s'écouler de droite à gauche.

Règle CSS dédiée (`frontend/css/rtl.css`) :
```css
[dir="rtl"] .av-icon-flip,
[dir="rtl"] [data-lucide="arrow-left"],
[dir="rtl"] [data-lucide="arrow-right"],
[dir="rtl"] [data-lucide="chevron-left"],
[dir="rtl"] [data-lucide="chevron-right"] {
  transform: scaleX(-1);
}
```

### 4.2 Icônes à NE JAMAIS Inverser
- **Symboles physiques ou neutres** : Coche de validation (`check`), loupe de recherche (`search`), cœur (`heart`), étoile de notation (`star`), poubelle (`trash`), calendrier (`calendar`), cadenas (`lock`).
- **Supports multimédia** : Bouton lecture (`play` pointe toujours vers la droite), pause.
- **Logos de marques** : Logo Atlas Voyage, logos de cartes bancaires (Visa, Mastercard, CMI).

---

## 5. Composants Complexes en RTL

### 5.1 En-têtes et Menus Déroulants
- Les menus déroulants associés au bouton de compte ou au panier s'ouvrent par défaut vers la gauche (`right: auto; left: 0;`).
- Le bouton de fermeture des modales (croix `✕`) est positionné dans l'angle supérieur gauche de la boîte de dialogue en RTL.

### 5.2 Formulaires et Champs de Saisie
- Les labels sont alignés à droite (`text-align: right;`).
- Les placeholders de saisie s'affichent à droite.
- Les icônes intérieures aux champs de saisie (ex. icône loupe dans le champ de recherche) sont ancrées à droite (`inset-inline-start: 12px;`), et le padding du texte est ajusté en conséquence (`padding-inline-start: 40px;`).

### 5.3 Tableaux et Grilles d'Administration
- La première colonne (Identifiant / Titre) est située à l'extrême droite.
- La colonne des boutons d'actions contextuelles (modifier, supprimer, voir) est située à l'extrême gauche.

---

## 6. Liste de Contrôle Qualité RTL (Checklist QA)

Avant toute mise en production d'une nouvelle page ou fonctionnalité :
- [x] L'attribut `dir="rtl"` et la classe `.rtl` sont bien présents sur `<html>`.
- [x] Aucun texte ne déborde de son conteneur lors du passage en arabe (vérifié également via le mode pseudo `?pseudo=1`).
- [x] Les flèches de navigation et de retour pointent dans la bonne direction.
- [x] Les champs de formulaire affichent le texte et le curseur à droite.
- [x] Les prix en MAD ou devises converties restent lisibles sans inversion de parenthèses ou de symboles.
- [x] Les critères WCAG 2.1 AA (contrastes > 4.5:1, zones cliquables > 44x44px, ordre de tabulation logique) sont validés en RTL comme en LTR.

