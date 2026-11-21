const pool = require('../config/db');

/**
 * Fetch movies from MySQL with full discovery capabilities:
 * - Text search (title, description, genre)
 * - Filtering (genre, language, release_status)
 * - Sorting (rating, popularity, title, release_date)
 */
const getAllMovies = async (req, res) => {
    try {
        const { search, genre, language, status, sort } = req.query;

        let query = 'SELECT * FROM movies WHERE 1=1';
        const params = [];

        // Search by keyword
        if (search && search.trim()) {
            query += ' AND (title LIKE ? OR description LIKE ? OR genre LIKE ?)';
            const term = `%${search.trim()}%`;
            params.push(term, term, term);
        }

        // Filter by genre
        if (genre && genre !== 'all' && genre.trim()) {
            query += ' AND genre LIKE ?';
            params.push(`%${genre.trim()}%`);
        }

        // Filter by language
        if (language && language !== 'all' && language.trim()) {
            query += ' AND language = ?';
            params.push(language.trim());
        }

        // Filter by release status (NOW_SHOWING vs COMING_SOON)
        if (status && status !== 'all' && status.trim()) {
            query += ' AND release_status = ?';
            params.push(status.trim().toUpperCase());
        }

        // Sorting
        switch (sort) {
            case 'rating':
                query += ' ORDER BY rating DESC, votes_count DESC';
                break;
            case 'popularity':
                query += ' ORDER BY votes_count DESC, rating DESC';
                break;
            case 'latest':
                query += ' ORDER BY release_date DESC';
                break;
            case 'title_asc':
                query += ' ORDER BY title ASC';
                break;
            default:
                query += ' ORDER BY release_status ASC, rating DESC, title ASC';
                break;
        }

        const [rows] = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            count: rows.length,
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

/**
 * Fetch detailed movie information including reviews & show count
 */
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

        const movie = rows[0];

        // Fetch show counts and reviews for this movie
        const [shows] = await pool.query(
            `SELECT COUNT(*) AS total_shows FROM shows WHERE movie_id = ? AND show_date >= CURDATE()`,
            [movieId]
        );
        const [reviews] = await pool.query(
            `SELECT r.review_id, r.rating, r.review_text, r.created_at, u.name AS user_name
             FROM reviews r
             JOIN users u ON r.user_id = u.user_id
             WHERE r.movie_id = ?
             ORDER BY r.created_at DESC LIMIT 10`,
            [movieId]
        );

        movie.upcoming_shows_count = shows[0].total_shows;
        movie.reviews = reviews;

        return res.status(200).json({
            success: true,
            data: movie
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

/**
 * Add a new movie
 */
const addMovie = async (req, res) => {
    try {
        const {
            title,
            genre,
            duration_minutes,
            language,
            description,
            poster_url,
            banner_url,
            rating,
            votes_count,
            cast_crew,
            release_status,
            trailer_url,
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
            `INSERT INTO movies 
             (title, genre, duration_minutes, language, description, poster_url, banner_url, rating, votes_count, cast_crew, release_status, trailer_url, release_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                genre.trim(),
                duration,
                language.trim(),
                description ? description.trim() : null,
                poster_url ? poster_url.trim() : null,
                banner_url ? banner_url.trim() : null,
                rating ? parseFloat(rating) : 4.5,
                votes_count ? parseInt(votes_count, 10) : 100,
                cast_crew ? cast_crew.trim() : null,
                release_status || 'NOW_SHOWING',
                trailer_url ? trailer_url.trim() : null,
                release_date || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Movie added successfully',
            data: {
                movie_id: result.insertId,
                title: title.trim(),
                genre: genre.trim()
            }
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

/**
 * Update an existing movie
 */
const updateMovie = async (req, res) => {
    try {
        const movieId = parseInt(req.params.id, 10);
        if (isNaN(movieId) || movieId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid movie ID' });
        }

        const [existing] = await pool.query('SELECT * FROM movies WHERE movie_id = ?', [movieId]);
        if (!existing || existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }

        const cur = existing[0];
        const {
            title = cur.title,
            genre = cur.genre,
            duration_minutes = cur.duration_minutes,
            language = cur.language,
            description = cur.description,
            poster_url = cur.poster_url,
            banner_url = cur.banner_url,
            rating = cur.rating,
            votes_count = cur.votes_count,
            cast_crew = cur.cast_crew,
            release_status = cur.release_status,
            trailer_url = cur.trailer_url,
            release_date = cur.release_date
        } = req.body;

        await pool.query(
            `UPDATE movies SET 
             title = ?, genre = ?, duration_minutes = ?, language = ?, description = ?,
             poster_url = ?, banner_url = ?, rating = ?, votes_count = ?, cast_crew = ?,
             release_status = ?, trailer_url = ?, release_date = ?
             WHERE movie_id = ?`,
            [
                title, genre, duration_minutes, language, description,
                poster_url, banner_url, rating, votes_count, cast_crew,
                release_status, trailer_url, release_date,
                movieId
            ]
        );

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

/**
 * Delete a movie when safe
 */
const deleteMovie = async (req, res) => {
    try {
        const movieId = parseInt(req.params.id, 10);
        if (isNaN(movieId) || movieId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid movie ID' });
        }

        // Check dependent shows
        const [shows] = await pool.query('SELECT COUNT(*) AS count FROM shows WHERE movie_id = ?', [movieId]);
        if (shows[0].count > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete movie: It has ${shows[0].count} scheduled show(s). Please delete or reassign scheduled shows first.`
            });
        }

        const [result] = await pool.query('DELETE FROM movies WHERE movie_id = ?', [movieId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
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

module.exports = {
    getAllMovies,
    getMovieById,
    addMovie,
    updateMovie,
    deleteMovie
};
