//projectRoutes.js

import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projectController.js';

const router = express.Router();



// Routes
// Get all projects
router.get('/',protect,authorize('admin','manager'), getAllProjects);

// Get single project by ID
router.get('/:id',protect,authorize('admin','manager'), getProjectById);

// Create a new project
router.post('/',protect,authorize('admin'), createProject);

// Update a project
router.put('/:id',protect,authorize('admin'), updateProject);

// Delete a project
router.delete('/:id',protect,authorize('admin'), deleteProject);



export default router;