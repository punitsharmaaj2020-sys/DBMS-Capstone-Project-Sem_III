-- =======================================================
-- Seed Data: movie_ticket_booking
-- DBMS Capstone Project: Premium Movie Ticket Booking Platform
-- =======================================================

USE movie_ticket_booking;

-- Disable Foreign Key checks for clean re-seeding
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE refunds;
TRUNCATE TABLE payments;
TRUNCATE TABLE booking_seats;
TRUNCATE TABLE bookings;
TRUNCATE TABLE reviews;
TRUNCATE TABLE watchlist;
TRUNCATE TABLE coupons;
TRUNCATE TABLE seats;
TRUNCATE TABLE shows;
TRUNCATE TABLE screens;
TRUNCATE TABLE theatres;
TRUNCATE TABLE users;
TRUNCATE TABLE customers;
TRUNCATE TABLE movies;
SET FOREIGN_KEY_CHECKS = 1;

-- =======================================================
-- 1. SEED MOVIES (Now Showing & Coming Soon)
-- =======================================================
INSERT INTO movies (movie_id, title, genre, duration_minutes, language, description, poster_url, banner_url, rating, votes_count, cast_crew, release_status, trailer_url, release_date) VALUES
(1, 'The Dark Knight', 'Action', 152, 'English', 
 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', 
 '/images/posters/the-dark-knight.svg', 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&q=80', 4.9, 15420, 'Christian Bale, Heath Ledger, Aaron Eckhart | Dir: Christopher Nolan', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=EXeTwQWrcwY', '2008-07-18'),

(2, 'Inception', 'Sci-Fi', 148, 'English', 
 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 
 '/images/posters/inception.svg', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80', 4.8, 12890, 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page | Dir: Christopher Nolan', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=YoHD9XEInc0', '2010-07-16'),

(3, 'Interstellar', 'Sci-Fi', 169, 'English', 
 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival as Earth faces catastrophic famine.', 
 '/images/posters/interstellar.svg', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80', 4.9, 18900, 'Matthew McConaughey, Anne Hathaway, Jessica Chastain | Dir: Christopher Nolan', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zSWdZVtXT7E', '2014-11-07'),

(4, 'Parasite', 'Thriller', 132, 'Korean', 
 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.', 
 '/images/posters/parasite.svg', 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1200&q=80', 4.6, 9400, 'Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong | Dir: Bong Joon Ho', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=5xH0hhMBw80', '2019-05-30'),

(5, 'RRR', 'Action', 187, 'Telugu', 
 'A fearless revolutionary and an officer in the British force, who once shared a deep bond, decide to join forces and chart out an inspiring path of freedom against the despotic rulers.', 
 '/images/posters/rrr.svg', 'https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?w=1200&q=80', 4.7, 14200, 'N.T. Rama Rao Jr., Ram Charan, Alia Bhatt | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=f_vbAtFSEc0', '2022-03-25'),

(6, 'Dune: Part Two', 'Sci-Fi', 166, 'English', 
 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', 
 '/images/posters/dune-part-two.svg', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&q=80', 4.8, 16800, 'Timothee Chalamet, Zendaya, Rebecca Ferguson | Dir: Denis Villeneuve', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Way9Dexny3w', '2024-03-01'),

(7, 'Oppenheimer', 'Drama', 180, 'English', 
 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.', 
 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500&q=80', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200&q=80', 4.8, 17200, 'Cillian Murphy, Emily Blunt, Matt Damon | Dir: Christopher Nolan', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=uYPbbksJxIg', '2023-07-21'),

(8, 'Avengers: Secret Wars', 'Action', 165, 'English', 
 'Earth''s mightiest heroes reunite across dimensions and parallel timelines to battle the multiverse collapse.', 
 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&q=80', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&q=80', 4.9, 8500, 'Ensemble Marvel Cast | Marvel Studios', 'COMING_SOON', 'https://www.youtube.com', '2027-05-07'),

(9, 'Spider-Man: Beyond the Spider-Verse', 'Animation', 140, 'English', 
 'Miles Morales must navigate the multiverse to save the people he loves most from impending reality destruction.', 
 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=500&q=80', 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=1200&q=80', 4.9, 9300, 'Shameik Moore, Hailee Steinfeld | Sony Pictures Animation', 'COMING_SOON', 'https://www.youtube.com', '2026-12-18'    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);

-- =======================================================
-- 2. SEED THEATRES (Across major metropolitan cities)
-- =======================================================
INSERT INTO theatres (theatre_id, name, city, address, total_screens) VALUES
(1, 'PVR ICON: Infiniti Mall', 'Mumbai', 'Link Road, Andheri West, Mumbai', 3),
(2, 'INOX Megaplex: Inorbit Mall', 'Mumbai', 'Link Road, Malad West, Mumbai', 2),
(3, 'Cinepolis: DLF Avenue', 'Delhi', 'Press Enclave Road, Saket, New Delhi', 3),
(4, 'PVR Superplex: Forum Mall', 'Bengaluru', 'Hosur Road, Koramangala, Bengaluru', 2    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);

-- =======================================================
-- 3. SEED SCREENS
-- =======================================================
INSERT INTO screens (screen_id, theatre_id, screen_number, screen_name, screen_type, total_seats) VALUES
(1, 1, 1, 'Audi 1 - IMAX Laser 3D', 'IMAX Laser', 64),
(2, 1, 2, 'Audi 2 - 4DX Dynamic', '4DX', 64),
(3, 1, 3, 'Audi 3 - Dolby Atmos Premiere', 'Dolby Atmos', 64),
(4, 2, 1, 'Audi 1 - Insignia Luxury', 'Luxury Recliner', 64),
(5, 2, 2, 'Audi 2 - BigPix 4K', 'Dolby 7.1', 64),
(6, 3, 1, 'Audi 1 - Macro XE', 'IMAX', 64),
(7, 3, 2, 'Audi 2 - VIP Lounge', 'VIP Lounge', 64),
(8, 4, 1, 'Audi 1 - P[XL] Large Screen', 'Dolby Atmos', 64    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);

-- =======================================================
-- 4. SEED SEATS (For Screen 1, 2, 3, 4 - 64 seats per screen)
-- Layout: 8 rows (A-H), 8 columns (1-8)
-- A-B: RECLINER (multiplier 1.50)
-- C-E: PREMIUM (multiplier 1.25)
-- F-H: REGULAR (multiplier 1.00)
-- =======================================================
DELIMITER //
CREATE PROCEDURE PopulateScreenSeats(IN p_screen_id INT)
BEGIN
    DECLARE r_idx INT DEFAULT 1;
    DECLARE c_idx INT DEFAULT 1;
    DECLARE row_char CHAR(1    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);
    DECLARE tier_val VARCHAR(20    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);
    DECLARE mult_val DECIMAL(3,2    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);
    
    WHILE r_idx <= 8 DO
        SET row_char = CHAR(64 + r_idx    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
); -- A=65, B=66, etc.
        IF r_idx IN (1, 2) THEN
            SET tier_val = 'RECLINER';
            SET mult_val = 1.50;
        ELSEIF r_idx IN (3, 4, 5) THEN
            SET tier_val = 'PREMIUM';
            SET mult_val = 1.25;
        ELSE
            SET tier_val = 'REGULAR';
            SET mult_val = 1.00;
        END IF;

        SET c_idx = 1;
        WHILE c_idx <= 8 DO
            INSERT INTO seats (screen_id, seat_number, seat_row, seat_col, seat_tier, price_multiplier)
            VALUES (p_screen_id, CONCAT(row_char, c_idx), row_char, c_idx, tier_val, mult_val    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);
            SET c_idx = c_idx + 1;
        END WHILE;
        SET r_idx = r_idx + 1;
    END WHILE;
END //
DELIMITER ;

CALL PopulateScreenSeats(1    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);
CALL PopulateScreenSeats(2    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);
CALL PopulateScreenSeats(3    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);
CALL PopulateScreenSeats(4    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);
CALL PopulateScreenSeats(5    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);
CALL PopulateScreenSeats(6    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);
CALL PopulateScreenSeats(7    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);
CALL PopulateScreenSeats(8    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);

DROP PROCEDURE PopulateScreenSeats;

-- =======================================================
-- 5. SEED USERS & CUSTOMERS
-- Passwords:
-- admin@cinepass.com -> admin123 ($2b$10$W90ykCb5Tav4EiXFeQag6ua8IIMd2KXYGL23M6A64/hLU1LuZN2C.)
-- akshat@example.com -> user123 ($2b$10$eC1Zv/9AHTj5XW0gApBxsuzD7sQosLZnTIlwJkQ4AfgeV.LKloXvy)
-- rahul@example.com  -> user123 ($2b$10$eC1Zv/9AHTj5XW0gApBxsuzD7sQosLZnTIlwJkQ4AfgeV.LKloXvy)
-- =======================================================
INSERT INTO users (user_id, name, email, password_hash, phone, role) VALUES
(1, 'System Administrator', 'admin@cinepass.com', '$2b$10$W90ykCb5Tav4EiXFeQag6ua8IIMd2KXYGL23M6A64/hLU1LuZN2C.', '+91 9876543210', 'ADMIN'),
(2, 'Akshat Tomar', 'akshat@example.com', '$2b$10$eC1Zv/9AHTj5XW0gApBxsuzD7sQosLZnTIlwJkQ4AfgeV.LKloXvy', '+91 9123456780', 'CUSTOMER'),
(3, 'Rahul Sharma', 'rahul@example.com', '$2b$10$eC1Zv/9AHTj5XW0gApBxsuzD7sQosLZnTIlwJkQ4AfgeV.LKloXvy', '+91 9811223344', 'CUSTOMER'    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);

INSERT INTO customers (customer_id, customer_name, email) VALUES
(1, 'Akshat Tomar', 'akshat@example.com'),
(2, 'Rahul Sharma', 'rahul@example.com'    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);

-- =======================================================
-- 6. SEED SHOWTIMES (Dynamic dates: Today, Tomorrow, Day+2, Day+3)
-- =======================================================
INSERT INTO shows (show_id, movie_id, theatre_id, screen_id, show_date, show_time, ticket_price, total_seats, available_seats) VALUES
-- The Dark Knight (Movie 1)
(1, 1, 1, 1, CURDATE(), '14:30:00', 250.00, 64, 60),
(2, 1, 1, 1, CURDATE(), '18:45:00', 300.00, 64, 64),
(3, 1, 2, 4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '20:00:00', 350.00, 64, 64),
(4, 1, 3, 6, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '16:00:00', 280.00, 64, 64),

-- Inception (Movie 2)
(5, 2, 1, 2, CURDATE(), '15:00:00', 220.00, 64, 64),
(6, 2, 2, 5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '19:15:00', 260.00, 64, 64),

-- Interstellar (Movie 3)
(7, 3, 1, 3, CURDATE(), '17:30:00', 280.00, 64, 64),
(8, 3, 3, 7, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '21:00:00', 320.00, 64, 64),

-- Parasite (Movie 4)
(9, 4, 2, 4, CURDATE(), '16:30:00', 200.00, 64, 64),
(10, 4, 4, 8, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '18:00:00', 220.00, 64, 64),

-- RRR (Movie 5)
(11, 5, 4, 8, CURDATE(), '13:00:00', 250.00, 64, 64),
(12, 5, 1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '21:30:00', 320.00, 64, 64),

-- Dune: Part Two (Movie 6)
(13, 6, 1, 1, CURDATE(), '11:00:00', 290.00, 64, 64),
(14, 6, 3, 6, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '17:00:00', 310.00, 64, 64),

-- Oppenheimer (Movie 7)
(15, 7, 1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '13:30:00', 350.00, 64, 64    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);

-- =======================================================
-- 7. SEED COUPONS
-- =======================================================
INSERT INTO coupons (coupon_id, code, description, discount_percent, max_discount, min_amount, expiry_date, is_active) VALUES
(1, 'WELCOME50', '50% off for first time movie lovers up to ₹150', 50, 150.00, 250.00, DATE_ADD(CURDATE(), INTERVAL 90 DAY), TRUE),
(2, 'CINE100', 'Flat 20% discount on cinema bookings up to ₹100', 20, 100.00, 300.00, DATE_ADD(CURDATE(), INTERVAL 60 DAY), TRUE),
(3, 'BLOCKBUSTER', 'Mega 30% discount on premium auditoriums up to ₹250', 30, 250.00, 500.00, DATE_ADD(CURDATE(), INTERVAL 45 DAY), TRUE    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);

-- =======================================================
-- 8. SEED BOOKINGS, SEATS & PAYMENTS
-- =======================================================
-- Booking 1: Akshat booked 2 tickets for Show 1 (Seats A1, A2)
INSERT INTO bookings (booking_id, customer_id, user_id, show_id, booking_reference, number_of_tickets, seat_numbers, total_amount, convenience_fee, discount_amount, coupon_code, booking_status, payment_status)
VALUES (1, 1, 2, 1, 'BK-100001', 2, 'A1, A2', 750.00, 30.00, 0.00, NULL, 'CONFIRMED', 'PAID'    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);

-- Insert seats in booking_seats (Seat A1 = seat_id 1, A2 = seat_id 2 in Screen 1)
INSERT INTO booking_seats (booking_id, show_id, seat_id, seat_number, seat_tier, seat_price, status) VALUES
(1, 1, 1, 'A1', 'RECLINER', 375.00, 'CONFIRMED'),
(1, 1, 2, 'A2', 'RECLINER', 375.00, 'CONFIRMED'    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);

-- Payment record
INSERT INTO payments (booking_id, user_id, amount, payment_method, razorpay_order_id, razorpay_payment_id, transaction_id, payment_status)
VALUES (1, 2, 750.00, 'RAZORPAY_TEST', 'order_demo_1001', 'pay_demo_2001', 'TXN-984729104', 'SUCCESS'    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);

-- Booking 2: Rahul booked 2 tickets for Show 1 (Seats C3, C4)
INSERT INTO bookings (booking_id, customer_id, user_id, show_id, booking_reference, number_of_tickets, seat_numbers, total_amount, convenience_fee, discount_amount, coupon_code, booking_status, payment_status)
VALUES (2, 2, 3, 1, 'BK-100002', 2, 'C3, C4', 625.00, 30.00, 100.00, 'CINE100', 'CONFIRMED', 'PAID'    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);

INSERT INTO booking_seats (booking_id, show_id, seat_id, seat_number, seat_tier, seat_price, status) VALUES
(2, 1, 19, 'C3', 'PREMIUM', 312.50, 'CONFIRMED'),
(2, 1, 20, 'C4', 'PREMIUM', 312.50, 'CONFIRMED'    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);

INSERT INTO payments (booking_id, user_id, amount, payment_method, razorpay_order_id, razorpay_payment_id, transaction_id, payment_status)
VALUES (2, 3, 625.00, 'RAZORPAY_TEST', 'order_demo_1002', 'pay_demo_2002', 'TXN-984729105', 'SUCCESS'    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);

-- =======================================================
-- 9. SEED REVIEWS & RATINGS
-- =======================================================
INSERT INTO reviews (movie_id, user_id, rating, review_text) VALUES
(1, 2, 5, 'Heath Ledger''s Joker is legendary. The pacing, soundtrack, and direction make this a timeless cinematic masterpiece.'),
(1, 3, 5, 'Best superhero movie ever made. The cinematography and IMAX sound design are phenomenal.'),
(3, 2, 5, 'Hans Zimmer''s score combined with Christopher Nolan''s cosmic storytelling brought tears to my eyes.'),
(6, 3, 5, 'Dune Part Two is the defining sci-fi epic of this generation. Visuals are utterly breathtaking.'    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
);

-- =======================================================
-- 10. SEED WATCHLIST
-- =======================================================
INSERT INTO watchlist (user_id, movie_id) VALUES
(2, 3), -- Akshat watchlists Interstellar
(2, 6), -- Akshat watchlists Dune 2
(3, 1), -- Rahul watchlists The Dark Knight
(3, 7    (10, 'Kabir Singh', 'Romance', 165, 'Hindi', 'A hot-headed surgeon meets a brave medical student at a college, exploring love, loss and redemption.', '/images/posters/kabir-singh.svg', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=1200&q=80', 4.5, 11000, 'Shahid Kapoor, Kiara Advani | Dir: Sandeep Reddy Vanga', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=JkLlqgVoiP8', '2020-06-21'),
    (11, 'Baahubali: The Beginning', 'Action', 159, 'Telugu', 'Epic tale of two brothers in a kingdom torn by betrayal and power.', '/images/posters/baahubali1.svg', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=1200&q=80', 4.7, 15000, 'Prabhas, Rana Daggubati | Dir: S.S. Rajamouli', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=3U8ZPVApG1w', '2015-07-10'),
    (12, 'Kantara', 'Drama', 124, 'Kannada', 'A mythic tale of man versus nature set in the Western Ghats.', '/images/posters/kantara.svg', 'https://images.unsplash.com/photo-1617563312615-cd5d8e573ef0?w=1200&q=80', 4.6, 9000, 'Rishab Shetty, Sapthami Gowda | Dir: Rishab Shetty', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=Ktr-R2AVeAU', '2022-09-30'),
    (13, 'Joker', 'Drama', 122, 'English', 'A gritty origin story of a failed comedian turned chaotic villain.', '/images/posters/joker.svg', 'https://images.unsplash.com/photo-1521452263015-ef44692281b4?w=1200&q=80', 4.8, 20000, 'Joaquin Phoenix | Dir: Todd Phillips', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=zAGJQ3tJ4Io', '2019-10-04')
); -- Rahul watchlists Oppenheimer

-- Additional seed data for movies, theatres, and languages
INSERT INTO movies (movie_id, title, genre, duration_minutes, language, description, poster_url, banner_url, rating, votes_count, cast_crew, release_status, trailer_url, release_date) VALUES
(14, 'Titanic', 'Romance', 195, 'English', 'A love story unfolds aboard the ill-fated RMS Titanic.', '/images/posters/titanic.svg', 'https://example.com/banners/titanic.jpg', 4.8, 25000, 'Leonardo DiCaprio, Kate Winslet | Dir: James Cameron', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=2e-eXJ6QQ1g', '1997-12-19'),
(15, 'The Matrix', 'Sci-Fi', 136, 'English', 'A hacker discovers reality is a simulation and joins a rebellion.', '/images/posters/matrix.svg', 'https://example.com/banners/matrix.jpg', 4.9, 22000, 'Keanu Reeves, Laurence Fishburne | Dir: The Wachowskis', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=vKQi3bBA1y8', '1999-03-31'),
(16, 'Kung Fu Panda', 'Animation', 92, 'Mandarin', 'A clumsy panda becomes the Dragon Warrior to save his valley.', '/images/posters/kungfu-panda.svg', 'https://example.com/banners/kungfu-panda.jpg', 4.7, 18000, 'Jack Black, Angelina Jolie | Dir: Mark Osborne', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=PXi3M1MAY5U', '2008-06-06');

INSERT INTO theatres (theatre_id, name, city, address, total_screens) VALUES
(5, 'PVR Cinemas: Express Avenue', 'Chennai', 'Express Avenue Mall, Royapettah, Chennai', 4),
(6, 'INOX: GVK One', 'Hyderabad', 'GVK One Mall, Banjara Hills, Hyderabad', 3),
(7, 'Cinepolis: Phoenix Marketcity', 'Pune', 'Phoenix Marketcity, Baner, Pune', 2);
