const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/authMiddleware');
const {
    adminLogin,
    adminLogout,
    verifyAdmin,
    addMovie,
    updateMovie,
    deleteMovie,
    addShow,
    getAllBookings,
    getAdminStats
} = require('../controllers/adminController');
const { getAllMovies } = require('../controllers/movieController');

// Public admin routes
router.post('/login', adminLogin);

// Protected admin routes
router.post('/logout', adminAuth, adminLogout);
router.get('/verify', adminAuth, verifyAdmin);
router.get('/movies', adminAuth, getAllMovies);
router.post('/movies', adminAuth, addMovie);
router.put('/movies/:id', adminAuth, updateMovie);
router.delete('/movies/:id', adminAuth, deleteMovie);
router.post('/shows', adminAuth, addShow);
router.get('/bookings', adminAuth, getAllBookings);
router.get('/stats', adminAuth, getAdminStats);

module.exports = router;
