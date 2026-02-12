import prisma from '../config/database.js';

export const getSatDashboardStats = async (req, res) => {
  try {
    const totalUnits = await prisma.item_sat.count();
    
    // Status distribution
    const statsByStatus = await prisma.item_sat.groupBy({
      by: ['status'],
      _count: true,
    });

    // Brand distribution
    const statsByBrand = await prisma.item_sat.groupBy({
      by: ['brandToko'],
      _count: true,
    });

    // Recent activities (from item_sat directly or activity log)
    const recentItems = await prisma.item_sat.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: { product: true }
    });

    // Formatted stats for status
    const statusCounts = statsByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {});

    res.json({
      totalUnits,
      statusCounts,
      brandCounts: statsByBrand,
      recentItems
    });
  } catch (error) {
    console.error('Error fetching SAT dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
