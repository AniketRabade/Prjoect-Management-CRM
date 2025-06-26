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








