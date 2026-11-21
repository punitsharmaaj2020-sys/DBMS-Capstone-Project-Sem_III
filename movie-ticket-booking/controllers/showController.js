const pool = require('../config/db');

/**
 * Fetch all shows with multi-criteria filtering:
 * movie_id, theatre_id, city, date
 */
const getAllShows = async (req, res) => {
    try {
        const { movie_id, theatre_id, city, date } = req.query;

        let query = `
            SELECT s.show_id, s.movie_id, s.theatre_id, s.screen_id,
                   s.show_date, s.show_time, s.ticket_price, s.total_seats, s.available_seats,
                   m.title AS movie_title, m.genre, m.language, m.poster_url, m.duration_minutes,
                   COALESCE(t.name, 'CinePass Grand Multiplex') AS theatre_name,
                   COALESCE(t.city, 'Mumbai') AS city,
                   COALESCE(sc.screen_name, 'Audi 1 - IMAX') AS screen_name,
                   COALESCE(sc.screen_type, 'Standard') AS screen_type
            FROM shows s
            JOIN movies m ON s.movie_id = m.movie_id
            LEFT JOIN theatres t ON s.theatre_id = t.theatre_id
            LEFT JOIN screens sc ON s.screen_id = sc.screen_id
            WHERE 1=1
        `;
        const params = [];

        if (movie_id) {
            query += ' AND s.movie_id = ?';
            params.push(parseInt(movie_id, 10));
        }

        if (theatre_id) {
            query += ' AND s.theatre_id = ?';
            params.push(parseInt(theatre_id, 10));
        }

        if (city && city.toLowerCase() !== 'all') {
            query += ' AND t.city = ?';
            params.push(city.trim());
        }

        if (date) {
            query += ' AND s.show_date = ?';
            params.push(date.trim());
        }

        query += ' ORDER BY s.show_date ASC, s.show_time ASC';

        const [rows] = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (err) {
        console.error('Error fetching shows:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching shows',
            error: err.message
        });
    }
};

/**
 * Fetch active/upcoming shows for a specific movie
 */
const getShowsByMovie = async (req, res) => {
    try {
        const movieId = parseInt(req.params.movieId, 10);
        const { city, date } = req.query;

        if (isNaN(movieId) || movieId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid movie ID. ID must be a positive number.'
            });
        }

        let query = `
            SELECT s.show_id, s.movie_id, s.theatre_id, s.screen_id,
                   s.show_date, s.show_time, s.ticket_price, s.total_seats, s.available_seats,
                   m.title AS movie_title, m.poster_url, m.duration_minutes,
                   COALESCE(t.name, 'CinePass Grand Multiplex') AS theatre_name,
                   COALESCE(t.city, 'Mumbai') AS city,
                   COALESCE(t.address, 'City Center') AS address,
                   COALESCE(sc.screen_name, 'Audi 1 - IMAX') AS screen_name,
                   COALESCE(sc.screen_type, 'Standard') AS screen_type
            FROM shows s
            INNER JOIN movies m ON s.movie_id = m.movie_id
            LEFT JOIN theatres t ON s.theatre_id = t.theatre_id
            LEFT JOIN screens sc ON s.screen_id = sc.screen_id
            WHERE s.movie_id = ?
        `;
        const params = [movieId];

        if (city && city.toLowerCase() !== 'all') {
            query += ' AND t.city = ?';
            params.push(city.trim());
        }

        if (date) {
            query += ' AND s.show_date = ?';
            params.push(date.trim());
        }

        query += ' ORDER BY s.show_date ASC, t.name ASC, s.show_time ASC';

        const [rows] = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (err) {
        console.error('Error fetching shows for movie:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching shows',
            error: err.message
        });
    }
};

/**
 * Fetch single show details
 */
const getShowById = async (req, res) => {
    try {
        const showId = parseInt(req.params.id, 10);
        if (isNaN(showId) || showId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid show ID' });
        }

        const [rows] = await pool.query(
            `SELECT s.show_id, s.movie_id, s.theatre_id, s.screen_id,
                    s.show_date, s.show_time, s.ticket_price, s.total_seats, s.available_seats,
                    m.title AS movie_title, m.poster_url, m.genre, m.language, m.duration_minutes,
                    COALESCE(t.name, 'CinePass Grand Multiplex') AS theatre_name,
                    COALESCE(t.city, 'Mumbai') AS city,
                    COALESCE(t.address, 'City Center') AS address,
                    COALESCE(sc.screen_name, 'Audi 1 - IMAX') AS screen_name,
                    COALESCE(sc.screen_type, 'Standard') AS screen_type
             FROM shows s
             JOIN movies m ON s.movie_id = m.movie_id
             LEFT JOIN theatres t ON s.theatre_id = t.theatre_id
             LEFT JOIN screens sc ON s.screen_id = sc.screen_id
             WHERE s.show_id = ?`,
            [showId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Show not found' });
        }

        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Error fetching show details:', err);
        return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
};

/**
 * Add a new show screening
 */
const addShow = async (req, res) => {
    try {
        const {
            movie_id,
            theatre_id,
            screen_id,
            show_date,
            show_time,
            ticket_price,
            total_seats = 64
        } = req.body;

        if (!movie_id || !show_date || !show_time || ticket_price === undefined) {
            return res.status(400).json({
                success: false,
                message: 'movie_id, show_date, show_time, and ticket_price are required'
            });
        }

        const movieId = parseInt(movie_id, 10);
        const theatreId = theatre_id ? parseInt(theatre_id, 10) : null;
        const screenId = screen_id ? parseInt(screen_id, 10) : null;
        const price = parseFloat(ticket_price);
        const seats = parseInt(total_seats, 10);

        if (isNaN(movieId) || movieId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid movie_id' });
        }
        if (isNaN(price) || price <= 0) {
            return res.status(400).json({ success: false, message: 'ticket_price must be greater than 0' });
        }

        const [movieRows] = await pool.query('SELECT movie_id FROM movies WHERE movie_id = ?', [movieId]);
        if (!movieRows || movieRows.length === 0) {
            return res.status(404).json({ success: false, message: `Movie with ID ${movieId} does not exist.` });
        }

        const [result] = await pool.query(
            `INSERT INTO shows (movie_id, theatre_id, screen_id, show_date, show_time, ticket_price, total_seats, available_seats)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [movieId, theatreId, screenId, show_date, show_time, price, seats, seats]
        );

        return res.status(201).json({
            success: true,
            message: 'Show scheduled successfully',
            data: {
                show_id: result.insertId,
                movie_id: movieId,
                show_date,
                show_time,
                ticket_price: price,
                available_seats: seats
            }
        });
    } catch (err) {
        console.error('Error adding show:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while adding show',
            error: err.message
        });
    }
};

/**
 * Delete / cancel a show
 */
const deleteShow = async (req, res) => {
    try {
        const showId = parseInt(req.params.id, 10);
        const [bookings] = await pool.query(
            'SELECT COUNT(*) AS count FROM bookings WHERE show_id = ? AND booking_status = "CONFIRMED"',
            [showId]
        );

        if (bookings[0].count > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete show: There are ${bookings[0].count} active booking(s) for this show.`
            });
        }

        await pool.query('DELETE FROM shows WHERE show_id = ?', [showId]);
        res.json({ success: true, message: 'Show cancelled and deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error deleting show', error: err.message });
    }
};

module.exports = {
    getAllShows,
    getShowsByMovie,
    getShowById,
    addShow,
    deleteShow
};
