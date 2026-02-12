import axios from 'axios';
import prisma from '../config/database.js';

const ARTACOM_EMAIL = process.env.ARTACOM_EMAIL || 'ahmad@ajnusa.com';
const ARTACOM_PASSWORD = process.env.ARTACOM_PASSWORD || 'password';

class ArtacomService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Authenticate with Artacom API
   */
  async authenticate() {
    try {
      console.log('Attempting to authenticate with Artacom API at: https://billingftth.my.id/api/auth/token');
      
      // Use the specific endpoint you provided
      const endpoint = 'https://billingftth.my.id/api/auth/token';
      
      // Based on the API error response, it expects 'username' and 'password'
      const payload = {
        username: ARTACOM_EMAIL,  // Using email as username
        password: ARTACOM_PASSWORD,
      };
      
      console.log(`Trying auth with payload: ${JSON.stringify(Object.keys(payload))}`);
      
      // Convert payload to URL-encoded format as required by the API
      const urlEncodedPayload = new URLSearchParams(payload).toString();
      
      const response = await axios.post(
        endpoint,
        urlEncodedPayload,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          validateStatus: function (status) {
            // Accept both success and auth failure (401) as valid responses for debugging
            return status < 500;
          }
        }
      );
      
      console.log(`Auth attempt returned status: ${response.status}`);
      console.log(`Auth response data:`, response.data);
      
      // Based on your example, the API returns access_token, refresh_token, token_type, and expires_in
      if (response.status >= 200 && response.status < 300) {
        if (response.data && typeof response.data === 'object') {
          if (response.data.access_token) {
            this.token = response.data.access_token;
            
            // Calculate token expiry based on expires_in (seconds)
            if (response.data.expires_in) {
              this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000)); // Convert seconds to milliseconds
            } else {
              // Default to 1 hour if expires_in not provided
              this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
            }
            
            console.log('Authentication successful with token');
            return this.token;
          } else {
            // Maybe the token is in headers
            const authHeader = response.headers['authorization'] || 
                             response.headers['Authorization'] || 
                             response.headers['access-token'] ||
                             response.headers['Access-Token'];
                             
            if (authHeader) {
              if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
                this.token = authHeader.substring(7);
              } else if (typeof authHeader === 'string') {
                this.token = authHeader;
              } else {
                this.token = `session_${Date.now()}`;
              }
            }
          }
        }
      }
      
      if (this.token) {
        console.log('Authentication successful with token');
        return this.token;
      } else {
        console.error('No token found in response despite successful authentication');
        throw new Error('No token returned from Artacom API');
      }
    } catch (error) {
      console.error('Artacom authentication failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Get auth header for API requests
   */
  async getAuthHeader() {
    if (!this.token || (this.tokenExpiry && new Date() > this.tokenExpiry)) {
      try {
        await this.authenticate();
      } catch (authError) {
        console.error('Authentication failed, attempting refresh:', authError.message);
        await this.refreshToken();
      }
    }
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken() {
    try {
      // Simply re-authenticate since we don't have a specific refresh token
      await this.authenticate();
    } catch (error) {
      console.error('Token refresh failed:', error.message);
      throw error;
    }
  }

  /**
   * Fetch inventory data from Artacom
   */
  async fetchInventory() {
    try {
      const headers = await this.getAuthHeader();
      
      // Try different possible inventory endpoints
      const endpointsToTry = [
        'https://billingftth.my.id/api/inventory/inventory',  // Original endpoint
        'https://billingftth.my.id/api/inventory',           // Alternative endpoint
        'https://billingftth.my.id/api/devices',             // Devices endpoint
        'https://billingftth.my.id/api/ftth',                // FTTH-specific endpoint
        'https://billingftth.my.id/api/stock',               // Stock endpoint
        'https://billingftth.my.id/api/items',               // Items endpoint
      ];
      
      // Try different HTTP methods
      const methodsToTry = ['GET', 'POST', 'PATCH'];
      
      for (const endpoint of endpointsToTry) {
        for (const method of methodsToTry) {
          try {
            console.log(`Trying inventory endpoint: ${endpoint} with method: ${method}`);
            
            let response;
            if (method === 'GET') {
              response = await axios.get(endpoint, {
                headers: {
                  ...headers,
                  'Accept': 'application/json',
                },
                timeout: 30000,
                validateStatus: function (status) {
                  return status < 500;
                }
              });
            } else if (method === 'POST') {
              response = await axios.post(endpoint, {}, {
                headers: {
                  ...headers,
                  'Accept': 'application/json',
                },
                timeout: 30000,
                validateStatus: function (status) {
                  return status < 500;
                }
              });
            } else if (method === 'PATCH') {
              response = await axios.patch(endpoint, {}, {
                headers: {
                  ...headers,
                  'Accept': 'application/json',
                },
                timeout: 30000,
                validateStatus: function (status) {
                  return status < 500;
                }
              });
            }
            
            console.log(`Inventory fetch attempt at ${endpoint} with ${method} returned status: ${response.status}`);
            
            // Check if response contains valid inventory data
            if (response.status === 200) {
              if (Array.isArray(response.data)) {
                console.log(`Successfully fetched ${response.data.length} inventory items from ${endpoint}`);
                return response.data;
              } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
                // Common pattern: { data: [...] }
                console.log(`Successfully fetched ${response.data.data.length} inventory items from ${endpoint}`);
                return response.data.data;
              } else if (response.data && typeof response.data === 'object' && response.data.items) {
                // Another common pattern: { items: [...] }
                console.log(`Successfully fetched ${response.data.items.length} inventory items from ${endpoint}`);
                return response.data.items;
              } else {
                // Got some other kind of response, might be valid
                console.log(`Got response from ${endpoint}, checking if it's valid data`);
                return response.data;
              }
            } else if (response.status === 401 || response.status === 403) {
              console.error(`Unauthorized access to ${endpoint}. Token may have expired.`);
              // Try re-authenticating
              await this.authenticate();
              // Retry with new token
              const retryResponse = await axios.get(endpoint, {
                headers: {
                  ...await this.getAuthHeader(),
                  'Accept': 'application/json',
                },
                timeout: 30000,
              });
              
              if (Array.isArray(retryResponse.data)) {
                console.log(`Successfully fetched ${retryResponse.data.length} inventory items from ${endpoint} after re-authentication`);
                return retryResponse.data;
              } else if (retryResponse.data && typeof retryResponse.data === 'object' && Array.isArray(retryResponse.data.data)) {
                console.log(`Successfully fetched ${retryResponse.data.data.length} inventory items from ${endpoint} after re-authentication`);
                return retryResponse.data.data;
              }
            }
          } catch (endpointError) {
            console.log(`Failed to reach inventory endpoint ${endpoint} with method ${method}: ${endpointError.message}`);
            continue; // Try next combination
          }
        }
      }
      
      throw new Error('No valid inventory endpoint found or all attempts failed');
    } catch (error) {
      console.error('Failed to fetch inventory from Artacom:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Fetch item history data from Artacom
   */
  async fetchAllHistories() {
    try {
      const headers = await this.getAuthHeader();
      // Try the endpoint provided by user
      const endpoint = 'https://billingftth.my.id/api/inventory/history/all';
      
      console.log(`Fetching all histories from: ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        headers: {
          ...headers,
          'Accept': 'application/json',
        },
        timeout: 60000,
      });
      
      if (response.status === 200) {
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch all histories from Artacom:', error.message);
      return [];
    }
  }

  /**
   * Fetch specific item history from Artacom
   */
  async fetchItemHistory(artacomItemId) {
    try {
      const headers = await this.getAuthHeader();
      const endpoint = `https://billingftth.my.id/api/inventory/${artacomItemId}/history`;
      
      const response = await axios.get(endpoint, {
        headers,
        timeout: 30000,
      });
      
      if (response.status === 200) {
        return Array.isArray(response.data) ? response.data : (response.data.data || []);
      }
      return [];
    } catch (error) {
      console.error(`Failed to fetch history for item ${artacomItemId}:`, error.message);
      return [];
    }
  }

  /**
   * Transform Artacom data to local schema format
   */
  transformArtacomData(artacomData) {
    // Handle different possible data formats from Artacom API
    if (!Array.isArray(artacomData)) {
      // If it's an object with a data property, extract the array
      if (artacomData && Array.isArray(artacomData.data)) {
        artacomData = artacomData.data;
      } else if (artacomData && typeof artacomData === 'object') {
        // If it's a single object, wrap it in an array
        artacomData = [artacomData];
      } else {
        return [];
      }
    }

    return artacomData.map((item) => {
      // Handle different possible field names in the API response
      // Also ensure values are properly typed
      // Extract product name from device/model field if available
      const productName = item['Nama Perangkat'] || 
                         item['Device Name'] || 
                         item['device_name'] || 
                         item.deviceName || 
                         item['Model'] || 
                         item['model'] || 
                         item.model || 
                         item['Tipe Perangkat'] || 
                         item.Tipe || 
                         item.type || 
                         item.device_type || 
                         item.category || 
                         'Active';
      
      return {
        serialNumber: String(item['Serial Number'] || 
                           item['serial_number'] || 
                           item.serialNumber || 
                           item.sn || 
                           item.id || 
                           ''),
        macAddress: item['MAC Address'] || 
                    item['mac_address'] || 
                    item.macAddress || 
                    item.mac || 
                    null,
        type: String(productName),
        status: this.mapStatus(String(item.Status || 
                                 item.status || 
                                 item.state || 
                                 'GUDANG')),
        purchaseDate: this.parseDate(item['Tanggal Pembelian'] || 
                                   item['purchase_date'] || 
                                   item.purchaseDate || 
                                   item.date_purchased || 
                                   item.created_at || 
                                   item.createdAt || 
                                   null),
        location: String(item.Lokasi || 
                        item.location || 
                        item.lokasi || 
                        item.warehouse || 
                        ''),
        notes: String(item.Catatan ||
                     item.notes ||
                     item.catatan ||
                     item.description ||
                     ''),
        purchaseDate: this.parseDate(item['Tanggal Pembelian'] ||
                                   item['purchase_date'] ||
                                   item.purchaseDate ||
                                   item.date_purchased ||
                                   item.created_at ||
                                   item.createdAt ||
                                   null),
      };
    });
  }

  /**
   * Parse date from various possible formats
   */
  parseDate(dateValue) {
    if (!dateValue) return null;
    
    // If it's already a Date object, return it
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    // If it's a string, try to parse it
    if (typeof dateValue === 'string') {
      // Try various common date formats
      const date = new Date(dateValue);
      
      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // If it's a number (timestamp), convert it
    if (typeof dateValue === 'number') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // If none of the above worked, return null
    return null;
  }

  /**
   * Map Artacom status to local status
   */
  mapStatus(status) {
    if (!status) return 'GUDANG';
    
    const statusUpper = status.toUpperCase();
    
    // Exact matches
    if (['GUDANG', 'WAREHOUSE', 'DI WAREHOUSE GUDANG'].some(s => statusUpper.includes(s))) return 'GUDANG';
    if (['TERPASANG', 'INSTALLED', 'OPERASIONAL', 'RUSUN', 'PERUMAHAN', 'PINUS'].some(s => statusUpper.includes(s))) return 'TERPASANG';
    if (['RUSAK', 'DAMAGED', 'REPAIR', 'PERBAIKAN'].some(s => statusUpper.includes(s))) return 'RUSAK';
    if (['TEKNISI', 'TECHNICIAN', 'LAPANGAN'].some(s => statusUpper.includes(s))) return 'TEKNISI';

    return 'GUDANG';
  }

  /**
   * Sync Artacom data to local database
   */
  async syncToDatabase() {
    let syncLogId;
    try {
      console.log('Starting sync with Artacom...');

      // Create sync log entry
      const syncLog = await prisma.synclog.create({
        data: {
          id: `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'ARTACOM_SYNC',
          status: 'IN_PROGRESS',
          details: JSON.stringify({ message: 'Sync started' }),
        },
      });
      syncLogId = syncLog.id;

      // Fetch data from Artacom
      const artaData = await this.fetchInventory();
      const transformedData = this.transformArtacomData(artaData);

      let createdCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      for (const item of transformedData) {
        try {
          // Find or create product based on type
          let product = await prisma.product.findFirst({
            where: {
              name: item.type,
            },
          });

          if (!product) {
            // Create new product
            product = await prisma.product.create({
                data: {
                  id: `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  sku: `ARTA-${item.type.substring(0, 3).toUpperCase()}-${Date.now()}`,
                  name: item.type,
                  category: this.inferCategory(item.type),
                  unit: 'Pcs',
                },
              });
          }

          // Check if item exists by serial number
          const existingItem = await prisma.itemdetail.findUnique({
            where: { serialNumber: item.serialNumber },
          });

          let itemId;
          if (existingItem) {
            // Determine status based on notes if not already set
            let finalStatus = item.status;
            if (item.notes) {
              const derivedStatus = this.deriveStatusFromNotes(item.notes);
              if (derivedStatus) {
                finalStatus = derivedStatus;
              }
            }
            
            // Update existing item
            const updatedItem = await prisma.itemdetail.update({
              where: { id: existingItem.id },
              data: {
                macAddress: item.macAddress,
                status: finalStatus,
                purchaseDate: item.purchaseDate,
                notes: item.notes || existingItem.notes,
              },
            });
            itemId = updatedItem.id;
            updatedCount++;
          } else {
            // Determine status based on notes
            let finalStatus = item.status;
            if (item.notes) {
              const derivedStatus = this.deriveStatusFromNotes(item.notes);
              if (derivedStatus) {
                finalStatus = derivedStatus;
              }
            }
            
            // Create new item
            const newItem = await prisma.itemdetail.create({
              data: {
                id: `ITM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                productId: product.id,
                serialNumber: item.serialNumber,
                macAddress: item.macAddress,
                status: finalStatus,
                purchaseDate: item.purchaseDate,
                notes: item.notes,
              },
            });
            itemId = newItem.id;
            createdCount++;
          }

          // Items are now updated, we will sync stock at the end
        } catch (error) {
          console.error(`Error syncing item ${item.serialNumber}:`, error.message);
          errorCount++;
        }
      }

      // Sync Stock with Item Statuses
      await this.syncStockWithInventory();

      // Sync Histories
      await this.syncHistoriesToDatabase();

      // Update sync log with success status
      await prisma.synclog.update({
        where: { id: syncLogId },
        data: {
          status: 'SUCCESS',
          details: JSON.stringify({
            message: `Sync completed: ${createdCount} created, ${updatedCount} updated, ${errorCount} errors`,
            created: createdCount,
            updated: updatedCount,
            errors: errorCount,
            totalProcessed: transformedData.length,
          }),
        },
      });

      return {
        success: true,
        created: createdCount,
        updated: updatedCount,
        errors: errorCount,
        message: `Sync completed: ${createdCount} created, ${updatedCount} updated, ${errorCount} errors`,
      };
    } catch (error) {
      console.error('Sync failed:', error);
      
      // Update sync log with failure status
      if (syncLogId) {
        await prisma.synclog.update({
          where: { id: syncLogId },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
            details: JSON.stringify({
              message: 'Sync failed',
              error: error.message,
            }),
          },
        });
      }

      return {
        success: false,
        error: error.message,
        message: 'Sync failed: ' + error.message,
      };
    }
  }

  /**
   * Derive status from notes
   */
  deriveStatusFromNotes(notes) {
    if (!notes) return null;

    // Convert notes to lowercase for comparison
    const lowerNotes = notes.toLowerCase();

    // Define keywords for each status
    const gudangKeywords = ['gudang', 'warehouse', 'stock', 'ready', 'tersedia', 'baru', 'di gudang'];
    const terpasangKeywords = ['terpasang', 'installed', 'install', 'instalasi', 'active', 'aktif', 'terinstall', 'installasi', 'terinstal', 'terinstalasi'];
    const rusakKeywords = ['rusak', 'broken', 'damage', 'defect', 'tidak bisa', 'mati'];
    const teknisiKeywords = ['teknisi', 'tech', 'maintenance', 'service', 'repair', 'diperbaiki', 'perbaikan'];

    // Check for each status
    if (gudangKeywords.some(keyword => lowerNotes.includes(keyword))) {
      return 'GUDANG';
    } else if (terpasangKeywords.some(keyword => lowerNotes.includes(keyword))) {
      return 'TERPASANG';
    } else if (rusakKeywords.some(keyword => lowerNotes.includes(keyword))) {
      return 'RUSAK';
    } else if (teknisiKeywords.some(keyword => lowerNotes.includes(keyword))) {
      return 'TEKNISI';
    }

    // Check for specific Artacom statuses
    if (lowerNotes.includes('di operasional rusun ftth')) {
      return 'DI_OPERASIONAL_RUSUN_FTTH';
    } else if (lowerNotes.includes('di warehouse gudang')) {
      return 'DI_WAREHOUSE_GUDANG';
    } else if (lowerNotes.includes('dioperasional perumahan ftth')) {
      return 'DIOPERASIONAL_PERUMAHAN_FTTH';
    } else if (lowerNotes.includes('pinus luar')) {
      return 'PINUS_LUAR';
    } else if (lowerNotes.includes('repair')) {
      return 'REPAIR';
    } else if (lowerNotes.includes('terpasang di perumahan')) {
      return 'TERPASANG_DI_PERUMAHAN';
    } else if (lowerNotes.includes('terpasang di rusun')) {
      return 'TERPASANG_DI_RUSUN';
    }

    return null; // Return null if no matching status found
  }

  /**
   * Recalculates stock quantity for all products based on item statuses
   */
  async syncStockWithInventory() {
    console.log('Synchronizing stock quantities with item statuses...');
    try {
      const products = await prisma.product.findMany();
      
      for (const product of products) {
        // Count items that are in warehouse
        const inWarehouseCount = await prisma.itemdetail.count({
          where: {
            productId: product.id,
            status: {
              in: ['GUDANG', 'DI_WAREHOUSE_GUDANG']
            }
          }
        });

        // Update or create stock record
        const existingStock = await prisma.stock.findFirst({
          where: { productId: product.id, warehouseId: 'WH-001' }
        });

        if (existingStock) {
          await prisma.stock.update({
            where: { id: existingStock.id },
            data: { 
              quantity: inWarehouseCount,
              updatedAt: new Date()
            }
          });
        } else {
          await prisma.stock.create({
            data: {
              id: `STK-SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              productId: product.id,
              warehouseId: 'WH-001',
              quantity: inWarehouseCount,
              updatedAt: new Date()
            }
          });
        }
      }
      console.log('Stock synchronization completed.');
    } catch (error) {
      console.error('Failed to sync stock with inventory:', error);
    }
  }


  /**
   * Sync histories from Artacom to local database
   */
  async syncHistoriesToDatabase() {
    try {
      console.log('Syncing item histories from Artacom...');
      const artacomHistories = await this.fetchAllHistories();
      
      if (!Array.isArray(artacomHistories) || artacomHistories.length === 0) {
        console.log('No histories found to sync.');
        return;
      }

      console.log(`Processing ${artacomHistories.length} history records from Artacom...`);
      let createdCount = 0;
      let matchCount = 0;
      
      for (let i = 0; i < artacomHistories.length; i++) {
        const history = artacomHistories[i];
        // Find the local item by serial number
        const sn = history.serial_number || history.sn || history['Serial Number'];
        
        if (!sn) continue;

        const localItem = await prisma.itemdetail.findFirst({
          where: { 
            serialNumber: {
              equals: String(sn).trim()
            }
          }
        });

        if (!localItem) {
          // Only log for the first few misses to avoid spam
          if (i < 5) console.log(`No local item found for SN: ${sn}`);
          continue;
        }

        matchCount++;
        if (i < 5) console.log(`Match found! SN: ${sn} -> Local ID: ${localItem.id}`);

        // Parse date - handles 'timestamp', 'created_at', 'date', 'waktu'
        const createdAt = this.parseDate(history.timestamp || history.created_at || history.date || history.waktu);
        
        // Map action - Must match itemhistory_action enum:
        // CREATE, UPDATE_STATUS, UPDATE_SN, UPDATE_MAC, UPDATE_NOTES, UPDATE_PURCHASE_DATE, UPDATE_LOCATION, DELETE, RESTORE, MOVE
        const artacomAction = String(history.action || history.aksi || 'Imported');
        let action = 'CREATE'; // Default to CREATE for imports
        let notes = artacomAction;

        const lowerAction = artacomAction.toLowerCase();
        if (lowerAction.includes('status')) {
          action = 'UPDATE_STATUS';
        } else if (lowerAction.includes('move') || lowerAction.includes('pindah') || lowerAction.includes('lokasi')) {
          action = 'MOVE';
        } else if (lowerAction.includes('update') || lowerAction.includes('edit')) {
          action = 'UPDATE_NOTES';
        } else if (lowerAction.includes('delete') || lowerAction.includes('hapus')) {
          action = 'DELETE';
        }

        // Check for duplicates
        // Since we don't have a unique ID from Artacom for histories, we check for similar record
        const whereClause = {
          itemId: localItem.id,
          action: action,
        };
        
        // If we have a notes/description, include it in the duplicate check to be more precise
        if (notes) {
          whereClause.notes = String(notes);
        }

        // We use findFirst with action and notes. Timestamps can be tricky to match exactly.
        const existingHistory = await prisma.itemhistory.findFirst({
          where: whereClause
        });

        if (!existingHistory) {
          await prisma.itemhistory.create({
            data: {
              id: `HST-ARTA-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              itemId: localItem.id,
              action: action,
              notes: String(notes),
              metadata: JSON.stringify({
                artacomUser: history.user?.name || history.user || history.oleh || 'Automated',
                artacomData: history
              }),
              createdAt: createdAt || new Date(),
            }
          });
          createdCount++;
        }
      }
      
      console.log(`History sync completed. Matched ${matchCount}, Created ${createdCount} new records.`);
    } catch (error) {
      console.error('Failed to sync histories:', error.message);
    }
  }

  /**
   * Infer product category from type name
   */
  inferCategory(type) {
    const typeLower = type.toLowerCase();

    if (typeLower.includes('ont') || 
        typeLower.includes('xpon') || 
        typeLower.includes('router') || 
        typeLower.includes('modem') || 
        typeLower.includes('ap') || 
        typeLower.includes('zte') || 
        typeLower.includes('f660')) {
      return 'Active';
    }
    if (typeLower.includes('kabel') || 
        typeLower.includes('cable') || 
        typeLower.includes('splitter') || 
        typeLower.includes('patchcord') || 
        typeLower.includes('pigtail')) {
      return 'Passive';
    }
    if (typeLower.includes('splicer') || 
        typeLower.includes('tangga') || 
        typeLower.includes('tool') || 
        typeLower.includes('tester') || 
        typeLower.includes('multimeter')) {
      return 'Tool';
    }

    return 'Active'; // Default
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    // Get the latest sync log
    const latestSync = await prisma.synclog.findFirst({
      where: { type: 'ARTACOM_SYNC' },
      orderBy: { createdAt: 'desc' },
    });

    return {
      connected: !!this.token,
      lastSync: latestSync ? latestSync.createdAt : null,
      lastSyncStatus: latestSync ? latestSync.status : null,
      apiEndpoint: 'https://billingftth.my.id',
    };
  }

  /**
   * Get sync history
   */
  async getSyncHistory(limit = 10) {
    const syncLogs = await prisma.synclog.findMany({
      where: { type: 'ARTACOM_SYNC' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return syncLogs;
  }
}

export default new ArtacomService();
