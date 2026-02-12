import prisma from '../config/database.js';

// Get overall inventory statistics
export const getStats = async (req, res) => {
  try {
    // Total products
    const totalProducts = await prisma.product.count();

    // Total items (SN-based)
    const totalItems = await prisma.itemdetail.count();

    // Items by status
    const itemsByStatus = await prisma.itemdetail.groupBy({
      by: ['status'],
      _count: true,
    });

    // Total stock quantity (non-SN items)
    const stocks = await prisma.stock.findMany();
    const totalStockQuantity = stocks.reduce((sum, stock) => sum + stock.quantity, 0);

    // Low stock items (less than 10)
    const lowStockItems = await prisma.stock.findMany({
      where: {
        quantity: {
          lt: 10,
        },
      },
      include: {
        product: true,
      },
    });

    // Items by category
    const productsByCategory = await prisma.product.groupBy({
      by: ['category'],
      _count: true,
    });

    res.json({
      totalProducts,
      totalItems,
      itemsByStatus: itemsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      totalStockQuantity,
      lowStockCount: lowStockItems.length,
      productsByCategory: productsByCategory.reduce((acc, item) => {
        acc[item.category] = item._count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Get low stock items
export const getLowStock = async (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold) || 10;

    const lowStockItems = await prisma.stock.findMany({
      where: {
        quantity: {
          lt: threshold,
        },
      },
      include: {
        product: true,
      },
      orderBy: {
        quantity: 'asc',
      },
    });

    res.json(lowStockItems);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
};

// Get stock by category
export const getByCategory = async (req, res) => {
  try {
    // Get all products with their stock counts
    const products = await prisma.product.findMany({
      include: {
        stock: true,
        itemdetail: {
          select: {
            status: true,
          },
        },
      },
    });

    // Aggregate by category
    const categoryData = products.reduce((acc, product) => {
      const category = product.category;
      if (!acc[category]) {
        acc[category] = {
          category,
          productCount: 0,
          totalStock: 0,
          itemCount: 0,
          itemsByStatus: { GUDANG: 0, TERPASANG: 0, RUSAK: 0, TEKNISI: 0 },
        };
      }

      acc[category].productCount += 1;
      acc[category].itemCount += product.itemdetail.length;

      // Sum up stock quantities
      product.stock.forEach((stock) => {
        acc[category].totalStock += stock.quantity;
      });

      // Count items by status
      product.itemdetail.forEach((item) => {
        acc[category].itemsByStatus[item.status] += 1;
      });

      return acc;
    }, {});

    // Convert to array
    const result = Object.values(categoryData);

    res.json(result);
  } catch (error) {
    console.error('Error fetching category data:', error);
    res.status(500).json({ error: 'Failed to fetch category data' });
  }
};

// Get stock trend (for charts)
export const getStockTrend = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        stock: true,
        itemdetail: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const stockData = products.map((product) => {
      const totalStock = product.stock.reduce((sum, stock) => sum + stock.quantity, 0);
      const itemCount = product.itemdetail.length;
      const availableItems = product.itemdetail.filter((item) => item.status === 'GUDANG').length;

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        unit: product.unit,
        stockLevel: product.unit === 'Pcs' ? itemCount : totalStock,
        availableItems,
        deployedItems: product.itemdetail.filter((item) => item.status === 'TERPASANG').length,
      };
    });

    res.json(stockData);
  } catch (error) {
    console.error('Error fetching stock trend:', error);
    res.status(500).json({ error: 'Failed to fetch stock trend' });
  }
};

// Get recent activities
export const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recently updated items
    const recentItems = await prisma.itemdetail.findMany({
      take: limit,
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        product: true,
      },
    });

    // Get recently updated stocks
    const recentStocks = await prisma.stock.findMany({
      take: limit,
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        product: true,
      },
    });

    // Combine and format activities
    const activities = [
      ...recentItems.map((item) => ({
        type: 'item',
        id: item.id,
        description: `${item.product.name} - SN: ${item.serialNumber}`,
        status: item.status,
        timestamp: item.updatedAt,
      })),
      ...recentStocks.map((stock) => ({
        type: 'stock',
        id: stock.id,
        description: `${stock.product.name} - Stock updated to ${stock.quantity} ${stock.product.unit}`,
        timestamp: stock.updatedAt,
      })),
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
};
