const express = require('express');
const router = express.Router();
const theatreController = require('../controllers/theatreController');
const { adminAuth } = require('../middleware/authMiddleware');

router.get('/', theatreController.getAllTheatres);
router.get('/cities', theatreController.getCities);
router.get('/:id', theatreController.getTheatreById);

router.post('/', adminAuth, theatreController.addTheatre);
router.put('/:id', adminAuth, theatreController.updateTheatre);
router.delete('/:id', adminAuth, theatreController.deleteTheatre);

module.exports = router;
