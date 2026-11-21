const pool = require('../config/db');

/**
 * Fetch interactive seat layout and real-time occupancy for a show
 */
exports.getSeatsForShow = async (req, res, next) => {
    try {
        const showId = parseInt(req.params.showId, 10);
        if (isNaN(showId) || showId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid show ID' });
        }

        // 1. Get show metadata
        const [shows] = await pool.query(
            `SELECT s.show_id, s.movie_id, s.theatre_id, s.screen_id,
                    s.show_date, s.show_time, s.ticket_price, s.available_seats, s.total_seats,
                    m.title AS movie_title, m.poster_url, m.duration_minutes,
                    COALESCE(t.name, 'CinePass Grand Multiplex') AS theatre_name,
                    COALESCE(t.city, 'Mumbai') AS city,
                    COALESCE(sc.screen_name, 'Audi 1 - IMAX') AS screen_name,
                    COALESCE(sc.screen_type, 'Standard') AS screen_type
             FROM shows s
             JOIN movies m ON s.movie_id = m.movie_id
             LEFT JOIN theatres t ON s.theatre_id = t.theatre_id
             LEFT JOIN screens sc ON s.screen_id = sc.screen_id
             WHERE s.show_id = ?`,
            [showId]
        );

        if (shows.length === 0) {
            return res.status(404).json({ success: false, message: 'Show not found' });
        }

        const show = shows[0];
        let screenId = show.screen_id || 1;

        // 2. Query seats for this screen
        let [seats] = await pool.query(
            `SELECT seat_id, screen_id, seat_number, seat_row, seat_col, seat_tier, price_multiplier
             FROM seats
             WHERE screen_id = ?
             ORDER BY seat_row ASC, seat_col ASC`,
            [screenId]
        );

        // Fallback: If no seats defined for this screen, use screen 1 seats
        if (seats.length === 0) {
            const [fallbackSeats] = await pool.query(
                `SELECT seat_id, screen_id, seat_number, seat_row, seat_col, seat_tier, price_multiplier
                 FROM seats
                 WHERE screen_id = 1
                 ORDER BY seat_row ASC, seat_col ASC`
            );
            seats = fallbackSeats;
        }

        // 3. Query occupied seats for this show from booking_seats
        const [occupiedRows] = await pool.query(
            `SELECT seat_id, seat_number
             FROM booking_seats
             WHERE show_id = ? AND status = 'CONFIRMED'`,
            [showId]
        );

        const occupiedSeatIdSet = new Set(occupiedRows.map(r => r.seat_id));
        const occupiedSeatNumberSet = new Set(occupiedRows.map(r => r.seat_number));

        const basePrice = parseFloat(show.ticket_price);

        // 4. Enrich seat objects
        const layout = seats.map(s => {
            const multiplier = parseFloat(s.price_multiplier) || 1.0;
            const price = Math.round(basePrice * multiplier);
            const isOccupied = occupiedSeatIdSet.has(s.seat_id) || occupiedSeatNumberSet.has(s.seat_number);

            return {
                seat_id: s.seat_id,
                seat_number: s.seat_number,
                row: s.seat_row,
                col: s.seat_col,
                tier: s.seat_tier,
                price,
                is_occupied: isOccupied
            };
        });

        res.json({
            success: true,
            show: {
                show_id: show.show_id,
                movie_title: show.movie_title,
                poster_url: show.poster_url,
                duration_minutes: show.duration_minutes,
                theatre_name: show.theatre_name,
                city: show.city,
                screen_name: show.screen_name,
                screen_type: show.screen_type,
                show_date: show.show_date,
                show_time: show.show_time,
                base_ticket_price: basePrice,
                available_seats: show.available_seats,
                total_seats: show.total_seats
            },
            seats: layout,
            convenience_fee_per_ticket: 25.00
        });

    } catch (err) {
        next(err);
    }
};
