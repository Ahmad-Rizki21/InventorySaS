import { prisma } from '../config/database.js';

// Get Activity Logs with pagination and filters
export async function getActivityLogs(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      startDate,
      endDate,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get logs with user info
    const [logs, total] = await Promise.all([
      prisma.activitylog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },

          },
        },
      }),
      prisma.activitylog.count({ where }),
    ]);

    res.json({
      data: logs,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil activity log' });
  }
}

// Get Activity Log by ID
export async function getActivityLogById(req, res) {
  try {
    const { id } = req.params;

    const log = await prisma.activitylog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            roleLegacy: true,
            role: true,
          },

        },
      },
    });

    if (!log) {
      return res.status(404).json({ message: 'Activity log tidak ditemukan' });
    }

    res.json(log);
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil activity log' });
  }
}

// Get available action types
export async function getActionTypes(req, res) {
  try {
    // Get distinct action types
    const actions = await prisma.activitylog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    });

    res.json(actions.map(a => a.action));
  } catch (error) {
    console.error('Get action types error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil action types' });
  }
}

// Create Activity Log (helper function)
export async function createActivityLog(userId, action, description, metadata = {}) {
  try {
    await prisma.activitylog.create({
      data: {
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        action,
        description,
        metadata: JSON.stringify(metadata),
      },
    });
  } catch (error) {
    console.error('Create activity log error:', error);
  }
}