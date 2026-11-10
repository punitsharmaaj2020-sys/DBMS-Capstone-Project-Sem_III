const pool = require('../config/db');

// Get all movies ordered by title
const getAllMovies = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM movies ORDER BY title ASC');
        return res.status(200).json({
            success: true,
            data: rows
        });
    } catch (err) {
        console.error('Error fetching movies:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching movies',
            error: err.message
        });
    }
};

// Get single movie by ID
const getMovieById = async (req, res) => {
    try {
        const movieId = parseInt(req.params.id, 10);
        if (isNaN(movieId) || movieId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid movie ID. ID must be a positive number.'
            });
        }

        const [rows] = await pool.query('SELECT * FROM movies WHERE movie_id = ?', [movieId]);

        if (!rows || rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (err) {
        console.error('Error fetching movie details:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching movie details',
            error: err.message
        });
    }
};

module.exports = {
    getAllMovies,
    getMovieById
};
