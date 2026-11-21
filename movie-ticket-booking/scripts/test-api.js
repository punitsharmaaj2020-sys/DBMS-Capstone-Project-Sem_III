/**
 * End-to-End API Test Suite - CinePass Premium Movie Ticket Booking Platform
 * Tests all modules: Auth, Catalog, Theatres, Shows, Interactive Seats,
 * Coupons, Payments, ACID Transactions, Cancellations, Reviews, Watchlist, Admin
 */

const http = require('http');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const reqHeaders = {
            'Content-Type': 'application/json',
            ...headers
        };

        const req = http.request(url, { method, headers: reqHeaders }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('=======================================================');
    console.log('🚀 CinePass Platform - Comprehensive API & DBMS Verification');
    console.log('=======================================================\n');
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${message}`);
            failed++;
        }
    }

    try {
        // ----------------------------------------------------
        // 1. Movie Catalog Endpoints
        // ----------------------------------------------------
        console.log('1. Testing Public Movie Catalog Endpoints:');
        const moviesRes = await request('GET', '/api/movies');
        assert(moviesRes.status === 200, 'GET /api/movies returns HTTP 200');
        assert(moviesRes.body.success === true, 'Response contains success: true');
        assert(Array.isArray(moviesRes.body.data) && moviesRes.body.data.length >= 6, `Catalog contains ${moviesRes.body.data ? moviesRes.body.data.length : 0} movies`);

        const singleMovieRes = await request('GET', '/api/movies/1');
        assert(singleMovieRes.status === 200, 'GET /api/movies/1 returns HTTP 200');
        assert(singleMovieRes.body.data && singleMovieRes.body.data.title === 'The Dark Knight', 'First movie title is "The Dark Knight"');
        console.log('');

        // ----------------------------------------------------
        // 2. Theatres & Cities Endpoints
        // ----------------------------------------------------
        console.log('2. Testing Theatres & Location Discovery:');
        const citiesRes = await request('GET', '/api/theatres/cities');
        assert(citiesRes.status === 200, 'GET /api/theatres/cities returns HTTP 200');
        assert(Array.isArray(citiesRes.body.data) && citiesRes.body.data.includes('Mumbai'), 'Cities list contains "Mumbai"');

        const theatresRes = await request('GET', '/api/theatres?city=Mumbai');
        assert(theatresRes.status === 200, 'GET /api/theatres?city=Mumbai returns HTTP 200');
        assert(theatresRes.body.data.length >= 2, `Found ${theatresRes.body.data.length} theatres in Mumbai`);
        console.log('');

        // ----------------------------------------------------
        // 3. Showtimes & Interactive Seat Layout
        // ----------------------------------------------------
        console.log('3. Testing Showtimes & Interactive Seat Inventory:');
        const showsRes = await request('GET', '/api/shows');
        assert(showsRes.status === 200, 'GET /api/shows returns HTTP 200');
        assert(showsRes.body.data.length >= 10, `All scheduled shows returned: ${showsRes.body.data.length}`);

        const seatsRes = await request('GET', '/api/seats/show/1');
        assert(seatsRes.status === 200, 'GET /api/seats/show/1 returns HTTP 200');
        assert(seatsRes.body.seats && seatsRes.body.seats.length === 64, `Interactive layout has ${seatsRes.body.seats.length} individual seats`);
        assert(seatsRes.body.seats.some(s => s.is_occupied === true), 'Live seat map reflects occupied seats from booking_seats');
        console.log('');

        // ----------------------------------------------------
        // 4. Coupons & Discount Engine
        // ----------------------------------------------------
        console.log('4. Testing Coupon Validation & Offers:');
        const couponRes = await request('POST', '/api/coupons/apply', { code: 'WELCOME50', amount: 500 });
        assert(couponRes.status === 200, 'POST /api/coupons/apply returns HTTP 200');
        assert(couponRes.body.coupon.discount_amount === 150, 'WELCOME50 applied maximum discount cap of ₹150');
        console.log('');

        // ----------------------------------------------------
        // 5. User Authentication & Profile
        // ----------------------------------------------------
        console.log('5. Testing User Security & Authentication:');
        const testEmail = `tester_${Date.now()}@example.com`;
        const registerRes = await request('POST', '/api/auth/register', {
            name: 'Test Candidate',
            email: testEmail,
            password: 'password123',
            phone: '+91 9988776655'
        });
        assert(registerRes.status === 201, 'POST /api/auth/register returns HTTP 201 Created');
        const userToken = registerRes.body.token;
        assert(typeof userToken === 'string', 'Received JWT bearer token');

        const loginRes = await request('POST', '/api/auth/login', {
            email: testEmail,
            password: 'password123'
        });
        assert(loginRes.status === 200, 'POST /api/auth/login returns HTTP 200');

        const meRes = await request('GET', '/api/auth/me', null, { Authorization: `Bearer ${userToken}` });
        assert(meRes.status === 200 && meRes.body.user.email === testEmail, 'GET /api/auth/me validates user profile');
        console.log('');

        // ----------------------------------------------------
        // 6. Payment Gateway Order Creation & Verification
        // ----------------------------------------------------
        console.log('6. Testing Payment Gateway (Test Mode / Simulator):');
        const orderRes = await request('POST', '/api/payments/create-order', { amount: 650.00 });
        assert(orderRes.status === 200, 'POST /api/payments/create-order returns HTTP 200');
        assert(orderRes.body.order && orderRes.body.order.amount === 65000, 'Order created in paise (₹650 = 65000 paise)');

        const verifyPayRes = await request('POST', '/api/payments/verify', {
            razorpay_order_id: orderRes.body.order.id,
            razorpay_payment_id: 'pay_test_' + Date.now(),
            is_simulator: true
        });
        assert(verifyPayRes.status === 200, 'POST /api/payments/verify confirms payment');
        console.log('');

        // ----------------------------------------------------
        // 7. ACID Booking Transaction Engine
        // ----------------------------------------------------
        console.log('7. Testing ACID Booking Transaction Engine:');
        const bookingPayload = {
            customer_name: 'Test Candidate',
            email: testEmail,
            show_id: 1,
            seat_ids: [15, 16], // Seats B7, B8
            coupon_code: 'WELCOME50'
        };

        const createBookingRes = await request('POST', '/api/bookings', bookingPayload, { Authorization: `Bearer ${userToken}` });
        assert(createBookingRes.status === 201, 'POST /api/bookings returns HTTP 201 Created');
        assert(createBookingRes.body.data && createBookingRes.body.data.booking_id, 'Booking ID and reference generated');
        const createdBookingRef = createBookingRes.body.data.booking_reference;
        const createdBookingId = createBookingRes.body.data.booking_id;

        // Test Double-Booking Prevention (Immediate collision test)
        const collisionRes = await request('POST', '/api/bookings', bookingPayload);
        assert(collisionRes.status === 409, 'Double-booking the exact same seats is rejected with HTTP 409 Conflict');
        console.log('');

        // ----------------------------------------------------
        // 8. Digital Ticket Generation & Self-Service
        // ----------------------------------------------------
        console.log('8. Testing Digital Ticket & Cancellation:');
        const ticketRes = await request('GET', `/api/bookings/ticket/${createdBookingRef}`);
        assert(ticketRes.status === 200, `GET /api/bookings/ticket/${createdBookingRef} returns HTTP 200`);
        assert(ticketRes.body.ticket && ticketRes.body.ticket.seat_numbers, 'Digital ticket contains seat details');

        const cancelRes = await request('PUT', `/api/bookings/${createdBookingId}/cancel`);
        assert(cancelRes.status === 200, 'PUT /api/bookings/:id/cancel returns HTTP 200');
        assert(cancelRes.body.data.booking_status === 'CANCELLED', 'Booking status transitioned to CANCELLED');

        const doubleCancelRes = await request('PUT', `/api/bookings/${createdBookingId}/cancel`);
        assert(doubleCancelRes.status === 400, 'Double cancellation safely rejected with HTTP 400');
        console.log('');

        // ----------------------------------------------------
        // 9. Watchlist & Movie Reviews
        // ----------------------------------------------------
        console.log('9. Testing Watchlist & Movie Reviews:');
        const addWlRes = await request('POST', '/api/watchlist', { movie_id: 2 }, { Authorization: `Bearer ${userToken}` });
        assert(addWlRes.status === 201, 'POST /api/watchlist adds movie to watchlist');

        const getWlRes = await request('GET', '/api/watchlist', null, { Authorization: `Bearer ${userToken}` });
        assert(getWlRes.status === 200 && getWlRes.body.data.some(m => m.movie_id === 2), 'Watchlist contains Inception');

        const reviewRes = await request('POST', '/api/reviews', { movie_id: 1, rating: 5, review_text: 'Astounding direction and sound design!' }, { Authorization: `Bearer ${userToken}` });
        assert(reviewRes.status === 201, 'POST /api/reviews records user review & rating in MySQL');
        console.log('');

        // ----------------------------------------------------
        // 10. Admin Security & Dashboard Analytics
        // ----------------------------------------------------
        console.log('10. Testing Admin Portal Security & Analytics:');
        const loginAdmin = await request('POST', '/api/admin/login', { username: 'admin', password: 'admin123' });
        assert(loginAdmin.status === 200, 'POST /api/admin/login returns HTTP 200 with valid credentials');
        const adminToken = loginAdmin.body.token;

        const verifyRes = await request('GET', '/api/admin/verify', null, { Authorization: `Bearer ${adminToken}` });
        assert(verifyRes.status === 200, 'GET /api/admin/verify validates admin session');

        const statsRes = await request('GET', '/api/admin/stats', null, { Authorization: `Bearer ${adminToken}` });
        assert(statsRes.status === 200, 'GET /api/admin/stats returns HTTP 200');
        assert(statsRes.body.data.totalMovies >= 6, `Stats show ${statsRes.body.data.totalMovies} total movies`);
        assert(statsRes.body.data.totalTheatres >= 4, `Stats show ${statsRes.body.data.totalTheatres} theatres`);
        assert(Array.isArray(statsRes.body.data.popularMovies), 'Stats contain popular movies leaderboard');
        console.log('');

        // ----------------------------------------------------
        // Summary
        // ----------------------------------------------------
        console.log('=======================================================');
        console.log(`🏁 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
        console.log('=======================================================');

        if (failed === 0) {
            console.log('🎉 ALL SYSTEM MODULES ARE 100% OPERATIONAL!\n');
            process.exit(0);
        } else {
            console.error('❌ SOME TESTS FAILED!\n');
            process.exit(1);
        }

    } catch (err) {
        console.error('Fatal test error:', err.message);
        process.exit(1);
    }
}

runTests();
