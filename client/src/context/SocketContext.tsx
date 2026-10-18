import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: Set<string>;
  isOnline: (userId: string) => boolean;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('socialsphere_access_token');
    const socketUrl = import.meta.env.VITE_WS_URL || window.location.origin;

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to real-time server');
    });

    newSocket.on('user_presence', ({ userId, status }: { userId: string; status: 'online' | 'offline' }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (status === 'online') next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

  const isOnline = (userId: string) => onlineUsers.has(userId);

  const sendTyping = (conversationId: string, isTyping: boolean) => {
    if (socket) {
      socket.emit(isTyping ? 'typing_start' : 'typing_stop', { conversationId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isOnline, sendTyping }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
