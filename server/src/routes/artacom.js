import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { syncFromArtacom, getArtacomInventory, getSyncStatus, getSyncHistory } from '../controllers/artacomController.js';

const router = express.Router();

router.use(authenticateToken);

// Sync inventory from Artacom to local database
router.post('/sync', syncFromArtacom);

// Get inventory items from Artacom API
router.get('/inventory', getArtacomInventory);

// Get sync status
router.get('/status', getSyncStatus);

// Get sync history
router.get('/history', getSyncHistory);

export default router;