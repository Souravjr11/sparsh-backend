const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB
const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);

let db, bookings;

async function connectMongo() {
  try {
    await client.connect();
    db = client.db("sparshdb");
    bookings = db.collection("bookings");
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

// Get all bookings
app.get("/bookings", async (req, res) => {
  try {
    const data = await bookings.find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, bookings: data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});