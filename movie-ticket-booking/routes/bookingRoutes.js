const express = require('express');
const router = express.Router();
const { createBooking, getBookingsByEmail, cancelBooking } = require('../controllers/bookingController');

router.post('/', createBooking);
router.get('/', getBookingsByEmail);
router.put('/:id/cancel', cancelBooking);

module.exports = router;
