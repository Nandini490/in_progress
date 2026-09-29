import dotenv from 'dotenv';
import { createApp } from './src/app.js';
import { connectDB, closeDB } from './src/config/db.js';

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 5002;
const HOST = process.env.HOST || '0.0.0.0';
const app = createApp();

async function startServer() {
  console.log('🚀  [Server]: Starting In Progress backend server...');

  // Attempt database connection
  await connectDB();

  const server = app.listen(PORT, HOST, () => {
    console.log(`📡  [Server]: In Progress API is running on http://${HOST}:${PORT}`);
    console.log(`🩺  [Server]: Health endpoint active at http://${HOST}:${PORT}/api/health`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    console.log(`\n🛑  [Server]: Received ${signal}. Closing gracefully...`);
    server.close(async () => {
      await closeDB();
      console.log('👋  [Server]: All connections closed. Goodbye.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer();
