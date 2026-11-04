const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/generateToken');
const Order = require('../models/Order');
const SellerOrder = require('../models/SellerOrder');
const Delivery = require('../models/Delivery');
const DeliveryPartner = require('../models/DeliveryPartner');
const { calculateDistanceKm, calculateEtaMinutes } = require('../utils/geoUtils');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // 1. Authenticated Socket Handshake Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') ||
        socket.handshake.query?.token;

      if (token) {
        try {
          const decoded = verifyAccessToken(token);
          socket.user = {
            id: decoded.id,
            role: decoded.role || socket.handshake.query?.role || 'customer',
          };
        } catch (tokenErr) {
          console.warn(`[Socket.IO] Token verification failed: ${tokenErr.message}`);
          // Allow connection as guest if tracking an order
          socket.user = { id: null, role: 'guest' };
        }
      } else {
        socket.user = { id: null, role: 'guest' };
      }
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on('connection', (socket) => {
    const userRole = socket.user?.role || 'guest';
    const userId = socket.user?.id;
    console.log(`[Socket.IO] Client connected: ${socket.id} (Role: ${userRole}, UserID: ${userId || 'N/A'})`);

    // Automatically join role-specific private rooms if authenticated
    if (userId) {
      socket.join(`user:${userId}`);
      socket.join(`user_${userId}`);

      if (userRole === 'seller') {
        socket.join(`seller:${userId}`);
        socket.join(`seller_${userId}`);
      } else if (userRole === 'delivery' || userRole === 'delivery_partner') {
        socket.join(`delivery:${userId}`);
        socket.join(`delivery_${userId}`);
      } else if (['admin', 'super_admin', 'manager'].includes(userRole)) {
        socket.join('admin_channel');
        socket.join('admin_room');
      }
    }

    // Explicit room joins with fallback compatibility
    socket.on('join_admin_room', () => {
      socket.join('admin_channel');
      socket.join('admin_room');
    });

    socket.on('join_seller_room', (sellerId) => {
      if (sellerId) {
        socket.join(`seller:${sellerId}`);
        socket.join(`seller_${sellerId}`);
      }
    });

    socket.on('join_delivery_room', (partnerId) => {
      if (partnerId) {
        socket.join(`delivery:${partnerId}`);
        socket.join(`delivery_${partnerId}`);
      }
    });

    // 2. Order Tracking Room Join with Authorization Verification
    socket.on('join_order_tracking', async (data) => {
      const orderId = typeof data === 'object' ? data?.orderId : data;
      if (!orderId) return;

      // Join room immediately for lowest latency
      socket.join(`order:${orderId}`);
      socket.join(`tracking_${orderId}`);

      try {
        const order = await Order.findOne({
          $or: [
            ...(orderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: orderId }] : []),
            { orderId: orderId },
            { orderNumber: orderId },
          ],
        });

        if (order) {
          const ordNum = order.orderNumber || order.orderId;
          const ordMongoId = order._id.toString();

          socket.join(`order:${ordNum}`);
          socket.join(`order:${ordMongoId}`);
          socket.join(`tracking_${ordNum}`);
          socket.join(`tracking_${ordMongoId}`);

          console.log(`[Socket.IO] Socket ${socket.id} subscribed to live tracking for Order #${ordNum}`);

          // Emit initial sync event
          socket.emit('order:tracking_subscribed', {
            orderId: ordNum,
            status: order.orderStatus,
            deliveryPartner: order.deliveryPartnerName
              ? {
                  name: order.deliveryPartnerName,
                  phone: order.deliveryPartnerPhone,
                  vehicle: order.deliveryPartnerVehicle,
                }
              : null,
            currentLocation: order.currentLocation,
            distanceRemainingKm: order.distanceRemainingKm,
            estimatedMinutesRemaining: order.estimatedMinutesRemaining,
          });
        }
      } catch (e) {
        console.warn(`[Socket.IO] Error joining tracking room:`, e.message);
      }
    });

    socket.on('join_tracking_room', (orderId) => {
      if (orderId) {
        socket.join(`tracking_${orderId}`);
        socket.join(`order:${orderId}`);
      }
    });

    // 3. Delivery Partner Real-Time GPS Location Update
    socket.on('delivery:location_update', async (data) => {
      try {
        const { orderId, deliveryId, latitude, longitude, heading = 0, speed = 0 } = data || {};
        if (!latitude || !longitude) return;

        const partnerId = socket.user?.id || data?.partnerId;

        // Update Partner Document
        if (partnerId) {
          await DeliveryPartner.findByIdAndUpdate(partnerId, {
            $set: {
              'currentLocation.latitude': Number(latitude),
              'currentLocation.longitude': Number(longitude),
              'currentLocation.heading': Number(heading),
              'currentLocation.speed': Number(speed),
              'currentLocation.updatedAt': new Date(),
            },
          }).catch(() => {});
        }

        // Find linked active Order & Delivery
        let targetOrderNumber = orderId;
        let delivery = null;

        if (deliveryId) {
          delivery = await Delivery.findOne({
            $or: [{ _id: deliveryId }, { deliveryNumber: deliveryId }],
          });
        } else if (orderId) {
          delivery = await Delivery.findOne({
            $or: [{ orderNumber: orderId }, { order: orderId }],
          });
        } else if (partnerId) {
          delivery = await Delivery.findOne({
            deliveryPartner: partnerId,
            status: { $in: ['accepted', 'reached_pickup', 'picked_up', 'out_for_delivery', 'reached_customer'] },
          }).sort({ updatedAt: -1 });
        }

        let remainingKm = 2.4;
        let etaMinutes = 8;

        if (delivery) {
          targetOrderNumber = delivery.orderNumber;
          const isOnDeliveryLeg = ['picked_up', 'out_for_delivery', 'reached_customer'].includes(delivery.status);
          const destLat = isOnDeliveryLeg
            ? delivery.deliveryAddress?.latitude || 26.9015
            : delivery.pickupAddress?.latitude || 26.9124;
          const destLon = isOnDeliveryLeg
            ? delivery.deliveryAddress?.longitude || 75.7421
            : delivery.pickupAddress?.longitude || 75.7873;

          remainingKm = calculateDistanceKm(Number(latitude), Number(longitude), destLat, destLon);
          etaMinutes = calculateEtaMinutes(remainingKm, 'Bike');

          delivery.currentLocation = {
            latitude: Number(latitude),
            longitude: Number(longitude),
            heading: Number(heading),
            speed: Number(speed),
            updatedAt: new Date(),
          };
          delivery.distanceRemaining = remainingKm;
          delivery.estimatedMinutes = etaMinutes;
          await delivery.save();
        }

        // Update Order in DB
        if (targetOrderNumber) {
          const updatedOrder = await Order.findOneAndUpdate(
            { $or: [{ orderNumber: targetOrderNumber }, { orderId: targetOrderNumber }] },
            {
              $set: {
                'currentLocation.latitude': Number(latitude),
                'currentLocation.longitude': Number(longitude),
                'currentLocation.heading': Number(heading),
                'currentLocation.speed': Number(speed),
                'currentLocation.updatedAt': new Date(),
                distanceRemainingKm: remainingKm,
                estimatedMinutesRemaining: etaMinutes,
              },
            },
            { new: true }
          );

          // Broadcast to Customer & Order Room
          emitToOrder(targetOrderNumber, 'delivery:location_updated', {
            orderId: targetOrderNumber,
            latitude: Number(latitude),
            longitude: Number(longitude),
            heading: Number(heading),
            speed: Number(speed),
            distanceRemainingKm: remainingKm,
            etaMinutes,
            updatedAt: new Date(),
          });

          emitToOrder(targetOrderNumber, 'delivery:eta_updated', {
            orderId: targetOrderNumber,
            etaMinutes,
            distanceRemainingKm: remainingKm,
            updatedAt: new Date(),
          });

          // Broadcast to Seller
          if (updatedOrder?.sellers?.length > 0) {
            updatedOrder.sellers.forEach((sellerId) => {
              emitToSeller(sellerId, 'delivery:location_updated', {
                orderId: targetOrderNumber,
                latitude: Number(latitude),
                longitude: Number(longitude),
                distanceRemainingKm: remainingKm,
                etaMinutes,
                updatedAt: new Date(),
              });
            });
          }
        }
      } catch (locErr) {
        console.warn('[Socket.IO] Error handling delivery:location_update:', locErr.message);
      }
    });

    // 4. Delivery Partner Lifecycle Socket Events
    socket.on('delivery:arrived_pickup', (data) => {
      const { orderId, sellerId } = data || {};
      if (sellerId) emitToSeller(sellerId, 'delivery:rider_reached_pickup', data);
      if (orderId) emitToOrder(orderId, 'order:status_updated', { orderId, status: 'reached_pickup' });
    });

    socket.on('delivery:picked_up', (data) => {
      const { orderId, sellerId } = data || {};
      if (sellerId) emitToSeller(sellerId, 'delivery:order_picked_up', data);
      if (orderId) {
        emitToOrder(orderId, 'order:status_updated', { orderId, status: 'shipped' });
        emitToOrder(orderId, 'delivery:status_updated', { orderId, status: 'shipped' });
      }
    });

    socket.on('delivery:out_for_delivery', (data) => {
      const { orderId, sellerId } = data || {};
      if (sellerId) emitToSeller(sellerId, 'delivery:out_for_delivery', data);
      if (orderId) {
        emitToOrder(orderId, 'order:status_updated', { orderId, status: 'out_for_delivery' });
        emitToOrder(orderId, 'delivery:status_updated', { orderId, status: 'out_for_delivery' });
      }
    });

    socket.on('delivery:completed', (data) => {
      const { orderId, sellerId } = data || {};
      if (sellerId) emitToSeller(sellerId, 'delivery:delivered', data);
      if (orderId) {
        emitToOrder(orderId, 'order:status_updated', { orderId, status: 'delivered' });
        emitToOrder(orderId, 'delivery:completed', data);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => io;

// Universal Emitters
const emitToOrder = (orderId, event, payload) => {
  if (io && orderId) {
    io.to(`order:${orderId}`).emit(event, payload);
    io.to(`tracking_${orderId}`).emit(event, payload);
    io.emit(`order_${orderId}_${event}`, payload);
  }
};

const emitToCustomer = (userId, event, payload) => {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, payload);
    io.to(`user_${userId}`).emit(event, payload);
    io.emit(`customer_${userId}_${event}`, payload);
  }
};

const emitToSeller = (sellerId, event, payload) => {
  if (io && sellerId) {
    io.to(`seller:${sellerId}`).emit(event, payload);
    io.to(`seller_${sellerId}`).emit(event, payload);
    io.emit(`seller_${sellerId}_${event}`, payload);
  }
};

const emitToDeliveryPartner = (partnerId, event, payload) => {
  if (io && partnerId) {
    io.to(`delivery:${partnerId}`).emit(event, payload);
    io.to(`delivery_${partnerId}`).emit(event, payload);
    io.emit(`delivery_${partnerId}_${event}`, payload);
  }
};

const emitToAdmins = (event, payload) => {
  if (io) {
    io.to('admin_channel').emit(event, payload);
    io.to('admin_room').emit(event, payload);
    io.emit(event, payload);
  }
};

const emitOrderCreated = (order) => {
  emitToAdmins('new_order', {
    orderId: order.orderId,
    customerName: order.shippingAddress?.fullName || 'Customer',
    grandTotal: order.pricing?.grandTotal || order.totalAmount || 0,
    itemsCount: order.items?.length || 0,
    timestamp: new Date(),
    order,
  });
};

const emitOrderStatusUpdated = (order) => {
  const ordNum = order.orderNumber || order.orderId;
  const status = order.orderStatus;

  emitToOrder(ordNum, 'order:status_updated', {
    orderId: ordNum,
    status,
    timestamp: new Date(),
    order,
  });

  emitToAdmins('order_status_updated', {
    orderId: ordNum,
    newStatus: status,
    timestamp: new Date(),
    order,
  });
};

const emitCustomerRegistered = (user) => {
  emitToAdmins('new_customer', {
    userId: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    timestamp: new Date(),
  });
};

const emitPaymentUpdated = (payment, order) => {
  emitToAdmins('payment_status_updated', {
    orderId: order?.orderId || order?.orderNumber,
    paymentId: payment._id,
    status: payment.status,
    amount: payment.amount,
    method: payment.paymentMethod,
    timestamp: new Date(),
  });
};

const emitStockAlert = (product, currentStock, status) => {
  emitToAdmins('low_stock_alert', {
    productId: product._id,
    productName: product.name,
    sku: product.sku,
    currentStock,
    status,
    timestamp: new Date(),
  });
};

const emitReturnRequested = (returnRequest, order) => {
  emitToAdmins('return_requested', {
    returnId: returnRequest._id,
    orderId: order?.orderId,
    refundAmount: returnRequest.refundAmount,
    reason: returnRequest.reason,
    timestamp: new Date(),
  });
};

const emitRefundUpdated = (refund) => {
  emitToAdmins('refund_status_updated', {
    refundId: refund._id,
    status: refund.status,
    amount: refund.amount,
    timestamp: new Date(),
  });
};

module.exports = {
  initSocket,
  getIO,
  emitToOrder,
  emitToCustomer,
  emitToSeller,
  emitToDeliveryPartner,
  emitToAdmins,
  emitOrderCreated,
  emitOrderStatusUpdated,
  emitCustomerRegistered,
  emitPaymentUpdated,
  emitStockAlert,
  emitReturnRequested,
  emitRefundUpdated,
};
