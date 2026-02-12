import prisma from '../config/database.js';

/**
 * Membuat catatan audit untuk aktivitas pengguna
 */
export const createAuditLog = async (auditData) => {
  try {
    const auditLog = await prisma.activitylog.create({
      data: {
        userId: auditData.userId,
        action: auditData.action,
        entity: auditData.entity,
        entityId: auditData.entityId,
        description: auditData.description,
        metadata: auditData.metadata ? JSON.stringify(auditData.metadata) : null,
        ipAddress: auditData.ipAddress || null,
        userAgent: auditData.userAgent || null,
      },
    });
    
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw error;
  }
};

/**
 * Mendapatkan log audit untuk entitas tertentu
 */
export const getEntityAuditLogs = async (entity, entityId) => {
  try {
    const auditLogs = await prisma.activitylog.findMany({
      where: {
        entity,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return auditLogs;
  } catch (error) {
    console.error('Error getting entity audit logs:', error);
    throw error;
  }
};

/**
 * Mendapatkan semua log audit dengan pagination
 */
export const getAllAuditLogs = async (options = {}) => {
  const { page = 1, limit = 10, entity, action, userId } = options;
  
  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const whereClause = {};
    if (entity) whereClause.entity = entity;
    if (action) whereClause.action = action;
    if (userId) whereClause.userId = userId;
    
    const auditLogs = await prisma.activitylog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: parseInt(skip),
      take: parseInt(limit),
    });
    
    const total = await prisma.activitylog.count({
      where: whereClause,
    });
    
    return {
      data: auditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error getting all audit logs:', error);
    throw error;
  }
};

/**
 * Fungsi helper untuk membuat deskripsi log berdasarkan perubahan
 */
export const generateAuditDescription = (entity, action, oldData, newData) => {
  switch (entity) {
    case 'USER':
      switch (action) {
        case 'CREATE_USER':
          return `User baru "${newData.name}" (${newData.email}) didaftarkan oleh ${newData.createdBy || 'pengguna'}`;
        case 'UPDATE_USER':
          return `Data user "${newData.name || oldData.name}" diperbarui oleh ${newData.updatedBy || 'pengguna'}`;
        case 'DELETE_USER':
          return `User "${oldData.name}" dihapus oleh ${newData.deletedBy || 'pengguna'}`;
        case 'RESET_PASSWORD':
          return `Password user "${oldData.name}" di-reset oleh ${newData.updatedBy || 'pengguna'}`;
        case 'LOGIN':
          return `User "${newData.name}" berhasil login`;
        case 'LOGOUT':
          return `User "${newData.name || oldData.name}" logout`;
        case 'CHANGE_PASSWORD':
          return `User "${newData.name || oldData.name}" mengubah password sendiri`;
        default:
          return `Aksi ${action} pada user "${newData.name || oldData.name}" oleh ${newData.updatedBy || 'pengguna'}`;
      }
    case 'ITEM':
      switch (action) {
        case 'UPDATE':
          return `Update detail item "${newData.serialNumber || oldData.serialNumber}" oleh ${newData.updatedBy || 'pengguna'}`;
        case 'UPDATE_STATUS':
          return `Status item [${newData.serialNumber || oldData.serialNumber}] berubah: ${oldData.status || '?'} ➔ ${newData.status} oleh ${newData.updatedBy || 'pengguna'}`;
        case 'MOVE':
          return `Item [${newData.serialNumber || oldData.serialNumber}] dipindahkan dari ${newData.fromLocation || 'Lama'} ke ${newData.toLocation || 'Baru'} oleh ${newData.updatedBy || 'pengguna'}`;
        case 'CREATE':
          return `Item baru [${newData.serialNumber}] (${newData.product?.name || 'Produk'}) ditambahkan ke sistem oleh ${newData.createdBy || 'pengguna'}`;
        case 'DELETE':
          return `Item [${oldData.serialNumber}] dihapus dari sistem oleh ${newData.deletedBy || 'pengguna'}`;
        default:
          return `${entity} ${action}: ${newData.serialNumber || oldData.serialNumber} oleh ${newData.updatedBy || 'pengguna'}`;
      }
    case 'STOCK':
      switch (action) {
        case 'STOCK_IN':
          return `Stok Masuk: ${newData.quantity || (newData.newQuantity - newData.oldQuantity)} unit untuk "${newData.product?.name || 'Produk'}" oleh ${newData.updatedBy || 'pengguna'}`;
        case 'STOCK_OUT':
          return `Stok Keluar: ${newData.quantity || (newData.oldQuantity - newData.newQuantity)} unit untuk "${newData.product?.name || 'Produk'}" oleh ${newData.updatedBy || 'pengguna'}`;
        case 'CREATE':
          return `Inisialisasi stok baru untuk "${newData.product?.name || 'Produk'}" oleh ${newData.createdBy || 'pengguna'}`;
        case 'UPDATE':
          return `Koreksi stok "${newData.product?.name || oldData.product?.name || 'Produk'}" oleh ${newData.updatedBy || 'pengguna'}`;
        default:
          return `Aksi ${action} pada stok "${newData.product?.name || oldData.product?.name || 'Produk'}"`;
      }
    case 'PRODUCT':
      switch (action) {
        case 'CREATE':
          return `Produk baru "${newData.name}" [SKU: ${newData.sku}] didaftarkan oleh ${newData.createdBy || 'pengguna'}`;
        case 'UPDATE':
          return `Produk "${newData.name || oldData.name}" diperbarui oleh ${newData.updatedBy || 'pengguna'}`;
        case 'DELETE':
          return `Produk "${oldData.name}" dihapus dari sistem oleh ${newData.deletedBy || 'pengguna'}`;
        default:
          return `${entity} ${action}: ${newData.name || oldData.name}`;
      }
    default:
      return `${entity} ${action} oleh ${newData.updatedBy || 'pengguna'}`;
  }
};