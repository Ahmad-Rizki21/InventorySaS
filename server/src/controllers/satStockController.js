import prisma from '../config/database.js';
import { createAuditLog } from '../services/auditService.js';

export const satStockIn = async (req, res) => {
  try {
    const { items, notes } = req.body; // items: array of { productSatId, serialNumber, ... }

    const results = await prisma.$transaction(async (tx) => {
      const createdItems = [];
      for (const itemData of items) {
        // Check if Serial Number already exists
        const existing = await tx.item_sat.findUnique({
          where: { serialNumber: itemData.serialNumber }
        });

        if (existing) {
          throw new Error(`Serial Number ${itemData.serialNumber} sudah terdaftar di sistem`);
        }

        const formattedData = { ...itemData };
        if (formattedData.tglTerimaGudang) {
          formattedData.tglTerimaGudang = new Date(formattedData.tglTerimaGudang);
        }

        const item = await tx.item_sat.create({
          data: {
            ...formattedData,
            status: 'GUDANG',
            notes: notes || formattedData.notes
          },
          include: { product: true }
        });
        createdItems.push(item);

        if (req.user) {
          await createAuditLog({
            userId: req.user.id,
            action: 'STOCK_IN_SAT',
            entity: 'ITEM_SAT',
            entityId: item.id,
            description: `Stock In SAT: ${item.serialNumber} (${item.product.name})`,
            metadata: { item },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
          }, tx);
        }
      }
      return createdItems;
    });

    res.status(201).json(results);
  } catch (error) {
    console.error('Error SAT Stock In:', error);
    
    // Return specific error message if it's one of our thrown errors
    if (error.message.includes('sudah terdaftar')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message || 'Failed to process SAT Stock In' });
  }
};

export const satStockOut = async (req, res) => {
  try {
    const { itemIds, status, idToko, namaToko, dc, brandToko, tglKirimMitra, mitra, notes } = req.body;

    const results = await prisma.$transaction(async (tx) => {
      const updatedItems = [];
      for (const id of itemIds) {
        const existing = await tx.item_sat.findUnique({ where: { id } });
        if (!existing) continue;

        const item = await tx.item_sat.update({
          where: { id },
          data: {
            status: status || 'TERPASANG',
            idToko,
            namaToko,
            dc,
            brandToko,
            tglKirimMitra: tglKirimMitra ? new Date(tglKirimMitra) : undefined,
            mitra,
            notes
          },
          include: { product: true }
        });
        updatedItems.push(item);

        if (req.user) {
          await createAuditLog({
            userId: req.user.id,
            action: 'STOCK_OUT_SAT',
            entity: 'ITEM_SAT',
            entityId: item.id,
            description: `Stock Out SAT: ${item.serialNumber} ke ${idToko || mitra || 'Lokasi'}`,
            metadata: { old: existing, new: item },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
          }, tx);
        }
      }
      return updatedItems;
    });

    res.json(results);
  } catch (error) {
    console.error('Error SAT Stock Out:', error);
    res.status(500).json({ error: 'Failed to process SAT Stock Out' });
  }
};
