const pool = require('../config/db');

/**
 * Get reviews for a movie
 */
exports.getReviewsByMovie = async (req, res, next) => {
    try {
        const movieId = parseInt(req.params.movieId, 10);
        const [reviews] = await pool.query(
            `SELECT r.review_id, r.movie_id, r.user_id, r.rating, r.review_text, r.created_at,
                    u.name AS user_name
             FROM reviews r
             JOIN users u ON r.user_id = u.user_id
             WHERE r.movie_id = ?
             ORDER BY r.created_at DESC`,
            [movieId]
        );

        const [avgStats] = await pool.query(
            `SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(review_id) AS total_reviews
             FROM reviews WHERE movie_id = ?`,
            [movieId]
        );

        res.json({
            success: true,
            avg_rating: avgStats[0].avg_rating || 0,
            total_reviews: avgStats[0].total_reviews || 0,
            data: reviews
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Add a review for a movie
 */
exports.addReview = async (req, res, next) => {
    try {
        const { movie_id, rating, review_text } = req.body;
        const userId = req.user.user_id;

        if (!movie_id || !rating) {
            return res.status(400).json({ success: false, message: 'movie_id and rating are required' });
        }

        const ratingNum = parseInt(rating, 10);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
        }

        const [result] = await pool.query(
            `INSERT INTO reviews (movie_id, user_id, rating, review_text)
             VALUES (?, ?, ?, ?)`,
            [parseInt(movie_id, 10), userId, ratingNum, review_text ? review_text.trim() : null]
        );

        // Update overall rating in movies table
        const [stats] = await pool.query(
            `SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(review_id) AS count
             FROM reviews WHERE movie_id = ?`,
            [parseInt(movie_id, 10)]
        );

        if (stats.length > 0 && stats[0].avg_rating) {
            await pool.query(
                `UPDATE movies SET rating = ?, votes_count = votes_count + 1 WHERE movie_id = ?`,
                [stats[0].avg_rating, parseInt(movie_id, 10)]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Thank you! Your review has been submitted.',
            review_id: result.insertId
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Admin: Get all reviews
 */
exports.getAllReviews = async (req, res, next) => {
    try {
        const [reviews] = await pool.query(
            `SELECT r.review_id, r.movie_id, r.user_id, r.rating, r.review_text, r.created_at,
                    m.title AS movie_title, u.name AS user_name, u.email
             FROM reviews r
             JOIN movies m ON r.movie_id = m.movie_id
             JOIN users u ON r.user_id = u.user_id
             ORDER BY r.created_at DESC`
        );
        res.json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
        next(err);
    }
};

/**
 * Admin: Delete / Moderate review
 */
exports.deleteReview = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        await pool.query('DELETE FROM reviews WHERE review_id = ?', [id]);
        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (err) {
        next(err);
    }
};
