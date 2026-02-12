import prisma from '../config/database.js';

// Get item history by item ID
const getItemHistory = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { page = 1, limit = 10, action } = req.query;

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

    res.json({
      data: histories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get item history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all item histories with filtering
const getAllHistories = async (req, res) => {
  try {
    const { page = 1, limit = 10, action, itemId, userId } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};

    if (action) whereClause.action = action;
    if (itemId) whereClause.itemId = itemId;
    if (userId) whereClause.userId = userId;

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
        },
        item: {
          include: {
            product: true
          }
        }
      }
    });

    const total = await prisma.itemhistory.count({
      where: whereClause
    });

    res.json({
      data: histories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all histories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export { 
  getItemHistory,
  getAllHistories 
};