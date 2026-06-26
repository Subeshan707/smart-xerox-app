import { useEffect, useRef, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function useSocket(events = {}) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      setIsConnected(true);
      // Join appropriate room based on role
      if (user?.role === 'shopOperator' && user?.shopId) {
        socket.emit('joinRoom', { room: `operator:${user.shopId}` });
      } else if (user?.role === 'customer') {
        socket.emit('joinRoom', { room: `customer:${user.id}` });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('🔌 Socket connection error:', err.message);
    });

    // Register event listeners
    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.role, user?.shopId, user?.id]);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const joinRoom = useCallback((room) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('joinRoom', { room });
    }
  }, []);

  const leaveRoom = useCallback((room) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leaveRoom', { room });
    }
  }, []);

  return { socket: socketRef, isConnected, emit, joinRoom, leaveRoom };
}
