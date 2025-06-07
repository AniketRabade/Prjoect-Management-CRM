import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import connectCloudinary from "./configs/cloudinary.js";

// Connect to DB and Cloudinary
connectDB();
connectCloudinary();

const app = express();


// 🌐 CORS Setup - Allow frontend from Vite (port 5174)
app.use(cors({
  origin: 'http://localhost:5174',
  credentials: true
}));

// 🧠 JSON body parser 
app.use(express.json());



// ✅ Routes
app.get("/", (req, res) => res.send("API is working"));


// 🚀 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
