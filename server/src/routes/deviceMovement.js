import express from 'express';
import { recordDeviceMovement, getDeviceMovementHistory } from '../controllers/deviceMovementController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Record device movement (from Gudang -> Teknisi -> Terpasang, etc.)
router.post('/items/:id/move', authenticateToken, recordDeviceMovement);

// Get device movement history
router.get('/items/:id/movements', authenticateToken, getDeviceMovementHistory);

export default router;