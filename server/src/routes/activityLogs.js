import express from 'express';
import {
  getActivityLogs,
  getActivityLogById,
  getActionTypes,
} from '../controllers/activityLogController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get activity logs with pagination and filters
router.get('/', getActivityLogs);

// Get activity log by ID
router.get('/:id', getActivityLogById);

// Get available action types
router.get('/meta/actions', getActionTypes);

export default router;
