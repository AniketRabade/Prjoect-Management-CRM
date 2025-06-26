// leadRoutes.js
import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  getMyLeads,
  convertLeadToClient,
  getLeadsByStatus,
  getLeadsBySource,
  getLeadsStats,
  getRecentLeads,
  updateLeadStatus,
  assignLead
} from '../controllers/leadController.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Lead CRUD Operations
router.post('/', authorize('admin', 'manager', 'employee'), createLead);
router.get('/', authorize('admin', 'manager'), getAllLeads);
// Personal Lead Views
router.get('/my-leads', getMyLeads);
router.get('/:id', getLeadById);
router.put('/:id', authorize('admin', 'manager', 'employee'), updateLead);
router.delete('/:id', authorize('admin', 'manager'), deleteLead);

// Lead Conversion
// router.post('/:id/convert', authorize('admin', 'manager'), convertLeadToClient);

// Lead Assignment
router.put('/:id/assign', authorize('admin', 'manager'), assignLead);

// Status Management
router.patch('/:id/status', authorize('admin', 'manager', 'employee'), updateLeadStatus);

// Filtered Lead Views
router.get('/status/:status', authorize('admin', 'manager'), getLeadsByStatus);
router.get('/source/:source', authorize('admin', 'manager'), getLeadsBySource);
router.get('/stats/overview', authorize('admin', 'manager'), getLeadsStats);
router.get('/recent/:limit', authorize('admin', 'manager'), getRecentLeads);



export default router;