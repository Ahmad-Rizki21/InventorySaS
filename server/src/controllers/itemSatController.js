import prisma from '../config/database.js';
import { createAuditLog } from '../services/auditService.js';
import xlsx from 'xlsx';

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

export const importItemsSat = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Helper to parse Excel date
    const parseExcelDate = (dateVal) => {
      if (!dateVal) return null;
      // Handle Excel serial date
      if (typeof dateVal === 'number') {
        return new Date(Math.round((dateVal - 25569) * 86400 * 1000));
      }
      // Handle string YYYY-MM-DD
      if (typeof dateVal === 'string') {
        // Try parsing YYYY-MM-DD
        const parts = dateVal.split('-');
        if (parts.length === 3) {
          const d = new Date(dateVal);
          if (!isNaN(d.getTime())) return d;
        }
      }
      const date = new Date(dateVal);
      return isNaN(date.getTime()) ? null : date;
    };

    // Get all products map for lookup
    const products = await prisma.product_sat.findMany();
    const productMap = new Map(products.map(p => [p.name.toUpperCase(), p.id]));

    for (const row of data) {
      try {
        // Mapping columns - support both old and new headers
        const productName = row['NAMA PERANGKAT'];
        const serialNumber = row['SN'];
        
        if (!productName || !serialNumber) {
          results.failed++;
          results.errors.push(`Row missing mandatory fields: ${JSON.stringify(row)}`);
          continue;
        }

        const productSatId = productMap.get(String(productName).toUpperCase());
        
        if (!productSatId) {
          results.failed++;
          results.errors.push(`Product not found: ${productName} (SN: ${serialNumber})`);
          continue;
        }

        const itemData = {
          productSatId,
          serialNumber: String(serialNumber),
          status: row['STATUS'] || 'GUDANG',
          milikPerangkat: row['MILIK PERANGKAT'] || null,
          idToko: row['ID TOKO'] ? String(row['ID TOKO']) : null,
          namaToko: row['NAMA TOKO'] || null,
          dc: row['DC'] || null,
          brandToko: row['BRAND TOKO'] || null,
          tglTerimaGudang: parseExcelDate(row['TGL TERIMA DI GUDANG (YYYY-MM-DD)'] || row['TGL TERIMA DI GUDANG']),
          catatanTerima: row['CATATAN TERIMA'] || null,
          tglKirimMitra: parseExcelDate(row['TGL KIRIM MITRA (YYYY-MM-DD)'] || row['TGL KIRIM MITRA']),
          mitra: row['MITRA'] || null,
          hargaPeplink: row['HARGA BARU PEPLINK/KIRIM KE TRANSTEL'] ? String(row['HARGA BARU PEPLINK/KIRIM KE TRANSTEL']) : null,
          notes: row['NOTES'] || null
        };

        // Upsert logic (Update if SN exists, else Create)
        await prisma.item_sat.upsert({
          where: { serialNumber: itemData.serialNumber },
          update: itemData,
          create: itemData
        });

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Error processing SN ${row['SN']}: ${err.message}`);
      }
    }

    if (req.user) {
      await createAuditLog({
        userId: req.user.id,
        action: 'IMPORT',
        entity: 'ITEM_SAT',
        description: `Imported ${results.success} items, Failed: ${results.failed}`,
        metadata: { results },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.json({ 
      message: `Import completed. Success: ${results.success}, Failed: ${results.failed}`,
      results 
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to process import file' });
  }
};

export const exportItemsSat = async (req, res) => {
  try {
    const items = await prisma.item_sat.findMany({
      include: {
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const exportData = items.map(item => ({
      'NAMA PERANGKAT': item.product?.name || 'Unknown',
      'SN': item.serialNumber,
      'STATUS': item.status,
      'MILIK PERANGKAT': item.milikPerangkat,
      'ID TOKO': item.idToko,
      'NAMA TOKO': item.namaToko,
      'DC': item.dc,
      'BRAND TOKO': item.brandToko,
      'TGL TERIMA DI GUDANG': item.tglTerimaGudang ? item.tglTerimaGudang.toISOString().split('T')[0] : '',
      'CATATAN TERIMA': item.catatanTerima,
      'TGL KIRIM MITRA': item.tglKirimMitra ? item.tglKirimMitra.toISOString().split('T')[0] : '',
      'MITRA': item.mitra,
      'HARGA BARU PEPLINK/KIRIM KE TRANSTEL': item.hargaPeplink,
      'NOTES': item.notes
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Inventory SAT');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="inventory_sat.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
};

export const downloadTemplateSat = async (req, res) => {
  try {
    const data = [
      {
        'NAMA PERANGKAT': 'CONTOH: PEPLINK BALANCE 20X',
        'SN': '193C-SAMPLE-SN',
        'STATUS': 'GUDANG',
        'MILIK PERANGKAT': 'JEDI',
        'ID TOKO': 'T001',
        'NAMA TOKO': 'ALFAMART CONTOH',
        'DC': 'BEKASI',
        'BRAND TOKO': 'Alfamart',
        'TGL TERIMA DI GUDANG (YYYY-MM-DD)': '2024-01-31',
        'CATATAN TERIMA': 'Barang Baru',
        'TGL KIRIM MITRA (YYYY-MM-DD)': '',
        'MITRA': '',
        'HARGA BARU PEPLINK/KIRIM KE TRANSTEL': '5000000',
        'NOTES': 'Contoh Data'
      }
    ];

    const instructions = [
      { 'Petunjuk Pengisian': '1. NAMA PERANGKAT harus sesuai dengan yang ada di sistem.' },
      { 'Petunjuk Pengisian': '2. SN (Serial Number) harus unik.' },
      { 'Petunjuk Pengisian': '3. Format Tanggal adalah YYYY-MM-DD (Contoh: 2024-01-31).' },
      { 'Petunjuk Pengisian': '4. STATUS valid: GUDANG, TERPASANG, RUSAK, TEKNISI, dll.' },
      { 'Petunjuk Pengisian': '5. Hapus baris contoh sebelum import.' }
    ];

    const wb = xlsx.utils.book_new();
    
    // Template Sheet
    const ws = xlsx.utils.json_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // NAMA PERANGKAT
      { wch: 20 }, // SN
      { wch: 15 }, // STATUS
      { wch: 15 }, // MILIK...
      { wch: 10 }, // ID TOKO
      { wch: 20 }, // NAMA TOKO
      { wch: 10 }, // DC
      { wch: 10 }, // BRAND
      { wch: 25 }, // TGL TERIMA
      { wch: 20 }, // CATATAN
      { wch: 25 }, // TGL KIRIM
      { wch: 15 }, // MITRA
      { wch: 20 }, // HARGA
      { wch: 20 }, // NOTES
    ];
    
    xlsx.utils.book_append_sheet(wb, ws, 'Template Import');

    // Instructions Sheet
    const wsInfo = xlsx.utils.json_to_sheet(instructions);
    wsInfo['!cols'] = [{ wch: 80 }];
    xlsx.utils.book_append_sheet(wb, wsInfo, 'PETUNJUK');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="template_import_sat.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({ error: 'Failed to download template' });
  }
};
