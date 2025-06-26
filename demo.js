//app.js
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
app.use(express.urlencoded({ extended: true })); // 1. For form data
app.use(express.json()); // 2. For JSON bodies
app.use(cookieParser());
app.use(cors());

// File upload middleware must come before routes
// Note: This is just the base configuration
// Specific file handling is done in individual route files

// Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/sales', saleRoutes);

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



//models/User.js
//User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never return password in queries
    },
    phone: {
      type: String,
      required: [true, "Please provide a phone number"],
      // unique: true,
      trim: true,
      match: [
        /^\+?[1-9]\d{1,14}$/,
        "Please provide a valid phone number",
      ],
    },
    accountType: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee",
    },
    permissions: {
      dashboard: { type: Boolean, default: false },
      users: { type: Boolean, default: false },
      tasks: { type: Boolean, default: false },
      leads: { type: Boolean, default: false },
      projects: { type: Boolean, default: false },
      clients: { type: Boolean, default: false },
      reports: { type: Boolean, default: false },
    },
    profilePicture: {
      type: String,
      default: 'default-profile.jpg'
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};






export default mongoose.model("User", UserSchema);



//routes
//userRoutes.js
//userRoutes.js
import express from 'express';
import upload from '../middlewares/uploadMiddleware.js';
import cloudinary from '../config/cloudinary.js';
import { protect, authorize } from '../middlewares/auth.js';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getMe
} from '../controllers/userController.js';

const router = express.Router();


router.post('/login', loginUser);
router.get('/logout', protect, logoutUser);
router.get('/me', protect, getMe);

// Admin only routes
// router.post('/register', protect, authorize('admin'), registerUser);
router.post('/register',protect,authorize('admin'), upload.single('profilePicture'), registerUser);

router.get('/', protect, authorize('admin'), getUsers);

router.get('/:id', protect, authorize('admin'), getUser);

// router.put('/:id', protect, authorize('admin'), updateUser);
router.put('/:id',protect,authorize('admin'),upload.single('profilePicture'),updateUser);

router.delete('/:id', protect, authorize('admin'), deleteUser);

export default router;







//controllers
// userController.js

import User from '../models/User.js';
import { generateToken } from '../config/jwt.js';
import cookieOptions from '../utils/cookieOptions.js';
import cloudinary from '../config/cloudinary.js';
import ErrorResponse from '../utils/errorResponse.js';


// @desc    Register a user (Admin only)
// @route   POST /api/v1/users/register
// @access  Private/Admin


// export const registerUser = async (req, res, next) => {
//   try {
//     const { name, email, password, phone, accountType, permissions } = req.body;

//     const user = await User.create({
//       name,
//       email,
//       password,
//       phone,
//       accountType,
//       permissions
//     });

//     const token = generateToken(user._id);

//     res.cookie('token', token, cookieOptions);

//     res.status(201).json({
//       success: true,
//       data: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         accountType: user.accountType
//       }
//     });
//   } catch (err) {
//     next(err);
//   }
// };


export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, accountType, permissions } = req.body;
    let profilePicture = '';

    console.log(req.body);
    console.log(req.file);

    // Handle file upload if exists
    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'user-profiles',
        width: 500,
        height: 500,
        crop: 'fill'
      });
      profilePicture = result.secure_url;
    }

    // Create user with or without profile picture
    const user = await User.create({
      name,
      email,
      password,
      phone,
      accountType,
      permissions,
      profilePicture: profilePicture || 'default-profile.jpg'
    });

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, cookieOptions);

    // Send response
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        profilePicture: user.profilePicture
      }
    });
  } catch (err) {
    // Clean up uploaded file if user creation fails
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.filename); 
    }
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/v1/users/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.cookie('token', token, cookieOptions);

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        profilePicture: user.profilePicture
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user
// @route   GET /api/v1/users/logout
// @access  Private
export const logoutUser = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    // const users = await User.find().select('-password');
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user (Admin only)
// @route   GET /api/v1/users/:id
// @access  Private/Admin
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/v1/users/:id
// @access  Private/Admin

// export const updateUser = async (req, res, next) => {
//   try {
//     const user = await User.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true
//     }).select('-password');

//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     res.status(200).json({
//       success: true,
//       data: user
//     });
//   } catch (err) {
//     next(err);
//   }
// };




export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Handle file upload if exists
    if (req.file) {
      // First get current user to check existing image
      const currentUser = await User.findById(id);
      
      // Delete old image from Cloudinary if it's not the default
      if (currentUser.profilePicture && 
          !currentUser.profilePicture.includes('default-profile')) {
        const publicId = currentUser.profilePicture
          .split('/')
          .pop()
          .split('.')[0];
        await cloudinary.uploader.destroy(`user-profiles/${publicId}`);
      }

      // Upload new image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'user-profiles',
        width: 500,
        height: 500,
        crop: 'fill'
      });
      updateData.profilePicture = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      // Clean up uploaded file if user not found
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    // Clean up uploaded file if error occurs
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    next(err);
  }
};



// @desc    Delete user (Admin only)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/users/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};








//config
//cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

export default cloudinary;




//middlewares
// uploadMiddleware.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'user-profiles',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export default upload;


