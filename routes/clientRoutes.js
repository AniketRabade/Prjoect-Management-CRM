//cientRoutes.js
import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import {
  addClient,
  deleteClient,
  updateClient,
  getAllClients,
  getClientById
} from '../controllers/clientControllers.js';

const router = express.Router();


// Add client
router.post('/add',protect,authorize('admin','manager'), addClient);

// Delete client
router.delete('/:id',protect, authorize('admin','manager'), deleteClient);

// Update client
router.put('/:id',protect, authorize('admin','manager'),updateClient);

// Get all clients
router.get('/',protect,authorize('admin','manager'), getAllClients);

// Get single client
router.get('/:id',protect, authorize('admin','manager'), getClientById);


export default router;
