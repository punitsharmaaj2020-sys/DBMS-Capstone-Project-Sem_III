const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.post('/', optionalAuth, bookingController.createBooking);
router.get('/', optionalAuth, bookingController.getBookingsByEmail);
router.get('/ticket/:reference', bookingController.getBookingTicket);
router.put('/:id/cancel', optionalAuth, bookingController.cancelBooking);

module.exports = router;
