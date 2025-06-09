import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { createClient } from 'redis';

// Load environment variables
dotenv.config();

// Import routes and middleware
import authRoutes from './routes/auth';
import gameRoutes from './routes/games';
import { playersRouter } from './routes/players';
import { authenticateToken } from './middleware/auth';
import { setupSocketHandlers } from './controllers/socketController';

const app = express();
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Database connection
export const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'worldstage',
  user: process.env.DB_USER || 'worldstage_user',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis connection
export const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

// Socket.io setup
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Make io available globally
export { io };

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', authenticateToken, gameRoutes);
app.use('/api/players', authenticateToken, playersRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Socket.io connection handling
setupSocketHandlers(io);

// Database connection test
async function connectDatabase() {
  try {
    await db.connect();
    console.log('✅ Connected to PostgreSQL database');
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error);
    process.exit(1);
  }
}

// Redis connection test
async function connectRedis() {
  try {
    await redis.connect();
    console.log('✅ Connected to Redis');
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    // Redis is not critical for basic functionality
    console.log('⚠️  Continuing without Redis (session storage will use memory)');
  }
}

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  await connectDatabase();
  await connectRedis();

  server.listen(PORT, () => {
    console.log(`🚀 WorldStage server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🎮 Ready for epic multiplayer strategy gaming!`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await db.end();
  await redis.quit();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await db.end();
  await redis.quit();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 