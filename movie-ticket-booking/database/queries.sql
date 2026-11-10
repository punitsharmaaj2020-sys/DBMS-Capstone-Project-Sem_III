-- =====================================================================
-- Movie Ticket Booking System - Useful Analytical & Operational Queries
-- Demonstrating Core DBMS Concepts: Joins, Aggregation, Subqueries, 
-- Grouping, Filtering, Set Operations, and Views
-- =====================================================================

USE movie_ticket_booking;

-- =====================================================================
-- Query 1: All movies and their scheduled showtimes
-- DBMS Concept: INNER JOIN between two related tables
-- Purpose: Retrieves an operational schedule showing when each movie plays.
-- =====================================================================
SELECT 
    m.movie_id,
    m.title AS movie_title,
    m.language,
    s.show_id,
    s.show_date,
    s.show_time,
    s.ticket_price,
    s.available_seats,
    s.total_seats
FROM movies m
INNER JOIN shows s ON m.movie_id = s.movie_id
ORDER BY s.show_date ASC, s.show_time ASC;


-- =====================================================================
-- Query 2: All confirmed bookings with customer and movie details
-- DBMS Concept: Multi-table INNER JOIN across 4 normalized entities
-- Purpose: Displays full booking receipts including patron and screening data.
-- =====================================================================
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
INNER JOIN customers c ON b.customer_id = c.customer_id
INNER JOIN shows s ON b.show_id = s.show_id
INNER JOIN movies m ON s.movie_id = m.movie_id
WHERE b.booking_status = 'CONFIRMED'
ORDER BY b.booking_date DESC;


-- =====================================================================
-- Query 3: Total revenue from confirmed bookings
-- DBMS Concept: Aggregate function (SUM) with conditional filter (WHERE)
-- Purpose: Calculates gross earnings from valid (non-cancelled) reservations.
-- =====================================================================
SELECT 
    COUNT(booking_id) AS total_confirmed_bookings,
    SUM(number_of_tickets) AS total_tickets_sold,
    COALESCE(SUM(total_amount), 0.00) AS total_gross_revenue
FROM bookings
WHERE booking_status = 'CONFIRMED';


-- =====================================================================
-- Query 4: Total tickets sold per movie
-- DBMS Concept: Multi-table JOIN with GROUP BY and aggregate SUM
-- Purpose: Analyzes ticket sales volume for each movie in the system.
-- =====================================================================
SELECT 
    m.movie_id,
    m.title AS movie_title,
    m.genre,
    COALESCE(SUM(b.number_of_tickets), 0) AS total_tickets_sold
FROM movies m
LEFT JOIN shows s ON m.movie_id = s.movie_id
LEFT JOIN bookings b ON s.show_id = b.show_id AND b.booking_status = 'CONFIRMED'
GROUP BY m.movie_id, m.title, m.genre
ORDER BY total_tickets_sold DESC;


-- =====================================================================
-- Query 5: Movies with no bookings
-- DBMS Concept: LEFT OUTER JOIN with IS NULL filter (Anti-Join pattern)
-- Purpose: Identifies movies that have not generated any bookings yet.
-- =====================================================================
SELECT 
    m.movie_id,
    m.title AS movie_title,
    m.genre,
    m.language
FROM movies m
LEFT JOIN shows s ON m.movie_id = s.movie_id
LEFT JOIN bookings b ON s.show_id = b.show_id
GROUP BY m.movie_id, m.title, m.genre, m.language
HAVING COUNT(b.booking_id) = 0;


-- =====================================================================
-- Query 6: Most popular movies ranked by tickets sold
-- DBMS Concept: GROUP BY, ORDER BY, aggregate SUM with ranking
-- Purpose: Produces a box-office popularity leaderboard.
-- =====================================================================
SELECT 
    m.movie_id,
    m.title AS movie_title,
    COUNT(DISTINCT s.show_id) AS total_scheduled_shows,
    COALESCE(SUM(b.number_of_tickets), 0) AS tickets_sold,
    COALESCE(SUM(b.total_amount), 0.00) AS total_revenue
FROM movies m
INNER JOIN shows s ON m.movie_id = s.movie_id
LEFT JOIN bookings b ON s.show_id = b.show_id AND b.booking_status = 'CONFIRMED'
GROUP BY m.movie_id, m.title
ORDER BY tickets_sold DESC, total_revenue DESC;


-- =====================================================================
-- Query 7: Shows with highest available seats
-- DBMS Concept: Selection, Sorting (ORDER BY DESC), and Pagination (LIMIT)
-- Purpose: Identifies shows with greatest surplus inventory for promotional discounts.
-- =====================================================================
SELECT 
    s.show_id,
    m.title AS movie_title,
    s.show_date,
    s.show_time,
    s.ticket_price,
    s.available_seats,
    s.total_seats,
    ROUND((s.available_seats / s.total_seats) * 100, 2) AS vacancy_percentage
FROM shows s
INNER JOIN movies m ON s.movie_id = m.movie_id
ORDER BY s.available_seats DESC
LIMIT 5;


-- =====================================================================
-- Query 8: Daily booking totals
-- DBMS Concept: Date functions with GROUP BY and multiple aggregations
-- Purpose: Tracks business trends, customer traffic, and daily turnover.
-- =====================================================================
SELECT 
    DATE(b.booking_date) AS booking_day,
    COUNT(b.booking_id) AS total_transactions,
    SUM(b.number_of_tickets) AS total_tickets_booked,
    SUM(b.total_amount) AS daily_revenue
FROM bookings b
WHERE b.booking_status = 'CONFIRMED'
GROUP BY DATE(b.booking_date)
ORDER BY booking_day DESC;


-- =====================================================================
-- Query 9: Customers with more than one booking
-- DBMS Concept: GROUP BY with HAVING clause for post-aggregation filtering
-- Purpose: Identifies repeat/frequent customers for loyalty rewards.
-- =====================================================================
SELECT 
    c.customer_id,
    c.customer_name,
    c.email,
    COUNT(b.booking_id) AS booking_count,
    SUM(b.number_of_tickets) AS cumulative_tickets,
    SUM(b.total_amount) AS cumulative_spent
FROM customers c
INNER JOIN bookings b ON c.customer_id = b.customer_id
GROUP BY c.customer_id, c.customer_name, c.email
HAVING COUNT(b.booking_id) > 1
ORDER BY booking_count DESC;


-- =====================================================================
-- Query 10: Booking history for a particular email
-- DBMS Concept: Parametric lookup using JOIN and indexed column filter
-- Purpose: Powers user self-service portal to see past ticket orders.
-- =====================================================================
SELECT 
    b.booking_id,
    m.title AS movie_title,
    s.show_date,
    s.show_time,
    b.number_of_tickets,
    b.total_amount,
    b.booking_status,
    b.booking_date
FROM bookings b
INNER JOIN customers c ON b.customer_id = c.customer_id
INNER JOIN shows s ON b.show_id = s.show_id
INNER JOIN movies m ON s.movie_id = m.movie_id
WHERE c.email = 'rahul@example.com'
ORDER BY b.booking_date DESC;


-- =====================================================================
-- Query 11: Average ticket price per movie
-- DBMS Concept: Aggregate AVG function with GROUP BY
-- Purpose: Analyzes pricing dispersion across movie titles.
-- =====================================================================
SELECT 
    m.movie_id,
    m.title AS movie_title,
    COUNT(s.show_id) AS number_of_shows,
    ROUND(AVG(s.ticket_price), 2) AS average_ticket_price,
    MIN(s.ticket_price) AS min_price,
    MAX(s.ticket_price) AS max_price
FROM movies m
INNER JOIN shows s ON m.movie_id = s.movie_id
GROUP BY m.movie_id, m.title
ORDER BY average_ticket_price DESC;


-- =====================================================================
-- Query 12: Movies with shows but no confirmed bookings
-- DBMS Concept: Nested Subquery with NOT IN / NOT EXISTS predicate
-- Purpose: Detects scheduled content that has had zero customer traction.
-- =====================================================================
SELECT 
    m.movie_id,
    m.title AS movie_title,
    m.genre,
    m.language
FROM movies m
WHERE m.movie_id IN (
    SELECT DISTINCT s.movie_id 
    FROM shows s
) 
AND m.movie_id NOT IN (
    SELECT DISTINCT s.movie_id
    FROM shows s
    INNER JOIN bookings b ON s.show_id = b.show_id
    WHERE b.booking_status = 'CONFIRMED'
);


-- =====================================================================
-- Query 13: Min, Max, and Average ticket prices across all active screenings
-- DBMS Concept: Multi-column scalar aggregation across the entire table
-- Purpose: Provides overall price baseline metrics for the theater management.
-- =====================================================================
SELECT 
    MIN(ticket_price) AS lowest_ticket_price,
    MAX(ticket_price) AS highest_ticket_price,
    ROUND(AVG(ticket_price), 2) AS overall_average_ticket_price,
    COUNT(show_id) AS total_screenings_scheduled
FROM shows;


-- =====================================================================
-- Query 14: Detailed revenue breakdown by movie
-- DBMS Concept: Multi-table outer joins with aggregation, grouping, and ordering
-- Purpose: Provides executive-level reporting of financial performance per title.
-- =====================================================================
SELECT 
    m.movie_id,
    m.title AS movie_title,
    m.language,
    COUNT(DISTINCT s.show_id) AS total_shows,
    COALESCE(SUM(CASE WHEN b.booking_status = 'CONFIRMED' THEN b.number_of_tickets ELSE 0 END), 0) AS confirmed_tickets,
    COALESCE(SUM(CASE WHEN b.booking_status = 'CONFIRMED' THEN b.total_amount ELSE 0.00 END), 0.00) AS total_revenue
FROM movies m
LEFT JOIN shows s ON m.movie_id = s.movie_id
LEFT JOIN bookings b ON s.show_id = b.show_id
GROUP BY m.movie_id, m.title, m.language
ORDER BY total_revenue DESC;
