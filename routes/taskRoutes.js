//taskRoutes.js
import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getMyTasks,
  getTasksByProject,
  updateTaskStatus
} from '../controllers/taskController.js';

const router = express.Router();


// All routes are protected
router.use(protect);

// Get all tasks (admin/manager only)
router.get('/', authorize('admin', 'manager'), getAllTasks);

// Get my tasks (for logged in user)
router.get('/my-tasks', getMyTasks);

// Get tasks by project
router.get('/project/:projectId',authorize('admin', 'manager'), getTasksByProject);

// Create task (admin/manager only)
router.post('/', authorize('admin', 'manager'), createTask);

// Get single task
router.get('/:id', getTaskById);

// Update task
router.put('/:id', updateTask);

// Update task status only
router.patch('/:id/status', updateTaskStatus);

// Delete task (admin/manager only)
router.delete('/:id', authorize('admin', 'manager'), deleteTask);

export default router;

