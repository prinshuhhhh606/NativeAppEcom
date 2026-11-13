
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/config';

let socket = null;
let connectedPartnerId = null;
let connectingPromise = null;

const listeners = {
  'delivery:new_assignment': new Set(),
  'delivery:cancelled': new Set(),
};

const attachListeners = () => {
  if (!socket) return;

  Object.entries(listeners).forEach(([eventName, callbacks]) => {
    // Prevent duplicate registration by this service.
    socket.off(eventName);

    callbacks.forEach((callback) => {
      socket.on(eventName, callback);
    });
  });
};

export const socketService = {
  connect: async (partnerId) => {
    if (!partnerId) {
      console.warn('[Delivery Socket] Partner ID missing');
      return null;
    }

    const partnerIdString = String(partnerId);

    if (
      socket &&
      connectedPartnerId === partnerIdString &&
      socket.connected
    ) {
      return socket;
    }

    if (
      connectingPromise &&
      connectedPartnerId === partnerIdString
    ) {
      return connectingPromise;
    }

    // Disconnect an old partner connection if necessary.
    if (socket && connectedPartnerId !== partnerIdString) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }

    connectedPartnerId = partnerIdString;

    connectingPromise = (async () => {
      try {
        const token = await AsyncStorage.getItem(
          Config.STORAGE_KEYS.TOKEN
        );

        socket = io(Config.SOCKET_URL, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 5000,
          timeout: 15000,

          // Backend socketManager can verify this JWT.
          auth: {
            token: token || '',
            role: 'delivery',
          },
        });

        socket.on('connect', () => {
          console.log(
            '[Delivery Socket] Connected:',
            socket.id
          );

          // Join the delivery partner room.
          socket.emit('join_delivery_room', partnerIdString);
        });

        socket.on('disconnect', (reason) => {
          console.log(
            '[Delivery Socket] Disconnected:',
            reason
          );
        });

        socket.on('connect_error', (error) => {
          console.warn(
            '[Delivery Socket] Connection error:',
            error.message
          );
        });

        attachListeners();

        return socket;
      } catch (error) {
        console.error(
          '[Delivery Socket] Connection failed:',
          error
        );

        socket = null;
        connectedPartnerId = null;

        return null;
      } finally {
        connectingPromise = null;
      }
    })();

    return connectingPromise;
  },

  getSocket: () => socket,

  isConnected: () => Boolean(socket?.connected),

  disconnect: () => {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }

    connectedPartnerId = null;
    connectingPromise = null;

    console.log('[Delivery Socket] Disconnected successfully');
  },

  onNewAssignment: (callback) => {
    if (typeof callback !== 'function') {
      return () => {};
    }

    listeners['delivery:new_assignment'].add(callback);

    if (socket) {
      socket.on('delivery:new_assignment', callback);
    }

    // Return cleanup function for React useEffect.
    return () => {
      listeners['delivery:new_assignment'].delete(callback);
      socket?.off('delivery:new_assignment', callback);
    };
  },

  on: (eventName, callback) => {
    if (typeof callback !== 'function' || !eventName) {
      return () => {};
    }

    if (!listeners[eventName]) {
      listeners[eventName] = new Set();
    }
    listeners[eventName].add(callback);

    if (socket) {
      socket.on(eventName, callback);
    }

    return () => {
      listeners[eventName]?.delete(callback);
      socket?.off(eventName, callback);
    };
  },

  off: (eventName, callback) => {
    if (eventName && listeners[eventName]) {
      if (callback) {
        listeners[eventName].delete(callback);
      } else {
        listeners[eventName].clear();
      }
    }
    socket?.off(eventName, callback);
  },

  onCancelled: (callback) => {
    if (typeof callback !== 'function') {
      return () => {};
    }

    listeners['delivery:cancelled'].add(callback);

    if (socket) {
      socket.on('delivery:cancelled', callback);
    }

    // Return cleanup function for React useEffect.
    return () => {
      listeners['delivery:cancelled'].delete(callback);
      socket?.off('delivery:cancelled', callback);
    };
  },
};

export default socketService;
