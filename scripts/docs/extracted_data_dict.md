## Dictionnaire de Données (40 Entités JPA)

### Table `AuditLog`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité AuditLog |
| `actorId` | `Long` | Attribut de l'entité AuditLog |
| `actorEmail` | `String` | Attribut de l'entité AuditLog |
| `actorRole` | `String` | Attribut de l'entité AuditLog |
| `action` | `String` | Attribut de l'entité AuditLog |
| `resourceType` | `String` | Attribut de l'entité AuditLog |
| `resourceId` | `Long` | Attribut de l'entité AuditLog |
| `description` | `String` | Attribut de l'entité AuditLog |
| `beforeJson` | `String` | Attribut de l'entité AuditLog |
| `afterJson` | `String` | Attribut de l'entité AuditLog |
| `ipAddress` | `String` | Attribut de l'entité AuditLog |
| `userAgent` | `String` | Attribut de l'entité AuditLog |
| `createdAt` | `LocalDateTime` | Attribut de l'entité AuditLog |

### Table `Booking`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité Booking |
| `reference` | `String` | Attribut de l'entité Booking |
| `client` | `User` | Attribut de l'entité Booking |
| `status` | `BookingStatus` | Attribut de l'entité Booking |
| `paymentStatus` | `PaymentStatus` | Attribut de l'entité Booking |
| `paymentMethod` | `PaymentMethod` | Attribut de l'entité Booking |
| `subtotal` | `BigDecimal` | Attribut de l'entité Booking |
| `discount` | `BigDecimal` | Attribut de l'entité Booking |
| `total` | `BigDecimal` | Attribut de l'entité Booking |
| `currency` | `String` | Attribut de l'entité Booking |
| `promoCode` | `PromoCode` | Attribut de l'entité Booking |
| `promoCodeSnapshot` | `String` | Attribut de l'entité Booking |
| `promoTypeSnapshot` | `DiscountType` | Attribut de l'entité Booking |
| `promoValueSnapshot` | `BigDecimal` | Attribut de l'entité Booking |
| `createdAt` | `LocalDateTime` | Attribut de l'entité Booking |
| `confirmedAt` | `LocalDateTime` | Attribut de l'entité Booking |
| `cancelledAt` | `LocalDateTime` | Attribut de l'entité Booking |
| `expiresAt` | `LocalDateTime` | Attribut de l'entité Booking |
| `serviceStartAt` | `LocalDateTime` | Attribut de l'entité Booking |
| `serviceEndAt` | `LocalDateTime` | Attribut de l'entité Booking |
| `cancellationReason` | `String` | Attribut de l'entité Booking |
| `cancelledBy` | `Long` | Attribut de l'entité Booking |
| `contactPhone` | `String` | Attribut de l'entité Booking |
| `notes` | `String` | Attribut de l'entité Booking |
| `version` | `Long` | Attribut de l'entité Booking |
| `items` | `BookingItem[]` | Attribut de l'entité Booking |

### Table `BookingItem`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité BookingItem |
| `booking` | `Booking` | Attribut de l'entité BookingItem |
| `offer` | `Offer` | Attribut de l'entité BookingItem |
| `bundle` | `Bundle` | Attribut de l'entité BookingItem |
| `parentItem` | `BookingItem` | Attribut de l'entité BookingItem |
| `supplier` | `User` | Attribut de l'entité BookingItem |
| `titleSnapshot` | `String` | Attribut de l'entité BookingItem |
| `quantity` | `Integer` | Attribut de l'entité BookingItem |
| `unitPrice` | `BigDecimal` | Attribut de l'entité BookingItem |
| `lineTotal` | `BigDecimal` | Attribut de l'entité BookingItem |
| `travelCriteria` | `String` | Attribut de l'entité BookingItem |
| `serviceStartAt` | `LocalDateTime` | Attribut de l'entité BookingItem |
| `serviceEndAt` | `LocalDateTime` | Attribut de l'entité BookingItem |
| `allocations` | `BookingItemAllocation[]` | Attribut de l'entité BookingItem |

### Table `BookingItemAllocation`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité BookingItemAllocation |
| `bookingItem` | `BookingItem` | Attribut de l'entité BookingItemAllocation |
| `availability` | `OfferAvailability` | Attribut de l'entité BookingItemAllocation |
| `quantity` | `Integer` | Attribut de l'entité BookingItemAllocation |
| `restored` | `boolean` | Attribut de l'entité BookingItemAllocation |

### Table `BookingSequence`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `year` | `Integer` | Attribut de l'entité BookingSequence |
| `lastValue` | `Long` | Attribut de l'entité BookingSequence |

### Table `Bundle`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité Bundle |
| `title` | `String` | Attribut de l'entité Bundle |
| `description` | `String` | Attribut de l'entité Bundle |
| `discountPercentage` | `Double` | Attribut de l'entité Bundle |
| `offers` | `Offer[]` | Attribut de l'entité Bundle |
| `createdBy` | `User` | Attribut de l'entité Bundle |

### Table `Car`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `brand` | `String` | Attribut de l'entité Car |
| `model` | `String` | Attribut de l'entité Car |
| `transmission` | `String` | Attribut de l'entité Car |
| `seats` | `Integer` | Attribut de l'entité Car |
| `pickupLocation` | `String` | Attribut de l'entité Car |
| `dropoffLocations` | `String[]` | Attribut de l'entité Car |
| `allowsDifferentDropoff` | `Boolean` | Attribut de l'entité Car |
| `minimumDriverAge` | `Integer` | Attribut de l'entité Car |
| `maximumDriverAge` | `Integer` | Attribut de l'entité Car |

### Table `Cart`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité Cart |
| `client` | `User` | Attribut de l'entité Cart |
| `items` | `CartItem[]` | Attribut de l'entité Cart |
| `promoCode` | `PromoCode` | Attribut de l'entité Cart |

### Table `CartItem`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité CartItem |
| `cart` | `Cart` | Attribut de l'entité CartItem |
| `offer` | `Offer` | Attribut de l'entité CartItem |
| `bundle` | `Bundle` | Attribut de l'entité CartItem |
| `quantity` | `Integer` | Attribut de l'entité CartItem |
| `travelCriteria` | `String` | Attribut de l'entité CartItem |

### Table `City`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité City |
| `name` | `String` | Attribut de l'entité City |
| `normalizedName` | `String` | Attribut de l'entité City |
| `latitude` | `Double` | Attribut de l'entité City |
| `longitude` | `Double` | Attribut de l'entité City |
| `country` | `String` | Attribut de l'entité City |
| `countryCode` | `String` | Attribut de l'entité City |
| `hasAirport` | `Boolean` | Attribut de l'entité City |

### Table `CityTranslation`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité CityTranslation |
| `city` | `City` | Attribut de l'entité CityTranslation |
| `locale` | `String` | Attribut de l'entité CityTranslation |
| `name` | `String` | Attribut de l'entité CityTranslation |

### Table `ContactMessage`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité ContactMessage |
| `name` | `String` | Attribut de l'entité ContactMessage |
| `email` | `String` | Attribut de l'entité ContactMessage |
| `subject` | `String` | Attribut de l'entité ContactMessage |
| `message` | `String` | Attribut de l'entité ContactMessage |
| `ipAddress` | `String` | Attribut de l'entité ContactMessage |
| `processed` | `Boolean` | Attribut de l'entité ContactMessage |
| `createdAt` | `LocalDateTime` | Attribut de l'entité ContactMessage |

### Table `EmailVerificationToken`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |

### Table `Excursion`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `durationHours` | `Integer` | Attribut de l'entité Excursion |
| `includesGuide` | `Boolean` | Attribut de l'entité Excursion |
| `includesTransport` | `Boolean` | Attribut de l'entité Excursion |
| `itinerary` | `String` | Attribut de l'entité Excursion |

### Table `Favorite`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité Favorite |
| `client` | `User` | Attribut de l'entité Favorite |
| `offer` | `Offer` | Attribut de l'entité Favorite |
| `createdAt` | `LocalDateTime` | Attribut de l'entité Favorite |

### Table `FileAsset`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |

### Table `Flight`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `airline` | `String` | Attribut de l'entité Flight |
| `flightNumber` | `String` | Attribut de l'entité Flight |
| `departureAirport` | `String` | Attribut de l'entité Flight |
| `arrivalAirport` | `String` | Attribut de l'entité Flight |
| `departureDateTime` | `LocalDateTime` | Attribut de l'entité Flight |
| `arrivalDateTime` | `LocalDateTime` | Attribut de l'entité Flight |
| `roundTrip` | `Boolean` | Attribut de l'entité Flight |
| `returnDepartureDateTime` | `LocalDateTime` | Attribut de l'entité Flight |
| `returnArrivalDateTime` | `LocalDateTime` | Attribut de l'entité Flight |
| `cabinClass` | `String` | Attribut de l'entité Flight |

### Table `Hotel`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `stars` | `Integer` | Attribut de l'entité Hotel |
| `roomType` | `String` | Attribut de l'entité Hotel |
| `address` | `String` | Attribut de l'entité Hotel |

### Table `IdempotencyRecord`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité IdempotencyRecord |
| `key` | `String` | Attribut de l'entité IdempotencyRecord |
| `user` | `User` | Attribut de l'entité IdempotencyRecord |
| `endpoint` | `String` | Attribut de l'entité IdempotencyRecord |
| `requestHash` | `String` | Attribut de l'entité IdempotencyRecord |
| `responseStatus` | `Integer` | Attribut de l'entité IdempotencyRecord |
| `responseBody` | `String` | Attribut de l'entité IdempotencyRecord |
| `paymentId` | `Long` | Attribut de l'entité IdempotencyRecord |
| `operationAmount` | `BigDecimal` | Attribut de l'entité IdempotencyRecord |
| `createdAt` | `LocalDateTime` | Attribut de l'entité IdempotencyRecord |
| `expiresAt` | `LocalDateTime` | Attribut de l'entité IdempotencyRecord |

### Table `Notification`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité Notification |
| `user` | `User` | Attribut de l'entité Notification |
| `type` | `NotificationType` | Attribut de l'entité Notification |
| `title` | `String` | Attribut de l'entité Notification |
| `link` | `String` | Attribut de l'entité Notification |
| `readAt` | `LocalDateTime` | Attribut de l'entité Notification |
| `referenceType` | `String` | Attribut de l'entité Notification |
| `referenceId` | `Long` | Attribut de l'entité Notification |
| `dedupKey` | `String` | Attribut de l'entité Notification |
| `message` | `String` | Attribut de l'entité Notification |
| `isRead` | `Boolean` | Attribut de l'entité Notification |
| `createdAt` | `LocalDateTime` | Attribut de l'entité Notification |

### Table `NotificationDispatch`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité NotificationDispatch |
| `userId` | `Long` | Attribut de l'entité NotificationDispatch |
| `dedupKey` | `String` | Attribut de l'entité NotificationDispatch |
| `createdAt` | `LocalDateTime` | Attribut de l'entité NotificationDispatch |

### Table `NotificationPreference`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `userId` | `Long` | Attribut de l'entité NotificationPreference |
| `emailEnabled` | `boolean` | Attribut de l'entité NotificationPreference |
| `inAppEnabled` | `boolean` | Attribut de l'entité NotificationPreference |
| `bookingEmail` | `boolean` | Attribut de l'entité NotificationPreference |
| `paymentEmail` | `boolean` | Attribut de l'entité NotificationPreference |
| `offerEmail` | `boolean` | Attribut de l'entité NotificationPreference |
| `supportEmail` | `boolean` | Attribut de l'entité NotificationPreference |

### Table `Offer`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité Offer |
| `title` | `String` | Attribut de l'entité Offer |
| `description` | `String` | Attribut de l'entité Offer |
| `basePrice` | `Double` | Attribut de l'entité Offer |
| `stock` | `Integer` | Attribut de l'entité Offer |
| `allowsPayOnArrival` | `Boolean` | Attribut de l'entité Offer |
| `active` | `Boolean` | Attribut de l'entité Offer |
| `averageRating` | `Double` | Attribut de l'entité Offer |
| `reviewCount` | `Integer` | Attribut de l'entité Offer |
| `availabilities` | `OfferAvailability[]` | Attribut de l'entité Offer |
| `moderationReason` | `String` | Attribut de l'entité Offer |
| `moderatedAt` | `LocalDateTime` | Attribut de l'entité Offer |
| `moderatedBy` | `User` | Attribut de l'entité Offer |
| `images` | `String[]` | Attribut de l'entité Offer |
| `city` | `City` | Attribut de l'entité Offer |
| `supplier` | `User` | Attribut de l'entité Offer |

### Table `OfferAvailability`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité OfferAvailability |
| `startAt` | `LocalDateTime` | Attribut de l'entité OfferAvailability |
| `endAt` | `LocalDateTime` | Attribut de l'entité OfferAvailability |
| `capacity` | `Integer` | Attribut de l'entité OfferAvailability |

### Table `OfferTranslation`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité OfferTranslation |
| `offer` | `Offer` | Attribut de l'entité OfferTranslation |
| `locale` | `String` | Attribut de l'entité OfferTranslation |
| `title` | `String` | Attribut de l'entité OfferTranslation |
| `description` | `String` | Attribut de l'entité OfferTranslation |
| `itinerary` | `String` | Attribut de l'entité OfferTranslation |
| `status` | `String` | Attribut de l'entité OfferTranslation |
| `updatedAt` | `LocalDateTime` | Attribut de l'entité OfferTranslation |

### Table `PasswordResetToken`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |

### Table `Payment`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité Payment |
| `booking` | `Booking` | Attribut de l'entité Payment |
| `client` | `User` | Attribut de l'entité Payment |
| `method` | `PaymentMethod` | Attribut de l'entité Payment |
| `status` | `PaymentStatus` | Attribut de l'entité Payment |
| `amount` | `BigDecimal` | Attribut de l'entité Payment |
| `refundedAmount` | `BigDecimal` | Attribut de l'entité Payment |
| `reservedRefundAmount` | `BigDecimal` | Attribut de l'entité Payment |
| `currency` | `String` | Attribut de l'entité Payment |
| `provider` | `String` | Attribut de l'entité Payment |
| `providerReference` | `String` | Attribut de l'entité Payment |
| `idempotencyKey` | `String` | Attribut de l'entité Payment |
| `activeBookingId` | `Long` | Attribut de l'entité Payment |
| `cardBrand` | `String` | Attribut de l'entité Payment |
| `cardLast4` | `String` | Attribut de l'entité Payment |
| `failureCode` | `String` | Attribut de l'entité Payment |
| `failureMessage` | `String` | Attribut de l'entité Payment |
| `collectedBy` | `User` | Attribut de l'entité Payment |
| `createdAt` | `LocalDateTime` | Attribut de l'entité Payment |
| `updatedAt` | `LocalDateTime` | Attribut de l'entité Payment |
| `paidAt` | `LocalDateTime` | Attribut de l'entité Payment |
| `refundedAt` | `LocalDateTime` | Attribut de l'entité Payment |
| `version` | `Long` | Attribut de l'entité Payment |

### Table `PaymentEvent`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité PaymentEvent |
| `payment` | `Payment` | Attribut de l'entité PaymentEvent |
| `fromStatus` | `PaymentStatus` | Attribut de l'entité PaymentEvent |
| `toStatus` | `PaymentStatus` | Attribut de l'entité PaymentEvent |
| `eventType` | `String` | Attribut de l'entité PaymentEvent |
| `actor` | `User` | Attribut de l'entité PaymentEvent |
| `actorRole` | `String` | Attribut de l'entité PaymentEvent |
| `details` | `String` | Attribut de l'entité PaymentEvent |
| `createdAt` | `LocalDateTime` | Attribut de l'entité PaymentEvent |

### Table `PromoCode`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité PromoCode |
| `code` | `String` | Attribut de l'entité PromoCode |
| `discountType` | `DiscountType` | Attribut de l'entité PromoCode |
| `value` | `BigDecimal` | Attribut de l'entité PromoCode |
| `expiryDate` | `LocalDate` | Attribut de l'entité PromoCode |
| `active` | `Boolean` | Attribut de l'entité PromoCode |

### Table `RefreshToken`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité RefreshToken |
| `userId` | `Long` | Attribut de l'entité RefreshToken |
| `tokenHash` | `String` | Attribut de l'entité RefreshToken |
| `familyId` | `String` | Attribut de l'entité RefreshToken |
| `expiresAt` | `LocalDateTime` | Attribut de l'entité RefreshToken |
| `revokedAt` | `LocalDateTime` | Attribut de l'entité RefreshToken |
| `replacedBy` | `String` | Attribut de l'entité RefreshToken |
| `createdAt` | `LocalDateTime` | Attribut de l'entité RefreshToken |
| `ipAddress` | `String` | Attribut de l'entité RefreshToken |
| `userAgent` | `String` | Attribut de l'entité RefreshToken |

### Table `Review`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité Review |
| `offer` | `Offer` | Attribut de l'entité Review |
| `client` | `User` | Attribut de l'entité Review |
| `booking` | `Booking` | Attribut de l'entité Review |
| `rating` | `Integer` | Attribut de l'entité Review |
| `title` | `String` | Attribut de l'entité Review |
| `comment` | `String` | Attribut de l'entité Review |
| `status` | `ReviewStatus` | Attribut de l'entité Review |
| `moderatedBy` | `User` | Attribut de l'entité Review |
| `moderatedAt` | `LocalDateTime` | Attribut de l'entité Review |
| `moderationReason` | `String` | Attribut de l'entité Review |
| `supplierReply` | `String` | Attribut de l'entité Review |
| `supplierRepliedAt` | `LocalDateTime` | Attribut de l'entité Review |
| `reportCount` | `Integer` | Attribut de l'entité Review |
| `createdAt` | `LocalDateTime` | Attribut de l'entité Review |
| `updatedAt` | `LocalDateTime` | Attribut de l'entité Review |

### Table `Setting`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité Setting |
| `settingKey` | `String` | Attribut de l'entité Setting |
| `settingValue` | `String` | Attribut de l'entité Setting |
| `valueType` | `SettingType` | Attribut de l'entité Setting |
| `description` | `String` | Attribut de l'entité Setting |
| `minValue` | `Double` | Attribut de l'entité Setting |
| `maxValue` | `Double` | Attribut de l'entité Setting |
| `updatedAt` | `LocalDateTime` | Attribut de l'entité Setting |
| `updatedBy` | `String` | Attribut de l'entité Setting |

### Table `SupplierProfile`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |

### Table `TaxiTransfer`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `pickupLocation` | `String` | Attribut de l'entité TaxiTransfer |
| `dropoffLocation` | `String` | Attribut de l'entité TaxiTransfer |
| `vehicleType` | `String` | Attribut de l'entité TaxiTransfer |

### Table `Ticket`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité Ticket |
| `reference` | `String` | Attribut de l'entité Ticket |
| `subject` | `String` | Attribut de l'entité Ticket |
| `category` | `TicketCategory` | Attribut de l'entité Ticket |
| `priority` | `TicketPriority` | Attribut de l'entité Ticket |
| `status` | `TicketStatus` | Attribut de l'entité Ticket |
| `requester` | `User` | Attribut de l'entité Ticket |
| `assignee` | `User` | Attribut de l'entité Ticket |
| `booking` | `Booking` | Attribut de l'entité Ticket |
| `createdAt` | `LocalDateTime` | Attribut de l'entité Ticket |
| `updatedAt` | `LocalDateTime` | Attribut de l'entité Ticket |
| `resolvedAt` | `LocalDateTime` | Attribut de l'entité Ticket |
| `closedAt` | `LocalDateTime` | Attribut de l'entité Ticket |
| `messages` | `TicketMessage[]` | Attribut de l'entité Ticket |

### Table `TicketAttachment`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité TicketAttachment |
| `message` | `TicketMessage` | Attribut de l'entité TicketAttachment |
| `name` | `String` | Attribut de l'entité TicketAttachment |
| `url` | `String` | Attribut de l'entité TicketAttachment |
| `mimeType` | `String` | Attribut de l'entité TicketAttachment |
| `size` | `Long` | Attribut de l'entité TicketAttachment |

### Table `TicketMessage`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité TicketMessage |
| `ticket` | `Ticket` | Attribut de l'entité TicketMessage |
| `author` | `User` | Attribut de l'entité TicketMessage |
| `content` | `String` | Attribut de l'entité TicketMessage |
| `internalNote` | `boolean` | Attribut de l'entité TicketMessage |
| `createdAt` | `LocalDateTime` | Attribut de l'entité TicketMessage |
| `attachments` | `TicketAttachment[]` | Attribut de l'entité TicketMessage |

### Table `TicketSequence`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `year` | `Integer` | Attribut de l'entité TicketSequence |
| `lastValue` | `Long` | Attribut de l'entité TicketSequence |

### Table `User`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité User |
| `fullName` | `String` | Attribut de l'entité User |
| `email` | `String` | Attribut de l'entité User |
| `password` | `String` | Attribut de l'entité User |
| `role` | `Role` | Attribut de l'entité User |
| `supplierCategory` | `OfferType` | Attribut de l'entité User |
| `archived` | `boolean` | Attribut de l'entité User |
| `phone` | `String` | Attribut de l'entité User |
| `country` | `String` | Attribut de l'entité User |
| `avatarUrl` | `String` | Attribut de l'entité User |
| `emailVerified` | `boolean` | Attribut de l'entité User |
| `tokenVersion` | `long` | Attribut de l'entité User |
| `createdAtEstimated` | `boolean` | Attribut de l'entité User |
| `failedLoginAttempts` | `int` | Attribut de l'entité User |
| `consentVersion` | `String` | Attribut de l'entité User |
| `preferredLanguage` | `String` | Attribut de l'entité User |
| `preferredCurrency` | `String` | Attribut de l'entité User |
| `marketingOptIn` | `boolean` | Attribut de l'entité User |

### Table `WebhookEvent`

| Attribut / Colonne | Type Java / SQL | Rôle / Description |
| :--- | :--- | :--- |
| `id` | `Long` | Attribut de l'entité WebhookEvent |
| `provider` | `String` | Attribut de l'entité WebhookEvent |
| `eventId` | `String` | Attribut de l'entité WebhookEvent |
| `type` | `String` | Attribut de l'entité WebhookEvent |
| `payloadHash` | `String` | Attribut de l'entité WebhookEvent |
| `receivedAt` | `LocalDateTime` | Attribut de l'entité WebhookEvent |
| `processedAt` | `LocalDateTime` | Attribut de l'entité WebhookEvent |
| `status` | `String` | Attribut de l'entité WebhookEvent |

