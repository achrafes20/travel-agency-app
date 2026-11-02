# Plan et Procédure de Réponse aux Incidents de Sécurité — Atlas Voyage

Ce document définit le guide de conduite opérationnelle (Runbook) pour la détection, le confinement, l'éradication, le rétablissement et la notification légale en cas d'incident de sécurité sur la plateforme Atlas Voyage.

---

## 1. Classification de la Gravité des Incidents

| Niveau | Sévérité | Définition / Exemples | Temps de Réaction Cible (SLA) | Responsable |
| :--- | :--- | :--- | :--- | :--- |
| **P1** | **Critique** | Fuite massive de données personnelles (RGPD / CNDP), compromission du serveur ou de la base de données, exécution de code à distance (RCE), contournement total de l'authentification. | **< 15 minutes** | RSSI / Lead Tech / Direction |
| **P2** | **Majeur** | Détection d'un rejeu frauduleux de refresh token (`SECURITY_ALERT`), attaque DoS impactant la disponibilité du service, attaque par force brute distribuée réussie sur un compte à privilèges. | **< 1 heure** | Ingénieur Sécurité / DevOps |
| **P3** | **Modéré** | Alertes répétées de rate limiting (429), tentative infructueuse d'injection SQL bloquée, échecs consécutifs d'authentification sur un compte utilisateur standard. | **< 4 heures** | Équipe Support / Développeurs |
| **P4** | **Mineur** | Comportement suspect isolé, faux positif de pare-feu applicatif. | **< 24 heures** | Analyste / Développeur |

---

## 2. Détection et Alertes Automatisées

L'architecture applicative génère des marqueurs d'alerte spécifiques dans les journaux structurés :

1. **Tentative de Rejeu de Refresh Token (Vol de session) :**
   ```
   WARN [http-nio-8080-exec-1] c.a.voyage.service.RefreshTokenService : SECURITY_ALERT: refresh_token_reuse_detected userId=... familyId=...
   ```
   *Action automatique déclenchée :* Invalidation instantanée de toute la famille de jetons associée et incrémentation de `tokenVersion` de l'utilisateur.

2. **Verrouillage de Compte par Force Brute :**
   ```
   WARN [http-nio-8080-exec-3] com.agence.voyage.service.AuthService : account_locked userId=... email=...
   ```
   *Action automatique déclenchée :* Verrouillage du compte pour 15 minutes avec rejet automatique de toute tentative subséquente.

3. **Dépassement de Quota de Requêtes (Rate Limit) :**
   ```
   WARN [http-nio-8080-exec-5] c.a.v.s.RateLimitingFilter : RATE_LIMIT_EXCEEDED client=... path=/api/auth/login
   ```

---

## 3. Déroulement d'une Intervention en 6 Étapes

```
   ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
   │ 1. Détection &  │  ──>  │ 2. Confinement  │  ──>  │ 3. Éradication  │
   │  Qualification  │       │  & Atténuation  │       │   de la Cause   │
   └─────────────────┘       └─────────────────┘       └─────────────────┘
                                                                │
   ┌─────────────────┐       ┌─────────────────┐                ▼
   │ 6. Post-Mortem  │  <──  │ 5. Notification │  <──  ┌─────────────────┐
   │ & Amélioration  │       │   Réglementaire │       │ 4. Récupération │
   └─────────────────┘       └─────────────────┘       │ & Rétablissement│
                                                       └─────────────────┘
```

### Étape 1 : Détection & Qualification
- Vérifier l'authenticité de l'incident via les logs applicatifs (`correlationId`, logs Spring Boot, logs Nginx).
- Isoler les comptes utilisateurs ou adresses IP ciblées.
- Assigner le niveau de sévérité (P1 à P4).

### Étape 2 : Confinement & Atténuation Immédiate

#### Cas 2.1 : Compromission d'un Compte Utilisateur Spécifique
Pour couper immédiatement l'accès d'un compte suspect sans suspendre le service global :
```http
POST /api/auth/logout-all
# Ou via intervention administrateur direct en base :
```
```sql
-- Révocation de toutes les sessions actives de l'utilisateur
UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = :targetUserId;
UPDATE users SET token_version = token_version + 1, locked_until = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE id = :targetUserId;
```

#### Cas 2.2 : Attaque par Force Brute / Déni de Service provenant d'une IP
Bloquer l'adresse IP au niveau du pare-feu Nginx ou du système hôte :
```bash
# Blocage au niveau pare-feu iptables
sudo iptables -A INPUT -s <IP_SUSPECTE> -j DROP

# Ou ajout temporaire dans Nginx
# /etc/nginx/conf.d/blockips.conf
deny <IP_SUSPECTE>;
sudo nginx -s reload
```

#### Cas 2.3 : Fuite Générale de Clé Secrète (ex. `JWT_SECRET`)
Exécuter la procédure de rotation d'urgence décrite dans `docs/securite/procedure_rotation_secrets.md` :
1. Régénérer `JWT_SECRET`.
2. Invalider tous les refresh tokens existants.
3. Redémarrer les instances backend.

### Étape 3 : Éradication de la Cause Racine
- Analyser le vecteur d'entrée (vulnérabilité applicative, mot de passe compromis, attaque Man-in-the-Middle).
- Déployer un correctif de code ou fermer l'accès incriminé.
- Effectuer un scan de vulnérabilités des dépendances (`mvn dependency-check:check`).

### Étape 4 : Rétablissement & Contrôle d'Intégrité
- Si la base de données a été altérée :
  - Restaurer la sauvegarde de la veille via le script `restore_mysql.ps1`.
  - Rejouer les transactions manquantes à partir des binlogs MySQL (Point-in-Time Recovery).
- Valider la cohérence des données (réservations, paiements, utilisateurs).
- Lever les mesures de confinement temporaires.

### Étape 5 : Notification Réglementaire (Conformité CNDP / RGPD)

En cas de violation de données personnelles avérée (accès illégitime, fuite de base de données, altération) :

> [!IMPORTANT]
> Conformément à la **Loi marocaine n° 09-08** (art. 23) et au **RGPD** (art. 33) :
> - **Délai légal :** Notification obligatoire à la **CNDP (Commission Nationale de Contrôle de la Protection des Données à Caractère Personnel)** dans un délai maximal de **72 heures** après en avoir pris connaissance.
> - **Contenu de la déclaration :**
>   1. Nature de la violation (catégories et nombre approximatif de personnes concernées).
>   2. Coordonnées du Délégué à la Protection des Données (DPO).
>   3. Conséquences probables de la violation.
>   4. Mesures prises ou envisagées pour remédier à la violation et atténuer les risques.
> - **Information des personnes concernées :** Si la violation présente un risque élevé pour les droits et libertés des personnes, celles-ci doivent être informées directement sans délai injustifié par email.

### Étape 6 : Post-Mortem et Plan d'Amélioration
- Rédaction d'un rapport post-incident formel dans les 5 jours ouvrés.
- Chronologie détaillée des événements et des actions de mitigation.
- Analyse des causes fondamentales (Méthode des 5 Pourquoi).
- Ajout de règles de test de non-régression dans la suite de tests automatisée.
- Actualisation du présent plan de réponse aux incidents.

