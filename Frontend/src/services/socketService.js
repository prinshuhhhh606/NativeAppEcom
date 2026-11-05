/**
 * Real-Time Socket.IO Synchronization Service
 * Manages WebSocket connection, role-based rooms, auto-reconnection,
 * active order subscriptions, and real-time delivery GPS streaming.
 */
import { io } from 'socket.io-client';
import { Config } from '../constants/config';
import secureStorage from '../utils/secureStorage';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.activeSubscriptions = new Map(); // orderId -> { onLocation, onStatus, onEta, onPartner }
    this.connectionListeners = new Set();
    this.isConnecting = false;
    this.candidateIndex = 0;
    this.activeUrl = null;
    this.failoverTimer = null;
  }

  /**
   * Initialize or retrieve active authenticated Socket connection
   */
  async getSocket() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    if (this.isConnecting && this.socket) {
      return this.socket;
    }

    return this.connect();
  }

  /**
   * Synchronous accessor for the current socket instance (may be null if not yet connected)
   */
  getCurrentSocket() {
    return this.socket || null;
  }

  /**
   * Connect to backend Socket.IO server with multi-candidate host failover
   */
  async connect(preferredUrl = null) {
    if (this.socket && (this.isConnected || this.isConnecting)) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnecting = true;

    // Retrieve active token across Customer, Seller, or Delivery
    let token = null;
    let role = 'customer';
    try {
      const session = await secureStorage.getAuthSession();
      if (session?.token) {
        token = session.token;
        role = session.role || 'customer';
      } else {
        token =
          (await secureStorage.getDeliveryToken()) ||
          (await secureStorage.getSellerToken()) ||
          (await secureStorage.getAdminToken()) ||
          (await secureStorage.getAccessToken());
      }
    } catch (e) {
      // Safe fallback
    }

    const candidateUrls = Config.SOCKET_CANDIDATE_URLS || [
      Config.SOCKET_URL,
      'http://10.0.2.2:5000',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
    ];

    const socketUrl = preferredUrl || this.activeUrl || candidateUrls[this.candidateIndex || 0] || Config.SOCKET_URL;
    this.activeUrl = socketUrl;

    this.socket = io(socketUrl, {
      auth: { token },
      query: { role },
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      timeout: 8000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.isConnecting = false;
      if (this.failoverTimer) {
        clearTimeout(this.failoverTimer);
        this.failoverTimer = null;
      }
      console.log(`[SocketService] Connected to ${socketUrl} (ID: ${this.socket.id})`);

      // Notify connection state listeners
      this._notifyConnectionListeners(true);

      // Re-subscribe all active order tracking rooms upon reconnect
      this.activeSubscriptions.forEach((_, orderId) => {
        this.socket.emit('join_order_tracking', { orderId });
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.isConnecting = false;
      console.log(`[SocketService] Disconnected: ${reason}`);
      this._notifyConnectionListeners(false);
    });

    this.socket.on('connect_error', (error) => {
      this.isConnected = false;
      this.isConnecting = false;
      // Log connection status info without triggering LogBox yellow-box spam
      console.log(`[SocketService] Host ${socketUrl} connection attempt: ${error.message}`);

      // Try next candidate URL if this one timed out or failed to connect
      if (!this.failoverTimer && candidateUrls.length > 1) {
        this.failoverTimer = setTimeout(() => {
          this.failoverTimer = null;
          if (!this.isConnected) {
            this.candidateIndex = ((this.candidateIndex || 0) + 1) % candidateUrls.length;
            const nextUrl = candidateUrls[this.candidateIndex];
            console.log(`[SocketService] Auto-failing over to candidate host: ${nextUrl}`);
            this.connect(nextUrl);
          }
        }, 2000);
      }
    });

    // Universal callback dispatcher matching orderId, orderNumber, deliveryId
    const triggerOrderCallbacks = (data, cbName) => {
      const candidates = [
        data?.orderId,
        data?.orderNumber,
        data?.parentOrderId,
        data?._id,
        data?.id,
        data?.deliveryId,
        data?.assignmentId,
        data?.subOrderId,
        data?.subOrderNumber,
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());

      for (const [subKey, sub] of this.activeSubscriptions.entries()) {
        const subKeyLower = String(subKey).toLowerCase();
        // Match exact or substring if IDs differ only in prefix
        const match =
          candidates.length === 0 ||
          candidates.includes(subKeyLower) ||
          candidates.some((c) => c.includes(subKeyLower) || subKeyLower.includes(c));

        if (match && sub && typeof sub[cbName] === 'function') {
          try {
            sub[cbName](data);
          } catch (e) {
            console.warn(`[SocketService] Error in ${cbName} callback:`, e);
          }
        }
      }
    };

    // Listen for incoming live order tracking broadcasts
    this.socket.on('delivery:location_updated', (data) => {
      triggerOrderCallbacks(data, 'onLocation');
    });

    this.socket.on('delivery:eta_updated', (data) => {
      triggerOrderCallbacks(data, 'onEta');
    });

    this.socket.on('order:status_updated', (data) => {
      triggerOrderCallbacks(data, 'onStatus');
    });

    this.socket.on('status_updated', (data) => {
      triggerOrderCallbacks(data, 'onStatus');
    });

    this.socket.on('customer:order_status_updated', (data) => {
      triggerOrderCallbacks(data, 'onStatus');
    });

    this.socket.on('seller:order_status_updated', (data) => {
      triggerOrderCallbacks(data, 'onStatus');
    });

    this.socket.on('order_status_updated', (data) => {
      triggerOrderCallbacks(data, 'onStatus');
    });

    this.socket.on('delivery:status_updated', (data) => {
      triggerOrderCallbacks(data, 'onStatus');
    });

    this.socket.on('delivery:partner_assigned', (data) => {
      triggerOrderCallbacks(data, 'onPartner');
    });

    this.socket.on('delivery:assignment_accepted', (data) => {
      triggerOrderCallbacks(data, 'onPartner');
    });

    this.socket.on('delivery:order_picked_up', (data) => {
      triggerOrderCallbacks({ ...data, status: 'picked_up' }, 'onStatus');
    });

    this.socket.on('delivery:out_for_delivery', (data) => {
      triggerOrderCallbacks({ ...data, status: 'out_for_delivery' }, 'onStatus');
    });

    this.socket.on('delivery:delivered', (data) => {
      triggerOrderCallbacks({ ...data, status: 'delivered' }, 'onStatus');
    });

    return this.socket;
  }

  /**
   * Subscribe to Live Order Tracking (Customer / Seller / Admin)
   */
  async subscribeToOrder(orderId, callbacks = {}) {
    if (!orderId) return;

    const existing = this.activeSubscriptions.get(orderId) || {};
    this.activeSubscriptions.set(orderId, { ...existing, ...callbacks });

    const socket = await this.getSocket();
    if (socket && (this.isConnected || socket.connected)) {
      socket.emit('join_order_tracking', { orderId });
    }
  }

  /**
   * Unsubscribe from Order Tracking
   */
  unsubscribeFromOrder(orderId) {
    if (!orderId) return;

    this.activeSubscriptions.delete(orderId);

    if (this.socket && this.isConnected) {
      this.socket.emit('leave_order_tracking', { orderId });
    }
  }

  /**
   * Delivery Partner: Emit GPS location update in real-time
   */
  async emitLocationUpdate({ orderId, deliveryId, latitude, longitude, heading = 0, speed = 0 }) {
    if (!latitude || !longitude) return;

    const socket = await this.getSocket();
    if (socket && this.isConnected) {
      socket.emit('delivery:location_update', {
        orderId,
        deliveryId,
        latitude,
        longitude,
        heading,
        speed,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Delivery Partner: Emit workflow actions
   */
  async emitDeliveryAction(event, payload = {}) {
    const socket = await this.getSocket();
    if (socket && this.isConnected) {
      socket.emit(`delivery:${event}`, payload);
    }
  }

  /**
   * Seller: Emit workflow actions
   */
  async emitSellerAction(event, payload = {}) {
    const socket = await this.getSocket();
    if (socket && this.isConnected) {
      socket.emit(`order:${event}`, payload);
    }
  }

  /**
   * Register connection state change listener
   */
  isSocketConnected() {
    return Boolean(this.socket?.connected || this.isConnected);
  }

  onConnectionChange(listener) {
    this.connectionListeners.add(listener);
    try {
      listener(Boolean(this.socket?.connected || this.isConnected));
    } catch (e) {}
    return () => this.connectionListeners.delete(listener);
  }

  _notifyConnectionListeners(status) {
    this.connectionListeners.forEach((fn) => {
      try {
        fn(status);
      } catch (e) {}
    });
  }

  /**
   * Disconnect socket cleanly on logout
   */
  disconnect() {
    this.activeSubscriptions.clear();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
  }
}

export const socketService = new SocketService();
export default socketService;
