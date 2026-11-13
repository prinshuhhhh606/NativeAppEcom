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

export const orderService = {
  /**
   * Get all user orders
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

        return cachedOrders
          .map((item) => this._normalizeOrderData(item))
          .filter(Boolean);
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

    // API fail hone par existing cached orders return karo.
    if (storageKey) {
      try {
        const stored = await AsyncStorage.getItem(storageKey);

        if (stored) {
          const parsed = JSON.parse(stored);

          if (Array.isArray(parsed)) {
            return parsed
              .map((item) => this._normalizeOrderData(item))
              .filter(Boolean);
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
    const isCancelled = ['cancelled', 'rejected'].includes(statusNorm);
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
   * Get Live Order Tracking Details (Real-Time GPS & Milestones)

/**
 * Get live tracking details for an order.
 * 1. Fetch from live tracking API.
 * 2. Fallback to exact backend order lookup.
 * 3. Fallback to local order cache.
 */
async getLiveTracking(orderId) {
  const cleanId = orderId
    ? String(orderId).trim().replace(/^[#\s]+/, '')
    : '';

  if (!cleanId) {
    console.warn('[OrderService] Tracking order ID is missing.');
    return null;
  }

  // Prevent duplicate API requests for the same order
  const existingRequest = inFlightTrackingRequests.get(cleanId);

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    // FIRST: Backend live tracking API
    try {
      const endpoint = `/orders/${encodeURIComponent(cleanId)}/track`;
      const response = await api.get(endpoint);

      // API interceptor may already return response.data
      const raw = response?.data || response;

      // Normalize possible response structures
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
        console.log('[OrderService] Live tracking order found:', {
          orderId: orderData.orderId,
          orderStatus: orderData.orderStatus,
          status: orderData.status,
        });

        return this._enrichOrderWithLiveTracking(orderData);
      }

      console.warn(
        '[OrderService] Live tracking response has no valid order:',
        raw
      );
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
        console.log('[OrderService] Order found through backend lookup:', {
          orderId: orderData.orderId,
          orderStatus: orderData.orderStatus,
          status: orderData.status,
        });

        return this._enrichOrderWithLiveTracking(orderData);
      }
    } catch (error) {
      console.warn(
        '[OrderService] Order details fallback failed:',
        error?.response?.data || error?.message
      );
    }

    // THIRD: Search exact order in local cache
    try {
      const orders = await this.getOrders();

      const match = orders.find((item) => {
        if (!item) return false;

        return (
          String(item.orderId || '').trim() === cleanId ||
          String(item.orderNumber || '').trim() === cleanId ||
          String(item._id || '').trim() === cleanId
        );
      });

      if (match) {
        console.log('[OrderService] Order found in local cache:', {
          orderId: match.orderId,
          orderStatus: match.orderStatus,
          status: match.status,
        });

        return this._enrichOrderWithLiveTracking(match);
      }
    } catch (error) {
      console.warn(
        '[OrderService] Cached tracking fallback failed:',
        error?.message
      );
    }

    console.warn(
      '[OrderService] Shipment not found:',
      cleanId
    );

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

