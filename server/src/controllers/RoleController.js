import { prisma } from '../config/database.js';

// Get all roles
export async function getAllRoles(req, res) {
  try {
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan saat mengambil data role' 
    });
  }
}

// Get role by ID
export async function getRoleById(req, res) {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!role) {
      return res.status(404).json({ 
        success: false, 
        message: 'Role tidak ditemukan' 
      });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Error getting role:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan saat mengambil data role' 
    });
  }
}

// Create new role
export async function createRole(req, res) {
  try {
    const { name, permissions } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nama role wajib diisi' 
      });
    }

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name }
    });

    if (existingRole) {
      return res.status(409).json({ 
        success: false, 
        message: 'Role sudah ada' 
      });
    }

    // Create new role
    const newRole = await prisma.role.create({
      data: {
        name,
        permissions: permissions || []
      },
      select: {
        id: true,
        name: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.status(201).json({
      success: true,
      data: newRole,
      message: 'Role berhasil dibuat'
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan saat membuat role' 
    });
  }
}

// Update role
export async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return res.status(404).json({ 
        success: false, 
        message: 'Role tidak ditemukan' 
      });
    }

    // Check if name is being updated and if it conflicts with another role
    if (name && name !== existingRole.name) {
      const duplicateRole = await prisma.role.findUnique({
        where: { name }
      });

      if (duplicateRole) {
        return res.status(409).json({ 
          success: false, 
          message: 'Nama role sudah digunakan' 
        });
      }
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(permissions !== undefined && { permissions })
      },
      select: {
        id: true,
        name: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.json({
      success: true,
      data: updatedRole,
      message: 'Role berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan saat memperbarui role' 
    });
  }
}

// Delete role
export async function deleteRole(req, res) {
  try {
    const { id } = req.params;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return res.status(404).json({ 
        success: false, 
        message: 'Role tidak ditemukan' 
      });
    }

    // Check if role is assigned to any users
    const usersWithRole = await prisma.user.count({
      where: { roleId: id }
    });

    if (usersWithRole > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tidak dapat menghapus role karena masih digunakan oleh pengguna' 
      });
    }

    // Delete role
    await prisma.role.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Role berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan saat menghapus role' 
    });
  }
}

// Update role permissions
export async function updateRolePermissions(req, res) {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    // Validate input
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Permissions harus berupa array' 
      });
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return res.status(404).json({ 
        success: false, 
        message: 'Role tidak ditemukan' 
      });
    }

    // Update role permissions
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        permissions
      },
      select: {
        id: true,
        name: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.json({
      success: true,
      data: updatedRole,
      message: 'Permissions berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan saat memperbarui permissions' 
    });
  }
}