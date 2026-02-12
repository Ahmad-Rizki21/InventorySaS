import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getStocks,
  stockIn,
  stockOut,
  getStockByProduct,
} from '../controllers/stockController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getStocks);
router.get('/product/:productId', getStockByProduct);
router.post('/in', stockIn);
router.post('/out', stockOut);

export default router;
