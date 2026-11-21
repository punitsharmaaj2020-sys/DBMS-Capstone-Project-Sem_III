const pool = require('../config/db');

/**
 * Get user's watchlist
 */
exports.getWatchlist = async (req, res, next) => {
    try {
        const userId = req.user.user_id;

        const [movies] = await pool.query(
            `SELECT m.movie_id, m.title, m.genre, m.language, m.duration_minutes,
                    m.poster_url, m.rating, m.release_status, m.release_date,
                    w.watchlist_id, w.added_at
             FROM watchlist w
             JOIN movies m ON w.movie_id = m.movie_id
             WHERE w.user_id = ?
             ORDER BY w.added_at DESC`,
            [userId]
        );

        res.json({ success: true, count: movies.length, data: movies });
    } catch (err) {
        next(err);
    }
};

/**
 * Add movie to watchlist
 */
exports.addToWatchlist = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const { movie_id } = req.body;

        if (!movie_id) {
            return res.status(400).json({ success: false, message: 'movie_id is required' });
        }

        const movieId = parseInt(movie_id, 10);

        await pool.query(
            `INSERT IGNORE INTO watchlist (user_id, movie_id) VALUES (?, ?)`,
            [userId, movieId]
        );

        res.status(201).json({ success: true, message: 'Movie added to your watchlist' });
    } catch (err) {
        next(err);
    }
};

/**
 * Remove movie from watchlist
 */
exports.removeFromWatchlist = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const movieId = parseInt(req.params.movieId, 10);

        await pool.query(
            `DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?`,
            [userId, movieId]
        );

        res.json({ success: true, message: 'Movie removed from watchlist' });
    } catch (err) {
        next(err);
    }
};
