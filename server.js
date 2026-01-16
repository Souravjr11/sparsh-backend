const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ---------- MongoDB ----------
const MONGO_URI = process.env.MONGO_URI;
const mongoClient = new MongoClient(MONGO_URI);

let mongoDb, bookingsCollection;

async function connectMongo() {
  try {
    await mongoClient.connect();
    mongoDb = mongoClient.db("sparshdb");
    bookingsCollection = mongoDb.collection("bookings");
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err);
  }
}

connectMongo();

// ---------- SQLite (for users login/register only) ----------
const sqliteDb = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) console.log(err);
  else console.log("✅ SQLite Database connected");
});

// Create USERS table
sqliteDb.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  )
`);
// Test route
app.get("/", (req, res) => {
    res.send("Backend running successfully");
  });
  
  // Register user (SQLite)
  app.post("/register", (req, res) => {
    const { email, password } = req.body;
  
    sqliteDb.run(
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
  
  // Login user (SQLite)
  app.post("/login", (req, res) => {
    const { email, password } = req.body;
  
    sqliteDb.get(
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
  
  // Booking API (MongoDB)
  app.post("/book", async (req, res) => {
    try {
      const { name, phone, band, date } = req.body;
  
      if (!name || !phone || !band || !date) {
        return res.json({ success: false, message: "All fields required" });
      }
  
      if (!bookingsCollection) {
        return res.json({ success: false, message: "MongoDB not connected yet" });
      }
  
      await bookingsCollection.insertOne({
        name,
        phone,
        band,
        date,
        createdAt: new Date(),
      });
  
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.json({ success: false, message: "Database error" });
    }
  });
  
  // Get all bookings (MongoDB) ✅ (Admin)
  app.get("/bookings", async (req, res) => {
    try {
      if (!bookingsCollection) {
        return res.json({ success: false, message: "MongoDB not connected yet" });
      }
  
      const rows = await bookingsCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
  
      res.json({ success: true, bookings: rows });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  });
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });