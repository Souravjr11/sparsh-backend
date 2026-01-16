const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
const db = new sqlite3.Database("./database.sqlite", err => {
  if (err) console.log(err);
  else console.log("Database connected");
});

// Create USERS table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  )
`);

// Create BOOKINGS table
db.run(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    band TEXT,
    date TEXT
  )
`);

// ------------------------------------
// ROUTES
// ------------------------------------

// Test route
app.get("/", (req, res) => {
  res.send("Backend running successfully");
});

// Register user
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  db.run(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, password],
    function (err) {
      if (err) {
        return res.json({ success: false, message: "User already exists" });
      }
      res.json({ success: true });
    }
  );
});
app.post("/login", (req, res) => {
    const { email, password } = req.body;
  
    db.get(
      "SELECT * FROM users WHERE email = ? AND password = ?",
      [email, password],
      (err, row) => {
        if (err) return res.json({ success: false, message: "Server error" });
  
        if (row) {
          res.json({ success: true, message: "Login successful" });
        } else {
          res.json({ success: false, message: "Invalid email or password" });
        }
      }
    );
  });
  

// Booking API
app.post("/book", (req, res) => {
  const { name, phone, band, date } = req.body;

  db.run(
    "INSERT INTO bookings (name, phone, band, date) VALUES (?, ?, ?, ?)",
    [name, phone, band, date],
    () => {
      res.json({ success: true });
    }
  );
});
// Get all bookings (Admin)
app.get("/bookings", (req, res) => {
    db.all("SELECT * FROM bookings ORDER BY id DESC", [], (err, rows) => {
      if (err) return res.json({ success: false, message: err.message });
      res.json({ success: true, bookings: rows });
    });
  });
  

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
