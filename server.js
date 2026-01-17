require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
  app.options("*", cors());
  
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB
const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);

let db, bookings, users;

async function connectMongo() {
  try {
    await client.connect();
    db = client.db("sparshdb");
    bookings = db.collection("bookings");
    users = db.collection("users");
    await users.createIndex({ email: 1 }, { unique: true });

    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err);
  }
}

connectMongo();

// Test route
app.get("/", (req, res) => {
  res.send("Backend running successfully with MongoDB");
});

// Booking API
app.post("/book", async (req, res) => {
  try {
    const { name, phone, band, date } = req.body;

    if (!name || !phone || !band || !date) {
      return res.json({ success: false, message: "All fields required" });
    }
    if (!bookings) {
        return res.status(500).json({ success: false, message: "DB not connected" });
      }
      

    await bookings.insertOne({
      name,
      phone,
      band,
      date,
      createdAt: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Database error" });
  }
});
// TEMP USERS (not permanent - resets on restart)

// Register API
app.post("/register", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.json({ success: false, message: "Email & password required" });
      if (!users) return res.status(500).json({ success: false, message: "DB not connected" });
  
      await users.insertOne({ email: email.toLowerCase(), password, createdAt: new Date() });
      res.json({ success: true });
    } catch (err) {
      if (err.code === 11000) return res.json({ success: false, message: "User already exists" });
      res.json({ success: false, message: err.message });
    }
  });
  

// Login API
app.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.json({ success: false, message: "Email & password required" });
      if (!users) return res.status(500).json({ success: false, message: "DB not connected" });
  
      const user = await users.findOne({ email: email.toLowerCase(), password });
      if (!user) return res.json({ success: false, message: "Invalid credentials" });
  
      res.json({ success: true });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  });
  

// Get all bookings
app.get("/bookings", async (req, res) => {
  try {
    if (!bookings) {
        return res.status(500).json({ success: false, message: "DB not connected" });
      }      
    const data = await bookings.find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, bookings: data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});
res.json({ ok: true, mongo: !!db, bookings: !!bookings, users: !!users });

  
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
