const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { userAuth } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', userAuth, authController.getMe);
router.put('/profile', userAuth, authController.updateProfile);

module.exports = router;
