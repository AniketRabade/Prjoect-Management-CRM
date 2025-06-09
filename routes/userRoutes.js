const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const {
  registerUser,
  loginUser,
  logoutUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getMe
} = require('../controllers/userController');

const router = express.Router();

router.post('/login', loginUser);
router.get('/logout', protect, logoutUser);
router.get('/me', protect, getMe);

// Admin only routes
router.post('/register', registerUser);
// router.post('/register', protect, authorize('admin'), registerUser);
router.get('/', protect, authorize('admin'), getUsers);
router.get('/:id', protect, authorize('admin'), getUser);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;