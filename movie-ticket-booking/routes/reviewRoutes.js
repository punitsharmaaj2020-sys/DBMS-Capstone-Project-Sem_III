const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { userAuth, adminAuth } = require('../middleware/authMiddleware');

router.get('/movie/:movieId', reviewController.getReviewsByMovie);
router.post('/', userAuth, reviewController.addReview);
router.get('/all', adminAuth, reviewController.getAllReviews);
router.delete('/:id', adminAuth, reviewController.deleteReview);

module.exports = router;
