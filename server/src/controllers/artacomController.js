import artacomService from '../services/artacomService.js';

/**
 * Controller for Artacom API integration
 */

/**
 * Sync inventory from Artacom to local database
 */
export const syncFromArtacom = async (req, res) => {
  try {
    const result = await artacomService.syncToDatabase();
    
    res.status(200).json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (error) {
    console.error('Sync from Artacom failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to sync inventory from Artacom'
    });
  }
};

/**
 * Get inventory items from Artacom API
 */
export const getArtacomInventory = async (req, res) => {
  try {
    const inventory = await artacomService.fetchInventory();
    
    res.status(200).json({
      success: true,
      data: inventory,
      count: Array.isArray(inventory) ? inventory.length : 0
    });
  } catch (error) {
    console.error('Get Artacom inventory failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch inventory from Artacom'
    });
  }
};

/**
 * Get sync status
 */
export const getSyncStatus = async (req, res) => {
  try {
    const status = await artacomService.getSyncStatus();
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get sync status failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get sync status'
    });
  }
};

/**
 * Get sync history
 */
export const getSyncHistory = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const history = await artacomService.getSyncHistory(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('Get sync history failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get sync history'
    });
  }
};