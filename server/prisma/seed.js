import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Get existing roles to link by roleId
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const gudangRole = await prisma.role.findUnique({ where: { name: 'GUDANG' } });
  const teknisiRole = await prisma.role.findUnique({ where: { name: 'TEKNISI' } });

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      roleId: adminRole?.id
    },
    create: {
      id: `USR-ADMIN-${Date.now()}`,
      email: 'admin@example.com',
      name: 'Admin User',
      password: await bcrypt.hash('password123', 10), // Hash default password
      roleId: adminRole?.id,
      updatedAt: new Date(),
    },
  });

  console.log('Processed admin user:', adminUser.email);

  // Create gudang user
  const gudangUser = await prisma.user.upsert({
    where: { email: 'gudang@example.com' },
    update: {
      roleId: gudangRole?.id
    },
    create: {
      id: `USR-GUDANG-${Date.now()}`,
      email: 'gudang@example.com',
      name: 'Gudang User',
      password: await bcrypt.hash('password123', 10),
      roleId: gudangRole?.id,
      updatedAt: new Date(),
    },
  });

  console.log('Processed gudang user:', gudangUser.email);

  // Create teknisi user
  const teknisiUser = await prisma.user.upsert({
    where: { email: 'teknisi@example.com' },
    update: {
      roleId: teknisiRole?.id
    },
    create: {
      id: `USR-TEKNISI-${Date.now()}`,
      email: 'teknisi@example.com',
      name: 'Teknisi User',
      password: await bcrypt.hash('password123', 10),
      roleId: teknisiRole?.id,
      updatedAt: new Date(),
    },
  });

  console.log('Processed teknisi user:', teknisiUser.email);
}



main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });