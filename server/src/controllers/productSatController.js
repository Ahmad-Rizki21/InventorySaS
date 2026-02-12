import prisma from '../config/database.js';
import { createAuditLog } from '../services/auditService.js';

export const getProductsSat = async (req, res) => {
  try {
    const { search } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    const products = await prisma.product_sat.findMany({
      where,
      include: {
        items: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const productsWithStats = products.map((product) => {
      const itemCount = product.items.length;
      const availableItems = product.items.filter((item) => item.status === 'GUDANG').length;
      const deployedItems = product.items.filter((item) => item.status === 'TERPASANG').length;

      return {
        ...product,
        itemCount,
        availableItems,
        deployedItems,
      };
    });

    res.json(productsWithStats);
  } catch (error) {
    console.error('Error fetching SAT products:', error);
    res.status(500).json({ error: 'Failed to fetch SAT products' });
  }
};

export const createProductSat = async (req, res) => {
  try {
    const { sku, name } = req.body;

    const existing = await prisma.product_sat.findUnique({
      where: { sku },
    });

    if (existing) {
      return res.status(400).json({ error: 'SKU already exists' });
    }

    const product = await prisma.product_sat.create({
      data: {
        sku,
        name,
      },
    });

    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'CREATE',
        entity: 'PRODUCT_SAT',
        entityId: product.id,
        description: `Membuat produk SAT baru: ${product.name} (${product.sku})`,
        metadata: {
          createdValues: { sku: product.sku, name: product.name },
          createdBy: req.user.name,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating SAT product:', error);
    res.status(500).json({ error: 'Failed to create SAT product' });
  }
};

export const updateProductSat = async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, name } = req.body;

    const existing = await prisma.product_sat.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await prisma.product_sat.update({
      where: { id },
      data: {
        sku,
        name,
      },
    });

    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'PRODUCT_SAT',
        entityId: product.id,
        description: `Memperbarui produk SAT: ${product.name}`,
        metadata: {
          oldValues: { sku: existing.sku, name: existing.name },
          newValues: { sku: product.sku, name: product.name },
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating SAT product:', error);
    res.status(500).json({ error: 'Failed to update SAT product' });
  }
};

export const deleteProductSat = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product_sat.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (existing.items.length > 0) {
      return res.status(400).json({
        error: 'Tidak bisa menghapus produk yang masih memiliki unit SN.',
      });
    }

    await prisma.product_sat.delete({
      where: { id },
    });

    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'DELETE',
        entity: 'PRODUCT_SAT',
        entityId: id,
        description: `Menghapus produk SAT: ${existing.name}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting SAT product:', error);
    res.status(500).json({ error: 'Failed to delete SAT product' });
  }
};
