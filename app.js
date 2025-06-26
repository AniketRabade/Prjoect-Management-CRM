import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import userRoutes from './routes/userRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import saleRoutes from './routes/salesRoutes.js';
import leadRoutes from './routes/leadRoute.js';
import attendanceRoutes from './routes/attendanceRoutes.js';

// Import middlewares
import errorHandler from './middlewares/error.js';

// Database connection
import connectDB from './config/db.js';
import upload from './middlewares/uploadMiddleware.js';

// Initialize express
const app = express();

// Connect to MongoDB
connectDB();

// Middlewares

// app.js - Correct order:

// const corsOptions = {
//   origin: 'http://localhost:5173', // Your frontend origin
//   credentials: true, // Allow credentials (cookies)
//   optionsSuccessStatus: 200 // Some legacy browsers choke on 204
// };

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true })); // 1. For form data
app.use(express.json()); // 2. For JSON bodies
app.use(cookieParser());
// app.use(cors());

// File upload middleware must come before routes
// Note: This is just the base configuration
// Specific file handling is done in individual route files

// Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/attendance', attendanceRoutes);

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