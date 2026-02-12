import prisma from '../config/database.js';
import { createHistoryRecord } from '../services/itemHistoryService.js';
import { createAuditLog, generateAuditDescription } from '../services/auditService.js';

// Get all items
export const getItems = async (req, res) => {
  try {
    const { status, productId, search } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (productId) {
      where.productId = productId;
    }
    if (search) {
      where.OR = [
        { serialNumber: { contains: search } },
        { macAddress: { contains: search } },
      ];
    }

    const items = await prisma.itemdetail.findMany({
      where,
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

// Get item by ID
export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.itemdetail.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
};

// Find item by serial number (for scanner)
export const getItemBySerialNumber = async (req, res) => {
  try {
    const { sn } = req.params;

    const item = await prisma.itemdetail.findUnique({
      where: { serialNumber: sn },
      include: {
        product: true,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error finding item by serial number:', error);
    res.status(500).json({ error: 'Failed to find item' });
  }
};

// Create new item (register SN)
export const createItem = async (req, res) => {
  try {
    const { productId, serialNumber, macAddress, purchaseDate, notes } = req.body;

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if serial number already exists
    const existingSN = await prisma.itemdetail.findUnique({
      where: { serialNumber },
    });

    if (existingSN) {
      return res.status(400).json({ error: 'Serial number already exists' });
    }

    // Check if MAC address already exists (if provided)
    if (macAddress) {
      const existingMAC = await prisma.itemdetail.findUnique({
        where: { macAddress },
      });
      if (existingMAC) {
        return res.status(400).json({ error: 'MAC address already exists' });
      }
    }

    const item = await prisma.itemdetail.create({
      data: {
        productId,
        serialNumber,
        macAddress,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        notes,
        status: 'GUDANG',
      },
      include: {
        product: true,
      },
    });

    // Create history record for creation
    await createHistoryRecord({
      itemId: item.id,
      action: 'CREATE',
      notes: 'Item created',
      userId: req.user?.id, // assuming user info is available in req.user
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Create audit log for item creation
    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'CREATE',
        entity: 'ITEM',
        entityId: item.id,
        description: generateAuditDescription('ITEM', 'CREATE', null, item),
        metadata: {
          createdValues: { 
            serialNumber: item.serialNumber, 
            macAddress: item.macAddress, 
            status: item.status, 
            purchaseDate: item.purchaseDate, 
            notes: item.notes 
          },
          createdBy: req.user.name,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
};

// Update item status
export const updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, lastKnownLat, lastKnownLng } = req.body;

    const validStatuses = ['GUDANG', 'TERPASANG', 'RUSAK', 'TEKNISI'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get current item to compare values
    const currentItem = await prisma.itemdetail.findUnique({
      where: { id },
    });

    if (!currentItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = await prisma.itemdetail.update({
      where: { id },
      data: {
        status,
        lastKnownLat,
        lastKnownLng,
      },
      include: {
        product: true,
      },
    });
    
    // Create audit log for item status update
    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'UPDATE_STATUS',
        entity: 'ITEM',
        entityId: item.id,
        description: generateAuditDescription('ITEM', 'UPDATE_STATUS', currentItem, item),
        metadata: {
          oldStatus: currentItem.status,
          newStatus: status,
          serialNumber: item.serialNumber,
          productName: item.product.name,
          updatedBy: req.user.name,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.json(item);
  } catch (error) {
    console.error('Error updating item status:', error);
    res.status(500).json({ error: 'Failed to update item status' });
  }
};

// Update item
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { serialNumber, macAddress, status, purchaseDate, notes } = req.body;

    // Check if item exists
    const existing = await prisma.itemdetail.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check for conflicts
    if (serialNumber && serialNumber !== existing.serialNumber) {
      const snConflict = await prisma.itemdetail.findUnique({
        where: { serialNumber },
      });
      if (snConflict) {
        return res.status(400).json({ error: 'Serial number already exists' });
      }
    }

    if (macAddress && macAddress !== existing.macAddress) {
      const macConflict = await prisma.itemdetail.findUnique({
        where: { macAddress },
      });
      if (macConflict) {
        return res.status(400).json({ error: 'MAC address already exists' });
      }
    }

    // Prepare update data
    const updateData = {};
    if (serialNumber) updateData.serialNumber = serialNumber;
    if (macAddress !== undefined) updateData.macAddress = macAddress; // Allow null
    if (status) updateData.status = status;
    if (purchaseDate !== undefined) updateData.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    if (notes !== undefined) updateData.notes = notes; // Allow null

    const item = await prisma.itemdetail.update({
      where: { id },
      data: updateData,
      include: {
        product: true,
      },
    });

    // Create history records for each field that was updated
    if (serialNumber && serialNumber !== existing.serialNumber) {
      await createHistoryRecord({
        itemId: item.id,
        action: 'UPDATE_SN',
        oldValue: existing.serialNumber,
        newValue: serialNumber,
        field: 'serialNumber',
        notes: `Serial number updated from ${existing.serialNumber} to ${serialNumber}`,
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    if (macAddress !== undefined && macAddress !== existing.macAddress) {
      await createHistoryRecord({
        itemId: item.id,
        action: 'UPDATE_MAC',
        oldValue: existing.macAddress,
        newValue: macAddress,
        field: 'macAddress',
        notes: `MAC address updated from ${existing.macAddress} to ${macAddress}`,
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    if (status && status !== existing.status) {
      await createHistoryRecord({
        itemId: item.id,
        action: 'UPDATE_STATUS',
        oldValue: existing.status,
        newValue: status,
        field: 'status',
        notes: `Status updated from ${existing.status} to ${status}`,
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    if (purchaseDate !== undefined && purchaseDate !== existing.purchaseDate) {
      await createHistoryRecord({
        itemId: item.id,
        action: 'UPDATE_PURCHASE_DATE',
        oldValue: existing.purchaseDate ? new Date(existing.purchaseDate).toISOString() : null,
        newValue: purchaseDate ? new Date(purchaseDate).toISOString() : null,
        field: 'purchaseDate',
        notes: `Purchase date updated from "${existing.purchaseDate}" to "${purchaseDate}"`,
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    if (notes !== undefined && notes !== existing.notes) {
      await createHistoryRecord({
        itemId: item.id,
        action: 'UPDATE_NOTES',
        oldValue: existing.notes,
        newValue: notes,
        field: 'notes',
        notes: `Notes updated from "${existing.notes}" to "${notes}"`,
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    // Create audit log for item update
    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'ITEM',
        entityId: item.id,
        description: generateAuditDescription('ITEM', 'UPDATE', existing, item),
        metadata: {
          oldValues: { 
            serialNumber: existing.serialNumber, 
            macAddress: existing.macAddress, 
            status: existing.status, 
            purchaseDate: existing.purchaseDate, 
            notes: existing.notes 
          },
          newValues: { 
            serialNumber: item.serialNumber, 
            macAddress: item.macAddress, 
            status: item.status, 
            purchaseDate: item.purchaseDate, 
            notes: item.notes 
          },
          updatedBy: req.user.name,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
};

// Delete item
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the item before deletion to store its data in history
    const item = await prisma.itemdetail.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await prisma.itemdetail.delete({
      where: { id },
    });

    // Create audit log for item deletion
    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'DELETE',
        entity: 'ITEM',
        entityId: item.id,
        description: generateAuditDescription('ITEM', 'DELETE', item, { deletedBy: req.user.name }),
        metadata: {
          deletedValues: { 
            serialNumber: item.serialNumber, 
            macAddress: item.macAddress, 
            status: item.status, 
            purchaseDate: item.purchaseDate, 
            notes: item.notes 
          },
          deletedBy: req.user.name,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
};
// Bulk import items from Excel
export const importItems = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Process each item
    for (let i = 0; i < items.length; i++) {
      const itemData = items[i];
      try {
        const { productSku, serialNumber, macAddress, status, purchaseDate, notes } = itemData;

        if (!productSku || !serialNumber) {
          results.failed++;
          results.errors.push(`Baris ${i + 1}: SKU atau Serial Number kosong`);
          continue;
        }

        // Find product by SKU
        const product = await prisma.product.findUnique({
          where: { sku: productSku },
        });

        if (!product) {
          results.failed++;
          results.errors.push(`Baris ${i + 1}: Produk dengan SKU "${productSku}" tidak ditemukan`);
          continue;
        }

        // Check if serial number already exists
        const existingSN = await prisma.itemdetail.findUnique({
          where: { serialNumber },
        });

        if (existingSN) {
          results.failed++;
          results.errors.push(`Baris ${i + 1}: Serial Number "${serialNumber}" sudah terdaftar (Duplikat)`);
          continue;
        }

        // Check if MAC address already exists
        if (macAddress) {
          const existingMAC = await prisma.itemdetail.findUnique({
            where: { macAddress },
          });
          if (existingMAC) {
            results.failed++;
            results.errors.push(`Baris ${i + 1}: MAC Address "${macAddress}" sudah terdaftar (Duplikat)`);
            continue;
          }
        }

        // Create item (Let Prisma handle the ID via cuid() or generate it with index and timestamp)
        const newItem = await prisma.itemdetail.create({
          data: {
            id: `ITM-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
            productId: product.id,
            serialNumber,
            macAddress: macAddress || null,
            status: (status || 'GUDANG').toUpperCase(),
            purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
            notes: notes || null,
          },
          include: {
            product: true,
          },
        });

        // Create history record
        await createHistoryRecord({
          itemId: newItem.id,
          action: 'IMPORT',
          notes: 'Item imported from Excel',
          userId: req.user?.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        // Create audit log
        if (req.user) {
          await createAuditLog({
            userId: req.user.id,
            action: 'CREATE',
            entity: 'ITEM',
            entityId: newItem.id,
            description: `Import item: ${newItem.serialNumber} (${newItem.product.name})`,
            metadata: {
              importAction: 'EXCEL_IMPORT',
              itemData: {
                serialNumber: newItem.serialNumber,
                macAddress: newItem.macAddress,
                status: newItem.status,
              },
              importedBy: req.user.name,
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
          });
        }

        results.success++;
      } catch (itemError) {
        console.error('Error processing import item:', itemError);
        results.failed++;
        results.errors.push(`Internal error for item ${itemData.serialNumber}: ${itemError.message}`);
      }
    }

    res.json({
      message: `Import selesai: ${results.success} berhasil, ${results.failed} gagal`,
      results,
    });
  } catch (error) {
    console.error('Error importing items:', error);
    res.status(500).json({ error: 'Failed to import items' });
  }
};
