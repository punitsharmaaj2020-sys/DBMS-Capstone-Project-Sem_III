/**
 * Database Setup & Initialization Script
 * Movie Ticket Booking System - DBMS Capstone Project
 * 
 * Executes database/schema.sql and database/seed.sql on MySQL server
 * and verifies all relational tables, views, and seed data.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT, 10) || 3306;
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'movie_ticket_booking';

function cleanSqlDelimiters(sql) {
    return sql
        .replace(/DELIMITER\s+\/\//gi, '')
        .replace(/DELIMITER\s+;/gi, '')
        .replace(/\/\/\s*$/gm, ';');
}

async function runSetup() {
    console.log('=======================================================');
    console.log('🎬 Movie Ticket Booking Platform - MySQL DB Initialization');
    console.log('=======================================================\n');

    let connection;

    try {
        console.log(`🔌 Step 1: Connecting to MySQL server at ${dbHost}:${dbPort} as user "${dbUser}"...`);
        connection = await mysql.createConnection({
            host: dbHost,
            port: dbPort,
            user: dbUser,
            password: dbPassword,
            multipleStatements: true,
            dateStrings: true
        });
        console.log('✅ Connected to MySQL server successfully!\n');

        // Step 2: Read and execute schema.sql
        console.log('📄 Step 2: Executing database/schema.sql...');
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        let schemaSql = cleanSqlDelimiters(fs.readFileSync(schemaPath, 'utf8'));

        await connection.query(schemaSql);
        console.log('✅ Database and 14 tables created successfully!\n');

        // Step 3: Read and execute seed.sql
        console.log('🌱 Step 3: Executing database/seed.sql...');
        const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');
        let seedSql = cleanSqlDelimiters(fs.readFileSync(seedPath, 'utf8'));

        await connection.query(`USE \`${dbName}\`;`);
        await connection.query(seedSql);
        console.log('✅ Seed data populated successfully!\n');

        // Step 4: Verification queries
        console.log('🔍 Step 4: Verifying database state...\n');

        // Verify movies
        const [movies] = await connection.query('SELECT movie_id, title, genre, language, release_status, rating FROM movies ORDER BY movie_id ASC');
        console.log(`✅ Table 'movies': ${movies.length} records:`);
        movies.forEach(m => console.log(`   - [#${m.movie_id}] ${m.title} (${m.genre}, ${m.language}) [${m.release_status}] ★ ${m.rating}`));
        console.log('');

        // Verify theatres & screens
        const [theatres] = await connection.query('SELECT theatre_id, name, city, total_screens FROM theatres');
        console.log(`✅ Table 'theatres': ${theatres.length} theatres:`);
        theatres.forEach(t => console.log(`   - [#${t.theatre_id}] ${t.name} (${t.city}) - ${t.total_screens} Screens`));
        console.log('');

        const [seatsCount] = await connection.query('SELECT COUNT(*) AS count FROM seats');
        console.log(`✅ Table 'seats': ${seatsCount[0].count} individual seats configured across screens.`);

        // Verify shows
        const [shows] = await connection.query('SELECT show_id, movie_id, theatre_id, show_date, show_time, ticket_price, available_seats, total_seats FROM shows ORDER BY show_id ASC');
        console.log(`✅ Table 'shows': ${shows.length} screenings scheduled.`);
        console.log('');

        // Verify users
        const [users] = await connection.query('SELECT user_id, name, email, role FROM users');
        console.log(`✅ Table 'users': ${users.length} registered accounts:`);
        users.forEach(u => console.log(`   - [#${u.user_id}] ${u.name} (${u.email}) [${u.role}]`));
        console.log('');

        // Verify coupons
        const [coupons] = await connection.query('SELECT code, discount_percent, max_discount FROM coupons');
        console.log(`✅ Table 'coupons': ${coupons.length} active promo codes.`);
        coupons.forEach(c => console.log(`   - Code: "${c.code}" (${c.discount_percent}% off, max ₹${c.max_discount})`));
        console.log('');

        // Verify view
        const [viewRows] = await connection.query('SELECT * FROM booking_details_view');
        console.log(`✅ View 'booking_details_view': ${viewRows.length} joined records verified.\n`);

        console.log('=======================================================');
        console.log('🎉 MYSQL DATABASE IS FULLY UPGRADED AND VERIFIED!');
        console.log('   Run "npm start" to start the server at http://localhost:3000');
        console.log('=======================================================');

        await connection.end();
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Initialization Failed:', err.message);
        console.error('\n👉 Troubleshooting checklist:');
        console.error('   1. Verify your MySQL service is running (e.g. MySQL80 in Windows Services).');
        console.error('   2. Set your MySQL root password in the ".env" file (DB_PASSWORD=your_actual_password).');
        console.error('   3. Alternatively, open MySQL Workbench and run "database/schema.sql" and "database/seed.sql" directly.\n');
        if (connection) {
            try { await connection.end(); } catch (e) {}
        }
        process.exit(1);
    }
}

runSetup();
