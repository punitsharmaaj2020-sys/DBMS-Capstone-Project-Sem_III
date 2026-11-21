const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const {
    getAllMovies,
    addMovie,
    updateMovie,
    deleteMovie
} = require('./movieController');
const { addShow } = require('./showController');
const { activeAdminTokens } = require('../middleware/authMiddleware');

// In-memory token store for legacy admin authentication
const activeTokens = new Map();

/**
 * Admin login authentication
 */
const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username (email) and password are required'
            });
        }
        // Normalize email
        const normalizedEmail = username.trim().toLowerCase();
        // Look up admin user in DB (role = 'ADMIN')
        const [rows] = await pool.query(
            'SELECT user_id, password_hash FROM users WHERE email = ? AND role = ?',
            [normalizedEmail, 'ADMIN']
        );
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }
        const adminUser = rows[0];
        const isMatch = await bcrypt.compare(password, adminUser.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }
        // Generate token and store in memory
        const token = crypto.randomBytes(32).toString('hex');
        activeTokens.set(token, { username: normalizedEmail, loginTime: new Date() });
        activeAdminTokens.add(token);
        return res.status(200).json({
            success: true,
            message: 'Admin login successful',
            token,
            user: { name: 'CinePass Administrator', role: 'ADMIN' }
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

/**
 * Admin logout
 */
const adminLogout = (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token) {
                activeTokens.delete(token);
                activeAdminTokens.delete(token);
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

/**
 * Verify admin token session
 */
const verifyAdmin = (req, res) => {
    if (req.isAdmin) {
        return res.status(200).json({
            success: true,
            message: 'Authenticated as Administrator',
            user: { role: 'ADMIN', name: 'Administrator' }
        });
    }
    return res.status(401).json({
        success: false,
        message: 'Unauthorized: Admin privileges required'
    });
};

/**
 * Retrieve all customer bookings with search and filter
 */
const getAllBookings = async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = `
            SELECT b.booking_id,
                   COALESCE(b.booking_reference, CONCAT('BK-', LPAD(b.booking_id, 6, '0'))) AS booking_reference,
                   COALESCE(u.name, c.customer_name) AS customer_name,
                   COALESCE(u.email, c.email) AS email,
                   m.title AS movie_title,
                   m.poster_url,
                   COALESCE(t.name, 'CinePass Grand Multiplex') AS theatre_name,
                   COALESCE(sc.screen_name, 'Audi 1') AS screen_name,
                   s.show_date,
                   s.show_time,
                   b.number_of_tickets,
                   b.seat_numbers,
                   b.total_amount,
                   b.convenience_fee,
                   b.discount_amount,
                   b.coupon_code,
                   b.booking_status,
                   b.payment_status,
                   b.booking_date,
                   p.transaction_id
            FROM bookings b
            LEFT JOIN customers c ON b.customer_id = c.customer_id
            LEFT JOIN users u ON b.user_id = u.user_id
            INNER JOIN shows s ON b.show_id = s.show_id
            INNER JOIN movies m ON s.movie_id = m.movie_id
            LEFT JOIN screens sc ON s.screen_id = sc.screen_id
            LEFT JOIN theatres t ON (sc.theatre_id = t.theatre_id OR s.theatre_id = t.theatre_id)
            LEFT JOIN payments p ON b.booking_id = p.booking_id
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'all') {
            query += ' AND b.booking_status = ?';
            params.push(status.trim().toUpperCase());
        }

        if (search && search.trim()) {
            query += ' AND (b.booking_reference LIKE ? OR c.customer_name LIKE ? OR c.email LIKE ? OR m.title LIKE ?)';
            const term = `%${search.trim()}%`;
            params.push(term, term, term, term);
        }

        query += ' ORDER BY b.booking_date DESC';

        const [rows] = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            count: rows.length,
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

/**
 * Retrieve most popular movies ranked by tickets sold and gross revenue
 */
const getPopularMovies = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                m.movie_id,
                m.title AS movie_title,
                m.genre,
                m.rating,
                COUNT(DISTINCT s.show_id) AS total_scheduled_shows,
                COALESCE(SUM(CASE WHEN b.booking_status = 'CONFIRMED' THEN b.number_of_tickets ELSE 0 END), 0) AS tickets_sold,
                COALESCE(SUM(CASE WHEN b.booking_status = 'CONFIRMED' THEN b.total_amount ELSE 0.00 END), 0.00) AS total_revenue
             FROM movies m
             LEFT JOIN shows s ON m.movie_id = s.movie_id
             LEFT JOIN bookings b ON s.show_id = b.show_id
             GROUP BY m.movie_id, m.title, m.genre, m.rating
             ORDER BY tickets_sold DESC, total_revenue DESC
             LIMIT 10`
        );

        return res.status(200).json({
            success: true,
            data: rows
        });
    } catch (err) {
        console.error('Error fetching popular movies:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching popular movies',
            error: err.message
        });
    }
};

/**
 * Get comprehensive admin statistics
 */
const getAdminStats = async (req, res) => {
    try {
        const [movieCountRows] = await pool.query('SELECT COUNT(*) AS total_movies FROM movies');
        const [theatreCountRows] = await pool.query('SELECT COUNT(*) AS total_theatres FROM theatres');
        const [showCountRows] = await pool.query('SELECT COUNT(*) AS total_shows FROM shows');
        const [bookingCountRows] = await pool.query('SELECT COUNT(*) AS total_bookings FROM bookings');
        const [userCountRows] = await pool.query('SELECT COUNT(*) AS total_users FROM users WHERE role = "CUSTOMER"');
        const [couponCountRows] = await pool.query('SELECT COUNT(*) AS total_coupons FROM coupons WHERE is_active = TRUE');

        const [confirmedStatsRows] = await pool.query(
            `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue,
                    COALESCE(SUM(number_of_tickets), 0) AS total_tickets_sold
             FROM bookings
             WHERE booking_status = 'CONFIRMED'`
        );

        // Popular movies
        const [popularMovies] = await pool.query(
            `SELECT 
                m.movie_id,
                m.title AS movie_title,
                m.genre,
                m.rating,
                COUNT(DISTINCT s.show_id) AS total_scheduled_shows,
                COALESCE(SUM(CASE WHEN b.booking_status = 'CONFIRMED' THEN b.number_of_tickets ELSE 0 END), 0) AS tickets_sold,
                COALESCE(SUM(CASE WHEN b.booking_status = 'CONFIRMED' THEN b.total_amount ELSE 0.00 END), 0.00) AS total_revenue
             FROM movies m
             LEFT JOIN shows s ON m.movie_id = s.movie_id
             LEFT JOIN bookings b ON s.show_id = b.show_id
             GROUP BY m.movie_id, m.title, m.genre, m.rating
             ORDER BY tickets_sold DESC, total_revenue DESC
             LIMIT 6`
        );

        // Top Theatres
        const [topTheatres] = await pool.query(
            `SELECT 
                t.theatre_id,
                t.name AS theatre_name,
                t.city,
                COUNT(b.booking_id) AS total_bookings,
                COALESCE(SUM(CASE WHEN b.booking_status = 'CONFIRMED' THEN b.total_amount ELSE 0.00 END), 0.00) AS total_revenue
             FROM theatres t
             LEFT JOIN shows s ON t.theatre_id = s.theatre_id
             LEFT JOIN bookings b ON s.show_id = b.show_id
             GROUP BY t.theatre_id, t.name, t.city
             ORDER BY total_revenue DESC, total_bookings DESC
             LIMIT 5`
        );

        // Daily booking counts for recent days
        const [dailyStats] = await pool.query(
            `SELECT DATE(booking_date) AS booking_day,
                    COUNT(booking_id) AS bookings_count,
                    COALESCE(SUM(total_amount), 0.00) AS revenue
             FROM bookings
             WHERE booking_status = 'CONFIRMED'
             GROUP BY DATE(booking_date)
             ORDER BY booking_day DESC
             LIMIT 7`
        );

        const totalMovies = Number(movieCountRows[0].total_movies) || 0;
        const totalTheatres = Number(theatreCountRows[0].total_theatres) || 0;
        const totalShows = Number(showCountRows[0].total_shows) || 0;
        const totalBookings = Number(bookingCountRows[0].total_bookings) || 0;
        const totalUsers = Number(userCountRows[0].total_users) || 0;
        const totalCoupons = Number(couponCountRows[0].total_coupons) || 0;
        const totalRevenue = Number(parseFloat(confirmedStatsRows[0].total_revenue).toFixed(2)) || 0;
        const totalTicketsSold = Number(confirmedStatsRows[0].total_tickets_sold) || 0;

        return res.status(200).json({
            success: true,
            data: {
                totalMovies,
                totalTheatres,
                totalShows,
                totalBookings,
                totalUsers,
                totalCoupons,
                totalRevenue,
                totalTicketsSold,
                popularMovies,
                topTheatres,
                dailyStats
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
    getAllMovies,
    addMovie,
    updateMovie,
    deleteMovie,
    addShow,
    getAllBookings,
    getAdminStats,
    getPopularMovies
};
