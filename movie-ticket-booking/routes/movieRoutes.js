const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { adminAuth } = require('../middleware/authMiddleware');

router.get('/', movieController.getAllMovies);
router.get('/:id', movieController.getMovieById);
router.post('/', adminAuth, movieController.addMovie);
router.put('/:id', adminAuth, movieController.updateMovie);
router.delete('/:id', adminAuth, movieController.deleteMovie);

module.exports = router;
