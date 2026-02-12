// Using direct import of PrismaClient
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Define default roles and their permissions
const defaultRoles = [
  {
    name: 'ADMIN',
    permissions: [
      'products.view',
      'products.create',
      'products.update',
      'products.delete',
      'inventory.view',
      'inventory.stock_in',
      'inventory.stock_out',
      'inventory.audit',
      'sat.dashboard.view',
      'sat.products.view',
      'sat.products.create',
      'sat.products.update',
      'sat.products.delete',
      'sat.inventory.view',
      'sat.inventory.stock_in',
      'sat.inventory.stock_out',
      'users.manage',
      'settings.view',
      'activity_log.view'
    ]
  },
  {
    name: 'GUDANG',
    permissions: [
      'products.view',
      'inventory.view',
      'inventory.stock_in',
      'inventory.stock_out',
      'inventory.audit',
      'sat.dashboard.view',
      'sat.products.view',
      'sat.inventory.view',
      'sat.inventory.stock_in',
      'sat.inventory.stock_out',
      'activity_log.view'
    ]
  },
  {
    name: 'TEKNISI',
    permissions: [
      'inventory.view',
      'inventory.audit'
    ]
  }
];

async function seedRoles() {
  try {
    console.log('Seeding roles...');
    
    // Create or update roles
    for (const roleData of defaultRoles) {
      console.log(`Attempting to create/update role: ${roleData.name}`);
      
      // Check if role exists
      const existingRole = await prisma.role.findUnique({
        where: { name: roleData.name }
      });
      
      if (existingRole) {
        // Update existing role
        await prisma.role.update({
          where: { name: roleData.name },
          data: { permissions: roleData.permissions }
        });
        console.log(`Role ${roleData.name} has been updated`);
      } else {
        // Create new role
        await prisma.role.create({
          data: {
            name: roleData.name,
            permissions: roleData.permissions
          }
        });
        console.log(`Role ${roleData.name} has been created`);
      }
    }
    
    // Since we're adding the new role system, we need to create default roles for any existing users
    // Find a default role to assign to users without a role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' }
    });

    if (adminRole) {
      // If there are users without a roleId, assign them to the admin role
      const allUsers = await prisma.user.findMany();
      const usersWithoutRole = allUsers.filter(user => !user.roleId);

      for (const user of usersWithoutRole) {
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: adminRole.id }
        });

        console.log(`User ${user.email} assigned to role ${adminRole.name}`);
      }
    }
    
    console.log('Roles seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Check if this file is run directly (equivalent to require.main === module in CommonJS)
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this module is the main module being run
if (process.argv[1] === __filename) {
  seedRoles()
    .then(() => {
      console.log('Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

export { seedRoles };