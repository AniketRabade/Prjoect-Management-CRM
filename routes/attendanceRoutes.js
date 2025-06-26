import express from 'express';
import { 
  checkIn, 
  checkOut,
  getAttendance,
  getUserAttendance,
  updateAttendance,
  deleteAttendance,
  updateStatus,
  bulkUpdateStatus,
  getAttendanceStats
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Employee routes
router.post('/check-in', protect, checkIn);
router.put('/check-out', protect, checkOut);
router.get('/my-attendance', protect, getUserAttendance);

// Admin/Manager routes
router.get('/', protect, authorize('admin', 'manager'), getAttendance);
router.get('/stats', protect, authorize('admin', 'manager'), getAttendanceStats);
router.put('/:id', protect, authorize('admin'), updateAttendance);
router.patch('/:id/status', protect, authorize('admin'), updateStatus);
router.post('/bulk-status', protect, authorize('admin'), bulkUpdateStatus);
router.delete('/:id', protect, authorize('admin'), deleteAttendance);

export default router;