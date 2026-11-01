const { Server } = require('socket.io');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join admin room
    socket.on('join_admin_room', (data) => {
      socket.join('admin_channel');
      socket.join('admin_room');
      console.log(`[Socket.IO] Socket ${socket.id} joined admin_channel`);
    });

    // Join seller room
    socket.on('join_seller_room', (sellerId) => {
      if (sellerId) {
        socket.join(`seller_${sellerId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined seller_${sellerId}`);
      }
    });

    // Join delivery partner room
    socket.on('join_delivery_room', (partnerId) => {
      if (partnerId) {
        socket.join(`delivery_${partnerId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined delivery_${partnerId}`);
      }
    });

    // Join tracking room for specific order
    socket.on('join_tracking_room', (orderId) => {
      if (orderId) {
        socket.join(`tracking_${orderId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined tracking_${orderId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

// Safe event emitters to admin channel
const emitToAdmins = (event, payload) => {
  if (io) {
    io.to('admin_channel').emit(event, payload);
    // Also broadcast to root so any connected admin dashboard receives it
    io.emit(event, payload);
  }
};

const emitOrderCreated = (order) => {
  emitToAdmins('new_order', {
    orderId: order.orderId,
    customerName: order.shippingAddress?.fullName || 'Customer',
    grandTotal: order.pricing?.grandTotal || 0,
    itemsCount: order.items?.length || 0,
    timestamp: new Date(),
    order,
  });
};

const emitOrderStatusUpdated = (order) => {
  emitToAdmins('order_status_updated', {
    orderId: order.orderId,
    newStatus: order.orderStatus,
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
    orderId: order?.orderId,
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
    status, // 'low_stock' or 'out_of_stock'
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

const emitToSeller = (sellerId, event, payload) => {
  if (io && sellerId) {
    io.to(`seller_${sellerId}`).emit(event, payload);
    io.emit(`seller_${sellerId}_${event}`, payload);
  }
};

const emitToDeliveryPartner = (partnerId, event, payload) => {
  if (io && partnerId) {
    io.to(`delivery_${partnerId}`).emit(event, payload);
    io.emit(`delivery_${partnerId}_${event}`, payload);
  }
};

const emitToTrackingRoom = (orderId, event, payload) => {
  if (io && orderId) {
    io.to(`tracking_${orderId}`).emit(event, payload);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToAdmins,
  emitToSeller,
  emitToDeliveryPartner,
  emitToTrackingRoom,
  emitOrderCreated,
  emitOrderStatusUpdated,
  emitCustomerRegistered,
  emitPaymentUpdated,
  emitStockAlert,
  emitReturnRequested,
  emitRefundUpdated,
};

