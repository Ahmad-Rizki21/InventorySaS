import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import {
  getProductsSat,
  createProductSat,
  updateProductSat,
  deleteProductSat
} from '../controllers/productSatController.js';
import {
  getSatDashboardStats
} from '../controllers/satDashboardController.js';
import {
  getItemsSat,
  createItemSat,
  updateItemSat,
  deleteItemSat,
  importItemsSat,
  exportItemsSat,
  downloadTemplateSat
} from '../controllers/itemSatController.js';
import {
  satStockIn,
  satStockOut
} from '../controllers/satStockController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

// Dashboard SAT Route
router.get('/dashboard', getSatDashboardStats);

// Product SAT Routes
router.get('/products', getProductsSat);
router.post('/products', createProductSat);
router.put('/products/:id', updateProductSat);
router.delete('/products/:id', deleteProductSat);

// Item SAT Routes
router.post('/items/import', upload.single('file'), importItemsSat);
router.get('/items/export', exportItemsSat);
router.get('/items/template', downloadTemplateSat);
router.get('/items', getItemsSat);
router.post('/items', createItemSat);
router.put('/items/:id', updateItemSat);
router.delete('/items/:id', deleteItemSat);

// Stock In/Out SAT Routes
router.post('/stock-in', satStockIn);
router.post('/stock-out', satStockOut);

export default router;
