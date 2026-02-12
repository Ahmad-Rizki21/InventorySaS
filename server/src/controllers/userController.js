import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '../services/auditService.js';

// Get all users
export async function getUsers(req, res) {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role && role !== 'all') {
      where.role = {
        name: role
      };
    }


    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: {
            select: {
              id: true,
              name: true,
              permissions: true,
            }
          },
          createdAt: true,
          updatedAt: true,
        },

      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      data: users,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil users' });
  }
}

// Get user by ID
export async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          }
        },
        createdAt: true,
        updatedAt: true,
        activitylog: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },

    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil user' });
  }
}

// Create user
export async function createUser(req, res) {
  try {
    const { name, email, password, role = 'TEKNISI' } = req.body;
    const creatorId = req.user.id;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, dan password wajib diisi' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: `USR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        email,
        password: hashedPassword,
        role: {
          connect: { name: role }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Log activity
    await createAuditLog({
      userId: creatorId,
      action: 'CREATE_USER',
      entity: 'USER',
      entityId: user.id,
      description: `User ${name} (${email}) ditambahkan oleh ${req.user.name}`,
      metadata: { targetUserId: user.id, role },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat membuat user' });
  }
}

// Update user
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    const updaterId = req.user.id;

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Check if email is being changed and already exists
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({ message: 'Email sudah terdaftar' });
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: name || existingUser.name,
        email: email || existingUser.email,
        role: role ? { connect: { name: role } } : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    // Log activity
    await createAuditLog({
      userId: updaterId,
      action: 'UPDATE_USER',
      entity: 'USER',
      entityId: user.id,
      description: `User ${user.name} (${user.email}) diupdate oleh ${req.user.name}`,
      metadata: { targetUserId: user.id, changes: { name, email, role } },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate user' });
  }
}

// Delete user
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const deleterId = req.user.id;

    // Don't allow deleting yourself
    if (id === deleterId) {
      return res.status(400).json({ message: 'Tidak bisa menghapus user sendiri' });
    }

    // Get user before delete
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Delete user (cascade delete for activity logs)
    await prisma.user.delete({
      where: { id },
    });

    // Log activity
    await createAuditLog({
      userId: deleterId,
      action: 'DELETE_USER',
      entity: 'USER',
      entityId: id,
      description: `User ${user.name} (${user.email}) dihapus oleh ${req.user.name}`,
      metadata: { deletedUser: { name: user.name, email: user.email } },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menghapus user' });
  }
}

// Reset user password
export async function resetUserPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const adminId = req.user.id;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Log activity
    await createAuditLog({
      userId: adminId,
      action: 'RESET_PASSWORD',
      entity: 'USER',
      entityId: user.id,
      description: `Password user ${user.name} (${user.email}) di-reset oleh ${req.user.name}`,
      metadata: { targetUserId: user.id },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({ message: 'Password berhasil di-reset' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mereset password' });
  }
}
