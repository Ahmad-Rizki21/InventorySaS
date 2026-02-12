import prisma from '../config/database.js';

// Create history record
export const createHistoryRecord = async (historyData) => {
  try {
    const history = await prisma.itemhistory.create({
      data: {
        id: `HST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        itemId: historyData.itemId,
        action: historyData.action,
        oldValue: historyData.oldValue || null,
        newValue: historyData.newValue || null,
        field: historyData.field || null,
        notes: historyData.notes || null,
        userId: historyData.userId || null,
        ipAddress: historyData.ipAddress || null,
        userAgent: historyData.userAgent || null,
      }
    });
    return history;
  } catch (error) {
    console.error('Error creating history record:', error);
    throw error;
  }
};

// Get item history
export const getItemHistory = async (itemId) => {
  try {
    const histories = await prisma.itemhistory.findMany({
      where: { itemId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    return histories;
  } catch (error) {
    console.error('Error getting item history:', error);
    throw error;
  }
};

// Get item history with pagination
export const getItemHistoryWithPagination = async (itemId, options = {}) => {
  const { page = 1, limit = 10, action } = options;
  
  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = { itemId };

    if (action) {
      whereClause.action = action;
    }

    const histories = await prisma.itemhistory.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const total = await prisma.itemhistory.count({
      where: whereClause
    });

    return {
      data: histories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting item history with pagination:', error);
    throw error;
  }
};

// Create movement record
export const createMovementRecord = async (movementData) => {
  try {
    const history = await prisma.itemhistory.create({
      data: {
        id: `MV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        itemId: movementData.itemId,
        action: 'MOVE',
        oldValue: movementData.fromLocation || movementData.fromStatus,
        newValue: movementData.toLocation || movementData.toStatus,
        field: movementData.type || 'location_status',
        notes: movementData.notes || `Pergerakan dari ${movementData.fromLocation || movementData.fromStatus} ke ${movementData.toLocation || movementData.toStatus}`,
        userId: movementData.userId || null,
        ipAddress: movementData.ipAddress || null,
        userAgent: movementData.userAgent || null,
      }
    });
    return history;
  } catch (error) {
    console.error('Error creating movement record:', error);
    throw error;
  }
};

// Get movement history for an item
export const getMovementHistory = async (itemId) => {
  try {
    const movements = await prisma.itemhistory.findMany({
      where: {
        itemId,
        action: 'MOVE'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    return movements;
  } catch (error) {
    console.error('Error getting movement history:', error);
    throw error;
  }
};