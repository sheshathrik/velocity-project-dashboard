import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/prisma.js';
import { initSocketServer } from './sockets/socketServer.js';
import { startOverdueScheduler } from './jobs/overdueScheduler.js';

async function bootstrap() {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  // Initialize pure WebSocket server via Socket.io
  initSocketServer(httpServer);

  // Start background overdue task scheduler
  startOverdueScheduler();

  httpServer.listen(env.PORT, () => {
    console.log(`🚀 Velocity Server running on http://localhost:${env.PORT}`);
    console.log(`📡 WebSocket server active on port ${env.PORT}`);
    console.log(`🌐 Environment: ${env.NODE_ENV}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
