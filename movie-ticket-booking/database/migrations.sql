-- =======================================================
-- Database Migration Script: movie_ticket_booking
-- Upgrades existing 4-table schema to complete BookMyShow-style architecture
-- Adds: users, theatres, screens, seats, booking_seats,
--       payments, refunds, watchlist, reviews, coupons
-- =======================================================

USE movie_ticket_booking;

-- 1. Upgrade movies table
ALTER TABLE movies
    ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500) AFTER poster_url,
    ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 4.5 AFTER banner_url,
    ADD COLUMN IF NOT EXISTS votes_count INT DEFAULT 1200 AFTER rating,
    ADD COLUMN IF NOT EXISTS cast_crew VARCHAR(500) AFTER votes_count,
    ADD COLUMN IF NOT EXISTS release_status ENUM('NOW_SHOWING', 'COMING_SOON') DEFAULT 'NOW_SHOWING' AFTER cast_crew,
    ADD COLUMN IF NOT EXISTS trailer_url VARCHAR(500) AFTER release_status;

-- 2. Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create theatres table
CREATE TABLE IF NOT EXISTS theatres (
    theatre_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    total_screens INT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_theatre_screens CHECK (total_screens > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create screens table
CREATE TABLE IF NOT EXISTS screens (
    screen_id INT PRIMARY KEY AUTO_INCREMENT,
    theatre_id INT NOT NULL,
    screen_number INT NOT NULL,
    screen_name VARCHAR(100) NOT NULL,
    screen_type VARCHAR(50) NOT NULL DEFAULT 'Standard',
    total_seats INT NOT NULL DEFAULT 60,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_screens_theatre FOREIGN KEY (theatre_id) 
        REFERENCES theatres(theatre_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_theatre_screen UNIQUE (theatre_id, screen_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create seats table
CREATE TABLE IF NOT EXISTS seats (
    seat_id INT PRIMARY KEY AUTO_INCREMENT,
    screen_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    seat_row VARCHAR(5) NOT NULL,
    seat_col INT NOT NULL,
    seat_tier ENUM('REGULAR', 'PREMIUM', 'RECLINER') NOT NULL DEFAULT 'REGULAR',
    price_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    CONSTRAINT fk_seats_screen FOREIGN KEY (screen_id) 
        REFERENCES screens(screen_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_screen_seat UNIQUE (screen_id, seat_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Upgrade shows table with theatre and screen references
ALTER TABLE shows
    ADD COLUMN IF NOT EXISTS theatre_id INT NULL AFTER movie_id,
    ADD COLUMN IF NOT EXISTS screen_id INT NULL AFTER theatre_id;

-- Add foreign key constraints on shows if not present
SET @fk_theatre_check = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = 'movie_ticket_booking' AND CONSTRAINT_NAME = 'fk_shows_theatre'
);
SET @sql_fk_theatre = IF(@fk_theatre_check = 0, 
    'ALTER TABLE shows ADD CONSTRAINT fk_shows_theatre FOREIGN KEY (theatre_id) REFERENCES theatres(theatre_id) ON DELETE SET NULL ON UPDATE CASCADE', 
    'SELECT 1'
);
PREPARE stmt1 FROM @sql_fk_theatre;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @fk_screen_check = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = 'movie_ticket_booking' AND CONSTRAINT_NAME = 'fk_shows_screen'
);
SET @sql_fk_screen = IF(@fk_screen_check = 0, 
    'ALTER TABLE shows ADD CONSTRAINT fk_shows_screen FOREIGN KEY (screen_id) REFERENCES screens(screen_id) ON DELETE SET NULL ON UPDATE CASCADE', 
    'SELECT 1'
);
PREPARE stmt2 FROM @sql_fk_screen;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 7. Upgrade bookings table
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS user_id INT NULL AFTER customer_id,
    ADD COLUMN IF NOT EXISTS booking_reference VARCHAR(50) NULL AFTER show_id,
    ADD COLUMN IF NOT EXISTS seat_numbers VARCHAR(255) NULL AFTER number_of_tickets,
    ADD COLUMN IF NOT EXISTS convenience_fee DECIMAL(10,2) DEFAULT 0.00 AFTER total_amount,
    ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0.00 AFTER convenience_fee,
    ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50) NULL AFTER discount_amount,
    ADD COLUMN IF NOT EXISTS payment_status ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED') DEFAULT 'PAID' AFTER booking_status;

-- 8. Create booking_seats table for atomic seat reservation
CREATE TABLE IF NOT EXISTS booking_seats (
    booking_seat_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    show_id INT NOT NULL,
    seat_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    seat_tier ENUM('REGULAR', 'PREMIUM', 'RECLINER') NOT NULL DEFAULT 'REGULAR',
    seat_price DECIMAL(10,2) NOT NULL,
    status ENUM('RESERVED', 'CONFIRMED', 'RELEASED') DEFAULT 'CONFIRMED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bs_booking FOREIGN KEY (booking_id) 
        REFERENCES bookings(booking_id) ON DELETE CASCADE,
    CONSTRAINT fk_bs_show FOREIGN KEY (show_id) 
        REFERENCES shows(show_id) ON DELETE CASCADE,
    CONSTRAINT fk_bs_seat FOREIGN KEY (seat_id) 
        REFERENCES seats(seat_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Create payments table
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    user_id INT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'RAZORPAY_TEST',
    razorpay_order_id VARCHAR(100) NULL,
    razorpay_payment_id VARCHAR(100) NULL,
    razorpay_signature VARCHAR(255) NULL,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    payment_status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'SUCCESS',
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) 
        REFERENCES bookings(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Create refunds table
CREATE TABLE IF NOT EXISTS refunds (
    refund_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    payment_id INT NULL,
    refund_amount DECIMAL(10,2) NOT NULL,
    refund_reason VARCHAR(255) DEFAULT 'User requested booking cancellation',
    refund_status ENUM('PENDING', 'PROCESSED', 'FAILED') DEFAULT 'PROCESSED',
    refund_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refunds_booking FOREIGN KEY (booking_id) 
        REFERENCES bookings(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
    watchlist_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    movie_id INT NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wl_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_wl_movie FOREIGN KEY (movie_id) 
        REFERENCES movies(movie_id) ON DELETE CASCADE,
    CONSTRAINT uq_user_movie_wl UNIQUE (user_id, movie_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    movie_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rev_movie FOREIGN KEY (movie_id) 
        REFERENCES movies(movie_id) ON DELETE CASCADE,
    CONSTRAINT fk_rev_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    coupon_id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    discount_percent INT NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
    max_discount DECIMAL(10,2) NOT NULL DEFAULT 200.00,
    min_amount DECIMAL(10,2) NOT NULL DEFAULT 300.00,
    expiry_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_theatres_city ON theatres(city);
CREATE INDEX IF NOT EXISTS idx_screens_theatre ON screens(theatre_id);
CREATE INDEX IF NOT EXISTS idx_seats_screen ON seats(screen_id);
CREATE INDEX IF NOT EXISTS idx_shows_screen ON shows(screen_id);
CREATE INDEX IF NOT EXISTS idx_bs_show_seat ON booking_seats(show_id, seat_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_movie ON reviews(movie_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- 15. Comprehensive Multi-Table Reporting View
CREATE OR REPLACE VIEW booking_details_view AS
SELECT 
    b.booking_id,
    b.booking_reference,
    COALESCE(u.name, c.customer_name) AS customer_name,
    COALESCE(u.email, c.email) AS email,
    m.title AS movie_title,
    m.poster_url,
    COALESCE(t.name, 'CinePass Grand Cinema') AS theatre_name,
    COALESCE(t.city, 'Mumbai') AS city,
    COALESCE(sc.screen_name, 'Audi 1 - IMAX') AS screen_name,
    s.show_date,
    s.show_time,
    b.number_of_tickets,
    b.seat_numbers,
    b.total_amount,
    b.convenience_fee,
    b.discount_amount,
    b.coupon_code,
    b.payment_status,
    b.booking_status,
    b.booking_date
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.customer_id
LEFT JOIN users u ON b.user_id = u.user_id
JOIN shows s ON b.show_id = s.show_id
JOIN movies m ON s.movie_id = m.movie_id
LEFT JOIN screens sc ON s.screen_id = sc.screen_id
LEFT JOIN theatres t ON (sc.theatre_id = t.theatre_id OR s.theatre_id = t.theatre_id);
