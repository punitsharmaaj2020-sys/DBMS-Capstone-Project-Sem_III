const express = require('express');
const router = express.Router();
const { getShowsByMovie } = require('../controllers/showController');

router.get('/movie/:movieId', getShowsByMovie);

module.exports = router;
