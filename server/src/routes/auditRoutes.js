import express from 'express';
import { getAuditLogs, getEntityAuditLogs, getUserAuditLogs } from '../controllers/auditController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all audit logs (requires authentication)
router.get('/logs', authenticateToken, getAuditLogs);

// Get audit logs for a specific entity
router.get('/logs/:entity/:entityId', authenticateToken, getEntityAuditLogs);

// Get audit logs for a specific user
router.get('/users/:userId/logs', authenticateToken, getUserAuditLogs);

export default router;