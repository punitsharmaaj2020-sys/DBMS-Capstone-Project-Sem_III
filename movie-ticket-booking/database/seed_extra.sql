-- =======================================================
-- Additional Seed Data: Movies, Theatres (Cities), and Languages
-- =======================================================

-- Insert additional movies (IDs start from 14)
INSERT INTO movies (movie_id, title, genre, duration_minutes, language, description, poster_url, banner_url, rating, votes_count, cast_crew, release_status, trailer_url, release_date) VALUES
(14, 'Titanic', 'Romance', 195, 'English', 'A love story unfolds aboard the ill-fated RMS Titanic.', '/images/posters/titanic.svg', 'https://example.com/banners/titanic.jpg', 4.8, 25000, 'Leonardo DiCaprio, Kate Winslet | Dir: James Cameron', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=2e-eXJ6QQ1g', '1997-12-19'),
(15, 'The Matrix', 'Sci-Fi', 136, 'English', 'A hacker discovers reality is a simulation and joins a rebellion.', '/images/posters/matrix.svg', 'https://example.com/banners/matrix.jpg', 4.9, 22000, 'Keanu Reeves, Laurence Fishburne | Dir: The Wachowskis', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=vKQi3bBA1y8', '1999-03-31'),
(16, 'Kung Fu Panda', 'Animation', 92, 'Mandarin', 'A clumsy panda becomes the Dragon Warrior to save his valley.', '/images/posters/kungfu-panda.svg', 'https://example.com/banners/kungfu-panda.jpg', 4.7, 18000, 'Jack Black, Angelina Jolie | Dir: Mark Osborne', 'NOW_SHOWING', 'https://www.youtube.com/watch?v=PXi3M1MAY5U', '2008-06-06');

-- Insert additional theatres (new cities) (IDs start from 5)
INSERT INTO theatres (theatre_id, name, city, address, total_screens) VALUES
(5, 'PVR Cinemas: Express Avenue', 'Chennai', 'Express Avenue Mall, Royapettah, Chennai', 4),
(6, 'INOX: GVK One', 'Hyderabad', 'GVK One Mall, Banjara Hills, Hyderabad', 3),
(7, 'Cinepolis: Phoenix Marketcity', 'Pune', 'Phoenix Marketcity, Baner, Pune', 2);

-- No separate language table needed; languages are stored per movie.
-- End of additional seed data.
