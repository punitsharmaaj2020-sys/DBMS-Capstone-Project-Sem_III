const crypto = require('crypto');
const pool = require('../config/db');

// In-memory token store for admin authentication
const activeTokens = new Map();

// Admin login
const adminLogin = (req, res) => {
    try {
        const { username, password } = req.body;

        const expectedUsername = process.env.ADMIN_USERNAME;
        const expectedPassword = process.env.ADMIN_PASSWORD;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Compare credentials directly with environment variables
        if (username === expectedUsername && password === expectedPassword) {
            const token = crypto.randomBytes(32).toString('hex');
            activeTokens.set(token, {
                username,
                loginTime: new Date()
            });

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                token
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    } catch (err) {
        console.error('Error in adminLogin:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during login',
            error: err.message
        });
    }
};

// Admin logout
const adminLogout = (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token) {
                activeTokens.delete(token);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (err) {
        console.error('Error in adminLogout:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during logout',
            error: err.message
        });
    }
};

// Verify admin token session
const verifyAdmin = (req, res) => {
    if (req.isAdmin) {
        return res.status(200).json({
            success: true,
            message: 'Authenticated'
        });
    }
    return res.status(401).json({
        success: false,
        message: 'Unauthorized: Admin privileges required'
    });
};

// Add a new movie
const addMovie = async (req, res) => {
    try {
        const {
            title,
            genre,
            duration_minutes,
            language,
            description,
            poster_url,
            release_date
        } = req.body;

        // Validate required fields
        if (!title || !genre || duration_minutes === undefined || !language) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: title, genre, duration_minutes, language'
            });
        }

        const duration = parseInt(duration_minutes, 10);
        if (isNaN(duration) || duration <= 0) {
            return res.status(400).json({
                success: false,
                message: 'duration_minutes must be a positive integer'
            });
        }

        const [result] = await pool.query(
            `INSERT INTO movies (title, genre, duration_minutes, language, description, poster_url, release_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                genre.trim(),
                duration,
                language.trim(),
                description ? description.trim() : null,
                poster_url ? poster_url.trim() : null,
                release_date || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Movie added successfully',
            data: { movie_id: result.insertId }
        });
    } catch (err) {
        console.error('Error adding movie:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while adding movie',
            error: err.message
        });
    }
};

// Update an existing movie
const updateMovie = async (req, res) => {
    try {
        const movieId = parseInt(req.params.id, 10);
        if (isNaN(movieId) || movieId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid movie ID. ID must be a positive number.'
            });
        }

        const {
            title,
            genre,
            duration_minutes,
            language,
            description,
            poster_url,
            release_date
        } = req.body;

        if (!title || !genre || duration_minutes === undefined || !language) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: title, genre, duration_minutes, language'
            });
        }

        const duration = parseInt(duration_minutes, 10);
        if (isNaN(duration) || duration <= 0) {
            return res.status(400).json({
                success: false,
                message: 'duration_minutes must be a positive integer'
            });
        }

        const [result] = await pool.query(
            `UPDATE movies
             SET title = ?, genre = ?, duration_minutes = ?, language = ?, description = ?, poster_url = ?, release_date = ?
             WHERE movie_id = ?`,
            [
                title.trim(),
                genre.trim(),
                duration,
                language.trim(),
                description ? description.trim() : null,
                poster_url ? poster_url.trim() : null,
                release_date || null,
                movieId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Movie updated successfully'
        });
    } catch (err) {
        console.error('Error updating movie:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating movie',
            error: err.message
        });
    }
};

// Delete a movie (only if no existing shows)
const deleteMovie = async (req, res) => {
    try {
        const movieId = parseInt(req.params.id, 10);
        if (isNaN(movieId) || movieId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid movie ID. ID must be a positive number.'
            });
        }

        // Check if movie has existing shows
        const [showCountRows] = await pool.query(
            'SELECT COUNT(*) as count FROM shows WHERE movie_id = ?',
            [movieId]
        );

        const showCount = showCountRows[0].count;
        if (showCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete movie with existing shows. Delete all shows first.'
            });
        }

        const [result] = await pool.query('DELETE FROM movies WHERE movie_id = ?', [movieId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Movie deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting movie:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while deleting movie',
            error: err.message
        });
    }
};

// Add a new show for a movie
const addShow = async (req, res) => {
    try {
        const { movie_id, show_date, show_time, ticket_price, total_seats } = req.body;

        // Validate required fields
        if (movie_id === undefined || !show_date || !show_time || ticket_price === undefined || total_seats === undefined) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: movie_id, show_date, show_time, ticket_price, total_seats'
            });
        }

        const movieId = parseInt(movie_id, 10);
        const price = parseFloat(ticket_price);
        const seats = parseInt(total_seats, 10);

        if (isNaN(movieId) || movieId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid movie_id' });
        }
        if (isNaN(price) || price < 0) {
            return res.status(400).json({ success: false, message: 'Invalid ticket_price' });
        }
        if (isNaN(seats) || seats <= 0) {
            return res.status(400).json({ success: false, message: 'total_seats must be a positive integer' });
        }

        // Verify movie exists
        const [movieRows] = await pool.query('SELECT movie_id FROM movies WHERE movie_id = ?', [movieId]);
        if (!movieRows || movieRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        // Insert new show with available_seats initialized to total_seats
        const [result] = await pool.query(
            `INSERT INTO shows (movie_id, show_date, show_time, ticket_price, total_seats, available_seats)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [movieId, show_date, show_time, price, seats, seats]
        );

        return res.status(201).json({
            success: true,
            message: 'Show added successfully',
            data: { show_id: result.insertId }
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

// Retrieve all customer bookings across all movies and shows
const getAllBookings = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT b.booking_id, c.customer_name, c.email, m.title AS movie_title,
                    s.show_date, s.show_time, b.number_of_tickets,
                    b.total_amount, b.booking_status, b.booking_date
             FROM bookings b
             INNER JOIN customers c ON b.customer_id = c.customer_id
             INNER JOIN shows s ON b.show_id = s.show_id
             INNER JOIN movies m ON s.movie_id = m.movie_id
             ORDER BY b.booking_date DESC`
        );

        return res.status(200).json({
            success: true,
            data: rows
        });
    } catch (err) {
        console.error('Error fetching all bookings:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching all bookings',
            error: err.message
        });
    }
};

// Get admin dashboard statistics
const getAdminStats = async (req, res) => {
    try {
        const [movieCountRows] = await pool.query('SELECT COUNT(*) AS total_movies FROM movies');
        const [bookingCountRows] = await pool.query('SELECT COUNT(*) AS total_bookings FROM bookings');
        const [confirmedStatsRows] = await pool.query(
            `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue,
                    COALESCE(SUM(number_of_tickets), 0) AS total_tickets_sold
             FROM bookings
             WHERE booking_status = 'CONFIRMED'`
        );

        const totalMovies = Number(movieCountRows[0].total_movies) || 0;
        const totalBookings = Number(bookingCountRows[0].total_bookings) || 0;
        const totalRevenue = Number(parseFloat(confirmedStatsRows[0].total_revenue).toFixed(2)) || 0;
        const totalTicketsSold = Number(confirmedStatsRows[0].total_tickets_sold) || 0;

        return res.status(200).json({
            success: true,
            data: {
                totalMovies,
                totalBookings,
                totalRevenue,
                totalTicketsSold
            }
        });
    } catch (err) {
        console.error('Error fetching admin stats:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching statistics',
            error: err.message
        });
    }
};

module.exports = {
    activeTokens,
    adminLogin,
    adminLogout,
    verifyAdmin,
    addMovie,
    updateMovie,
    deleteMovie,
    addShow,
    getAllBookings,
    getAdminStats
};
