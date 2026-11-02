-- Schéma Hibernate existant, consolidé. Ne jamais modifier après application.
CREATE TABLE users (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 full_name VARCHAR(255), email VARCHAR(255), password VARCHAR(255),
 role ENUM('ADMIN','AGENT','CLIENT','SUPPLIER'),
 supplier_category ENUM('CAR','EXCURSION','FLIGHT','HOTEL','TAXI_TRANSFER'),
 archived BOOLEAN NOT NULL DEFAULT FALSE,
 CONSTRAINT uk_users_email UNIQUE(email)
);
CREATE TABLE cities (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(255) NOT NULL, latitude DOUBLE, longitude DOUBLE,
 CONSTRAINT uk_cities_name UNIQUE(name)
);
CREATE TABLE offers (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 offer_type VARCHAR(31) NOT NULL,
 active BOOLEAN, allows_pay_on_arrival BOOLEAN, base_price DOUBLE,
 description VARCHAR(2000), stock INT, title VARCHAR(255),
 moderation_reason VARCHAR(1000), moderated_at DATETIME(6), moderated_by_admin_id BIGINT,
 city_id BIGINT NOT NULL, supplier_id BIGINT NOT NULL,
 airline VARCHAR(255), flight_number VARCHAR(255),
 departure_airport VARCHAR(255), arrival_airport VARCHAR(255),
 departure_date_time DATETIME(6), arrival_date_time DATETIME(6),
 round_trip BOOLEAN, return_departure_date_time DATETIME(6), return_arrival_date_time DATETIME(6), cabin_class VARCHAR(255),
 stars INT, room_type VARCHAR(255), address VARCHAR(255),
 brand VARCHAR(255), model VARCHAR(255), transmission VARCHAR(255), seats INT,
 car_pickup_location VARCHAR(255), allows_different_dropoff BOOLEAN,
 minimum_driver_age INT, maximum_driver_age INT,
 pickup_location VARCHAR(255), dropoff_location VARCHAR(255), vehicle_type VARCHAR(255),
 duration_hours INT, includes_guide BOOLEAN, includes_transport BOOLEAN, itinerary VARCHAR(2000),
 CONSTRAINT fk_offer_city FOREIGN KEY(city_id) REFERENCES cities(id),
 CONSTRAINT fk_offer_supplier FOREIGN KEY(supplier_id) REFERENCES users(id),
 CONSTRAINT fk_offer_moderator FOREIGN KEY(moderated_by_admin_id) REFERENCES users(id),
 INDEX idx_offer_type_active(offer_type, active),
 INDEX idx_offer_city(city_id), INDEX idx_offer_supplier(supplier_id)
);
CREATE TABLE offer_availabilities (
 offer_id BIGINT NOT NULL, available_from DATETIME(6) NOT NULL,
 available_until DATETIME(6) NOT NULL, capacity INT NOT NULL,
 CONSTRAINT fk_availability_offer FOREIGN KEY(offer_id) REFERENCES offers(id),
 CONSTRAINT chk_availability_dates CHECK(available_until > available_from),
 CONSTRAINT chk_availability_capacity CHECK(capacity > 0),
 INDEX idx_offer_availability_period(offer_id, available_from, available_until)
);
CREATE TABLE offer_images (
 offer_id BIGINT NOT NULL, image_path VARCHAR(255),
 CONSTRAINT fk_image_offer FOREIGN KEY(offer_id) REFERENCES offers(id)
);
CREATE TABLE car_dropoff_locations (
 offer_id BIGINT NOT NULL, location VARCHAR(255) NOT NULL,
 CONSTRAINT fk_dropoff_offer FOREIGN KEY(offer_id) REFERENCES offers(id)
);
CREATE TABLE bundles (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 title VARCHAR(255), description VARCHAR(2000), discount_percentage DOUBLE,
 created_by_agent_id BIGINT NOT NULL,
 CONSTRAINT fk_bundle_agent FOREIGN KEY(created_by_agent_id) REFERENCES users(id)
);
CREATE TABLE bundle_offers (
 bundle_id BIGINT NOT NULL, offer_id BIGINT NOT NULL,
 CONSTRAINT uk_bundle_offer UNIQUE(bundle_id, offer_id),
 CONSTRAINT fk_bundle_item_bundle FOREIGN KEY(bundle_id) REFERENCES bundles(id),
 CONSTRAINT fk_bundle_item_offer FOREIGN KEY(offer_id) REFERENCES offers(id)
);
CREATE TABLE promo_codes (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 code VARCHAR(255) NOT NULL, discount_type ENUM('FIXED','PERCENTAGE') NOT NULL,
 discount_value DECIMAL(12,2) NOT NULL, expiry_date DATE, active BOOLEAN,
 CONSTRAINT uk_promo_code UNIQUE(code)
);
CREATE TABLE carts (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 client_id BIGINT NOT NULL, promo_code_id BIGINT,
 CONSTRAINT uk_cart_client UNIQUE(client_id),
 CONSTRAINT fk_cart_client FOREIGN KEY(client_id) REFERENCES users(id),
 CONSTRAINT fk_cart_promo FOREIGN KEY(promo_code_id) REFERENCES promo_codes(id)
);
CREATE TABLE cart_items (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 cart_id BIGINT NOT NULL, offer_id BIGINT, bundle_id BIGINT,
 quantity INT NOT NULL, travel_criteria VARCHAR(4000),
 CONSTRAINT fk_cart_item_cart FOREIGN KEY(cart_id) REFERENCES carts(id),
 CONSTRAINT fk_cart_item_offer FOREIGN KEY(offer_id) REFERENCES offers(id),
 CONSTRAINT fk_cart_item_bundle FOREIGN KEY(bundle_id) REFERENCES bundles(id),
 CONSTRAINT chk_cart_item_target CHECK ((offer_id IS NOT NULL AND bundle_id IS NULL) OR (offer_id IS NULL AND bundle_id IS NOT NULL))
);
CREATE TABLE bookings (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 client_id BIGINT NOT NULL, offer_id BIGINT, bundle_id BIGINT,
 quantity INT NOT NULL, total_price DOUBLE NOT NULL,
 status ENUM('CANCELLED','COMPLETED','CONFIRMED','PENDING') NOT NULL,
 payment_method ENUM('ON_ARRIVAL','SIMULATED') NOT NULL,
 promo_code_id BIGINT, created_at DATETIME(6) NOT NULL,
 CONSTRAINT fk_booking_client FOREIGN KEY(client_id) REFERENCES users(id),
 CONSTRAINT fk_booking_offer FOREIGN KEY(offer_id) REFERENCES offers(id),
 CONSTRAINT fk_booking_bundle FOREIGN KEY(bundle_id) REFERENCES bundles(id),
 CONSTRAINT fk_booking_promo FOREIGN KEY(promo_code_id) REFERENCES promo_codes(id),
 CONSTRAINT chk_booking_target CHECK ((offer_id IS NOT NULL AND bundle_id IS NULL) OR (offer_id IS NULL AND bundle_id IS NOT NULL)),
 INDEX idx_booking_client_status(client_id, status), INDEX idx_booking_status_created(status, created_at)
);
CREATE TABLE payments (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 booking_id BIGINT NOT NULL, amount DOUBLE NOT NULL,
 method ENUM('ON_ARRIVAL','SIMULATED') NOT NULL,
 status ENUM('COMPLETED','PENDING') NOT NULL, paid_at DATETIME(6), marked_by_agent_id BIGINT,
 CONSTRAINT uk_payment_booking UNIQUE(booking_id),
 CONSTRAINT fk_payment_booking FOREIGN KEY(booking_id) REFERENCES bookings(id),
 CONSTRAINT fk_payment_agent FOREIGN KEY(marked_by_agent_id) REFERENCES users(id)
);
CREATE TABLE notifications (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT NOT NULL, message VARCHAR(1000) NOT NULL,
 is_read BOOLEAN NOT NULL, created_at DATETIME(6) NOT NULL,
 CONSTRAINT fk_notification_user FOREIGN KEY(user_id) REFERENCES users(id),
 INDEX idx_notification_user_read(user_id, is_read)
);
