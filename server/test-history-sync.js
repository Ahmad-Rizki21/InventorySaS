import artacomService from './src/services/artacomService.js';
import prisma from './src/config/database.js';

async function testHistorySync() {
  try {
    console.log('--- TESTING HISTORY SYNC ---');
    const histories = await artacomService.fetchAllHistories();
    console.log(`Fetched ${histories.length} history records.`);
    
    if (histories.length > 0) {
      console.log('First history record:', JSON.stringify(histories[0], null, 2));
      
      const snToLookFor = 'RTEGC60A7581';
      const matches = histories.filter(h => {
        const hSn = h.serial_number || h.sn || h['Serial Number'];
        return String(hSn) === snToLookFor;
      });
      console.log(`Found ${matches.length} matches for SN: ${snToLookFor}`);
      
      if (matches.length > 0) {
        console.log('First match details:', JSON.stringify(matches[0], null, 2));
      }
    }
    
    console.log('Running syncHistoriesToDatabase()...');
    await artacomService.syncHistoriesToDatabase();
    console.log('Done.');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testHistorySync();
