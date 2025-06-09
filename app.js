import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import userRoutes from './routes/userRoutes.js';

// Import middlewares
import errorHandler from './middlewares/error.js';

// Database connection
import connectDB from './config/db.js';

// Initialize express
const app = express();



// Connect to MongoDB
connectDB();

// Middlewares
app.use(express.json());
app.use(cookieParser());
// app.use(cors({
//   origin: process.env.CLIENT_URL,
//   credentials: true
// }));

app.use(cors());


// Routes
app.use('/api/v1/users', userRoutes);

// Error handler middleware
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});