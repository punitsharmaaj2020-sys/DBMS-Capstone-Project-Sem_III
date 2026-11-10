/**
 * Database Setup & Verification Script
 * Movie Ticket Booking System - DBMS Capstone Project
 */

require('dotenv').config();
const pool = require('../config/db');

async function setup() {
    console.log('=======================================================');
    console.log('🎬 Movie Ticket Booking System - Database Initialization');
    console.log('=======================================================\n');

    try {
        console.log('🔍 Checking database connection and tables...\n');

        // Check movies
        const [movies] = await pool.query('SELECT movie_id, title, genre, language FROM movies ORDER BY movie_id ASC');
        console.log(`✅ Table 'movies': ${movies.length} records found:`);
        movies.forEach(m => console.log(`   - [#${m.movie_id}] ${m.title} (${m.genre}, ${m.language})`));
        console.log('');

        // Check shows
        const [shows] = await pool.query('SELECT show_id, movie_id, show_date, show_time, ticket_price, available_seats, total_seats FROM shows ORDER BY show_id ASC');
        console.log(`✅ Table 'shows': ${shows.length} screenings scheduled across movies:`);
        shows.slice(0, 4).forEach(s => console.log(`   - [Show #${s.show_id}] Movie #${s.movie_id} on ${s.show_date} at ${s.show_time} | ₹${s.ticket_price} | Seats: ${s.available_seats}/${s.total_seats}`));
        if (shows.length > 4) console.log(`   ... and ${shows.length - 4} more scheduled shows.`);
        console.log('');

        // Check customers
        const [customers] = await pool.query('SELECT customer_id, customer_name, email FROM customers');
        console.log(`✅ Table 'customers': ${customers.length} registered customers:`);
        customers.forEach(c => console.log(`   - [#${c.customer_id}] ${c.customer_name} (${c.email})`));
        console.log('');

        // Check bookings
        const [bookings] = await pool.query('SELECT booking_id, customer_id, show_id, number_of_tickets, total_amount, booking_status FROM bookings');
        console.log(`✅ Table 'bookings': ${bookings.length} reservations recorded:`);
        bookings.forEach(b => console.log(`   - [Booking #${b.booking_id}] Customer #${b.customer_id} -> Show #${b.show_id} | Tickets: ${b.number_of_tickets} | Total: ₹${b.total_amount} | Status: ${b.booking_status}`));
        console.log('');

        // Check view
        const [viewData] = await pool.query('SELECT * FROM booking_details_view');
        console.log(`✅ View 'booking_details_view': ${viewData.length} joined records verified successfully.`);
        console.log('');

        console.log('=======================================================');
        console.log('🎉 Database is 100% INITIALIZED AND READY TO USE!');
        console.log('   Run "npm start" to launch the website at http://localhost:3000');
        console.log('=======================================================');
        process.exit(0);

    } catch (err) {
        console.error('❌ Database verification failed:', err.message);
        process.exit(1);
    }
}

setup();
