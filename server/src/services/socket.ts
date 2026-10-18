import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { env } from '../config/env';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

let io: Server | null = null;
const onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket Auth Middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      socket.username = payload.username;
      next();
    } catch (err: any) {
      next(new Error('Authentication failed: ' + err.message));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const username = socket.username!;

    // Track active socket
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      // Broadcast online status
      socket.broadcast.emit('user_presence', { userId, status: 'online' });
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Join personal user room for direct notifications and events
    socket.join(`user:${userId}`);

    console.log(`[Socket] User ${username} (${userId}) connected (Socket ID: ${socket.id})`);

    // Direct Conversation Room Handlers
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Typing Indicators
    socket.on('typing_start', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        username,
        isTyping: true,
      });
    });

    socket.on('typing_stop', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        username,
        isTyping: false,
      });
    });

    // Read Receipt real-time broadcast
    socket.on('message_read', ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
      socket.to(`conversation:${conversationId}`).emit('message_read_receipt', {
        conversationId,
        messageId,
        readerId: userId,
      });
    });

    // Disconnect Handler
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // Broadcast offline status
          socket.broadcast.emit('user_presence', { userId, status: 'offline' });
        }
      }
      console.log(`[Socket] User ${username} disconnected`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToConversation = (conversationId: string, event: string, data: any): void => {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
};

export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
};
