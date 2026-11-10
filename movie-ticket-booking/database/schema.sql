-- =======================================================
-- Database: movie_ticket_booking
-- DBMS Capstone Project: Movie Ticket Booking System
-- =======================================================

DROP DATABASE IF EXISTS movie_ticket_booking;
CREATE DATABASE movie_ticket_booking;
USE movie_ticket_booking;

-- =======================================================
-- TABLE 1: movies
-- Stores metadata about movies available in the theater
-- =======================================================
CREATE TABLE movies (
    movie_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    duration_minutes INT NOT NULL,
    language VARCHAR(50) NOT NULL,
    description TEXT,
    poster_url VARCHAR(500),
    release_date DATE,
    CONSTRAINT chk_movie_duration CHECK (duration_minutes > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================================================
-- TABLE 2: shows
-- Stores screening showtimes, pricing, and seat availability
-- =======================================================
CREATE TABLE shows (
    show_id INT PRIMARY KEY AUTO_INCREMENT,
    movie_id INT NOT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    ticket_price DECIMAL(10,2) NOT NULL,
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    CONSTRAINT fk_shows_movie FOREIGN KEY (movie_id) 
        REFERENCES movies(movie_id) ON DELETE CASCADE,
    CONSTRAINT chk_ticket_price CHECK (ticket_price > 0),
    CONSTRAINT chk_total_seats CHECK (total_seats > 0),
    CONSTRAINT chk_available_seats_non_negative CHECK (available_seats >= 0),
    CONSTRAINT chk_available_seats_limit CHECK (available_seats <= total_seats)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================================================
-- TABLE 3: customers
-- Stores customer profiles uniquely identified by email
-- =======================================================
CREATE TABLE customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================================================
-- TABLE 4: bookings
-- Records ticket booking transactions linked to customers and shows
-- =======================================================
CREATE TABLE bookings (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    show_id INT NOT NULL,
    number_of_tickets INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    booking_status ENUM('CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(customer_id),
    CONSTRAINT fk_bookings_show FOREIGN KEY (show_id) 
        REFERENCES shows(show_id),
    CONSTRAINT chk_tickets_positive CHECK (number_of_tickets > 0),
    CONSTRAINT chk_total_amount_non_negative CHECK (total_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================================================
-- INDEXES
-- Optimize performance for frequent lookup and join queries
-- =======================================================
CREATE INDEX idx_movies_title ON movies(title);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_shows_movie_id ON shows(movie_id);
CREATE INDEX idx_shows_date ON shows(show_date);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(booking_status);

-- DDL: ALTER TABLE example - Adding an index on genre
ALTER TABLE movies ADD INDEX idx_movies_genre (genre);

-- =======================================================
-- VIEW: booking_details_view
-- Joins bookings, customers, shows, and movies for reporting
-- =======================================================
CREATE OR REPLACE VIEW booking_details_view AS
SELECT 
    b.booking_id,
    c.customer_name,
    c.email,
    m.title AS movie_title,
    s.show_date,
    s.show_time,
    b.number_of_tickets,
    b.total_amount,
    b.booking_status,
    b.booking_date
FROM bookings b
JOIN customers c ON b.customer_id = c.customer_id
JOIN shows s ON b.show_id = s.show_id
JOIN movies m ON s.movie_id = m.movie_id;

-- =======================================================
-- STORED PROCEDURE: GetMovieRevenue
-- Computes total revenue from confirmed bookings for a movie
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
-- TRIGGER: before_booking_insert
-- Ensures that requested tickets do not exceed available seats
-- =======================================================
DELIMITER //
CREATE TRIGGER before_booking_insert
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
    DECLARE avail INT;
    SELECT available_seats INTO avail FROM shows WHERE show_id = NEW.show_id;
    IF avail < NEW.number_of_tickets THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Not enough available seats';
    END IF;
END //
DELIMITER ;
