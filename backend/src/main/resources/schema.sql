-- Script de creation du schema de la base de donnees "travel_agency_db"
-- Genere a partir des entites JPA (Hibernate ddl-auto=update) via mysqldump,
-- puis rendu idempotent (CREATE TABLE IF NOT EXISTS, sans DROP TABLE) pour pouvoir
-- s'executer automatiquement a chaque demarrage du backend sans perdre les donnees
-- existantes (voir spring.sql.init.mode=always dans application.properties).

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('ADMIN','AGENT','CLIENT','SUPPLIER') DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `destinations` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK420af7nwsa7i6e5k3pgw6r5cr` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cities` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `destination_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKiawc3a2rppxni6j7wsrpiuwcs` (`destination_id`),
  CONSTRAINT `FKiawc3a2rppxni6j7wsrpiuwcs` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `offers` (
  `offer_type` varchar(31) NOT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `allows_pay_on_arrival` bit(1) DEFAULT NULL,
  `base_price` double DEFAULT NULL,
  `description` varchar(2000) DEFAULT NULL,
  `stock` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `seats` int(11) DEFAULT NULL,
  `transmission` varchar(255) DEFAULT NULL,
  `duration_hours` int(11) DEFAULT NULL,
  `includes_guide` bit(1) DEFAULT NULL,
  `includes_transport` bit(1) DEFAULT NULL,
  `itinerary` varchar(255) DEFAULT NULL,
  `airline` varchar(255) DEFAULT NULL,
  `arrival_airport` varchar(255) DEFAULT NULL,
  `arrival_date_time` datetime(6) DEFAULT NULL,
  `departure_airport` varchar(255) DEFAULT NULL,
  `departure_date_time` datetime(6) DEFAULT NULL,
  `flight_number` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `room_type` varchar(255) DEFAULT NULL,
  `stars` int(11) DEFAULT NULL,
  `dropoff_location` varchar(255) DEFAULT NULL,
  `pickup_location` varchar(255) DEFAULT NULL,
  `vehicle_type` varchar(255) DEFAULT NULL,
  `city_id` bigint(20) DEFAULT NULL,
  `supplier_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKk9k3a9u7lq0gm5113epjvqo5d` (`city_id`),
  KEY `FKjtxkx5556cp2exkotts1sanj2` (`supplier_id`),
  CONSTRAINT `FKjtxkx5556cp2exkotts1sanj2` FOREIGN KEY (`supplier_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKk9k3a9u7lq0gm5113epjvqo5d` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `offer_images` (
  `offer_id` bigint(20) NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  KEY `FKckk2rrvvx52v2n7c4c9sjrfjw` (`offer_id`),
  CONSTRAINT `FKckk2rrvvx52v2n7c4c9sjrfjw` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `bundles` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `description` varchar(2000) DEFAULT NULL,
  `discount_percentage` double DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `created_by_agent_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKk1m5y08ocub63rkr6qs4n5exv` (`created_by_agent_id`),
  CONSTRAINT `FKk1m5y08ocub63rkr6qs4n5exv` FOREIGN KEY (`created_by_agent_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `bundle_offers` (
  `bundle_id` bigint(20) NOT NULL,
  `offer_id` bigint(20) NOT NULL,
  KEY `FKefj5xqwdtc10e8t9tn5qpmcpv` (`offer_id`),
  KEY `FK62keknsfb4yyqb6vbmr3l5g80` (`bundle_id`),
  CONSTRAINT `FK62keknsfb4yyqb6vbmr3l5g80` FOREIGN KEY (`bundle_id`) REFERENCES `bundles` (`id`),
  CONSTRAINT `FKefj5xqwdtc10e8t9tn5qpmcpv` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `carts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `client_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKssjjp2ol0d48cb9svr59oe2pw` (`client_id`),
  CONSTRAINT `FKqb4j2mrsj5xd3c1nix30qwe9u` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `quantity` int(11) DEFAULT NULL,
  `bundle_id` bigint(20) DEFAULT NULL,
  `cart_id` bigint(20) DEFAULT NULL,
  `offer_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK548j2it3qtf03q5vbgjeq9q82` (`bundle_id`),
  KEY `FKpcttvuq4mxppo8sxggjtn5i2c` (`cart_id`),
  KEY `FKrfq3crtk7idl58bd18xe01n6w` (`offer_id`),
  CONSTRAINT `FK548j2it3qtf03q5vbgjeq9q82` FOREIGN KEY (`bundle_id`) REFERENCES `bundles` (`id`),
  CONSTRAINT `FKpcttvuq4mxppo8sxggjtn5i2c` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`),
  CONSTRAINT `FKrfq3crtk7idl58bd18xe01n6w` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `promo_codes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `active` bit(1) DEFAULT NULL,
  `code` varchar(255) DEFAULT NULL,
  `discount_type` enum('FIXED','PERCENTAGE') DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `value` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKj9mo0xgfs34t6e3c17anidd83` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `bookings` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `payment_method` enum('ON_ARRIVAL','SIMULATED') DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `status` enum('CANCELLED','COMPLETED','CONFIRMED','PENDING') DEFAULT NULL,
  `total_price` double DEFAULT NULL,
  `bundle_id` bigint(20) DEFAULT NULL,
  `client_id` bigint(20) DEFAULT NULL,
  `offer_id` bigint(20) DEFAULT NULL,
  `promo_code_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK4c0x3edoajt38rhrpe64cdhru` (`bundle_id`),
  KEY `FKdwis3ct69bd9hmdcqmpiwf8wh` (`client_id`),
  KEY `FK1rpb9nchx8835ck1u3pla0t8k` (`offer_id`),
  KEY `FK88eyq095hps8dgyrprdmoelge` (`promo_code_id`),
  CONSTRAINT `FK1rpb9nchx8835ck1u3pla0t8k` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`),
  CONSTRAINT `FK4c0x3edoajt38rhrpe64cdhru` FOREIGN KEY (`bundle_id`) REFERENCES `bundles` (`id`),
  CONSTRAINT `FK88eyq095hps8dgyrprdmoelge` FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes` (`id`),
  CONSTRAINT `FKdwis3ct69bd9hmdcqmpiwf8wh` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `amount` double DEFAULT NULL,
  `method` enum('ON_ARRIVAL','SIMULATED') DEFAULT NULL,
  `paid_at` datetime(6) DEFAULT NULL,
  `status` enum('COMPLETED','PENDING') DEFAULT NULL,
  `booking_id` bigint(20) DEFAULT NULL,
  `marked_by_agent_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKnuscjm6x127hkb15kcb8n56wo` (`booking_id`),
  KEY `FKqtu2o5fpboms06kvjsn2p5cb2` (`marked_by_agent_id`),
  CONSTRAINT `FKc52o2b1jkxttngufqp3t7jr3h` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  CONSTRAINT `FKqtu2o5fpboms06kvjsn2p5cb2` FOREIGN KEY (`marked_by_agent_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_read` bit(1) DEFAULT NULL,
  `message` varchar(1000) DEFAULT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9y21adhxn0ayjhfocscqox7bh` (`user_id`),
  CONSTRAINT `FK9y21adhxn0ayjhfocscqox7bh` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;
