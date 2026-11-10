/**
 * End-to-End API Test Suite
 * Tests all public and admin endpoints
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
    console.log('🚀 Starting API Verification Tests...\n');
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
        // 1. GET /api/movies
        console.log('1. Testing Public Movie Catalog Endpoints:');
        const moviesRes = await request('GET', '/api/movies');
        assert(moviesRes.status === 200, 'GET /api/movies returns HTTP 200');
        assert(moviesRes.body.success === true, 'Response contains success: true');
        assert(Array.isArray(moviesRes.body.data) && moviesRes.body.data.length >= 6, `Catalog contains ${moviesRes.body.data?.length} movies`);

        // 2. GET /api/movies/1
        const movieDetailRes = await request('GET', '/api/movies/1');
        assert(movieDetailRes.status === 200, 'GET /api/movies/1 returns HTTP 200');
        assert(movieDetailRes.body.data?.title === 'The Dark Knight', 'First movie title is "The Dark Knight"');

        // 3. GET /api/shows/movie/1
        console.log('\n2. Testing Showtimes Endpoints:');
        const showsRes = await request('GET', '/api/shows/movie/1');
        assert(showsRes.status === 200, 'GET /api/shows/movie/1 returns HTTP 200');
        assert(Array.isArray(showsRes.body.data) && showsRes.body.data.length > 0, `Movie 1 has ${showsRes.body.data?.length} scheduled shows`);

        // 4. POST /api/bookings (Create booking)
        console.log('\n3. Testing ACID Booking Transaction Engine:');
        const targetShowId = showsRes.body.data[0].show_id;
        const initialSeats = showsRes.body.data[0].available_seats;

        const bookingRes = await request('POST', '/api/bookings', {
            customer_name: 'Antigravity Tester',
            email: 'tester@cinema.com',
            show_id: targetShowId,
            number_of_tickets: 2
        });
        assert(bookingRes.status === 201, 'POST /api/bookings returns HTTP 201 (Created)');
        assert(bookingRes.body.success === true, 'Booking confirmation received');
        const newBookingId = bookingRes.body.data?.booking_id;
        assert(newBookingId > 0, `Booking ID generated: #${newBookingId}`);

        // Verify seat decrement
        const updatedShowsRes = await request('GET', '/api/shows/movie/1');
        const updatedShow = updatedShowsRes.body.data.find(s => s.show_id === targetShowId);
        assert(updatedShow.available_seats === initialSeats - 2, `Available seats decremented atomically from ${initialSeats} to ${updatedShow.available_seats}`);

        // 5. GET /api/bookings?email=tester@cinema.com
        console.log('\n4. Testing Booking Self-Service & Cancellation:');
        const historyRes = await request('GET', '/api/bookings?email=tester@cinema.com');
        assert(historyRes.status === 200, 'GET /api/bookings?email=... returns HTTP 200');
        assert(historyRes.body.data?.length >= 1, 'Found created booking in customer history');

        // 6. PUT /api/bookings/:id/cancel
        const cancelRes = await request('PUT', `/api/bookings/${newBookingId}/cancel`);
        assert(cancelRes.status === 200, 'PUT /api/bookings/:id/cancel returns HTTP 200');
        assert(cancelRes.body.success === true, 'Cancellation confirmed');

        // Verify seat restoration
        const restoredShowsRes = await request('GET', '/api/shows/movie/1');
        const restoredShow = restoredShowsRes.body.data.find(s => s.show_id === targetShowId);
        assert(restoredShow.available_seats === initialSeats, `Seats restored back to ${initialSeats}`);

        // 7. POST /api/admin/login
        console.log('\n5. Testing Admin Portal Security & Analytics:');
        const loginRes = await request('POST', '/api/admin/login', {
            username: 'admin',
            password: 'admin123'
        });
        assert(loginRes.status === 200, 'POST /api/admin/login returns HTTP 200 with valid credentials');
        const token = loginRes.body.token;
        assert(!!token, 'Received session bearer token');

        // 8. GET /api/admin/verify
        const verifyRes = await request('GET', '/api/admin/verify', null, {
            'Authorization': `Bearer ${token}`
        });
        assert(verifyRes.status === 200, 'GET /api/admin/verify validates token session');

        // 9. GET /api/admin/stats
        const statsRes = await request('GET', '/api/admin/stats', null, {
            'Authorization': `Bearer ${token}`
        });
        assert(statsRes.status === 200, 'GET /api/admin/stats returns HTTP 200');
        assert(statsRes.body.data?.totalMovies >= 6, `Stats show ${statsRes.body.data?.totalMovies} total movies`);
        assert(statsRes.body.data?.totalRevenue >= 0, `Stats show total revenue ₹${statsRes.body.data?.totalRevenue}`);

        console.log('\n=======================================================');
        console.log(`🏁 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
        console.log('=======================================================');

        if (failed === 0) {
            console.log('🎉 ALL SYSTEM MODULES ARE 100% OPERATIONAL!\n');
            process.exit(0);
        } else {
            process.exit(1);
        }

    } catch (err) {
        console.error('Fatal test error:', err);
        process.exit(1);
    }
}

runTests();
