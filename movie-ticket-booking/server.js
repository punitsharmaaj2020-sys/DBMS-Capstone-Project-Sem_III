const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize MySQL pool and perform connection check
require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// REST API Routes
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const theatreRoutes = require('./routes/theatreRoutes');
const showRoutes = require('./routes/showRoutes');
const seatRoutes = require('./routes/seatRoutes');
const couponRoutes = require('./routes/couponRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/admin', adminRoutes);

// Serve Frontend Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/movie', (req, res) => res.sendFile(path.join(__dirname, 'public', 'movie.html')));
app.get('/bookings', (req, res) => res.sendFile(path.join(__dirname, 'public', 'bookings.html')));
app.get('/ticket', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ticket.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

app.listen(PORT, () => {
    console.log(`🎬 CinePass Premium Server running at http://localhost:${PORT}`);
});
