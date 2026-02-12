import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  importProducts,
} from '../controllers/productController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.post('/import', importProducts);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
