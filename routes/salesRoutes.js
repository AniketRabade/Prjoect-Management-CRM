//saleRoutes.js

import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import {
  getAllSales,
  getSalesStats,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  getMySales,
  getSalesByProject,
  getSalesByClient,
  getSalesByDateRange
} from '../controllers/saleController.js';

const router = express.Router();

router.use(protect);

// Get all sales (admin/manager only)
router.get('/', authorize('admin', 'manager'), getAllSales);

// Get sales statistics (admin/manager only)
router.get('/stats', authorize('admin', 'manager'), getSalesStats);

// Get sales by date range (admin/manager only)
router.get('/date-range', authorize('admin', 'manager'), getSalesByDateRange);

// Get my sales (for logged in salesperson)
router.get('/my-sales', getMySales);

// Get sales by project
router.get('/project/:projectId', authorize('admin', 'manager'), getSalesByProject);

// Get sales by client
router.get('/client/:clientId', authorize('admin', 'manager'), getSalesByClient);

// Create sale (admin/manager/salesperson)
router.post('/', authorize('admin', 'manager', 'employee'), createSale);

// Get single sale
router.get('/:id', getSaleById);

// Update sale (admin/manager/salesperson who created it)
router.put('/:id', authorize('admin', 'manager', 'employee'), updateSale);

// Delete sale (admin only)
router.delete('/:id', authorize('admin'), deleteSale);





export default router;