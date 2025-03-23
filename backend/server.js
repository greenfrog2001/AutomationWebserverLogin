const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Connect to SQLite database (file-based)
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to SQLite database');
        // Create users table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT
            )
        `, (err) => {
            if (err) {
                console.error('Error creating table:', err);
            } else {
                // Insert a default user (for testing)
                const defaultUser = 'user';
                const defaultPass = 'pass';
                bcrypt.hash(defaultPass, 10, (err, hash) => {
                    if (err) {
                        console.error('Error hashing password:', err);
                    } else {
                        db.run(`INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`, 
                            [defaultUser, hash], (err) => {
                                if (err) console.error('Error inserting default user:', err);
                                else console.log('Default user created');
                            });
                    }
                });
            }
        });
    }
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        if (!row) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Compare password with stored hash
        bcrypt.compare(password, row.password, (err, match) => {
            if (err) {
                console.error('Password comparison error:', err);
                return res.status(500).json({ success: false, message: 'Server error' });
            }
            if (match) {
                res.json({ success: true });
            } else {
                res.status(401).json({ success: false, message: 'Incorrect password' });
            }
        });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});