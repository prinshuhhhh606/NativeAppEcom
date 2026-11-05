/**
 * Order Management Service
 */
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_ORDERS } from '../models/orderModel';
import { generateOrderId } from '../utils/helpers';

const STORAGE_ORDERS_KEY = '@appecom_user_orders';
const inFlightTrackingRequests = new Map();

export const orderService = {
  /**
   * Get all user orders
   */
  async getOrders() {
    try {
      const response = await api.get('/orders');
      const rawList =
        response.data?.orders ||
        response.orders ||
        (Array.isArray(response.data) ? response.data : null) ||
        (Array.isArray(response) ? response : []);
      const list = (Array.isArray(rawList) ? rawList : []).map((item) =>
        this._normalizeOrderData(item)
      );
      if (list.length > 0) {
        try {
          await AsyncStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(list));
        } catch (e) {}
      }
      return list;
    } catch (e) {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_ORDERS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return (Array.isArray(parsed) ? parsed : []).map((item) =>
            this._normalizeOrderData(item)
          );
        }
      } catch (err) {}
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
   */
  async getLiveTracking(orderId) {
    const cleanId = orderId ? String(orderId).trim().replace(/^[#\s]+/, '') : '';
    if (!cleanId) {
      return null;
    }

    const existingRequest = inFlightTrackingRequests.get(cleanId);
    if (existingRequest) {
      return existingRequest;
    }

    const request = (async () => {
      try {
        const endpoint = `/orders/${encodeURIComponent(cleanId)}/track`;
        const response = await api.get(endpoint);
        const raw = response.data || response;
        if (raw && (raw.orderId || raw.orderNumber || raw.liveTracking)) {
          return this._enrichOrderWithLiveTracking(raw);
        }
        if (raw && raw.order) {
          return this._enrichOrderWithLiveTracking(raw.order);
        }
      } catch (e) {
        console.warn('Backend getLiveTracking warning, falling back to local/cached data:', e?.message);
      }

      // Fallback 1: Try getOrderById
      try {
        const orderData = await this.getOrderById(cleanId);
        if (orderData) {
          return this._enrichOrderWithLiveTracking(orderData);
        }
      } catch (err) {}

      // Fallback 2: Try finding matching order in locally cached orders
      try {
        const orders = await this.getOrders();
        const match = orders.find(
          (o) =>
            (cleanId && (o.orderId === cleanId || o.orderNumber === cleanId || o._id === cleanId)) ||
            this.isOrderActive(o.orderStatus || o.status)
        );
        if (match) {
          return this._enrichOrderWithLiveTracking(match);
        }
      } catch (err) {}

      // No real order found — return null so screen shows proper "not found" state
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
        shippingAddress: orderPayload.shippingAddress || orderPayload.deliveryAddress,
        deliveryAddress: orderPayload.deliveryAddress || orderPayload.shippingAddress,
        shippingAddressId:
          orderPayload.shippingAddressId ||
          orderPayload.deliveryAddress?._id ||
          orderPayload.deliveryAddress?.id ||
          undefined,
        paymentMethod: orderPayload.paymentMethod || 'COD',
        items: (orderPayload.items || []).map((it) => ({
          product: it.product?._id || it.product || it.id || it._id,
          id: it.product?._id || it.product || it.id || it._id,
          name: it.product?.name || it.product?.productName || it.name || 'Product',
          price: it.price || it.product?.price || 0,
          quantity: it.quantity || 1,
          image: it.image || it.product?.images?.[0] || '',
          sku: it.sku || it.product?.sku || '',
          seller: it.seller || it.product?.seller || undefined,
          selectedVariant: it.selectedVariant || it.variant || {},
        })),
      };

      const response = await api.post('/orders', payload);
      const rawOrder = response.data?.order || response.data || response;
      const createdOrder = this._normalizeOrderData(rawOrder);

      // Update local storage cache for offline viewing
      try {
        const orders = await this.getOrders();
        const updated = [
          createdOrder,
          ...orders.filter(
            (o) => (o.orderId || o._id) !== (createdOrder.orderId || createdOrder._id)
          ),
        ];
        await AsyncStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
      } catch (cacheErr) {}

      return createdOrder;
    } catch (e) {
      console.warn('Backend order creation error:', e?.data || e?.message || e);

      // api.js transforms errors into { status, message, data } — check both formats
      const errorMessage = e?.message || e?.data?.message || e?.response?.data?.message;
      if (errorMessage && e?.status && e.status !== 500 && !e?.isNetworkError) {
        // Real backend validation error — surface it to the user
        throw new Error(errorMessage);
      }

      // Network/server unreachable — throw the error so caller can handle it
      throw e;
      const orders = await this.getOrders();
      const newOrder = {
        orderId: generateOrderId(),
        orderNumber: generateOrderId(),
        createdAt: new Date().toISOString(),
        status: 'Confirmed',
        items: orderPayload.items,
        deliveryAddress: orderPayload.deliveryAddress,
        paymentMethod: orderPayload.paymentMethod,
        paymentStatus:
          orderPayload.paymentMethod === 'Cash on Delivery' || orderPayload.paymentMethod === 'COD'
            ? 'Pending on Delivery'
            : 'Paid',
        summary: orderPayload.summary,
        deliveryOtp: '482910',
        tracking: [
          { status: 'Order Confirmed', time: 'Just now', completed: true },
          { status: 'Processing', time: 'Pending', completed: false },
          { status: 'Packed', time: 'Pending', completed: false },
          { status: 'Shipped', time: 'Pending', completed: false },
          { status: 'In Transit', time: 'Pending', completed: false },
          { status: 'Out for Delivery', time: 'Pending', completed: false },
          { status: 'Delivered', time: 'Pending', completed: false },
        ],
        expectedDelivery: orderPayload.expectedDelivery || 'Expected in 3-4 days',
        courierPartner: 'Delhivery Pan-India Express',
        trackingNumber: 'BBIN-' + Math.floor(100000000 + Math.random() * 900000000),
      };

      const updated = [newOrder, ...orders];
      await AsyncStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
      return newOrder;
    }
  },

  /**
   * Cancel an order
   */
  async cancelOrder(orderId, reason = 'Customer requested cancellation') {
    try {
      const response = await api.put(`/orders/${orderId}/cancel`, { reason });
      return response.data;
    } catch (e) {
      const orders = await this.getOrders();
      const updated = orders.map((o) => {
        if (o.orderId === orderId) {
          return {
            ...o,
            status: 'Cancelled',
            cancellationReason: reason,
            cancelledAt: new Date().toISOString(),
          };
        }
        return o;
      });
      await AsyncStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
      return updated.find((o) => o.orderId === orderId);
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

