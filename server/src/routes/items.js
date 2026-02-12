import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getItems,
  getItemById,
  getItemBySerialNumber,
  createItem,
  updateItemStatus,
  updateItem,
  deleteItem,
  importItems,
} from '../controllers/itemController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getItems);
router.get('/scan/:sn', getItemBySerialNumber);
router.get('/:id', getItemById);
router.post('/', createItem);
router.post('/import', importItems);
router.put('/:id/status', updateItemStatus);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
