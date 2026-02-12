import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// Import routes
import dashboardRoutes from './routes/dashboard.js';
import productRoutes from './routes/products.js';
import stockRoutes from './routes/stocks.js';
import itemRoutes from './routes/items.js';
import itemHistoryRoutes from './routes/itemHistory.js';
import deviceMovementRoutes from './routes/deviceMovement.js';
import authRoutes from './routes/auth.js';
import activityLogRoutes from './routes/activityLogs.js';
import userRoutes from './routes/users.js';
import artacomRoutes from './routes/artacom.js';
import roleRoutes from './routes/roleRoutes.js';
import auditRoutes from './routes/auditRoutes.js'; // Import audit routes
import satRoutes from './routes/satRoutes.js';

// Import services
import artacomService from './services/artacomService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/histories', itemHistoryRoutes);
app.use('/api/movements', deviceMovementRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/artacom', artacomRoutes);
app.use('/api/audit', auditRoutes); // Add audit routes
app.use('/api/sat', satRoutes);

// Artacom sync endpoint (backward compatibility)
app.post('/api/sync/artacom', async (req, res) => {
  try {
    const result = await artacomService.syncToDatabase();
    res.json(result);
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed', message: error.message });
  }
});

// Get sync status (backward compatibility)
app.get('/api/sync/status', async (req, res) => {
  try {
    const status = await artacomService.getSyncStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  \x1b[32m
  ██╗███╗   ██╗██╗   ██╗███████╗███╗   ██╗████████╗
  ██║████╗  ██║██║   ██║██╔════╝████╗  ██║╚══██╔══╝
  ██║██╔██╗ ██║██║   ██║█████╗  ██╔██╗ ██║   ██║   
  ██║██║╚██╗██║╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║   
  ██║██║ ╚████║ ╚████╔╝ ███████╗██║ ╚████║   ██║   
  ╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝   

  [ SYSTEM ONLINE ]
  [ PORT : ${PORT} ]
  [ MODE : ${process.env.NODE_ENV || 'DEV'} ]
  \x1b[0m
  `);

});
