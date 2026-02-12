import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getStats,
  getLowStock,
  getByCategory,
  getStockTrend,
  getRecentActivities,
} from '../controllers/dashboardController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/stats', getStats);
router.get('/low-stock', getLowStock);
router.get('/by-category', getByCategory);
router.get('/stock-trend', getStockTrend);
router.get('/recent-activities', getRecentActivities);

export default router;
