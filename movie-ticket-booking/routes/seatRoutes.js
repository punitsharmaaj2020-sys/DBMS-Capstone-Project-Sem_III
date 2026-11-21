const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');

router.get('/show/:showId', seatController.getSeatsForShow);

module.exports = router;
