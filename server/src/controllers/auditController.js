import { getAllAuditLogs, getEntityAuditLogs as getEntityAuditLogsFromService } from '../services/auditService.js';

// Get all audit logs with filtering and pagination
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, entity, action, userId } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    if (entity) options.entity = entity;
    if (action) options.action = action;
    if (userId) options.userId = userId;

    const result = await getAllAuditLogs(options);

    res.json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

// Get audit logs for a specific entity
export const getEntityAuditLogs = async (req, res) => {
  try {
    const { entity, entityId } = req.params;

    const logs = await getEntityAuditLogsFromService(entity, entityId);

    res.json(logs);
  } catch (error) {
    console.error('Error fetching entity audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch entity audit logs' });
  }
};

// Get audit logs for a specific user
export const getUserAuditLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, entity, action } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      userId,
    };

    if (entity) options.entity = entity;
    if (action) options.action = action;

    const result = await getAllAuditLogs(options);

    res.json(result);
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch user audit logs' });
  }
};