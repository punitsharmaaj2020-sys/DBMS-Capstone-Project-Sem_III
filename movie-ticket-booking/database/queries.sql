-- =============================================================================
-- DATABASE QUERIES & DBMS CONCEPTS DEMONSTRATION
-- Project: Premium Movie Ticket Booking Platform (BookMyShow-style Architecture)
-- Target: B.Tech CSE 2nd-Year DBMS Capstone Evaluation & Technical Viva
-- =============================================================================

USE movie_ticket_booking;

-- =============================================================================
-- QUERY 1: DQL & Multi-Table INNER JOIN with Sorting
-- Demonstrates: INNER JOIN across 5 tables (bookings, customers, shows, movies, theatres),
-- filtering confirmed bookings and sorting descending by booking timestamp.
-- =============================================================================
SELECT 
    b.booking_reference,
    c.customer_name,
    c.email,
    m.title AS movie_title,
    t.name AS theatre_name,
    t.city,
    s.show_date,
    s.show_time,
    b.seat_numbers,
    b.number_of_tickets,
    b.total_amount,
    b.payment_status
FROM bookings b
INNER JOIN customers c ON b.customer_id = c.customer_id
INNER JOIN shows s ON b.show_id = s.show_id
INNER JOIN movies m ON s.movie_id = m.movie_id
INNER JOIN theatres t ON s.theatre_id = t.theatre_id
WHERE b.booking_status = 'CONFIRMED'
ORDER BY b.booking_date DESC;


-- =============================================================================
-- QUERY 2: Aggregate Functions & GROUP BY with HAVING Clause
-- Demonstrates: Aggregation (SUM, COUNT, AVG) grouped by movie, filtered using
-- HAVING to identify blockbuster movies generating more than ₹500 in confirmed revenue.
-- =============================================================================
SELECT 
    m.movie_id,
    m.title,
    m.genre,
    COUNT(b.booking_id) AS total_bookings_count,
    COALESCE(SUM(b.number_of_tickets), 0) AS total_tickets_sold,
    COALESCE(SUM(b.total_amount), 0.00) AS total_gross_revenue,
    ROUND(AVG(b.total_amount), 2) AS avg_booking_value
FROM movies m
INNER JOIN shows s ON m.movie_id = s.movie_id
INNER JOIN bookings b ON s.show_id = b.show_id
WHERE b.booking_status = 'CONFIRMED'
GROUP BY m.movie_id, m.title, m.genre
HAVING total_gross_revenue > 500.00
ORDER BY total_gross_revenue DESC;


-- =============================================================================
-- QUERY 3: LEFT OUTER JOIN (Catalog Coverage)
-- Demonstrates: LEFT JOIN to find all movies including those with zero scheduled shows
-- or zero bookings (ensures non-matching master rows are preserved).
-- =============================================================================
SELECT 
    m.movie_id,
    m.title,
    m.language,
    m.release_status,
    COUNT(s.show_id) AS scheduled_shows_count
FROM movies m
LEFT JOIN shows s ON m.movie_id = s.movie_id
GROUP BY m.movie_id, m.title, m.language, m.release_status
ORDER BY scheduled_shows_count DESC, m.title ASC;


-- =============================================================================
-- QUERY 4: RIGHT OUTER JOIN (Audit of Theatres vs Active Screenings)
-- Demonstrates: RIGHT OUTER JOIN to guarantee all registered theatres are evaluated
-- against upcoming scheduled screenings.
-- =============================================================================
SELECT 
    t.city,
    t.name AS theatre_name,
    s.show_date,
    s.show_time,
    s.ticket_price
FROM shows s
RIGHT OUTER JOIN theatres t ON s.theatre_id = t.theatre_id
ORDER BY t.city ASC, t.name ASC;


-- =============================================================================
-- QUERY 5: Correlated Subquery
-- Demonstrates: Subquery where inner query references outer table row (m.movie_id)
-- to retrieve movies whose user rating exceeds the average rating of their genre.
-- =============================================================================
SELECT 
    m1.movie_id,
    m1.title,
    m1.genre,
    m1.rating
FROM movies m1
WHERE m1.rating > (
    SELECT AVG(m2.rating)
    FROM movies m2
    WHERE m2.genre = m1.genre
)
ORDER BY m1.rating DESC;


-- =============================================================================
-- QUERY 6: Non-Correlated Subquery with IN Operator
-- Demonstrates: Finding all customers who have booked an IMAX or 4DX show.
-- =============================================================================
SELECT 
    c.customer_id,
    c.customer_name,
    c.email
FROM customers c
WHERE c.customer_id IN (
    SELECT DISTINCT b.customer_id
    FROM bookings b
    JOIN shows s ON b.show_id = s.show_id
    JOIN screens sc ON s.screen_id = sc.screen_id
    WHERE sc.screen_type IN ('IMAX Laser', '4DX', 'IMAX')
      AND b.booking_status = 'CONFIRMED'
);


-- =============================================================================
-- QUERY 7: Seat Inventory Breakdown by Tier (REGULAR, PREMIUM, RECLINER)
-- Demonstrates: Conditional aggregation with CASE statements to analyze
-- seating composition per theatre screen.
-- =============================================================================
SELECT 
    t.name AS theatre_name,
    sc.screen_name,
    sc.screen_type,
    COUNT(st.seat_id) AS total_physical_seats,
    SUM(CASE WHEN st.seat_tier = 'RECLINER' THEN 1 ELSE 0 END) AS recliner_seats_count,
    SUM(CASE WHEN st.seat_tier = 'PREMIUM' THEN 1 ELSE 0 END) AS premium_seats_count,
    SUM(CASE WHEN st.seat_tier = 'REGULAR' THEN 1 ELSE 0 END) AS regular_seats_count
FROM screens sc
JOIN theatres t ON sc.theatre_id = t.theatre_id
JOIN seats st ON sc.screen_id = st.screen_id
GROUP BY t.name, sc.screen_name, sc.screen_type
ORDER BY t.name, sc.screen_name;


-- =============================================================================
-- QUERY 8: Real-Time Seat Availability Collision Check
-- Demonstrates: Checking whether candidate seats for a show are already occupied
-- using the atomic `booking_seats` table and NOT EXISTS / IN clause.
-- =============================================================================
SELECT 
    st.seat_number,
    st.seat_tier,
    st.price_multiplier,
    CASE 
        WHEN bs.booking_seat_id IS NOT NULL AND bs.status = 'CONFIRMED' THEN 'OCCUPIED'
        ELSE 'AVAILABLE'
    END AS live_status
FROM seats st
JOIN shows s ON s.screen_id = st.screen_id
LEFT JOIN booking_seats bs 
    ON bs.seat_id = st.seat_id 
    AND bs.show_id = s.show_id 
    AND bs.status = 'CONFIRMED'
WHERE s.show_id = 1
ORDER BY st.seat_row ASC, st.seat_col ASC;


-- =============================================================================
-- QUERY 9: Coupon Redemption & Discount Financial Audit
-- Demonstrates: Financial reconciliation query calculating gross revenue, total
-- discount deductions, and net settled amount per coupon code.
-- =============================================================================
SELECT 
    COALESCE(b.coupon_code, 'NO_COUPON') AS coupon_applied,
    COUNT(b.booking_id) AS total_orders,
    SUM(b.total_amount) AS net_revenue_collected,
    SUM(b.discount_amount) AS total_discount_given
FROM bookings b
WHERE b.booking_status = 'CONFIRMED'
GROUP BY coupon_applied
ORDER BY net_revenue_collected DESC;


-- =============================================================================
-- QUERY 10: Multi-Criteria Filter & Pattern Matching (LIKE)
-- Demonstrates: Text pattern matching with wildcards (LIKE '%...%') and logical
-- conjunctions (AND, OR) for real-time cinema discovery.
-- =============================================================================
SELECT 
    movie_id,
    title,
    genre,
    language,
    rating,
    release_status
FROM movies
WHERE (title LIKE '%Dark%' OR description LIKE '%Joker%')
  AND language = 'English'
  AND rating >= 4.0;


-- =============================================================================
-- QUERY 11: SQL VIEW Demonstration (booking_details_view)
-- Demonstrates: Querying a pre-compiled relational VIEW providing abstraction
-- and encapsulation of complex 6-table joins.
-- =============================================================================
SELECT 
    booking_reference,
    customer_name,
    movie_title,
    theatre_name,
    city,
    show_date,
    show_time,
    seat_numbers,
    total_amount,
    payment_status,
    booking_status
FROM booking_details_view
WHERE booking_status = 'CONFIRMED';


-- =============================================================================
-- QUERY 12: Stored Procedure Execution with Input Parameter
-- Demonstrates: Invoking database-level stored logic with parameter passing.
-- =============================================================================
CALL GetMovieRevenue(1);


-- =============================================================================
-- QUERY 13: Customer Review Sentiment & Star Rating Averages
-- Demonstrates: AVG and COUNT aggregation on 1-to-many user review relations.
-- =============================================================================
SELECT 
    m.title AS movie_title,
    ROUND(AVG(r.rating), 1) AS computed_avg_rating,
    COUNT(r.review_id) AS verified_reviews_count
FROM movies m
LEFT JOIN reviews r ON m.movie_id = r.movie_id
GROUP BY m.movie_id, m.title
ORDER BY computed_avg_rating DESC;


-- =============================================================================
-- QUERY 14: User Watchlist & Personalized Recommendations
-- Demonstrates: Relational mapping between registered users and bookmarked movies.
-- =============================================================================
SELECT 
    u.name AS user_name,
    u.email,
    m.title AS watchlisted_movie,
    m.genre,
    m.rating,
    w.added_at
FROM watchlist w
JOIN users u ON w.user_id = u.user_id
JOIN movies m ON w.movie_id = m.movie_id
ORDER BY u.name ASC, w.added_at DESC;


-- =============================================================================
-- QUERY 15: ACID Transaction Engine (Complete Booking with Row Locking)
-- Demonstrates: 
--   - START TRANSACTION
--   - Pessimistic Row Locking (FOR UPDATE)
--   - Atomic seat status insertion in booking_seats
--   - Payment record creation
--   - Decrementing available seats
--   - COMMIT
-- =============================================================================
START TRANSACTION;

-- 1. Lock the candidate show row to prevent race conditions
SELECT show_id, available_seats, ticket_price 
FROM shows 
WHERE show_id = 1 
FOR UPDATE;

-- 2. Verify selected seats are not already occupied for this show
SELECT seat_id, seat_number 
FROM booking_seats 
WHERE show_id = 1 
  AND seat_id IN (1, 2) 
  AND status = 'CONFIRMED'
FOR UPDATE;

-- (If 0 rows returned above, proceed with booking):
-- 3. Insert Master Booking
INSERT INTO bookings (customer_id, user_id, show_id, booking_reference, number_of_tickets, seat_numbers, total_amount, convenience_fee, discount_amount, coupon_code, booking_status, payment_status)
VALUES (1, 2, 1, 'BK-TRANS-TEST', 2, 'A1, A2', 750.00, 30.00, 0.00, NULL, 'CONFIRMED', 'PAID');

SET @new_booking_id = LAST_INSERT_ID();

-- 4. Atomically insert individual seat reservations
INSERT INTO booking_seats (booking_id, show_id, seat_id, seat_number, seat_tier, seat_price, status)
VALUES 
(@new_booking_id, 1, 1, 'A1', 'RECLINER', 375.00, 'CONFIRMED'),
(@new_booking_id, 1, 2, 'A2', 'RECLINER', 375.00, 'CONFIRMED');

-- 5. Record verified payment
INSERT INTO payments (booking_id, user_id, amount, payment_method, transaction_id, payment_status)
VALUES (@new_booking_id, 2, 750.00, 'RAZORPAY_TEST', 'TXN-TRANS-TEST-01', 'SUCCESS');

-- 6. Decrement available seats in show
UPDATE shows 
SET available_seats = available_seats - 2 
WHERE show_id = 1;

-- Commit the transaction atomically
COMMIT;


-- =============================================================================
-- QUERY 16: ACID Transaction Engine (Cancellation, Seat Release & Refund)
-- Demonstrates: 
--   - Rollback capability
--   - Updating booking status
--   - Releasing seats in booking_seats
--   - Restoring seat count in shows
--   - Logging refund audit entry
-- =============================================================================
START TRANSACTION;

-- 1. Lock the booking to be cancelled
SELECT booking_id, show_id, number_of_tickets, total_amount, booking_status 
FROM bookings 
WHERE booking_reference = 'BK-TRANS-TEST' AND booking_status = 'CONFIRMED'
FOR UPDATE;

-- 2. Update booking status
UPDATE bookings 
SET booking_status = 'CANCELLED', payment_status = 'REFUNDED' 
WHERE booking_reference = 'BK-TRANS-TEST';

-- 3. Release occupied seats
UPDATE booking_seats 
SET status = 'RELEASED' 
WHERE booking_id = @new_booking_id;

-- 4. Restore available seats on the show
UPDATE shows 
SET available_seats = available_seats + 2 
WHERE show_id = 1;

-- 5. Record refund audit
INSERT INTO refunds (booking_id, refund_amount, refund_reason, refund_status)
VALUES (@new_booking_id, 750.00, 'Customer requested voluntary cancellation', 'PROCESSED');

-- Commit atomic cancellation
COMMIT;
