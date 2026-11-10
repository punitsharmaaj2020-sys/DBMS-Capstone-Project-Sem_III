const pool = require('../config/db');

// Get active/upcoming shows for a specific movie
const getShowsByMovie = async (req, res) => {
    try {
        const movieId = parseInt(req.params.movieId, 10);
        if (isNaN(movieId) || movieId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid movie ID. ID must be a positive number.'
            });
        }

        const [rows] = await pool.query(
            'SELECT * FROM shows WHERE movie_id = ? AND show_date >= CURDATE() ORDER BY show_date ASC, show_time ASC',
            [movieId]
        );

        return res.status(200).json({
            success: true,
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

module.exports = {
    getShowsByMovie
};
