const pool = require('../config/db');

// Regular expression for basic email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Create a new booking with transaction
const createBooking = async (req, res) => {
    const { customer_name, email, show_id, number_of_tickets } = req.body;

    // Validate presence of required fields
    if (!customer_name || !email || show_id === undefined || number_of_tickets === undefined) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required: customer_name, email, show_id, number_of_tickets'
        });
    }

    if (typeof customer_name !== 'string' || customer_name.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Valid customer name is required'
        });
    }

    const cleanEmail = email.toString().trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email address format'
        });
    }

    const showId = parseInt(show_id, 10);
    if (isNaN(showId) || showId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Valid show ID is required'
        });
    }

    const numTickets = parseInt(number_of_tickets, 10);
    if (isNaN(numTickets) || !Number.isInteger(numTickets) || numTickets < 1 || numTickets > 10) {
        return res.status(400).json({
            success: false,
            message: 'number_of_tickets must be an integer between 1 and 10'
        });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Lock show row and retrieve details with movie info
        const [shows] = await connection.query(
            `SELECT s.show_id, s.movie_id, s.show_date, s.show_time, s.ticket_price, s.available_seats,
                    m.title AS movie_title, m.poster_url, m.genre, m.language, m.duration_minutes
             FROM shows s
             INNER JOIN movies m ON s.movie_id = m.movie_id
             WHERE s.show_id = ?
             FOR UPDATE`,
            [showId]
        );

        // 2. If show not found, rollback and return 404
        if (!shows || shows.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Show not found'
            });
        }

        const show = shows[0];

        // 3. Check seat availability
        if (show.available_seats < numTickets) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Not enough seats available'
            });
        }

        // 4. Calculate total amount on server
        const ticketPrice = parseFloat(show.ticket_price);
        const totalAmount = Number((ticketPrice * numTickets).toFixed(2));

        // 5. Check if customer exists
        const [existingCustomers] = await connection.query(
            'SELECT customer_id FROM customers WHERE email = ?',
            [cleanEmail]
        );

        let customerId;
        if (existingCustomers && existingCustomers.length > 0) {
            customerId = existingCustomers[0].customer_id;
        } else {
            // 6. Insert new customer
            const [custResult] = await connection.query(
                'INSERT INTO customers (customer_name, email) VALUES (?, ?)',
                [customer_name.trim(), cleanEmail]
            );
            customerId = custResult.insertId;
        }

        // 7. Insert booking
        const [bookingResult] = await connection.query(
            `INSERT INTO bookings (customer_id, show_id, number_of_tickets, total_amount, booking_status)
             VALUES (?, ?, ?, ?, ?)`,
            [customerId, showId, numTickets, totalAmount, 'CONFIRMED']
        );

        // 8. Decrement available seats in shows
        await connection.query(
            'UPDATE shows SET available_seats = available_seats - ? WHERE show_id = ?',
            [numTickets, showId]
        );

        // 9. Commit transaction
        await connection.commit();

        // 10. Return booking details
        return res.status(201).json({
            success: true,
            message: 'Booking confirmed!',
            data: {
                booking_id: bookingResult.insertId,
                customer_name: customer_name.trim(),
                email: cleanEmail,
                movie: {
                    title: show.movie_title,
                    genre: show.genre,
                    language: show.language,
                    duration_minutes: show.duration_minutes,
                    poster_url: show.poster_url
                },
                show: {
                    show_id: show.show_id,
                    show_date: show.show_date,
                    show_time: show.show_time,
                    ticket_price: show.ticket_price
                },
                number_of_tickets: numTickets,
                total_amount: totalAmount,
                booking_status: 'CONFIRMED'
            }
        });

    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rbErr) {
                console.error('Error during transaction rollback:', rbErr);
            }
        }
        console.error('Error creating booking:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while processing booking',
            error: err.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Retrieve booking history by customer email
const getBookingsByEmail = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Email query parameter is required'
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const [rows] = await pool.query(
            `SELECT b.booking_id, c.customer_name, m.title AS movie_title,
                    s.show_date, s.show_time, b.number_of_tickets,
                    b.total_amount, b.booking_status, b.booking_date
             FROM bookings b
             INNER JOIN customers c ON b.customer_id = c.customer_id
             INNER JOIN shows s ON b.show_id = s.show_id
             INNER JOIN movies m ON s.movie_id = m.movie_id
             WHERE c.email = ?
             ORDER BY b.booking_date DESC`,
            [cleanEmail]
        );

        return res.status(200).json({
            success: true,
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

// Cancel an existing booking with transaction
const cancelBooking = async (req, res) => {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId) || bookingId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid booking ID. ID must be a positive number.'
        });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Lock booking record
        const [bookings] = await connection.query(
            'SELECT booking_status, show_id, number_of_tickets FROM bookings WHERE booking_id = ? FOR UPDATE',
            [bookingId]
        );

        // 2. Check if booking exists
        if (!bookings || bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookings[0];

        // 3. Check if already cancelled
        if (booking.booking_status === 'CANCELLED') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        // 4. Update booking status to CANCELLED
        await connection.query(
            "UPDATE bookings SET booking_status = 'CANCELLED' WHERE booking_id = ? ",
            [bookingId]
        );

        // 5. Restore available seats for the show
        await connection.query(
            'UPDATE shows SET available_seats = available_seats + ? WHERE show_id = ?',
            [booking.number_of_tickets, booking.show_id]
        );

        // 6. Commit transaction
        await connection.commit();

        // 7. Return success
        return res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully'
        });
    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rbErr) {
                console.error('Error during cancellation rollback:', rbErr);
            }
        }
        console.error('Error cancelling booking:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while cancelling booking',
            error: err.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    createBooking,
    getBookingsByEmail,
    cancelBooking
};
