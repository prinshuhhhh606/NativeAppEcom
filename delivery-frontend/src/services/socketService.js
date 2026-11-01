import { io } from 'socket.io-client';
import { Config } from '../constants/config';

let socket = null;

export const socketService = {
  connect: (partnerId) => {
    if (socket) return socket;

    socket = io(Config.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Delivery Socket] Connected:', socket.id);
      if (partnerId) {
        socket.emit('join_delivery_room', partnerId);
      }
    });

    socket.on('disconnect', () => {
      console.log('[Delivery Socket] Disconnected');
    });

    return socket;
  },

  getSocket: () => socket,

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  onNewAssignment: (callback) => {
    if (socket) {
      socket.on('delivery:new_assignment', callback);
    }
  },

  onCancelled: (callback) => {
    if (socket) {
      socket.on('delivery:cancelled', callback);
    }
  },
};

export default socketService;

