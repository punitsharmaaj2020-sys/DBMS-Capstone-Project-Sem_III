-- =======================================================
-- Seed Data: movie_ticket_booking
-- Populates movies, shows, customers, and sample bookings
-- =======================================================

USE movie_ticket_booking;

-- Disable foreign key checks for clean re-seeding
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE bookings;
TRUNCATE TABLE shows;
TRUNCATE TABLE customers;
TRUNCATE TABLE movies;
SET FOREIGN_KEY_CHECKS = 1;

-- =======================================================
-- 1. Insert Movies
-- =======================================================
INSERT INTO movies (movie_id, title, genre, duration_minutes, language, description, poster_url, release_date) VALUES
(1, 'The Dark Knight', 'Action/Thriller', 152, 'English', 
 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice. With the help of allies Lt. Jim Gordon and DA Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the city streets.', 
 '/images/posters/the-dark-knight.svg', '2008-07-18'),

(2, 'Inception', 'Sci-Fi/Action', 148, 'English', 
 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O. Cobb is offered a chance to have his criminal history erased as payment for the implantation of another person\'s idea into a target\'s subconscious.', 
 '/images/posters/inception.svg', '2010-07-16'),

(3, 'Interstellar', 'Sci-Fi/Drama', 169, 'English', 
 'When Earth becomes increasingly uninhabitable in the near future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers. They journey through a newly discovered wormhole near Saturn in search of a new habitable planet for the survival of humanity.', 
 '/images/posters/interstellar.svg', '2014-11-07'),

(4, 'Parasite', 'Thriller/Drama', 132, 'Korean', 
 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan. One by one, the Kim family members pose as unrelated, highly qualified individuals to infiltrate the Park household, unleashing an unexpected sequence of chaotic events.', 
 '/images/posters/parasite.svg', '2019-05-30'),

(5, 'Dune: Part Two', 'Sci-Fi/Adventure', 166, 'English', 
 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.', 
 '/images/posters/dune-part-two.svg', '2024-03-01'),

(6, 'RRR', 'Action/Drama', 187, 'Telugu', 
 'A fearless revolutionary and an officer in the British force, who once were friends, unite against the tyrannical British rulers of India in the 1920s. Together they embark on an epic and perilous journey of freedom, brotherhood, and rebellion to deliver justice for their oppressed people.', 
 '/images/posters/rrr.svg', '2022-03-25');

-- =======================================================
-- 2. Insert Shows (at least 2 shows per movie, dates Nov 1-15 2026)
-- =======================================================
INSERT INTO shows (show_id, movie_id, show_date, show_time, ticket_price, total_seats, available_seats) VALUES
-- The Dark Knight (Movie 1)
(1, 1, '2026-11-01', '14:30:00', 250.00, 150, 150),
(2, 1, '2026-11-02', '18:45:00', 280.00, 180, 180),

-- Inception (Movie 2)
(3, 2, '2026-11-03', '15:00:00', 220.00, 120, 120),
(4, 2, '2026-11-04', '20:15:00', 260.00, 150, 150),

-- Interstellar (Movie 3)
(5, 3, '2026-11-05', '16:00:00', 300.00, 200, 200),
(6, 3, '2026-11-06', '21:00:00', 320.00, 200, 200),

-- Parasite (Movie 4)
(7, 4, '2026-11-07', '13:15:00', 180.00, 100, 100),
(8, 4, '2026-11-08', '17:30:00', 200.00, 100, 100),

-- Dune: Part Two (Movie 5)
(9, 5, '2026-11-09', '14:00:00', 320.00, 160, 160),
(10, 5, '2026-11-10', '19:30:00', 350.00, 180, 180),

-- RRR (Movie 6)
(11, 6, '2026-11-11', '15:30:00', 200.00, 140, 140),
(12, 6, '2026-11-12', '19:45:00', 250.00, 160, 160);

-- =======================================================
-- 3. Insert Customers
-- =======================================================
INSERT INTO customers (customer_id, customer_name, email, created_at) VALUES
(1, 'Rahul Sharma', 'rahul@example.com', '2026-10-25 10:15:00'),
(2, 'Priya Patel', 'priya@example.com', '2026-10-25 11:30:00');

-- =======================================================
-- 4. Insert Sample Bookings
-- Show 1 ticket price: 250.00 -> 2 tickets = 500.00
-- Show 3 ticket price: 220.00 -> 3 tickets = 660.00
-- =======================================================
INSERT INTO bookings (booking_id, customer_id, show_id, number_of_tickets, total_amount, booking_date, booking_status) VALUES
(1, 1, 1, 2, 500.00, '2026-10-26 09:00:00', 'CONFIRMED'),
(2, 2, 3, 3, 660.00, '2026-10-26 09:30:00', 'CONFIRMED');

-- Update available seats for Show 1 and Show 3
UPDATE shows SET available_seats = available_seats - 2 WHERE show_id = 1;
UPDATE shows SET available_seats = available_seats - 3 WHERE show_id = 3;
