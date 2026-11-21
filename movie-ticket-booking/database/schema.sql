-- =======================================================
-- Database: movie_ticket_booking
-- DBMS Capstone Project: Premium Movie Ticket Booking Platform
-- Architecture: Relational Database (MySQL 8.0+ / InnoDB / 3NF)
-- =======================================================

DROP DATABASE IF EXISTS movie_ticket_booking;
CREATE DATABASE movie_ticket_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE movie_ticket_booking;

-- =======================================================
-- TABLE 1: movies
-- Stores metadata about movies, ratings, genres, and release status
-- =======================================================
CREATE TABLE movies (
    movie_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    duration_minutes INT NOT NULL,
    language VARCHAR(50) NOT NULL,
    description TEXT,
    poster_url VARCHAR(500),
    banner_url VARCHAR(500),
    rating DECIMAL(3,1) DEFAULT 4.5,
    votes_count INT DEFAULT 1200,
    cast_crew VARCHAR(500),
    release_status ENUM('NOW_SHOWING', 'COMING_SOON') DEFAULT 'NOW_SHOWING',
    trailer_url VARCHAR(500),
    release_date DATE,
    CONSTRAINT chk_movie_duration CHECK (duration_minutes > 0),
    CONSTRAINT chk_movie_rating CHECK (rating >= 0.0 AND rating <= 5.0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================
-- TABLE 2: theatres
-- Stores cinema theatres categorized by city location
-- =======================================================
CREATE TABLE theatres (
    theatre_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    total_screens INT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_theatre_screens CHECK (total_screens > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================
-- TABLE 3: screens
-- Represents auditoriums/screens within each cinema theatre
-- =======================================================
CREATE TABLE screens (
    screen_id INT PRIMARY KEY AUTO_INCREMENT,
    theatre_id INT NOT NULL,
    screen_number INT NOT NULL,
    screen_name VARCHAR(100) NOT NULL,
    screen_type VARCHAR(50) NOT NULL DEFAULT 'Standard',
    total_seats INT NOT NULL DEFAULT 60,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_screens_theatre FOREIGN KEY (theatre_id) 
        REFERENCES theatres(theatre_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_theatre_screen UNIQUE (theatre_id, screen_number),
    CONSTRAINT chk_screen_seats CHECK (total_seats > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================
-- TABLE 4: seats
-- Physical seat inventory per screen with tier classification
-- =======================================================
CREATE TABLE seats (
    seat_id INT PRIMARY KEY AUTO_INCREMENT,
    screen_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    seat_row VARCHAR(5) NOT NULL,
    seat_col INT NOT NULL,
    seat_tier ENUM('REGULAR', 'PREMIUM', 'RECLINER') NOT NULL DEFAULT 'REGULAR',
    price_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    CONSTRAINT fk_seats_screen FOREIGN KEY (screen_id) 
        REFERENCES screens(screen_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_screen_seat UNIQUE (screen_id, seat_number),
    CONSTRAINT chk_seat_col CHECK (seat_col > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================
-- TABLE 5: shows
-- Scheduled screenings linked to movies, theatres, and screens
-- =======================================================
CREATE TABLE shows (
    show_id INT PRIMARY KEY AUTO_INCREMENT,
    movie_id INT NOT NULL,
    theatre_id INT NULL,
    screen_id INT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    ticket_price DECIMAL(10,2) NOT NULL,
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    CONSTRAINT fk_shows_movie FOREIGN KEY (movie_id) 
        REFERENCES movies(movie_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_shows_theatre FOREIGN KEY (theatre_id) 
        REFERENCES theatres(theatre_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_shows_screen FOREIGN KEY (screen_id) 
        REFERENCES screens(screen_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_ticket_price CHECK (ticket_price > 0),
    CONSTRAINT chk_total_seats CHECK (total_seats > 0),
    CONSTRAINT chk_available_seats_non_neg CHECK (available_seats >= 0),
    CONSTRAINT chk_available_seats_limit CHECK (available_seats <= total_seats)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================
-- TABLE 6: customers (Backwards-compatibility support)
-- =======================================================
CREATE TABLE customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================
-- TABLE 7: users
-- Secure customer and administrator accounts with bcrypt hash
-- =======================================================
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================
-- TABLE 8: bookings
-- Master reservation records with financial breakdown & tracking
-- =======================================================
CREATE TABLE bookings (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    user_id INT NULL,
    show_id INT NOT NULL,
    booking_reference VARCHAR(50) UNIQUE,
    number_of_tickets INT NOT NULL,
    seat_numbers VARCHAR(255) NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    convenience_fee DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    coupon_code VARCHAR(50) NULL,
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    booking_status ENUM('CONFIRMED', 'CANCELLED', 'PENDING') NOT NULL DEFAULT 'CONFIRMED',
    payment_status ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PAID',
    CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_bookings_show FOREIGN KEY (show_id) 
        REFERENCES shows(show_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_tickets_positive CHECK (number_of_tickets > 0),
    CONSTRAINT chk_total_amount_non_negative CHECK (total_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================
-- TABLE 9: booking_seats
-- Atomic seat reservation mapping preventing double booking
-- =======================================================
CREATE TABLE booking_seats (
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

-- =======================================================
-- TABLE 10: payments
-- Payment audit logs with Razorpay test order / transaction references
-- =======================================================
CREATE TABLE payments (
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
        REFERENCES bookings(booking_id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================
-- TABLE 11: refunds
-- Refund records for cancelled bookings
-- =======================================================
CREATE TABLE refunds (
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

-- =======================================================
-- TABLE 12: watchlist
-- User favourite movies bookmarking
-- =======================================================
CREATE TABLE watchlist (
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

-- =======================================================
-- TABLE 13: reviews
-- Customer movie reviews and star ratings (1 to 5)
-- =======================================================
CREATE TABLE reviews (
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

-- =======================================================
-- TABLE 14: coupons
-- Promotional discount coupon codes with minimum amounts & limits
-- =======================================================
CREATE TABLE coupons (
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

-- =======================================================
-- INDEXES
-- High performance search and lookup indexes
-- =======================================================
CREATE INDEX idx_movies_title ON movies(title);
CREATE INDEX idx_movies_genre ON movies(genre);
CREATE INDEX idx_movies_status ON movies(release_status);
CREATE INDEX idx_theatres_city ON theatres(city);
CREATE INDEX idx_screens_theatre ON screens(theatre_id);
CREATE INDEX idx_seats_screen ON seats(screen_id);
CREATE INDEX idx_shows_movie_id ON shows(movie_id);
CREATE INDEX idx_shows_date ON shows(show_date);
CREATE INDEX idx_shows_screen ON shows(screen_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_show ON bookings(show_id);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_bs_show_seat ON booking_seats(show_id, seat_id, status);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_reviews_movie ON reviews(movie_id);
CREATE INDEX idx_watchlist_user ON watchlist(user_id);
CREATE INDEX idx_coupons_code ON coupons(code);

-- =======================================================
-- VIEW 1: booking_details_view
-- Multi-table JOIN view for ticket confirmations and history
-- =======================================================
CREATE OR REPLACE VIEW booking_details_view AS
SELECT 
    b.booking_id,
    COALESCE(b.booking_reference, CONCAT('BK-', LPAD(b.booking_id, 6, '0'))) AS booking_reference,
    COALESCE(u.name, c.customer_name) AS customer_name,
    COALESCE(u.email, c.email) AS email,
    m.title AS movie_title,
    m.poster_url,
    m.genre,
    m.language,
    COALESCE(t.name, 'CinePass Grand Multiplex') AS theatre_name,
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

-- =======================================================
-- VIEW 2: movie_analytics_view
-- Aggregates movie popularity, revenue, and ticket volume
-- =======================================================
CREATE OR REPLACE VIEW movie_analytics_view AS
SELECT 
    m.movie_id,
    m.title,
    m.genre,
    m.language,
    m.rating,
    COUNT(DISTINCT s.show_id) AS total_shows_scheduled,
    COALESCE(SUM(CASE WHEN b.booking_status = 'CONFIRMED' THEN b.number_of_tickets ELSE 0 END), 0) AS tickets_sold,
    COALESCE(SUM(CASE WHEN b.booking_status = 'CONFIRMED' THEN b.total_amount ELSE 0.00 END), 0.00) AS total_revenue
FROM movies m
LEFT JOIN shows s ON m.movie_id = s.movie_id
LEFT JOIN bookings b ON s.show_id = b.show_id
GROUP BY m.movie_id, m.title, m.genre, m.language, m.rating;

-- =======================================================
-- STORED PROCEDURE 1: GetMovieRevenue
-- =======================================================
DELIMITER //
CREATE PROCEDURE GetMovieRevenue(IN p_movie_id INT)
BEGIN
    SELECT 
        m.movie_id,
        m.title AS movie_title,
        COALESCE(SUM(b.total_amount), 0.00) AS total_revenue,
        COUNT(b.booking_id) AS total_bookings_count
    FROM movies m
    LEFT JOIN shows s ON m.movie_id = s.movie_id
    LEFT JOIN bookings b ON s.show_id = b.show_id AND b.booking_status = 'CONFIRMED'
    WHERE m.movie_id = p_movie_id
    GROUP BY m.movie_id, m.title;
END //
DELIMITER ;

-- =======================================================
-- TRIGGER 1: before_booking_insert
-- Ensures at database level that requested tickets do not exceed available seats
-- =======================================================
DELIMITER //
CREATE TRIGGER before_booking_insert
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
    DECLARE avail INT;
    SELECT available_seats INTO avail FROM shows WHERE show_id = NEW.show_id;
    IF avail < NEW.number_of_tickets THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Not enough available seats for this show';
    END IF;
END //
DELIMITER ;
