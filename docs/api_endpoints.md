# Répertoire Exhaustif des Points d'Accès de l'API (Endpoints) — Atlas Voyage

> **Objet :** Catalogue exhaustif de référence des 126 routes d'API REST implémentées dans le backend Atlas Voyage.  
> **Public visé :** Développeurs frontend, intégrateurs, testeurs API et auditeurs techniques.  
> **Dernière mise à jour :** 1er novembre 2026 | **Version de référence :** 3.0.0 (126 endpoints réels)  
> **Statut :** ✅ Stable (100% vérifié dans le code) | **Source :** Extraction automatique depuis les contrôleurs Spring Boot

---

## Synthèse par Domaine

| Domaine | Contrôleur(s) Spring | Nombre de Routes | Accès Principal |
| :--- | :--- | :---: | :--- |
| 1. Santé & Disponibilité | `StatusController` | **1** | Divers (voir détails) |
| 2. Authentification & Sessions | `AuthController` | **6** | Divers (voir détails) |
| 3. Sécurité du Compte & Réinitialisation | `AccountSecurityController` | **5** | Divers (voir détails) |
| 4. Profils Utilisateurs & Fiches Fournisseurs | `ProfileController` | **5** | Divers (voir détails) |
| 5. Administration des Utilisateurs & RGPD | `UserController` | **11** | Divers (voir détails) |
| 6. Villes Touristiques & Territoires | `CityController` | **5** | Divers (voir détails) |
| 7. Offres Touristiques, Disponibilités & Modération | `OfferController` | **10** | Divers (voir détails) |
| 8. Bundles & Packs Forfaits | `BundleController` | **5** | Divers (voir détails) |
| 9. Panier d'Achats | `CartController` | **7** | Divers (voir détails) |
| 10. Codes Promotionnels | `PromoCodeController` | **5** | Divers (voir détails) |
| 11. Réservations & Bons de Séjour (Vouchers) | `BookingController` | **8** | Divers (voir détails) |
| 12. Paiements Sandbox, Caisse & Webhooks | `PaymentController`, `PaymentWebhookController` | **11** | Divers (voir détails) |
| 13. Notifications In-App & Préférences | `NotificationController` | **7** | Divers (voir détails) |
| 14. Favoris Voyageurs | `FavoriteController` | **4** | Divers (voir détails) |
| 15. Tickets de Support & Assistance | `TicketController` | **9** | Divers (voir détails) |
| 16. Avis & Notations Vérifiées | `ReviewController` | **9** | Divers (voir détails) |
| 17. Contact Public & Pot de Miel | `ContactController` | **1** | Divers (voir détails) |
| 18. Paramètres Globaux & Maintenance | `SettingController` | **4** | Divers (voir détails) |
| 19. Statistiques, KPIs & Exports CSV | `StatsController` | **6** | Divers (voir détails) |
| 20. Devises Indicatives & Taux de Change | `CurrencyController` | **1** | Divers (voir détails) |
| 21. Fichiers & Images | `FileController` | **3** | Divers (voir détails) |
| 22. Journal d'Audit Immuable | `AuditController` | **3** | Divers (voir détails) |
| **TOTAL GÉNÉRAL** | **23 contrôleurs** | **126 endpoints** | — |

---

## 1. Santé & Disponibilité (1 endpoint)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `GET /api/status` | `Public` | `StatusController.status()` | status |

## 2. Authentification & Sessions (6 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `POST /api/auth/register` | `Public` | `AuthController.register()` | register |
| `POST /api/auth/login` | `Public` | `AuthController.login()` | login |
| `POST /api/auth/refresh` | `Public` | `AuthController.refresh()` | refresh |
| `POST /api/auth/logout` | `Authentifié` | `AuthController.logout()` | logout |
| `POST /api/auth/logout-all` | `Authentifié` | `AuthController.logoutAll()` | logoutAll |
| `GET /api/auth/me` | `Authentifié` | `AuthController.me()` | me |

## 3. Sécurité du Compte & Réinitialisation (5 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `POST /api/auth/change-password` | `Authentifié` | `AccountSecurityController.change()` | Changer mon mot de passe et révoquer les anciennes sessions |
| `POST /api/auth/forgot-password` | `Authentifié` | `AccountSecurityController.()` | Demander un lien de réinitialisation |
| `POST /api/auth/reset-password` | `Authentifié` | `AccountSecurityController.()` | Réinitialiser le mot de passe avec un lien à usage unique |
| `POST /api/auth/verify-email` | `Authentifié` | `AccountSecurityController.()` | Vérifier l |
| `POST /api/auth/resend-verification` | `Authentifié` | `AccountSecurityController.()` | Renvoyer le lien de vérification |

## 4. Profils Utilisateurs & Fiches Fournisseurs (5 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `GET /api/auth/profile-options` | `Authentifié` | `ProfileController.options()` | Lire les pays ISO et limites d |
| `PUT /api/auth/profile` | `Authentifié` | `ProfileController.update()` | Mettre à jour mon profil |
| `GET /api/suppliers/me/profile` | `Authentifié` | `ProfileController.supplier()` | Lire mon profil fournisseur |
| `PUT /api/suppliers/me/profile` | `Authentifié` | `ProfileController.supplierUpdate()` | Modifier mon profil fournisseur |
| `GET /api/suppliers/{id}/profile` | `Authentifié` | `ProfileController.supplierAdmin()` | Lire un fournisseur |

## 5. Administration des Utilisateurs & RGPD (11 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `GET /api/users/me/export` | `Authentifié` | `UserController.exportMe()` | exportMe |
| `DELETE /api/users/me` | `Authentifié` | `UserController.deleteMe()` | deleteMe |
| `GET /api/users` | `ADMIN` | `UserController.list()` | list |
| `GET /api/users/{id}` | `ADMIN` | `UserController.get()` | get |
| `PUT /api/users/me/preferences` | `Authentifié` | `UserController.updatePreferences()` | updatePreferences |
| `POST /api/users` | `ADMIN` | `UserController.create()` | create |
| `PUT /api/users/{id}` | `ADMIN` | `UserController.update()` | update |
| `POST /api/users/{id}/archive` | `ADMIN` | `UserController.archive()` | archive |
| `POST /api/users/{id}/restore` | `ADMIN` | `UserController.restore()` | restore |
| `POST /api/users/{id}/unlock` | `ADMIN` | `UserController.unlock()` | unlock |
| `DELETE /api/users/{id}` | `ADMIN` | `UserController.delete()` | delete |

## 6. Villes Touristiques & Territoires (5 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `GET /api/cities` | `Public` | `CityController.list()` | Lister les ressources |
| `GET /api/cities/{id}` | `Public` | `CityController.get()` | Consulter la ressource |
| `POST /api/cities` | `ADMIN` | `CityController.create()` | Créer la ressource |
| `PUT /api/cities/{id}` | `ADMIN` | `CityController.update()` | Modifier la ressource |
| `DELETE /api/cities/{id}` | `ADMIN` | `CityController.delete()` | Supprimer la ressource |

## 7. Offres Touristiques, Disponibilités & Modération (10 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `GET /api/offers` | `Public` | `OfferController.list()` | list |
| `GET /api/offers/search` | `Public` | `OfferController.search()` | search |
| `GET /api/offers/{id}` | `Public` | `OfferController.get()` | get |
| `GET /api/offers/{id}/translations` | `SUPPLIER (propriétaire), ADMIN` | `OfferController.getTranslations()` | getTranslations |
| `PUT /api/offers/{id}/translations/{locale}` | `SUPPLIER (propriétaire), ADMIN` | `OfferController.saveTranslation()` | saveTranslation |
| `DELETE /api/offers/{id}/translations/{locale}` | `SUPPLIER (propriétaire), ADMIN` | `OfferController.deleteTranslation()` | deleteTranslation |
| `POST /api/offers` | `SUPPLIER (propriétaire), ADMIN` | `OfferController.create()` | create |
| `PUT /api/offers/{id}` | `SUPPLIER (propriétaire), ADMIN` | `OfferController.update()` | update |
| `DELETE /api/offers/{id}` | `SUPPLIER (propriétaire), ADMIN` | `OfferController.delete()` | delete |
| `POST /api/offers/{id}/moderation` | `ADMIN` | `OfferController.moderate()` | moderate |

## 8. Bundles & Packs Forfaits (5 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `GET /api/bundles` | `Public` | `BundleController.list()` | list |
| `GET /api/bundles/{id}` | `Public` | `BundleController.get()` | get |
| `POST /api/bundles` | `AGENT, ADMIN` | `BundleController.create()` | create |
| `PUT /api/bundles/{id}` | `AGENT, ADMIN` | `BundleController.update()` | update |
| `DELETE /api/bundles/{id}` | `AGENT, ADMIN` | `BundleController.delete()` | delete |

## 9. Panier d'Achats (7 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `GET /api/cart` | `Authentifié` | `CartController.get()` | get |
| `POST /api/cart/items` | `Authentifié` | `CartController.addItem()` | addItem |
| `PUT /api/cart/items/{itemId}` | `Authentifié` | `CartController.updateItem()` | updateItem |
| `DELETE /api/cart/items/{itemId}` | `Authentifié` | `CartController.removeItem()` | removeItem |
| `DELETE /api/cart` | `Authentifié` | `CartController.clear()` | clear |
| `POST /api/cart/promo` | `Authentifié` | `CartController.applyPromo()` | applyPromo |
| `DELETE /api/cart/promo` | `Authentifié` | `CartController.removePromo()` | removePromo |

## 10. Codes Promotionnels (5 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `GET /api/promo-codes` | `Authentifié` | `PromoCodeController.list()` | list |
| `GET /api/promo-codes/{id}` | `Authentifié` | `PromoCodeController.get()` | get |
| `POST /api/promo-codes` | `ADMIN` | `PromoCodeController.create()` | create |
| `PUT /api/promo-codes/{id}` | `ADMIN` | `PromoCodeController.update()` | update |
| `DELETE /api/promo-codes/{id}` | `ADMIN` | `PromoCodeController.delete()` | delete |

## 11. Réservations & Bons de Séjour (Vouchers) (8 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `POST /api/bookings` | `CLIENT, AGENT, ADMIN` | `BookingController.create()` | Réserver le panier |
| `GET /api/bookings` | `CLIENT, AGENT, ADMIN` | `BookingController.list()` | Lister les réservations |
| `GET /api/bookings/supplier` | `SUPPLIER` | `BookingController.list()` | Lister les réservations |
| `GET /api/bookings/admin` | `ADMIN, AGENT` | `BookingController.list()` | Lister les réservations |
| `GET /api/bookings/{id}` | `CLIENT, AGENT, ADMIN` | `BookingController.get()` | Consulter une réservation |
| `POST /api/bookings/{id}/cancel` | `CLIENT, AGENT, ADMIN` | `BookingController.cancel()` | Annuler et restituer la capacité |
| `POST /api/bookings/{id}/confirm` | `ADMIN, AGENT` | `BookingController.confirm()` | Confirmer manuellement |
| `GET /api/bookings/{id}/voucher` | `CLIENT, AGENT, ADMIN` | `BookingController.voucher()` | Télécharger le voucher PDF avec QR signé |

## 12. Paiements Sandbox, Caisse & Webhooks (11 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `POST /api/payments` | `CLIENT, AGENT, ADMIN` | `PaymentController.create()` | Initier un paiement idempotent |
| `GET /api/payments` | `CLIENT, AGENT, ADMIN` | `PaymentController.booking()` | Paiements d |
| `GET /api/payments/{id}` | `CLIENT, AGENT, ADMIN` | `PaymentController.get()` | Détail d |
| `GET /api/payments/{id}/events` | `CLIENT, AGENT, ADMIN` | `PaymentController.events()` | Historique immuable du paiement |
| `POST /api/payments/{id}/refund` | `ADMIN` | `PaymentController.refund()` | Rembourser totalement ou partiellement |
| `POST /api/payments/{id}/collect-cash` | `AGENT, ADMIN` | `PaymentController.collect()` | Enregistrer un encaissement espèces |
| `GET /api/payments/mine` | `CLIENT, AGENT, ADMIN` | `PaymentController.list()` | Liste paginée des paiements |
| `GET /api/payments/admin` | `AGENT, ADMIN` | `PaymentController.list()` | Liste paginée des paiements |
| `GET /api/payments/cash-pending` | `AGENT, ADMIN` | `PaymentController.list()` | Liste paginée des paiements |
| `GET /api/payments/cash-history` | `AGENT, ADMIN` | `PaymentController.list()` | Liste paginée des paiements |
| `POST /api/payments/webhook` | `Public` | `PaymentWebhookController.()` | Recevoir un événement sandbox signé |

## 13. Notifications In-App & Préférences (7 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `GET /api/notifications` | `Authentifié` | `NotificationController.list()` | Mes notifications paginées |
| `GET /api/notifications/unread-count` | `Authentifié` | `NotificationController.count()` | Nombre de notifications non lues |
| `POST /api/notifications/{id}/read` | `Authentifié` | `NotificationController.read()` | Marquer une notification comme lue |
| `POST /api/notifications/read-all` | `Authentifié` | `NotificationController.all()` | Marquer toutes mes notifications comme lues |
| `DELETE /api/notifications/{id}` | `Authentifié` | `NotificationController.delete()` | Supprimer ma notification |
| `GET /api/notifications/preferences` | `Authentifié` | `NotificationController.preferences()` | Mes préférences de notifications |
| `PUT /api/notifications/preferences` | `Authentifié` | `NotificationController.update()` | Enregistrer mes préférences |

## 14. Favoris Voyageurs (4 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `GET /api/favorites` | `CLIENT` | `FavoriteController.list()` | Lister les offres favorites du client connectǸ (paginǸe) |
| `GET /api/favorites/ids` | `CLIENT` | `FavoriteController.listIds()` | Obtenir la liste des IDs des offres favorites du client connectǸ |
| `POST /api/favorites/{offerId}` | `CLIENT` | `FavoriteController.add()` | Ajouter une offre aux favoris |
| `DELETE /api/favorites/{offerId}` | `CLIENT` | `FavoriteController.remove()` | Retirer une offre des favoris |

## 15. Tickets de Support & Assistance (9 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `POST /api/tickets` | `CLIENT, AGENT, ADMIN` | `TicketController.create()` | Créer un nouveau ticket de support |
| `GET /api/tickets` | `CLIENT, AGENT, ADMIN` | `TicketController.list()` | Lister les tickets de support avec pagination et filtres |
| `GET /api/tickets/stats` | `CLIENT, AGENT, ADMIN` | `TicketController.getStats()` | Compteurs statistiques par statut et priorité (agents et admins) |
| `GET /api/tickets/{id}` | `CLIENT, AGENT, ADMIN` | `TicketController.get()` | Consulter le détail d |
| `POST /api/tickets/{id}/messages` | `CLIENT, AGENT, ADMIN` | `TicketController.addMessage()` | Ajouter un message au fil de discussion |
| `PATCH /api/tickets/{id}/status` | `CLIENT, AGENT, ADMIN` | `TicketController.updateStatus()` | Modifier le statut d |
| `PATCH /api/tickets/{id}/assignee` | `ADMIN, AGENT` | `TicketController.updateAssignee()` | Assigner un agent ou administrateur au ticket |
| `PATCH /api/tickets/{id}/priority` | `CLIENT, AGENT, ADMIN` | `TicketController.updatePriority()` | Modifier la priorité d |
| `DELETE /api/tickets/{id}` | `ADMIN, AGENT` | `TicketController.delete()` | Supprimer un ticket définitivement (administrateurs uniquement) |

## 16. Avis & Notations Vérifiées (9 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `GET /api/offers/{offerId}/reviews` | `Public` | `ReviewController.getReviewsForOffer()` | Lister les avis publics approuvés d |
| `GET /api/offers/{offerId}/reviews/summary` | `Public` | `ReviewController.getReviewSummary()` | Obtenir la note moyenne et la distribution des avis d |
| `POST /api/offers/{offerId}/reviews` | `CLIENT` | `ReviewController.createReview()` | Déposer un avis certifié sur une offre (nécessite une réservation terminée) |
| `PUT /api/reviews/{reviewId}` | `CLIENT` | `ReviewController.updateReview()` | Modifier son propre avis (dans les 48h suivant la publication) |
| `DELETE /api/reviews/{reviewId}` | `CLIENT` | `ReviewController.deleteReview()` | Supprimer un avis (l |
| `POST /api/reviews/{reviewId}/reply` | `SUPPLIER (offre), ADMIN` | `ReviewController.replyToReview()` | Répondre à un avis (le fournisseur de l |
| `POST /api/reviews/{reviewId}/report` | `CLIENT` | `ReviewController.reportReview()` | Signaler un avis inapproprié ou abusif |
| `GET /api/reviews/moderation` | `ADMIN` | `ReviewController.getReviewsForModeration()` | Lister les avis pour la file de modération administrateur |
| `POST /api/reviews/{reviewId}/moderate` | `ADMIN` | `ReviewController.moderateReview()` | Modérer un avis (approuver ou rejeter) |

## 17. Contact Public & Pot de Miel (1 endpoint)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `POST /api/contact` | `Public` | `ContactController.submitContact()` | submitContact |

## 18. Paramètres Globaux & Maintenance (4 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `GET /api/settings` | `ADMIN` | `SettingController.getAll()` | Obtenir la liste complte des paramtres systme (ADMIN) |
| `PUT /api/settings/{key}` | `ADMIN` | `SettingController.update()` | Mise à jour unitaire d |
| `PUT /api/settings` | `ADMIN` | `SettingController.updateAll()` | Mise  jour groupe et atomique des paramtres (ADMIN) |
| `GET /api/settings/public` | `Public` | `SettingController.getPublicSettings()` | Obtenir les paramtres publics non sensibles |

## 19. Statistiques, KPIs & Exports CSV (6 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `GET /api/stats/admin` | `ADMIN` | `StatsController.admin()` | Dashboard administrateur |
| `GET /api/stats/supplier` | `SUPPLIER` | `StatsController.supplier()` | Dashboard de mon fournisseur |
| `GET /api/stats/agent` | `AGENT` | `StatsController.agent()` | Dashboard opérationnel |
| `GET /api/stats/client` | `CLIENT` | `StatsController.client()` | Mes voyages et mon activité |
| `GET /api/stats/admin/export/bookings.csv` | `ADMIN` | `StatsController.bookings()` | Exporter les réservations CSV |
| `GET /api/stats/admin/export/revenue.csv` | `ADMIN` | `StatsController.revenue()` | Exporter le chiffre d |

## 20. Devises Indicatives & Taux de Change (1 endpoint)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `GET /api/currencies/rates` | `Public` | `CurrencyController.getRates()` | Obtenir les taux de change indicatifs par rapport au MAD |

## 21. Fichiers & Images (3 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `POST /api/files/images` | `Authentifié` | `FileController.upload()` | Téléverser une image |
| `GET /api/files/{name}` | `Public` | `FileController.read()` | Lire une image ou sa miniature |
| `DELETE /api/files/{name}` | `Authentifié` | `FileController.delete()` | Supprimer une image temporaire |

## 22. Journal d'Audit Immuable (3 endpoints)

| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |
| :--- | :--- | :--- | :--- |
| `GET /api/audit` | `ADMIN` | `AuditController.list()` | Lister les entrǸes du journal d |
| `GET /api/audit/{id}` | `ADMIN` | `AuditController.getById()` | Obtenir le dǸtail complet d |
| `GET /api/audit/export` | `ADMIN` | `AuditController.exportCsv()` | Exporter les logs d |

