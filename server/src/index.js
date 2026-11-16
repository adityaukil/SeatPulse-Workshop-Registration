import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initDatabase, db } from './db.js';
import { createEmailService } from './emailService.js';
import { setupSocket } from './socket.js';
import { createWorkshopsRouter } from './routes/workshops.js';
import { createRegistrationsRouter } from './routes/registrations.js';
import { createStatsRouter } from './routes/stats.js';
import { createSettingsRouter } from './routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Cross-Origin Resource Sharing setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Initialize database
initDatabase();

// Setup WebSocket server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const socketManager = setupSocket(io, db);
const emailService = createEmailService(db, io);

// API Routes
app.use('/api/workshops', createWorkshopsRouter(db, socketManager));
app.use('/api', createRegistrationsRouter(db, emailService, socketManager));
app.use('/api', createStatsRouter(db, socketManager));
app.use('/api', createSettingsRouter(db, emailService));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend build if dist exists
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    // Avoid intercepting API routes that returned 404
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ success: false, error: 'API route not found' });
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 SeatPulse Workshop Server running at: http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready for live seat count synchronization`);
  console.log(`📦 Client build served from: ${clientDist}`);
  console.log(`=============================================================\n`);
});
