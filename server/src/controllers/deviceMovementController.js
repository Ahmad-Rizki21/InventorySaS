import prisma from '../config/database.js';
import { createHistoryRecord, createMovementRecord } from '../services/itemHistoryService.js';

// Record device movement
export const recordDeviceMovement = async (req, res) => {
  try {
    const { id } = req.params; // item id
    const { fromLocation, toLocation, fromStatus, toStatus, notes, type } = req.body;

    // Validate item exists
    const item = await prisma.itemdetail.findUnique({
      where: { id },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Update the item status if provided
    if (toStatus) {
      await prisma.itemdetail.update({
        where: { id },
        data: { status: toStatus },
      });
    }

    // Create movement record
    const movement = await createMovementRecord({
      itemId: id,
      fromLocation,
      toLocation,
      fromStatus,
      toStatus,
      notes,
      type,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Create audit log for device movement
    if (req.user) {
      const { createAuditLog } = await import('../services/auditService.js');
      await createAuditLog({
        userId: req.user.id,
        action: 'MOVE',
        entity: 'ITEM',
        entityId: id,
        description: `Pergerakan item "${item.serialNumber}" dari ${fromLocation || '?' } ke ${toLocation || '?' }`,
        metadata: {
          fromLocation,
          toLocation,
          fromStatus,
          toStatus,
          notes,
          type,
          serialNumber: item.serialNumber,
          movedBy: req.user.name,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.status(201).json(movement);
  } catch (error) {
    console.error('Error recording device movement:', error);
    res.status(500).json({ error: 'Failed to record device movement' });
  }
};

// Get device movement history
export const getDeviceMovementHistory = async (req, res) => {
  try {
    const { id } = req.params; // item id

    // Validate item exists
    const item = await prisma.itemdetail.findUnique({
      where: { id },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Get movement history
    const movements = await prisma.itemhistory.findMany({
      where: {
        itemId: id,
        action: 'MOVE',
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

    res.json(movements);
  } catch (error) {
    console.error('Error getting device movement history:', error);
    res.status(500).json({ error: 'Failed to get device movement history' });
  }
};