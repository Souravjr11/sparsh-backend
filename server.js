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

// ---------- MongoDB ----------
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in environment variables");
}

const mongoClient = new MongoClient(MONGO_URI);

let mongoDb, bookingsCollection, usersCollection;

async function connectMongo() {
  try {
    await mongoClient.connect();
    mongoDb = mongoClient.db("sparshdb");
    bookingsCollection = mongoDb.collection("bookings");
    usersCollection = mongoDb.collection("users");
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err);
  }
}
connectMongo();

// Test route
app.get("/", (req, res) => {
  res.send("Backend running successfully");
});

// Register user (MongoDB)
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email & password required" });
    }
    if (!usersCollection) {
      return res.json({ success: false, message: "MongoDB not connected yet" });
    }

    // check existing
    const existing = await usersCollection.findOne({ email });
    if (existing) {
      return res.json({ success: false, message: "User already exists" });
    }

    await usersCollection.insertOne({
      email,
      password, // (later we can hash)
      createdAt: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// Login user (MongoDB)
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email & password required" });
    }
    if (!usersCollection) {
      return res.json({ success: false, message: "MongoDB not connected yet" });
    }

    const user = await usersCollection.findOne({ email, password });
    if (user) {
      res.json({ success: true, message: "Login successful" });
    } else {
      res.json({ success: false, message: "Invalid email or password" });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
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

// Get all bookings (MongoDB)
app.get("/bookings", async (req, res) => {
  try {
    if (!bookingsCollection) {
      return res.json({ success: false, message: "MongoDB not connected yet" });
    }

    const rows = await bookingsCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, bookings: rows });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});