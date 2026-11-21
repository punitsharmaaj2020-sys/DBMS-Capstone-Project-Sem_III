const express = require('express');
const router = express.Router();
const showController = require('../controllers/showController');
const { adminAuth } = require('../middleware/authMiddleware');

router.get('/', showController.getAllShows);
router.get('/movie/:movieId', showController.getShowsByMovie);
router.get('/:id', showController.getShowById);
router.post('/', adminAuth, showController.addShow);
router.delete('/:id', adminAuth, showController.deleteShow);

module.exports = router;
