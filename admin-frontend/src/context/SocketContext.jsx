import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected to backend real-time hub');
      setIsConnected(true);
      socketInstance.emit('join_admin_room');
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected from backend');
      setIsConnected(false);
    });

    // 1. New Order Event
    socketInstance.on('new_order', (data) => {
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white dark:bg-slate-800 shadow-xl rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-emerald-500 p-4`}>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                📦 New Order Received!
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                Order <span className="font-semibold text-emerald-600">#{data.orderId}</span> placed by {data.customerName} for{' '}
                <span className="font-bold text-gray-900 dark:text-white">₹{data.grandTotal}</span>
              </p>
            </div>
          </div>
        ),
        { duration: 6000, position: 'top-right' }
      );

      setLiveNotifications((prev) => [
        {
          id: Date.now(),
          type: 'order',
          title: `New Order #${data.orderId}`,
          message: `₹${data.grandTotal} by ${data.customerName}`,
          time: new Date(),
          isRead: false,
        },
        ...prev.slice(0, 49),
      ]);
      setUnreadCount((c) => c + 1);
    });

    // 2. Order Status Update
    socketInstance.on('order_status_updated', (data) => {
      toast.info(`Order #${data.orderId} is now ${data.newStatus}`);
      setLiveNotifications((prev) => [
        {
          id: Date.now(),
          type: 'status',
          title: `Order Status: ${data.newStatus}`,
          message: `Order #${data.orderId} updated`,
          time: new Date(),
          isRead: false,
        },
        ...prev.slice(0, 49),
      ]);
    });

    // 3. Low Stock Alert
    socketInstance.on('low_stock_alert', (data) => {
      toast.error(
        `⚠️ Low Stock Alert: "${data.productName}" has only ${data.currentStock} units remaining!`,
        { duration: 7000 }
      );
      setLiveNotifications((prev) => [
        {
          id: Date.now(),
          type: 'stock',
          title: `Low Stock: ${data.productName}`,
          message: `Current stock: ${data.currentStock}`,
          time: new Date(),
          isRead: false,
        },
        ...prev.slice(0, 49),
      ]);
      setUnreadCount((c) => c + 1);
    });

    // 4. New Customer Registration
    socketInstance.on('new_customer', (data) => {
      toast.success(`👤 New Customer Registered: ${data.name} (${data.phone || data.email})`);
      setLiveNotifications((prev) => [
        {
          id: Date.now(),
          type: 'customer',
          title: 'New Customer Registered',
          message: `${data.name} joined the platform`,
          time: new Date(),
          isRead: false,
        },
        ...prev.slice(0, 49),
      ]);
      setUnreadCount((c) => c + 1);
    });

    // 5. Return Requested
    socketInstance.on('return_requested', (data) => {
      toast(`🔄 Return Requested for Order #${data.orderId}: ₹${data.refundAmount}`, {
        icon: '⚠️',
      });
      setLiveNotifications((prev) => [
        {
          id: Date.now(),
          type: 'return',
          title: `Return Requested #${data.orderId}`,
          message: `Reason: ${data.reason}`,
          time: new Date(),
          isRead: false,
        },
        ...prev.slice(0, 49),
      ]);
      setUnreadCount((c) => c + 1);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated]);

  const markAllAsRead = () => {
    setLiveNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        liveNotifications,
        unreadCount,
        markAllAsRead,
      }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

