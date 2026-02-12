import prisma from '../config/database.js';
import { createAuditLog, generateAuditDescription } from '../services/auditService.js';

// Get all products with filtering
export const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;

    const where = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        stock: true,
        itemdetail: {
          select: {
            id: true,
            serialNumber: true,
            status: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Calculate stock info for each product
    const productsWithStock = products.map((product) => {
      const totalStock = product.stock.reduce((sum, stock) => sum + stock.quantity, 0);
      const itemCount = product.itemdetail.length;
      const availableItems = product.itemdetail.filter((item) => item.status === 'GUDANG').length;
      const deployedItems = product.itemdetail.filter((item) => item.status === 'TERPASANG').length;

      return {
        ...product,
        totalStock,
        itemCount,
        availableItems,
        deployedItems,
      };
    });

    res.json(productsWithStock);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stock: true,
        itemdetail: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// Create new product
export const createProduct = async (req, res) => {
  try {
    const { sku, name, category, unit } = req.body;

    // Check if SKU already exists
    const existing = await prisma.product.findUnique({
      where: { sku },
    });

    if (existing) {
      return res.status(400).json({ error: 'SKU already exists' });
    }

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        category,
        unit,
      },
    });

    // Create audit log for product creation
    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'CREATE',
        entity: 'PRODUCT',
        entityId: product.id,
        description: generateAuditDescription('PRODUCT', 'CREATE', null, product),
        metadata: {
          createdValues: { sku: product.sku, name: product.name, category: product.category, unit: product.unit },
          createdBy: req.user.name,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, name, category, unit } = req.body;

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if new SKU conflicts with another product
    if (sku !== existing.sku) {
      const skuConflict = await prisma.product.findUnique({
        where: { sku },
      });
      if (skuConflict) {
        return res.status(400).json({ error: 'SKU already exists' });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        sku,
        name,
        category,
        unit,
      },
    });

    // Create audit log for product update
    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'PRODUCT',
        entityId: product.id,
        description: generateAuditDescription('PRODUCT', 'UPDATE', existing, product),
        metadata: {
          oldValues: { sku: existing.sku, name: existing.name, category: existing.category, unit: existing.unit },
          newValues: { sku: product.sku, name: product.name, category: product.category, unit: product.unit },
          updatedBy: req.user.name,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        itemdetail: true,
        stock: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product has related items (SN items)
    // We allow deleting products with stock quantity (it will cascade delete)
    // but prevent deleting products that have individually tracked Serial Numbers (assets)
    if (existing.itemdetail.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete product that still has items with Serial Numbers. Please delete the items first.',
      });
    }

    await prisma.product.delete({
      where: { id },
    });

    // Create audit log for product deletion
    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'DELETE',
        entity: 'PRODUCT',
        entityId: existing.id,
        description: generateAuditDescription('PRODUCT', 'DELETE', existing, { deletedBy: req.user.name }),
        metadata: {
          deletedValues: { sku: existing.sku, name: existing.name, category: existing.category, unit: existing.unit },
          deletedBy: req.user.name,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
// Bulk import products from Excel
export const importProducts = async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const prodData = products[i];
      try {
        const { sku, name, category, unit, minStock, description } = prodData;

        if (!sku || !name || !category) {
          results.failed++;
          results.errors.push(`Baris ${i + 1}: SKU, Nama, atau Kategori kosong`);
          continue;
        }

        // Check if SKU already exists
        const existing = await prisma.product.findUnique({
          where: { sku },
        });

        if (existing) {
          results.failed++;
          results.errors.push(`Baris ${i + 1}: Produk dengan SKU "${sku}" sudah terdaftar (Duplikat)`);
          continue;
        }

        // Create product
        const newProduct = await prisma.product.create({
          data: {
            id: `PROD-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
            sku,
            name,
            category: category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(), // Normalize category
            unit: unit || 'Pcs',
            minStock: minStock ? parseInt(minStock) : 5,
            description: description || null,
          },
        });

        // Initialize stock record
        await prisma.stock.create({
          data: {
            id: `STK-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
            productId: newProduct.id,
            quantity: 0,
          },
        });

        // Create audit log
        if (req.user) {
          await createAuditLog({
            userId: req.user.id,
            action: 'CREATE',
            entity: 'PRODUCT',
            entityId: newProduct.id,
            description: `Import produk: ${newProduct.name} (${newProduct.sku})`,
            metadata: {
              importAction: 'EXCEL_IMPORT',
              productData: {
                sku: newProduct.sku,
                name: newProduct.name,
                category: newProduct.category,
              },
              importedBy: req.user.name,
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
          });
        }

        results.success++;
      } catch (prodError) {
        console.error('Error processing import product:', prodError);
        results.failed++;
        results.errors.push(`Baris ${i + 1}: Internal error (${prodError.message})`);
      }
    }

    res.json({
      message: `Import selesai: ${results.success} berhasil, ${results.failed} gagal`,
      results,
    });
  } catch (error) {
    console.error('Error importing products:', error);
    res.status(500).json({ error: 'Failed to import products' });
  }
};
