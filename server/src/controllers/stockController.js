import prisma from '../config/database.js';
import { createAuditLog, generateAuditDescription } from '../services/auditService.js';

// Get all stocks
export const getStocks = async (req, res) => {
  try {
    const { warehouseId } = req.query;

    const where = {};
    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const stocks = await prisma.stock.findMany({
      where,
      include: {
        product: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json(stocks);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
};

// Stock in - Add stock
export const stockIn = async (req, res) => {
  try {
    const { productId, warehouseId, quantity } = req.body;

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if stock record exists for this product and warehouse
    const existingStock = await prisma.stock.findFirst({
      where: {
        productId,
        warehouseId: warehouseId || 'WH-001',
      },
    });

    let stock;
    let actionType = '';
    let oldQuantity = 0;
    
    if (existingStock) {
      // Update existing stock
      oldQuantity = existingStock.quantity;
      stock = await prisma.stock.update({
        where: { id: existingStock.id },
        data: {
          quantity: {
            increment: quantity,
          },
        },
        include: {
          product: true,
        },
      });
      actionType = 'UPDATE'; // Stock was updated
    } else {
      // Create new stock record
      stock = await prisma.stock.create({
        data: {
          id: `STK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productId,
          warehouseId: warehouseId || 'WH-001',
          quantity,
        },
        include: {
          product: true,
        },
      });
      actionType = 'CREATE'; // New stock record was created
    }

    // Create audit log for stock in
    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: actionType === 'CREATE' ? 'CREATE' : 'STOCK_IN',
        entity: 'STOCK',
        entityId: stock.id,
        description: generateAuditDescription('STOCK', actionType === 'CREATE' ? 'CREATE' : 'STOCK_IN', 
          actionType === 'UPDATE' ? { ...existingStock, product } : null, 
          { ...stock, updatedBy: req.user.name }),
        metadata: {
          productId: stock.productId,
          warehouseId: stock.warehouseId,
          oldQuantity: actionType === 'UPDATE' ? oldQuantity : 0,
          newQuantity: stock.quantity,
          addedQuantity: quantity,
          actionType: actionType,
          updatedBy: req.user.name,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.status(201).json(stock);
  } catch (error) {
    console.error('Error processing stock in:', error);
    res.status(500).json({ error: 'Failed to process stock in' });
  }
};

// Stock out - Remove stock
export const stockOut = async (req, res) => {
  try {
    const { productId, warehouseId, quantity } = req.body;

    // Find stock record
    const stock = await prisma.stock.findFirst({
      where: {
        productId,
        warehouseId: warehouseId || 'WH-001',
      },
    });

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    if (stock.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Update stock
    const updatedStock = await prisma.stock.update({
      where: { id: stock.id },
      data: {
        quantity: {
          decrement: quantity,
        },
      },
      include: {
        product: true,
      },
    });

    // Create audit log for stock out
    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'STOCK_OUT',
        entity: 'STOCK',
        entityId: updatedStock.id,
        description: generateAuditDescription('STOCK', 'STOCK_OUT', 
          { ...stock, product: stock.product }, 
          { ...updatedStock, updatedBy: req.user.name }),
        metadata: {
          productId: updatedStock.productId,
          warehouseId: updatedStock.warehouseId,
          oldQuantity: stock.quantity,
          newQuantity: updatedStock.quantity,
          removedQuantity: quantity,
          updatedBy: req.user.name,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.json(updatedStock);
  } catch (error) {
    console.error('Error processing stock out:', error);
    res.status(500).json({ error: 'Failed to process stock out' });
  }
};

// Get stock by product
export const getStockByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const stocks = await prisma.stock.findMany({
      where: { productId },
      include: {
        product: true,
      },
    });

    res.json(stocks);
  } catch (error) {
    console.error('Error fetching stock by product:', error);
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
};
