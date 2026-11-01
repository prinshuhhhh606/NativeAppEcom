import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { seller, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !seller?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      // Join vendor-specific private room
      socketInstance.emit('join_seller_room', { sellerId: seller._id });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-time notification events
    socketInstance.on('seller_notification', (data) => {
      setUnreadCount((prev) => prev + 1);
      toast(
        (t) => (
          <div className="flex items-start gap-3">
            <div className="text-xl">🔔</div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{data.title || 'New Notification'}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">{data.message}</p>
            </div>
          </div>
        ),
        { duration: 5000 }
      );
    });

    socketInstance.on('new_order', (data) => {
      setUnreadCount((prev) => prev + 1);
      toast.success(
        `🛍️ New Order #${data.subOrderNumber || data.orderNumber}! Amount: ₹${data.totalAmount || data.earnings || ''}`,
        { duration: 6000 }
      );
    });

    socketInstance.on('order_status_update', (data) => {
      toast.info(`📦 Order #${data.subOrderNumber}: Status updated to ${data.status}`);
    });

    socketInstance.on('payout_update', (data) => {
      if (data.status === 'completed' || data.status === 'approved') {
        toast.success(`💰 Payout of ₹${data.amount} has been ${data.status}!`);
      } else {
        toast.error(`⚠️ Payout notice: ₹${data.amount} is ${data.status}`);
      }
    });

    socketInstance.on('product_approval', (data) => {
      if (data.status === 'approved') {
        toast.success(`🎉 Product "${data.productName}" was approved by Admin!`);
      } else {
        toast.error(`❌ Product "${data.productName}" was rejected: ${data.reason || 'Check details'}`);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, seller?._id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, unreadCount, setUnreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

