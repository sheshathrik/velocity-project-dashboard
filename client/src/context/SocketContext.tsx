import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.js';
import { TaskActivityLog, Notification, Task } from '../types/index.js';
import { api } from '../api/client.js';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeUsersCount: number;
  activities: TaskActivityLog[];
  notifications: Notification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  joinProjectRoom: (projectId: string) => void;
  leaveProjectRoom: (projectId: string) => void;
  onTaskUpdated?: (updatedTask: Task) => void;
  setTaskUpdateListener: (callback: ((task: Task) => void) | null) => void;
  refreshActivities: (projectId?: string) => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(1);
  const [activities, setActivities] = useState<TaskActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);

  const taskUpdateListenerRef = useRef<((task: Task) => void) | null>(null);

  const setTaskUpdateListener = (callback: ((task: Task) => void) | null) => {
    taskUpdateListenerRef.current = callback;
  };

  // Load initial notifications and unread count from DB
  const fetchInitialNotifications = async () => {
    try {
      const data = await api.getNotifications();
      if (data) {
        setNotifications(data.notifications || []);
        setUnreadNotificationCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Failed to load initial notifications:', err);
    }
  };

  // Load missed activities from DB (last 20 missed events requirement)
  const refreshActivities = async (projectId?: string) => {
    try {
      const data = await api.getActivity(projectId, 20);
      setActivities(data || []);
    } catch (err) {
      console.warn('Failed to load activity logs:', err);
    }
  };

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIsConnected(false);
      setActivities([]);
      setNotifications([]);
      setUnreadNotificationCount(0);
      return;
    }

    // Initial database catches
    fetchInitialNotifications();
    refreshActivities();

    // Establish pure WebSocket connection
    const newSocket = io('/', {
      transports: ['websocket'], // Strictly pure WebSocket — no polling
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('⚡ [Socket.io] Connected to server successfully:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('⚡ [Socket.io] Disconnected from server');
      setIsConnected(false);
    });

    // 1. Live Presence Update
    newSocket.on('presence:update', (data: { activeUsersCount: number }) => {
      setActiveUsersCount(data.activeUsersCount);
    });

    // 2. Real-time Live Activity Feed
    newSocket.on('activity:new', (newActivity: TaskActivityLog) => {
      setActivities((prev) => [newActivity, ...prev.slice(0, 49)]);
    });

    // 3. Real-time In-App Notifications
    newSocket.on('notification:new', (newNotification: Notification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadNotificationCount((prev) => prev + 1);
    });

    newSocket.on('notification:read', (data: { notificationId: string; unreadCount: number }) => {
      setUnreadNotificationCount(data.unreadCount);
      if (data.notificationId === 'ALL') {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === data.notificationId ? { ...n, isRead: true } : n))
        );
      }
    });

    // 4. Real-time Task Status Updates
    newSocket.on('task:status_updated', (data: { task: Task }) => {
      if (taskUpdateListenerRef.current) {
        taskUpdateListenerRef.current(data.task);
      }
    });

    newSocket.on('task:created', (data: { task: Task }) => {
      if (taskUpdateListenerRef.current) {
        taskUpdateListenerRef.current(data.task);
      }
    });

    newSocket.on('task:assigned', (data: { task: Task }) => {
      if (taskUpdateListenerRef.current) {
        taskUpdateListenerRef.current(data.task);
      }
    });

    newSocket.on('task:overdue', (data: { task: Task }) => {
      if (taskUpdateListenerRef.current) {
        taskUpdateListenerRef.current(data.task);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?.id]);

  const joinProjectRoom = (projectId: string) => {
    if (socket && isConnected) {
      socket.emit('project:join', projectId);
    }
  };

  const leaveProjectRoom = (projectId: string) => {
    if (socket && isConnected) {
      socket.emit('project:leave', projectId);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotificationCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        activeUsersCount,
        activities,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        joinProjectRoom,
        leaveProjectRoom,
        setTaskUpdateListener,
        refreshActivities,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
