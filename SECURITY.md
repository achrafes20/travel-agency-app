# Politique de Sécurité & Divulgation Responsable — Atlas Voyage

La sécurité de la plateforme **Atlas Voyage** et la protection des données de nos utilisateurs et partenaires sont des priorités absolues.

---

## 1. Versions Supportées

Seule la dernière version mineure de chaque branche majeure reçoit des correctifs de sécurité officiels :

| Version | Statut | Correctifs de Sécurité |
|---|:---:|:---:|
| **1.15.x** | ✅ Actuelle | Supportée |
| 1.14.x | 🟡 Maintenance | Correctifs critiques uniquement |
| < 1.14 | ❌ Obsolète | Non supportée |

---

## 2. Signalement d'une Vulnérabilité (Responsible Disclosure)

Si vous découvrez une faille ou une vulnérabilité de sécurité sur Atlas Voyage :

> [!CAUTION]
> **Ne créez jamais d'issue publique sur GitHub** pour signaler un problème de sécurité.

Veuillez transmettre votre rapport détaillé par e-mail sécurisé à notre équipe de sécurité :
- **Adresse de contact :** `securite@atlasvoyage.ma` (ou consulter [`docs/decisions_a_prendre.md`](docs/decisions_a_prendre.md#2-contact-de-sécurité-officiel) pour les contacts alternatifs)
- **Objet :** `[VULNÉRABILITÉ SÉCURITÉ] - Brève description du problème`

### Informations à inclure dans votre rapport :
1. Type et gravité estimée de la vulnérabilité (ex. Injection SQL, XSS, Contournement CSRF, BOLA / IDOR).
2. Composants et URLs affectés (contrôleurs Spring Boot ou pages frontend).
3. Procédure détaillée de reproduction étape par étape (Proof of Concept, commandes curl ou requêtes HTTP brutes).
4. Impact potentiel sur l'intégrité, la confidentialité ou la disponibilité du système.

---

## 3. Nos Engagements

Dès réception de votre signalement :
- **Accusé de réception :** sous **48 heures ouvrées**.
- **Évaluation & Qualification :** sous 5 jours ouvrés avec attribution d'un score CVSS v3.1.
- **Période d'embargo :** Nous vous demandons de préserver la confidentialité du signalement pendant un délai de **90 jours**, le temps de concevoir, tester et déployer le correctif.
- **Remerciements :** Après publication du correctif, votre nom ou pseudonyme pourra être crédité dans notre panthéon des contributeurs de sécurité (Hall of Fame).
