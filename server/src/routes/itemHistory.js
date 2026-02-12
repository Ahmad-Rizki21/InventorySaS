import express from 'express';
import { getItemHistory, getAllHistories } from '../controllers/itemHistoryController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get history for a specific item
router.get('/items/:itemId/history', authenticateToken, getItemHistory);

// Get all histories with optional filters
router.get('/histories', authenticateToken, getAllHistories);

export default router;