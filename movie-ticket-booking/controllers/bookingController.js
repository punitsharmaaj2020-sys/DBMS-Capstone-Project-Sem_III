const crypto = require('crypto');
const pool = require('../config/db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Create a new booking with ACID Transaction & Row Locking
 */
const createBooking = async (req, res) => {
    const {
        customer_name,
        email,
        show_id,
        number_of_tickets,
        seat_ids,
        coupon_code,
        payment_method = 'RAZORPAY_TEST',
        transaction_id
    } = req.body;

    // Validate presence of required fields
    if (!customer_name || !email || show_id === undefined) {
        return res.status(400).json({
            success: false,
            message: 'customer_name, email, and show_id are required'
        });
    }

    if (typeof customer_name !== 'string' || customer_name.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Valid customer name is required' });
    }

    const cleanEmail = email.toString().trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
        return res.status(400).json({ success: false, message: 'Invalid email address format' });
    }

    const showId = parseInt(show_id, 10);
    if (isNaN(showId) || showId <= 0) {
        return res.status(400).json({ success: false, message: 'Valid show ID is required' });
    }

    // Determine number of tickets
    let numTickets = number_of_tickets ? parseInt(number_of_tickets, 10) : 0;
    if (Array.isArray(seat_ids) && seat_ids.length > 0) {
        numTickets = seat_ids.length;
    }

    if (isNaN(numTickets) || numTickets < 1 || numTickets > 10) {
        return res.status(400).json({
            success: false,
            message: 'number_of_tickets must be an integer between 1 and 10'
        });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Lock show row using FOR UPDATE
        const [shows] = await connection.query(
            `SELECT s.show_id, s.movie_id, s.theatre_id, s.screen_id,
                    s.show_date, s.show_time, s.ticket_price, s.available_seats, s.total_seats,
                    m.title AS movie_title, m.poster_url, m.duration_minutes,
                    COALESCE(t.name, 'CinePass Grand Multiplex') AS theatre_name,
                    COALESCE(t.city, 'Mumbai') AS city,
                    COALESCE(sc.screen_name, 'Audi 1 - IMAX') AS screen_name
             FROM shows s
             INNER JOIN movies m ON s.movie_id = m.movie_id
             LEFT JOIN theatres t ON s.theatre_id = t.theatre_id
             LEFT JOIN screens sc ON s.screen_id = sc.screen_id
             WHERE s.show_id = ?
             FOR UPDATE`,
            [showId]
        );

        if (!shows || shows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Show not found' });
        }

        const show = shows[0];

        // 2. Check general seat availability
        if (show.available_seats < numTickets) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Not enough seats available. Requested: ${numTickets}, Available: ${show.available_seats}`
            });
        }

        // 3. Resolve seat objects to book
        let selectedSeats = [];
        const screenId = show.screen_id || 1;

        if (Array.isArray(seat_ids) && seat_ids.length > 0) {
            // Lock and fetch the requested seats
            const [seatRows] = await connection.query(
                `SELECT seat_id, seat_number, seat_row, seat_col, seat_tier, price_multiplier
                 FROM seats
                 WHERE seat_id IN (?)
                 FOR UPDATE`,
                [seat_ids]
            );

            if (seatRows.length !== seat_ids.length) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'One or more invalid seat IDs requested.' });
            }

            // Check collision in booking_seats for this show
            const [collisions] = await connection.query(
                `SELECT seat_id, seat_number
                 FROM booking_seats
                 WHERE show_id = ? AND seat_id IN (?) AND status = 'CONFIRMED'
                 FOR UPDATE`,
                [showId, seat_ids]
            );

            if (collisions.length > 0) {
                await connection.rollback();
                const occupiedNumbers = collisions.map(c => c.seat_number).join(', ');
                return res.status(409).json({
                    success: false,
                    message: `Seats [${occupiedNumbers}] have already been booked by another user. Please choose different seats.`
                });
            }

            selectedSeats = seatRows;
        } else {
            // Auto-select available seats for backward-compatibility with simpler tests
            const [availableScreenSeats] = await connection.query(
                `SELECT st.seat_id, st.seat_number, st.seat_row, st.seat_col, st.seat_tier, st.price_multiplier
                 FROM seats st
                 WHERE st.screen_id = ?
                   AND st.seat_id NOT IN (
                       SELECT seat_id FROM booking_seats WHERE show_id = ? AND status = 'CONFIRMED'
                   )
                 ORDER BY st.seat_row ASC, st.seat_col ASC
                 LIMIT ?
                 FOR UPDATE`,
                [screenId, showId, numTickets]
            );

            if (availableScreenSeats.length < numTickets) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Not enough individual seats available for this show.' });
            }
            selectedSeats = availableScreenSeats;
        }

        // 4. Calculate total amount accurately
        const basePrice = parseFloat(show.ticket_price);
        let seatsPriceSum = 0;
        const seatNumberList = [];

        selectedSeats.forEach(s => {
            const mult = parseFloat(s.price_multiplier) || 1.0;
            const singlePrice = Math.round(basePrice * mult);
            s.calculated_price = singlePrice;
            seatsPriceSum += singlePrice;
            seatNumberList.push(s.seat_number);
        });

        // Convenience fee (₹25 per ticket)
        const convenienceFee = numTickets * 25.00;
        let grossAmount = seatsPriceSum + convenienceFee;
        let discountAmount = 0.00;
        let appliedCoupon = null;

        // Apply coupon if provided
        if (coupon_code && coupon_code.trim()) {
            const cleanCode = coupon_code.trim().toUpperCase();
            const [coupons] = await connection.query(
                `SELECT coupon_id, code, discount_percent, max_discount, min_amount, expiry_date, is_active
                 FROM coupons WHERE code = ?`,
                [cleanCode]
            );

            if (coupons.length > 0) {
                const cp = coupons[0];
                if (cp.is_active && new Date(cp.expiry_date) >= new Date() && grossAmount >= parseFloat(cp.min_amount)) {
                    let disc = (grossAmount * parseFloat(cp.discount_percent)) / 100;
                    if (disc > parseFloat(cp.max_discount)) disc = parseFloat(cp.max_discount);
                    discountAmount = Math.round(disc * 100) / 100;
                    appliedCoupon = cp.code;
                }
            }
        }

        const netPayable = Math.max(0, Math.round((grossAmount - discountAmount) * 100) / 100);

        // 5. Customer / User linking
        let customerId;
        const [existingCustomers] = await connection.query(
            'SELECT customer_id FROM customers WHERE email = ?',
            [cleanEmail]
        );

        if (existingCustomers && existingCustomers.length > 0) {
            customerId = existingCustomers[0].customer_id;
        } else {
            const [custResult] = await connection.query(
                'INSERT INTO customers (customer_name, email) VALUES (?, ?)',
                [customer_name.trim(), cleanEmail]
            );
            customerId = custResult.insertId;
        }

        // Check if user is logged in or user exists
        let userId = req.user ? req.user.user_id : null;
        if (!userId) {
            const [userRows] = await connection.query('SELECT user_id FROM users WHERE email = ?', [cleanEmail]);
            if (userRows.length > 0) userId = userRows[0].user_id;
        }

        // 6. Generate unique booking reference and transaction reference
        const bookingRef = 'BK-' + crypto.randomBytes(3).toString('hex').toUpperCase();
        const txnId = transaction_id || ('TXN-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase());
        const seatNumbersStr = seatNumberList.join(', ');

        // 7. Insert into bookings table
        const [bookingResult] = await connection.query(
            `INSERT INTO bookings 
             (customer_id, user_id, show_id, booking_reference, number_of_tickets, seat_numbers, total_amount, convenience_fee, discount_amount, coupon_code, booking_status, payment_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 'PAID')`,
            [
                customerId,
                userId,
                showId,
                bookingRef,
                numTickets,
                seatNumbersStr,
                netPayable,
                convenienceFee,
                discountAmount,
                appliedCoupon
            ]
        );

        const bookingId = bookingResult.insertId;

        // 8. Atomically insert into booking_seats
        for (const s of selectedSeats) {
            await connection.query(
                `INSERT INTO booking_seats (booking_id, show_id, seat_id, seat_number, seat_tier, seat_price, status)
                 VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
                [bookingId, showId, s.seat_id, s.seat_number, s.seat_tier, s.calculated_price]
            );
        }

        // 9. Decrement available seats in shows
        const newAvailableSeats = show.available_seats - numTickets;
        await connection.query(
            'UPDATE shows SET available_seats = ? WHERE show_id = ?',
            [newAvailableSeats, showId]
        );

        // 10. Insert Payment Audit
        await connection.query(
            `INSERT INTO payments (booking_id, user_id, amount, payment_method, transaction_id, payment_status)
             VALUES (?, ?, ?, ?, ?, 'SUCCESS')`,
            [bookingId, userId, netPayable, payment_method, txnId]
        );

        // 11. Commit ACID Transaction
        await connection.commit();

        return res.status(201).json({
            success: true,
            message: 'Booking confirmed successfully!',
            data: {
                booking_id: bookingId,
                booking_reference: bookingRef,
                customer_id: customerId,
                customer_name: customer_name.trim(),
                email: cleanEmail,
                show_id: showId,
                movie_title: show.movie_title,
                poster_url: show.poster_url,
                theatre_name: show.theatre_name,
                city: show.city,
                screen_name: show.screen_name,
                show_date: show.show_date,
                show_time: show.show_time,
                number_of_tickets: numTickets,
                seat_numbers: seatNumbersStr,
                seats_breakdown: selectedSeats.map(s => ({
                    seat_number: s.seat_number,
                    tier: s.seat_tier,
                    price: s.calculated_price
                })),
                base_ticket_price: basePrice,
                convenience_fee: convenienceFee,
                discount_amount: discountAmount,
                coupon_code: appliedCoupon,
                total_amount: netPayable,
                payment_status: 'PAID',
                transaction_id: txnId,
                available_seats_remaining: newAvailableSeats,
                booking_status: 'CONFIRMED'
            }
        });

    } catch (err) {
        if (connection) {
            try { await connection.rollback(); } catch (rbErr) {}
        }
        console.error('Error creating booking transaction:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while processing booking',
            error: err.message
        });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Fetch bookings by customer email or user token
 */
const getBookingsByEmail = async (req, res) => {
    try {
        const email = req.query.email || (req.user ? req.user.email : null);

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Customer email is required'
            });
        }

        const cleanEmail = email.toString().trim().toLowerCase();

        const [rows] = await pool.query(
            `SELECT b.booking_id,
                    COALESCE(b.booking_reference, CONCAT('BK-', LPAD(b.booking_id, 6, '0'))) AS booking_reference,
                    b.customer_id,
                    b.user_id,
                    b.show_id,
                    b.number_of_tickets,
                    b.seat_numbers,
                    b.total_amount,
                    b.convenience_fee,
                    b.discount_amount,
                    b.coupon_code,
                    b.booking_date,
                    b.booking_status,
                    b.payment_status,
                    c.customer_name,
                    c.email,
                    s.show_date,
                    s.show_time,
                    s.ticket_price,
                    m.title AS movie_title,
                    m.poster_url,
                    m.genre,
                    m.language,
                    COALESCE(t.name, 'CinePass Grand Multiplex') AS theatre_name,
                    COALESCE(t.city, 'Mumbai') AS city,
                    COALESCE(sc.screen_name, 'Audi 1 - IMAX') AS screen_name,
                    p.transaction_id
             FROM bookings b
             INNER JOIN customers c ON b.customer_id = c.customer_id
             INNER JOIN shows s ON b.show_id = s.show_id
             INNER JOIN movies m ON s.movie_id = m.movie_id
             LEFT JOIN theatres t ON s.theatre_id = t.theatre_id
             LEFT JOIN screens sc ON s.screen_id = sc.screen_id
             LEFT JOIN payments p ON b.booking_id = p.booking_id
             WHERE c.email = ? OR (b.user_id IS NOT NULL AND b.user_id = (SELECT user_id FROM users WHERE email = ?))
             ORDER BY b.booking_date DESC`,
            [cleanEmail, cleanEmail]
        );

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (err) {
        console.error('Error fetching bookings by email:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching bookings',
            error: err.message
        });
    }
};

/**
 * Fetch digital ticket details by booking reference or ID
 */
const getBookingTicket = async (req, res) => {
    try {
        const idOrRef = req.params.reference;

        const [rows] = await pool.query(
            `SELECT b.booking_id,
                    COALESCE(b.booking_reference, CONCAT('BK-', LPAD(b.booking_id, 6, '0'))) AS booking_reference,
                    COALESCE(u.name, c.customer_name) AS customer_name,
                    COALESCE(u.email, c.email) AS email,
                    COALESCE(u.phone, '+91 9876543210') AS phone,
                    m.movie_id,
                    m.title AS movie_title,
                    m.poster_url,
                    m.banner_url,
                    m.genre,
                    m.language,
                    m.duration_minutes,
                    COALESCE(t.name, 'CinePass Grand Multiplex') AS theatre_name,
                    COALESCE(t.city, 'Mumbai') AS city,
                    COALESCE(t.address, 'City Center Cinema Complex') AS address,
                    COALESCE(sc.screen_name, 'Audi 1 - IMAX Laser') AS screen_name,
                    COALESCE(sc.screen_type, 'IMAX') AS screen_type,
                    s.show_id,
                    s.show_date,
                    s.show_time,
                    b.number_of_tickets,
                    b.seat_numbers,
                    b.total_amount,
                    b.convenience_fee,
                    b.discount_amount,
                    b.coupon_code,
                    b.booking_status,
                    b.payment_status,
                    b.booking_date,
                    p.transaction_id,
                    p.payment_method
             FROM bookings b
             LEFT JOIN customers c ON b.customer_id = c.customer_id
             LEFT JOIN users u ON b.user_id = u.user_id
             JOIN shows s ON b.show_id = s.show_id
             JOIN movies m ON s.movie_id = m.movie_id
             LEFT JOIN screens sc ON s.screen_id = sc.screen_id
             LEFT JOIN theatres t ON (sc.theatre_id = t.theatre_id OR s.theatre_id = t.theatre_id)
             LEFT JOIN payments p ON b.booking_id = p.booking_id
             WHERE b.booking_reference = ? OR b.booking_id = ?
             LIMIT 1`,
            [idOrRef, isNaN(parseInt(idOrRef, 10)) ? 0 : parseInt(idOrRef, 10)]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        res.json({ success: true, ticket: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error retrieving ticket', error: err.message });
    }
};

/**
 * Cancel a booking with ACID Transaction, Seat Release & Refund audit
 */
const cancelBooking = async (req, res) => {
    const bookingParam = req.params.id;
    const bookingId = parseInt(bookingParam, 10);

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Lock booking row
        let query = 'SELECT * FROM bookings WHERE ';
        let params = [];
        if (!isNaN(bookingId)) {
            query += 'booking_id = ? OR booking_reference = ? FOR UPDATE';
            params.push(bookingId, bookingParam);
        } else {
            query += 'booking_reference = ? FOR UPDATE';
            params.push(bookingParam);
        }

        const [bookings] = await connection.query(query, params);

        if (!bookings || bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const booking = bookings[0];

        // 2. Prevent double cancellation
        if (booking.booking_status === 'CANCELLED') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled. Cannot cancel again.'
            });
        }

        // 3. Update booking status
        await connection.query(
            "UPDATE bookings SET booking_status = 'CANCELLED', payment_status = 'REFUNDED' WHERE booking_id = ?",
            [booking.booking_id]
        );

        // 4. Release individual seats in booking_seats
        await connection.query(
            "UPDATE booking_seats SET status = 'RELEASED' WHERE booking_id = ?",
            [booking.booking_id]
        );

        // 5. Restore available seats on shows table
        await connection.query(
            'UPDATE shows SET available_seats = available_seats + ? WHERE show_id = ?',
            [booking.number_of_tickets, booking.show_id]
        );

        // 6. Fetch updated show available seats
        const [showRows] = await connection.query(
            'SELECT available_seats, total_seats FROM shows WHERE show_id = ?',
            [booking.show_id]
        );
        const restoredAvailableSeats = showRows && showRows.length > 0 ? showRows[0].available_seats : null;

        // 7. Insert refund audit record
        await connection.query(
            `INSERT INTO refunds (booking_id, refund_amount, refund_reason, refund_status)
             VALUES (?, ?, 'User requested cancellation', 'PROCESSED')`,
            [booking.booking_id, booking.total_amount]
        );

        // 8. Commit ACID transaction
        await connection.commit();

        return res.status(200).json({
            success: true,
            message: 'Booking successfully cancelled. Refund processed and seats restored.',
            data: {
                booking_id: booking.booking_id,
                booking_reference: booking.booking_reference,
                booking_status: 'CANCELLED',
                payment_status: 'REFUNDED',
                refund_amount: booking.total_amount,
                seats_restored: booking.number_of_tickets,
                show_id: booking.show_id,
                available_seats_now: restoredAvailableSeats
            }
        });

    } catch (err) {
        if (connection) {
            try { await connection.rollback(); } catch (rbErr) {}
        }
        console.error('Error during booking cancellation transaction:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while cancelling booking',
            error: err.message
        });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    createBooking,
    getBookingsByEmail,
    getBookingTicket,
    cancelBooking
};
