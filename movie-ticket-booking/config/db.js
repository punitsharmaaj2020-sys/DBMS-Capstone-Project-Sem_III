const path = require('path');
const fs = require('fs');
require('dotenv').config();

let pool;
let isSqlite = false;

// Check if MySQL should be attempted or if SQLite fallback is preferred
const hasMysqlConfig = process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '';

if (hasMysqlConfig && process.env.USE_SQLITE !== 'true') {
    try {
        const mysql = require('mysql2/promise');
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'movie_ticket_booking',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        console.log('🔌 MySQL pool initialized for database:', process.env.DB_NAME || 'movie_ticket_booking');
    } catch (err) {
        console.warn('⚠️ MySQL initialization failed, switching to SQLite:', err.message);
        pool = createSqliteAdapter();
    }
} else {
    // Zero-config built-in SQLite engine
    console.log('⚡ Using built-in zero-config SQL engine (SQLite). No MySQL or root password required!');
    pool = createSqliteAdapter();
}

function createSqliteAdapter() {
    isSqlite = true;
    const { DatabaseSync } = require('node:sqlite');
    const dbPath = path.join(__dirname, '..', 'database', 'movie_ticket_booking.sqlite');
    
    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new DatabaseSync(dbPath);

    // Register MySQL-compatible SQL functions in SQLite
    db.function('CURDATE', () => {
        return new Date().toISOString().split('T')[0];
    });

    // Initialize schema and initial seed data
    initSqliteSchema(db);

    // Return pool adapter matching mysql2/promise interface
    const adapter = {
        isSqlite: true,
        async query(sql, params = []) {
            return executeSqliteQuery(db, sql, params);
        },
        async getConnection() {
            let inTransaction = false;
            return {
                async beginTransaction() {
                    if (!inTransaction) {
                        db.exec('BEGIN TRANSACTION');
                        inTransaction = true;
                    }
                },
                async query(sql, params = []) {
                    return executeSqliteQuery(db, sql, params);
                },
                async commit() {
                    if (inTransaction) {
                        db.exec('COMMIT');
                        inTransaction = false;
                    }
                },
                async rollback() {
                    if (inTransaction) {
                        try {
                            db.exec('ROLLBACK');
                        } catch (e) {
                            // ignore if rollback already occurred
                        }
                        inTransaction = false;
                    }
                },
                release() {
                    // In-process database, no socket pool release needed
                }
            };
        }
    };

    return adapter;
}

function executeSqliteQuery(db, sql, params = []) {
    // Normalize MySQL syntax to SQLite
    let cleanSql = sql
        .replace(/\s+FOR\s+UPDATE\b/gi, '')
        .trim();

    // Remove trailing semicolons
    if (cleanSql.endsWith(';')) {
        cleanSql = cleanSql.slice(0, -1);
    }

    const flatParams = Array.isArray(params) ? params : [params];

    const isSelect = /^\s*(SELECT|PRAGMA|EXPLAIN)\b/i.test(cleanSql);

    try {
        const stmt = db.prepare(cleanSql);
        if (isSelect) {
            const rows = stmt.all(...flatParams);
            // Return plain objects clone so prototype behaves normally
            const cleanRows = rows.map(r => ({ ...r }));
            return [cleanRows, []];
        } else {
            const result = stmt.run(...flatParams);
            return [{
                insertId: Number(result.lastInsertRowid),
                affectedRows: result.changes
            }, []];
        }
    } catch (err) {
        console.error('SQL Execution Error on:', cleanSql, 'Params:', flatParams, 'Error:', err.message);
        throw err;
    }
}

function initSqliteSchema(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS movies (
            movie_id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            genre TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL,
            language TEXT NOT NULL,
            description TEXT,
            poster_url TEXT,
            release_date TEXT,
            CHECK (duration_minutes > 0)
        );

        CREATE TABLE IF NOT EXISTS shows (
            show_id INTEGER PRIMARY KEY AUTOINCREMENT,
            movie_id INTEGER NOT NULL,
            show_date TEXT NOT NULL,
            show_time TEXT NOT NULL,
            ticket_price REAL NOT NULL,
            total_seats INTEGER NOT NULL,
            available_seats INTEGER NOT NULL,
            FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
            CHECK (ticket_price > 0),
            CHECK (total_seats > 0),
            CHECK (available_seats >= 0),
            CHECK (available_seats <= total_seats)
        );

        CREATE TABLE IF NOT EXISTS customers (
            customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS bookings (
            booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            show_id INTEGER NOT NULL,
            number_of_tickets INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            booking_date TEXT DEFAULT (datetime('now')),
            booking_status TEXT NOT NULL DEFAULT 'CONFIRMED',
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
            FOREIGN KEY (show_id) REFERENCES shows(show_id),
            CHECK (number_of_tickets > 0),
            CHECK (total_amount >= 0)
        );

        CREATE VIEW IF NOT EXISTS booking_details_view AS
        SELECT 
            b.booking_id,
            c.customer_name,
            c.email,
            m.title AS movie_title,
            s.show_date,
            s.show_time,
            b.number_of_tickets,
            b.total_amount,
            b.booking_status,
            b.booking_date
        FROM bookings b
        JOIN customers c ON b.customer_id = c.customer_id
        JOIN shows s ON b.show_id = s.show_id
        JOIN movies m ON s.movie_id = m.movie_id;
    `);

    // Check if movies table is already populated
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM movies');
    const res = checkStmt.get();
    if (res && res.count > 0) {
        return; // Already seeded
    }

    console.log('🌱 Seeding database with movies, showtimes, customers and bookings...');

    // Seed Movies
    const insertMovie = db.prepare(`
        INSERT INTO movies (movie_id, title, genre, duration_minutes, language, description, poster_url, release_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertMovie.run(1, 'The Dark Knight', 'Action/Thriller', 152, 'English', 
        'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice. With the help of allies Lt. Jim Gordon and DA Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the city streets.',
        '/images/posters/the-dark-knight.svg', '2008-07-18');

    insertMovie.run(2, 'Inception', 'Sci-Fi/Action', 148, 'English', 
        'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O. Cobb is offered a chance to have his criminal history erased as payment for the implantation of another person\'s idea into a target\'s subconscious.',
        '/images/posters/inception.svg', '2010-07-16');

    insertMovie.run(3, 'Interstellar', 'Sci-Fi/Drama', 169, 'English', 
        'When Earth becomes increasingly uninhabitable in the near future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers. They journey through a newly discovered wormhole near Saturn in search of a new habitable planet for the survival of humanity.',
        '/images/posters/interstellar.svg', '2014-11-07');

    insertMovie.run(4, 'Parasite', 'Thriller/Drama', 132, 'Korean', 
        'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan. One by one, the Kim family members pose as unrelated, highly qualified individuals to infiltrate the Park household, unleashing an unexpected sequence of chaotic events.',
        '/images/posters/parasite.svg', '2019-05-30');

    insertMovie.run(5, 'Dune: Part Two', 'Sci-Fi/Adventure', 166, 'English', 
        'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
        '/images/posters/dune-part-two.svg', '2024-03-01');

    insertMovie.run(6, 'RRR', 'Action/Drama', 187, 'Telugu', 
        'A fearless revolutionary and an officer in the British force, who once were friends, unite against the tyrannical British rulers of India in the 1920s. Together they embark on an epic and perilous journey of freedom, brotherhood, and rebellion to deliver justice for their oppressed people.',
        '/images/posters/rrr.svg', '2022-03-25');

    // Seed Shows
    const insertShow = db.prepare(`
        INSERT INTO shows (show_id, movie_id, show_date, show_time, ticket_price, total_seats, available_seats)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertShow.run(1, 1, '2026-11-01', '14:30:00', 250.00, 150, 148);
    insertShow.run(2, 1, '2026-11-02', '18:45:00', 280.00, 180, 180);
    insertShow.run(3, 2, '2026-11-03', '15:00:00', 220.00, 120, 117);
    insertShow.run(4, 2, '2026-11-04', '20:15:00', 260.00, 150, 150);
    insertShow.run(5, 3, '2026-11-05', '16:00:00', 300.00, 200, 200);
    insertShow.run(6, 3, '2026-11-06', '21:00:00', 320.00, 200, 200);
    insertShow.run(7, 4, '2026-11-07', '13:15:00', 180.00, 100, 100);
    insertShow.run(8, 4, '2026-11-08', '17:30:00', 200.00, 100, 100);
    insertShow.run(9, 5, '2026-11-09', '14:00:00', 320.00, 160, 160);
    insertShow.run(10, 5, '2026-11-10', '19:30:00', 350.00, 180, 180);
    insertShow.run(11, 6, '2026-11-11', '15:30:00', 200.00, 140, 140);
    insertShow.run(12, 6, '2026-11-12', '19:45:00', 250.00, 160, 160);

    // Seed Customers
    const insertCustomer = db.prepare(`
        INSERT INTO customers (customer_id, customer_name, email, created_at)
        VALUES (?, ?, ?, datetime('now'))
    `);
    insertCustomer.run(1, 'Rahul Sharma', 'rahul@example.com');
    insertCustomer.run(2, 'Priya Patel', 'priya@example.com');

    // Seed Bookings
    const insertBooking = db.prepare(`
        INSERT INTO bookings (booking_id, customer_id, show_id, number_of_tickets, total_amount, booking_date, booking_status)
        VALUES (?, ?, ?, ?, ?, datetime('now'), 'CONFIRMED')
    `);
    insertBooking.run(1, 1, 1, 2, 500.00);
    insertBooking.run(2, 2, 3, 3, 660.00);

    console.log('✅ Database seeded successfully with 6 movies, 12 shows, customers, and bookings!');
}

module.exports = pool;
