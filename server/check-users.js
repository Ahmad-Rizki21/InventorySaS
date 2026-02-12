import { prisma } from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function checkAndSeedUsers() {
  try {
    // Check existing users
    const users = await prisma.user.findMany();
    console.log('\n📊 Existing users in database:');
    console.log('Total:', users.length);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    // If no users, create admin
    if (users.length === 0) {
      console.log('\n⚠️ No users found. Creating admin user...');

      const hashedPassword = await bcrypt.hash('admin123', 10);

      const admin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@inventory.com',
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      console.log('✅ Admin user created:');
      console.log('   Email: admin@inventory.com');
      console.log('   Password: admin123');
      console.log('   Role: ADMIN');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAndSeedUsers();
