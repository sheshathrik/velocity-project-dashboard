import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { TokenPayload } from '../types/index.js';

let io: SocketIOServer | null = null;

// Map socket.id -> userId
const connectedSockets = new Map<string, string>();

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket'], // Strictly enforce pure WebSockets — no long-polling
  });

  // Authentication Middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication failed: Missing WebSocket auth token'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
      socket.data.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication failed: Invalid or expired WebSocket token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as TokenPayload;
    if (!user) {
      socket.disconnect();
      return;
    }

    connectedSockets.set(socket.id, user.userId);

    // Join personal user room (for direct notifications)
    socket.join(`user:${user.userId}`);

    // Join role room (e.g. role:ADMIN, role:PROJECT_MANAGER, role:DEVELOPER)
    socket.join(`role:${user.role}`);

    console.log(`🔌 [Socket.io] Connected: ${user.name} (${user.email}) [${user.role}] - Socket ${socket.id}`);

    // Broadcast updated presence to all admins
    broadcastPresenceUpdate();

    // Client requests to join a project room
    socket.on('project:join', (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`📡 [Socket.io] User ${user.name} joined project room: project:${projectId}`);
    });

    // Client requests to leave a project room
    socket.on('project:leave', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      console.log(`📡 [Socket.io] User ${user.name} left project room: project:${projectId}`);
    });

    socket.on('disconnect', () => {
      connectedSockets.delete(socket.id);
      console.log(`🔌 [Socket.io] Disconnected: ${user.name} - Socket ${socket.id}`);
      broadcastPresenceUpdate();
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io has not been initialized.');
  }
  return io;
}

export function getOnlineUserCount(): number {
  const uniqueUsers = new Set(connectedSockets.values());
  return uniqueUsers.size;
}

export function broadcastPresenceUpdate(): void {
  if (!io) return;
  const count = getOnlineUserCount();
  // Broadcast presence count to all users or admins
  io.emit('presence:update', { activeUsersCount: count });
}
