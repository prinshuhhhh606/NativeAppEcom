/**
 * Order Management Service
 */
import secureStorage from '../utils/secureStorage';
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';



const getOrdersStorageKey = async () => {
  const session = await secureStorage.getAuthSession();
  const user = session?.user;

  const identity =
    user?.customerUserId ||
    user?._id ||
    user?.id ||
    user?.userId ||
    user?.email?.toLowerCase?.() ||
    user?.phone ||
    user?.mobileNumber;

  if (!identity) {
    console.warn('[OrderService] User identity not found.');
    return null;
  }

  return `@appecom_user_orders:${String(identity)}`;
};
const inFlightTrackingRequests = new Map();

// Synchronous 0-second memory caches
let _ordersMemoryCache = null;
const _liveTrackingMemoryCache = new Map();

export const orderService = {
  /**
   * Synchronous getter for zero-latency initial UI rendering
   */
  getOrdersMemoryCache() {
    return Array.isArray(_ordersMemoryCache) ? _ordersMemoryCache : [];
  },

  setOrdersMemoryCache(list) {
    if (Array.isArray(list)) {
      _ordersMemoryCache = list;
    }
  },

  /**
   * Read disk cache immediately on app/screen mount (0ms cold-start)
   */
  async getCachedOrdersFromDisk() {
    if (_ordersMemoryCache && _ordersMemoryCache.length > 0) {
      return _ordersMemoryCache;
    }
    try {
      const storageKey = await getOrdersStorageKey();
      if (!storageKey) return [];
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed
            .map((item) => this._normalizeOrderData(item))
            .filter(Boolean);
          _ordersMemoryCache = normalized;
          return normalized;
        }
      }
    } catch (err) {
      console.warn('[OrderService] getCachedOrdersFromDisk failed:', err?.message);
    }
    return [];
  },

  /**
   * Synchronously search cached order for instantaneous milestone rendering
   */
  findOrderInCacheSync(orderId) {
    if (!orderId) return null;
    const cleanId = String(orderId).trim().replace(/^[#\s]+/, '').toLowerCase();
    
    // Check direct tracking cache
    if (_liveTrackingMemoryCache.has(cleanId)) {
      return _liveTrackingMemoryCache.get(cleanId);
    }
    // Check orders memory cache
    if (_ordersMemoryCache && Array.isArray(_ordersMemoryCache)) {
      const match = _ordersMemoryCache.find((item) => {
        if (!item) return false;
        const oId = String(item.orderId || '').trim().replace(/^[#\s]+/, '').toLowerCase();
        const oNum = String(item.orderNumber || '').trim().replace(/^[#\s]+/, '').toLowerCase();
        const id = String(item._id || '').trim().replace(/^[#\s]+/, '').toLowerCase();
        return oId === cleanId || oNum === cleanId || id === cleanId;
      });
      if (match) {
        const enriched = this._enrichOrderWithLiveTracking(match);
        _liveTrackingMemoryCache.set(cleanId, enriched);
        return enriched;
      }
    }
    return null;
  },

  /**
   * Get cached live tracking data from disk (AsyncStorage)
   */
  async getCachedLiveTracking(orderId) {
    const cleanId = orderId ? String(orderId).trim().replace(/^[#\s]+/, '') : '';
    if (!cleanId) return null;

    const inMem = this.findOrderInCacheSync(cleanId);
    if (inMem) return inMem;

    try {
      const cached = await AsyncStorage.getItem(`@appecom_live_tracking:${cleanId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) {
          const enriched = this._enrichOrderWithLiveTracking(parsed);
          _liveTrackingMemoryCache.set(cleanId.toLowerCase(), enriched);
          return enriched;
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  },

  /**
   * Get all user orders with Stale-While-Revalidate caching
   */
  async getOrders() {
    let storageKey = null;

    try {
      storageKey = await getOrdersStorageKey();

      // Server se orders fetch karo.
      const response = await api.get('/orders');

      let rawList;

      if (Array.isArray(response)) {
        rawList = response;
      } else if (Array.isArray(response?.data)) {
        rawList = response.data;
      } else if (Array.isArray(response?.orders)) {
        rawList = response.orders;
      } else if (Array.isArray(response?.data?.orders)) {
        rawList = response.data.orders;
      } else {
        throw new Error('Invalid orders API response format');
      }

      const list = rawList
        .map((item) => this._normalizeOrderData(item))
        .filter(Boolean);

      console.log('[OrderService] API orders count:', list.length);

      // Instantly update memory cache
      _ordersMemoryCache = list;

      if (storageKey) {
        // Pehle existing cache read karo.
        const stored = await AsyncStorage.getItem(storageKey);

        let cachedOrders = [];

        try {
          const parsed = stored ? JSON.parse(stored) : [];
          cachedOrders = Array.isArray(parsed) ? parsed : [];
        } catch (cacheError) {
          console.warn(
            '[OrderService] Invalid cached orders:',
            cacheError?.message
          );
          cachedOrders = [];
        }

        // API empty ho aur cache mein purane orders hon,
        // to purane orders ko overwrite mat karo.
        if (list.length === 0 && cachedOrders.length > 0) {
          console.warn(
            '[OrderService] API returned empty list. Keeping existing cache.'
          );

          const fallback = cachedOrders
            .map((item) => this._normalizeOrderData(item))
            .filter(Boolean);
          _ordersMemoryCache = fallback;
          return fallback;
        }

        // API se valid orders aaye to cache update karo.
        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify(list)
        );
      }

      return list;

    } catch (error) {
      console.warn(
        '[OrderService] API orders failed:',
        error?.message
      );

      // Return memory cache if available
      if (_ordersMemoryCache && _ordersMemoryCache.length > 0) {
        return _ordersMemoryCache;
      }

      // API fail hone par existing cached orders return karo.
      if (storageKey) {
        try {
          const stored = await AsyncStorage.getItem(storageKey);

          if (stored) {
            const parsed = JSON.parse(stored);

            if (Array.isArray(parsed)) {
              const fallback = parsed
                .map((item) => this._normalizeOrderData(item))
                .filter(Boolean);
              _ordersMemoryCache = fallback;
              return fallback;
            }
          }
        } catch (cacheError) {
          console.warn(
            '[OrderService] Cache read failed:',
            cacheError?.message
          );
        }
      }

      return [];
    }
  },

  /**
   * Helper to normalize order and tracking into unified customer-facing format
   */
  _normalizeOrderData(rawOrder, rawTracking = null) {
    if (!rawOrder) return null;
    const o = rawOrder.order || rawOrder;
    const t = rawTracking || rawOrder.tracking;

    const orderId = o.orderId || o.orderNumber || o._id || 'BBIN-782194';
    const orderNumber = o.orderNumber || o.orderId || orderId;
    const courierPartner =
      o.courierPartner ||
      o.shippingDetails?.courierName ||
      t?.courierName ||
      'Delhivery Pan-India Express';
    const trackingNumber =
      o.trackingNumber ||
      o.shippingDetails?.trackingNumber ||
      t?.trackingNumber ||
      'BBIN-' + Math.floor(100000000 + Math.random() * 900000000);
    const expectedDelivery =
      o.expectedDelivery ||
      o.shippingDetails?.estimatedDeliveryDate ||
      t?.estimatedDelivery ||
      'Within 3-4 Days';

    // Normalize items with fallback images
    const items = (o.items || []).map((it) => {
      let img = it.image;
      if (!img && it.product?.images && it.product.images.length > 0) {
        img = typeof it.product.images[0] === 'string' ? it.product.images[0] : it.product.images[0]?.url;
      }
      if (!img) {
        img = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&q=80';
      }
      return {
        ...it,
        name: it.name || it.product?.name || it.product?.productName || 'Handcrafted Item',
        price: it.price || it.product?.price || 0,
        quantity: it.quantity || 1,
        image: img,
      };
    });

    // Normalize summary totals
    const summary = o.summary || {
      subtotal: o.subtotal || o.pricing?.subtotal || 0,
      discount: o.discount || o.pricing?.discount || 0,
      deliveryFee: o.deliveryCharges || o.pricing?.deliveryFee || 0,
      tax: o.tax || o.pricing?.tax || 0,
      totalAmount: o.totalAmount || o.pricing?.grandTotal || 0,
    };

    // Normalize timeline steps
    let tracking = [];
    if (t?.timeline && Array.isArray(t.timeline) && t.timeline.length > 0) {
      tracking = t.timeline.map((step) => ({
        status: step.title || step.status,
        time: step.description || (step.date ? new Date(step.date).toLocaleDateString('en-IN') : 'Completed'),
        completed: Boolean(step.completed),
      }));
    } else if (o.trackingTimeline && Array.isArray(o.trackingTimeline) && o.trackingTimeline.length > 0) {
      tracking = o.trackingTimeline.map((step) => ({
        status: step.status || step.title,
        time: step.time || step.description || 'Completed',
        completed: Boolean(step.completed),
      }));
    } else if (o.tracking && Array.isArray(o.tracking) && o.tracking.length > 0) {
      tracking = o.tracking.map((step) => ({
        status: step.status || step.title,
        time: step.time || step.description || 'Completed',
        completed: Boolean(step.completed),
      }));
    } else {
      const currentStatus = (o.orderStatus || o.status || 'pending').toLowerCase();
      const isPending = ['pending', 'placed', 'new'].includes(currentStatus);
      const isConfirmed = !isPending && currentStatus !== 'cancelled' && currentStatus !== 'rejected';
      tracking = [
        {
          status: 'Order Placed',
          time: isPending ? 'Awaiting seller approval' : 'Order placed',
          completed: true,
        },
        {
          status: 'Order Confirmed',
          time: 'Seller accepted order',
          completed: isConfirmed,
        },
        {
          status: 'Processing',
          time: 'Order being processed',
          completed: ['processing', 'preparing', 'packed', 'packing', 'ready_for_pickup', 'ready_to_ship', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(currentStatus),
        },
        {
          status: 'Packed',
          time: 'Package ready for dispatch',
          completed: ['packed', 'packing', 'ready_for_pickup', 'ready_to_ship', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(currentStatus),
        },
        {
          status: 'Shipped',
          time: 'Handed over to courier partner',
          completed: ['shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(currentStatus),
        },
        {
          status: 'In Transit',
          time: 'Shipment moving towards destination',
          completed: ['in_transit', 'out_for_delivery', 'delivered'].includes(currentStatus),
        },
        {
          status: 'Out for Delivery',
          time: 'Assigned to delivery executive',
          completed: ['out_for_delivery', 'delivered'].includes(currentStatus),
        },
        {
          status: 'Delivered',
          time: 'OTP confirmation on handover',
          completed: currentStatus === 'delivered',
        },
      ];
    }

    const normalizeTimelineStep = (step) => {
      if (!step || typeof step !== 'object') return step;
      const stepStatus = String(step.status || step.title || '').trim();
      const stepTime = String(step.time || step.description || '').trim();
      const isCurrentOrCompleted = Boolean(step.completed) || stepStatus.toLowerCase().includes('confirmed') || stepStatus.toLowerCase().includes('processing') || stepStatus.toLowerCase().includes('packed') || stepStatus.toLowerCase().includes('shipped');

      if (isCurrentOrCompleted && stepTime.toLowerCase() === 'pending') {
        return {
          ...step,
          time: stepStatus.toLowerCase().includes('confirmed') ? 'Confirmed' : stepStatus.toLowerCase().includes('processing') ? 'In Progress' : stepStatus.toLowerCase().includes('packed') ? 'Packed' : stepTime,
        };
      }

      return step;
    };

    tracking = Array.isArray(tracking) ? tracking.map(normalizeTimelineStep) : tracking;

    return {
      ...o,
      orderId,
      orderNumber,
      items,
      summary,
      courierPartner,
      trackingNumber,
      expectedDelivery,
      deliveryOtp: o.deliveryOtp || null,
      status: o.orderStatus || o.status || 'pending',
      orderStatus: o.orderStatus || o.status || 'pending',
      deliveryPartner: o.deliveryPartner || null,
      refund: o.refund || null,
      cancellationReason: o.cancellationReason || '',
      timeline: o.timeline || o.trackingTimeline || tracking,
      trackingTimeline: o.trackingTimeline || o.timeline || tracking,
      tracking,
    };
  },

  isOrderActive(status) {
    if (!status) return false;
    const s = String(status).toLowerCase().replace(/[\s_-]+/g, '_');
    return [
      'ready_for_pickup',
      'ready_to_ship',
      'pickup_scheduled',
      'delivery_partner_assigned',
      'delivery_partner_accepted',
      'assigned',
      'picked_up',
      'shipped',
      'in_transit',
      'out_for_delivery',
      'nearing_destination',
      'reached_customer',
    ].includes(s);
  },

  isOrderPending(status) {
    if (!status) return true;
    const s = String(status).toLowerCase().replace(/[\s_-]+/g, '_');
    return [
      'placed',
      'pending',
      'new',
      'confirmed',
      'accepted',
      'seller_accepted',
      'preparing',
      'processing',
      'order_processing',
      'packing',
      'packed',
    ].includes(s);
  },

  isOrderCompleted(status) {
    if (!status) return false;
    const s = String(status).toLowerCase().replace(/[\s_-]+/g, '_');
    return ['delivered', 'completed'].includes(s);
  },

  isOrderCancelled(status) {
    if (!status) return false;
    const s = String(status).toLowerCase().replace(/[\s_-]+/g, '_');
    return ['cancelled', 'rejected', 'failed', 'returned'].includes(s);
  },

  /**
   * Helper to ensure complete live tracking model with GPS & partner info
   */
  _enrichOrderWithLiveTracking(order) {
    if (!order) return null;
    const norm = this._normalizeOrderData(order);
    const orderId = norm.orderId || norm.orderNumber || norm._id || 'BBIN-782194';
    const statusNorm = (norm.orderStatus || norm.status || 'pending').toLowerCase();
    const isDelivered = statusNorm === 'delivered';
    const isRiderActive = ['shipped', 'in_transit', 'out_for_delivery', 'picked_up'].includes(statusNorm);
    // Only show delivery partner after order is packed/assigned (rank >= 3)
    const hasDeliveryPartner = ['packed', 'ready_for_pickup', 'ready_to_ship', 'pickup_scheduled',
      'delivery_partner_assigned', 'delivery_partner_accepted', 'picked_up',
      'shipped', 'in_transit', 'out_for_delivery', 'nearing_destination', 'delivered'].includes(statusNorm);

    // Use actual delivery partner from API — do NOT attach a dummy one for pending/processing orders
    const partner = hasDeliveryPartner
      ? (norm.deliveryPartner || (norm.deliveryPartnerName ? {
          _id: null,
          name: norm.deliveryPartnerName,
          phone: norm.deliveryPartnerPhone || null,
          vehicleType: norm.deliveryPartnerVehicle || 'Bike',
          vehicleNumber: null,
          rating: null,
          profilePhoto: null,
        } : null))
      : null;

    const seller = norm.seller || null;

    const pickupLocation = norm.liveTracking?.pickupLocation || (norm.pickupAddress?.latitude ? {
      latitude: norm.pickupAddress.latitude,
      longitude: norm.pickupAddress.longitude,
      storeName: seller?.storeName || 'Seller Store',
      addressText: seller?.address || norm.pickupAddress?.addressLine1 || 'Seller Address',
    } : null);

    const destLocation = norm.liveTracking?.destinationLocation || (norm.deliveryAddress?.latitude ? {
      latitude: norm.deliveryAddress.latitude,
      longitude: norm.deliveryAddress.longitude,
      fullName: norm.deliveryAddress?.fullName || 'Customer Address',
      addressText: norm.deliveryAddress?.addressLine1 || 'Delivery Address',
    } : null);

    // Only provide liveTracking data when rider is actually active (real GPS from backend)
    const liveTracking = norm.liveTracking || {
      isActive: isRiderActive,
      riderLocation: isRiderActive ? norm.liveTracking?.riderLocation || null : null,
      pickupLocation,
      destinationLocation: destLocation,
      distanceRemainingKm: isDelivered ? 0 : (norm.liveTracking?.distanceRemainingKm ?? 0),
      estimatedMinutesRemaining: isDelivered ? 0 : (norm.liveTracking?.estimatedMinutesRemaining ?? 0),
      lastUpdatedAt: norm.liveTracking?.lastUpdatedAt || null,
      locationStatus: isDelivered ? 'delivered' : isRiderActive ? 'live' : statusNorm,
    };

    return {
      ...norm,
      orderId,
      orderNumber: norm.orderNumber || orderId,
      deliveryPartner: partner,
      seller,
      liveTracking,
      trackingTimeline: norm.trackingTimeline || norm.timeline || norm.tracking,
      timeline: norm.timeline || norm.trackingTimeline || norm.tracking,
    };
  },

  /**
   * Get live tracking details for an order with 0-second memory & disk cache fallback.
   */
  async getLiveTracking(orderId, skipCache = false) {
    const cleanId = orderId
      ? String(orderId).trim().replace(/^[#\s]+/, '')
      : '';

    if (!cleanId) {
      console.warn('[OrderService] Tracking order ID is missing.');
      return null;
    }

    // 0-SECOND FAST PATH: Return memory or disk cache immediately if available and not explicitly skipped
    if (!skipCache) {
      const cached = this.findOrderInCacheSync(cleanId);
      if (cached) {
        // Asynchronously revalidate in background without blocking caller
        this.getLiveTracking(orderId, true).catch(() => {});
        return cached;
      }
    }

    // Prevent duplicate in-flight API requests for the same order
    const existingRequest = inFlightTrackingRequests.get(cleanId);
    if (existingRequest) {
      return existingRequest;
    }

    const request = (async () => {
      // FIRST: Backend live tracking API
      try {
        const endpoint = `/orders/${encodeURIComponent(cleanId)}/track`;
        const response = await api.get(endpoint);

        const raw = response?.data || response;
        let orderData =
          raw?.data?.order ||
          raw?.data ||
          raw?.order ||
          raw;

        if (orderData?.data) {
          orderData = orderData.data;
        }

        if (orderData?.order) {
          orderData = orderData.order;
        }

        if (
          orderData &&
          typeof orderData === 'object' &&
          !Array.isArray(orderData) &&
          (
            orderData.orderId ||
            orderData.orderNumber ||
            orderData._id ||
            orderData.liveTracking
          )
        ) {
          const enriched = this._enrichOrderWithLiveTracking(orderData);
          _liveTrackingMemoryCache.set(cleanId.toLowerCase(), enriched);
          try {
            AsyncStorage.setItem(`@appecom_live_tracking:${cleanId}`, JSON.stringify(enriched));
          } catch (e) {}
          return enriched;
        }
      } catch (error) {
        console.warn(
          '[OrderService] Live tracking API failed:',
          error?.response?.data || error?.message
        );
      }

      // SECOND: Fetch exact order from backend
      try {
        const orderData = await this.getOrderById(cleanId);

        if (orderData) {
          const enriched = this._enrichOrderWithLiveTracking(orderData);
          _liveTrackingMemoryCache.set(cleanId.toLowerCase(), enriched);
          try {
            AsyncStorage.setItem(`@appecom_live_tracking:${cleanId}`, JSON.stringify(enriched));
          } catch (e) {}
          return enriched;
        }
      } catch (error) {
        console.warn(
          '[OrderService] Order details fallback failed:',
          error?.response?.data || error?.message
        );
      }

      // THIRD: Search exact order in local memory or disk cache
      try {
        const cached = await this.getCachedLiveTracking(cleanId);
        if (cached) {
          return cached;
        }
      } catch (error) {
        console.warn(
          '[OrderService] Cached tracking fallback failed:',
          error?.message
        );
      }

      return null;
    })();

    inFlightTrackingRequests.set(cleanId, request);

    try {
      return await request;
    } finally {
      inFlightTrackingRequests.delete(cleanId);
    }
  },


  /**
   * Get order details by ID
   */
  async getOrderById(orderId) {
    const cleanId = orderId ? String(orderId).trim().replace(/^[#\s]+/, '') : '';
    if (!cleanId) throw new Error('Order ID is required');
    try {
      const response = await api.get(`/orders/${cleanId}`);
      const raw = response.data || response;
      const normalized = this._normalizeOrderData(raw.order || raw, raw.tracking);
      return normalized;
    } catch (e) {
      console.warn('Backend getOrderById error, trying local cache:', e?.message);
      // Try local order cache first
      try {
        const orders = await this.getOrders();
        const order = orders.find(
          (o) =>
            (cleanId && (o.orderId === cleanId || o.orderNumber === cleanId || o._id === cleanId))
        );
        if (order) {
          return this._normalizeOrderData(order);
        }
      } catch (err) {
        console.warn('Local cache fallback failed:', err?.message);
      }
      // Re-throw so the caller can show the actual error to the user
      throw e;
    }
  },

  /**
   * Create new order
   */

async createOrder(orderPayload) {
  try {
    // Normalize payload for backend compatibility
    const payload = {
      ...orderPayload,

      shippingAddress:
        orderPayload.shippingAddress || orderPayload.deliveryAddress,

      deliveryAddress:
        orderPayload.deliveryAddress || orderPayload.shippingAddress,

      shippingAddressId:
        orderPayload.shippingAddressId ||
        orderPayload.deliveryAddress?._id ||
        orderPayload.deliveryAddress?.id ||
        undefined,

      paymentMethod: orderPayload.paymentMethod || 'COD',

      items: (orderPayload.items || []).map((it) => ({
        product: it.product?._id || it.product || it.id || it._id,
        id: it.product?._id || it.product || it.id || it._id,

        name:
          it.product?.name ||
          it.product?.productName ||
          it.name ||
          'Product',

        price: it.price || it.product?.price || 0,
        quantity: it.quantity || 1,
        image: it.image || it.product?.images?.[0] || '',
        sku: it.sku || it.product?.sku || '',
        seller: it.seller || it.product?.seller || undefined,
        selectedVariant: it.selectedVariant || it.variant || {},
      })),
    };

    // Create order on backend
    const response = await api.post('/orders', payload);

    const rawOrder =
      response?.data?.order ||
      response?.data ||
      response;

    if (
      !rawOrder ||
      typeof rawOrder !== 'object' ||
      !(rawOrder._id || rawOrder.orderId || rawOrder.orderNumber)
    ) {
      throw new Error('Backend did not return a valid created order');
    }

    const createdOrder = this._normalizeOrderData(rawOrder);

    if (!createdOrder) {
      throw new Error('Unable to normalize the created order');
    }

    // Update current user's local orders cache
    try {
      const storageKey = await getOrdersStorageKey();

      if (storageKey) {
        const stored = await AsyncStorage.getItem(storageKey);

        const cachedOrders = stored
          ? JSON.parse(stored)
          : [];

        const orders = Array.isArray(cachedOrders)
          ? cachedOrders
          : [];

        const createdId = String(
          createdOrder._id ||
          createdOrder.orderId ||
          createdOrder.orderNumber
        );

        const updated = [
          createdOrder,
          ...orders.filter((order) => {
            const existingId = String(
              order?._id ||
              order?.orderId ||
              order?.orderNumber ||
              ''
            );

            return existingId !== createdId;
          }),
        ];

        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify(updated)
        );

        console.log(
          '[OrderService] Created order saved to user cache:',
          createdId
        );
      } else {
        console.warn(
          '[OrderService] User session not found. Order cache not updated.'
        );
      }
    } catch (cacheError) {
      console.warn(
        '[OrderService] Created order cache update failed:',
        cacheError?.message
      );
    }

    return createdOrder;

  } catch (e) {
    console.warn(
      '[OrderService] Backend order creation failed:',
      e?.data || e?.message || e
    );

    const errorMessage =
      e?.data?.message ||
      e?.response?.data?.message ||
      e?.message;

    if (
      errorMessage &&
      e?.status &&
      e.status !== 500 &&
      !e?.isNetworkError
    ) {
      throw new Error(errorMessage);
    }

    throw e;
  }
},

  /**
   * Cancel an order
   */
async cancelOrder(orderId, reason = 'Customer requested cancellation') {
  try {
    const cleanId = String(orderId || '').trim();

    if (!cleanId) {
      throw new Error('Order ID is required');
    }

    // Backend se cancellation request
    const response = await api.put(
      `/orders/${encodeURIComponent(cleanId)}/cancel`,
      { reason }
    );

    // Successful cancellation ke baad local cache update
    try {
      const storageKey = await getOrdersStorageKey();

      if (storageKey) {
        const stored = await AsyncStorage.getItem(storageKey);
        const cachedOrders = stored ? JSON.parse(stored) : [];

        if (Array.isArray(cachedOrders)) {
          const updated = cachedOrders.map((order) => {
            const matches =
              String(order?.orderId || '') === cleanId ||
              String(order?.orderNumber || '') === cleanId ||
              String(order?._id || '') === cleanId;

            if (!matches) return order;

            return {
              ...order,
              status: 'cancelled',
              orderStatus: 'cancelled',
              cancellationReason: reason,
              cancelledAt: new Date().toISOString(),
            };
          });

          await AsyncStorage.setItem(
            storageKey,
            JSON.stringify(updated)
          );
        }
      }
    } catch (cacheError) {
      console.warn(
        '[OrderService] Cancelled order cache update failed:',
        cacheError?.message
      );
    }

    return response?.data ?? response;

  } catch (error) {
    console.warn(
      '[OrderService] Order cancellation failed:',
      error?.message
    );

    throw error;
  }
},
  /**
   * Track order
   */
  async trackOrder(orderId) {
    const order = await this.getOrderById(orderId);
    return {
      orderId: order.orderId,
      status: order.status,
      tracking: order.tracking,
      expectedDelivery: order.expectedDelivery,
      courierPartner: order.courierPartner,
      trackingNumber: order.trackingNumber,
    };
  },

  /**
   * Get GST Tax Invoice data
   */
  async getOrderInvoice(orderId) {
    const response = await api.get(`/orders/${orderId}/invoice`);
    return response.data;
  },

  /**
   * Get printable invoice URL
   */
  getInvoiceHtmlUrl(orderId) {
    const baseURL = api.defaults.baseURL || 'http://10.164.77.95:5000/api';
    return `${baseURL}/orders/${orderId}/invoice/html`;
  },
};

export default orderService;

