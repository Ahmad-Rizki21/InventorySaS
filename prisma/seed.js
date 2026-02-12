import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@inventory.com' },
    update: {},
    create: {
      email: 'admin@inventory.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create sample products
  const products = [
    {
      sku: 'ONT-001',
      name: 'ONT ZTE F609',
      category: 'Active',
      unit: 'Pcs',
    },
    {
      sku: 'ONT-002',
      name: 'ONT Huawei HG8245H',
      category: 'Active',
      unit: 'Pcs',
    },
    {
      sku: 'CBL-001',
      name: 'Kabel Fiber Optic Drop Wire',
      category: 'Passive',
      unit: 'Meter',
    },
    {
      sku: 'CBL-002',
      name: 'Kabel Fiber Optic Core',
      category: 'Passive',
      unit: 'Meter',
    },
    {
      sku: 'SPL-001',
      name: 'Splitter 1:8 PLC',
      category: 'Passive',
      unit: 'Pcs',
    },
    {
      sku: 'SPL-002',
      name: 'Splitter 1:16 PLC',
      category: 'Passive',
      unit: 'Pcs',
    },
    {
      sku: 'TOL-001',
      name: 'Splicer Fusion',
      category: 'Tool',
      unit: 'Pcs',
    },
    {
      sku: 'TOL-002',
      name: 'Tangga Fiber',
      category: 'Tool',
      unit: 'Pcs',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  console.log('✅ Sample products created');

  // Get created products
  const ontProducts = await prisma.product.findMany({
    where: { category: 'Active' },
  });

  // Create sample items with serial numbers
  const sampleItems = [
    { productIndex: 0, serialNumber: 'ZTE20240001', macAddress: 'A4:B1:C2:D3:E4:F5', status: 'GUDANG' },
    { productIndex: 0, serialNumber: 'ZTE20240002', macAddress: 'A4:B1:C2:D3:E4:F6', status: 'GUDANG' },
    { productIndex: 0, serialNumber: 'ZTE20240003', macAddress: 'A4:B1:C2:D3:E4:F7', status: 'TERPASANG' },
    { productIndex: 0, serialNumber: 'ZTE20240004', macAddress: 'A4:B1:C2:D3:E4:F8', status: 'TERPASANG' },
    { productIndex: 0, serialNumber: 'ZTE20240005', macAddress: 'A4:B1:C2:D3:E4:F9', status: 'TEKNISI' },
    { productIndex: 1, serialNumber: 'HUA20240001', macAddress: 'B5:C2:D3:E4:F5:A6', status: 'GUDANG' },
    { productIndex: 1, serialNumber: 'HUA20240002', macAddress: 'B5:C2:D3:E4:F5:A7', status: 'GUDANG' },
    { productIndex: 1, serialNumber: 'HUA20240003', macAddress: 'B5:C2:D3:E4:F5:A8', status: 'TERPASANG' },
  ];

  for (const item of sampleItems) {
    await prisma.itemDetail.upsert({
      where: { serialNumber: item.serialNumber },
      update: {},
      create: {
        productId: ontProducts[item.productIndex].id,
        serialNumber: item.serialNumber,
        macAddress: item.macAddress,
        status: item.status,
      },
    });
  }

  console.log('✅ Sample items with SN created');

  // Create sample stocks
  const allProducts = await prisma.product.findMany();

  const sampleStocks = [
    { productIndex: 2, quantity: 5000 }, // Kabel Drop Wire - 5000 meter
    { productIndex: 3, quantity: 2000 }, // Kabel Core - 2000 meter
    { productIndex: 4, quantity: 5 },    // Splitter 1:8 - 5 pcs (low stock)
    { productIndex: 5, quantity: 3 },    // Splitter 1:16 - 3 pcs (low stock)
    { productIndex: 6, quantity: 2 },    // Splicer - 2 pcs (low stock)
    { productIndex: 7, quantity: 4 },    // Tangga - 4 pcs (low stock)
  ];

  for (const stock of sampleStocks) {
    const existingStock = await prisma.stock.findFirst({
      where: {
        productId: allProducts[stock.productIndex].id,
        warehouseId: 'WH-001',
      },
    });

    if (!existingStock) {
      await prisma.stock.create({
        data: {
          productId: allProducts[stock.productIndex].id,
          warehouseId: 'WH-001',
          quantity: stock.quantity,
        },
      });
    }
  }

  console.log('✅ Sample stocks created');
  console.log('\n🎉 Database seed completed!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: admin@inventory.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
