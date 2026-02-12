import prisma from '../config/database.js';
import { createAuditLog } from '../services/auditService.js';

export const getItemsSat = async (req, res) => {
  try {
    const { search, status, brandToko, productSatId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (brandToko) where.brandToko = brandToko;
    if (productSatId) where.productSatId = productSatId;
    
    if (search) {
      where.OR = [
        { serialNumber: { contains: search } },
        { idToko: { contains: search } },
        { namaToko: { contains: search } },
        { dc: { contains: search } },
        { mitra: { contains: search } },
      ];
    }

    const items = await prisma.item_sat.findMany({
      where,
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching SAT items:', error);
    res.status(500).json({ error: 'Failed to fetch SAT items' });
  }
};

export const createItemSat = async (req, res) => {
  try {
    const {
      productSatId,
      serialNumber,
      status,
      milikPerangkat,
      idToko,
      namaToko,
      dc,
      brandToko,
      tglTerimaGudang,
      catatanTerima,
      tglKirimMitra,
      mitra,
      hargaPeplink,
      notes
    } = req.body;

    const existing = await prisma.item_sat.findUnique({
      where: { serialNumber },
    });

    if (existing) {
      return res.status(400).json({ error: 'Serial Number sudah terdaftar' });
    }

    const item = await prisma.item_sat.create({
      data: {
        productSatId,
        serialNumber,
        status: status || 'GUDANG',
        milikPerangkat,
        idToko,
        namaToko,
        dc,
        brandToko,
        tglTerimaGudang: tglTerimaGudang ? new Date(tglTerimaGudang) : null,
        catatanTerima,
        tglKirimMitra: tglKirimMitra ? new Date(tglKirimMitra) : null,
        mitra,
        hargaPeplink,
        notes,
      },
      include: {
        product: true,
      }
    });

    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'CREATE',
        entity: 'ITEM_SAT',
        entityId: item.id,
        description: `Input unit SAT baru: ${item.serialNumber} (${item.product.name})`,
        metadata: { item },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating SAT item:', error);
    res.status(500).json({ error: 'Failed to create SAT item' });
  }
};

export const updateItemSat = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle date fields properly: empty string "" -> null, valid string -> Date
    if (updateData.tglTerimaGudang !== undefined) {
      updateData.tglTerimaGudang = updateData.tglTerimaGudang ? new Date(updateData.tglTerimaGudang) : null;
    }
    if (updateData.tglKirimMitra !== undefined) {
      updateData.tglKirimMitra = updateData.tglKirimMitra ? new Date(updateData.tglKirimMitra) : null;
    }

    const existing = await prisma.item_sat.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = await prisma.item_sat.update({
      where: { id },
      data: updateData,
      include: { product: true }
    });

    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'ITEM_SAT',
        entityId: id,
        description: `Update unit SAT: ${item.serialNumber}`,
        metadata: { old: existing, new: item },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.json(item);
  } catch (error) {
    console.error('Error updating SAT item:', error);
    res.status(500).json({ error: 'Failed to update SAT item' });
  }
};

export const deleteItemSat = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.item_sat.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await prisma.item_sat.delete({
      where: { id },
    });

    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'DELETE',
        entity: 'ITEM_SAT',
        entityId: id,
        description: `Hapus unit SAT: ${existing.serialNumber}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting SAT item:', error);
    res.status(500).json({ error: 'Failed to delete SAT item' });
  }
};
