const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/authMiddleware');
const {
    adminLogin,
    adminLogout,
    verifyAdmin,
    getAllMovies,
    addMovie,
    updateMovie,
    deleteMovie,
    addShow,
    getAllBookings,
    getAdminStats,
    getPopularMovies
} = require('../controllers/adminController');

// Public admin login
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
router.get('/popular-movies', adminAuth, getPopularMovies);

module.exports = router;
