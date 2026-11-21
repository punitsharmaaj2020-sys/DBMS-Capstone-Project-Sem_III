const express = require('express');
const router = express.Router();
const watchlistController = require('../controllers/watchlistController');
const { userAuth } = require('../middleware/authMiddleware');

router.get('/', userAuth, watchlistController.getWatchlist);
router.post('/', userAuth, watchlistController.addToWatchlist);
router.delete('/:movieId', userAuth, watchlistController.removeFromWatchlist);

module.exports = router;
