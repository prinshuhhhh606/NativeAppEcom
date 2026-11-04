/**
 * Centralized Order Lifecycle & Real-Time Tracking Synchronization Utility
 * Synchronizes multi-vendor SellerOrders, Delivery assignments, and parent Orders.
 * Ensures consistent status, timestamps, 8-milestone timeline, and Socket.IO broadcasts.
 */
const mongoose = require('mongoose');
const Order = require('../models/Order');
const SellerOrder = require('../models/SellerOrder');
const Delivery = require('../models/Delivery');
const { getIO, emitToOrder, emitToCustomer, emitToSeller } = require('../sockets/socketManager');

// Normalized rank hierarchy for order lifecycle progression
const STATUS_RANK = {
  placed: 0,
  pending: 0,
  new: 0,
  confirmed: 1,
  order_confirmed: 1,
  accepted: 1,
  seller_accepted: 1,
  preparing: 2,
  processing: 2,
  order_processing: 2,
  packing: 3,
  packed: 3,
  ready_to_ship: 3,
  ready_for_pickup: 3,
  pickup_scheduled: 3,
  delivery_partner_assigned: 3,
  delivery_partner_accepted: 3,
  picked_up: 3,
  shipped: 4,
  in_transit: 5,
  out_for_delivery: 6,
  nearing_destination: 6,
  delivered: 7,
  cancelled: -1,
  rejected: -1,
};

// Canonical 7 Milestones as required by the order status specification:
// Order Confirmed -> Processing -> Packed -> Shipped -> In Transit -> Out for Delivery -> Delivered
const STANDARD_MILESTONES = [
  {
    key: 'confirmed',
    status: 'Order Confirmed',
    title: 'ORDER CONFIRMED',
    description: 'Seller accepted and confirmed order.',
    rank: 1,
  },
  {
    key: 'processing',
    status: 'Processing',
    title: 'PROCESSING',
    description: 'Items being carefully processed and prepared by vendor.',
    rank: 2,
  },
  {
    key: 'packed',
    status: 'Packed',
    title: 'PACKED',
    description: 'Package packed, verified, and ready for dispatch.',
    rank: 3,
  },
  {
    key: 'shipped',
    status: 'Shipped',
    title: 'SHIPPED',
    description: 'Handed over to courier partner.',
    rank: 4,
  },
  {
    key: 'in_transit',
    status: 'In Transit',
    title: 'IN TRANSIT',
    description: 'Package is in transit towards delivery hub.',
    rank: 5,
  },
  {
    key: 'out_for_delivery',
    status: 'Out for Delivery',
    title: 'OUT FOR DELIVERY',
    description: 'Rider is on the way to delivery address.',
    rank: 6,
  },
  {
    key: 'delivered',
    status: 'Delivered',
    title: 'DELIVERED',
    description: 'Handed over securely with customer OTP verification.',
    rank: 7,
  },
];

function formatTime(date) {
  if (!date) return 'Pending';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Pending';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return 'Pending';
  }
}

/**
 * Build 7-milestone tracking timeline with accurate timestamps and completion flags
 */
function buildTrackingTimeline(order, currentStatusNorm, partnerName = '') {
  const currentRank = STATUS_RANK[currentStatusNorm] || 1;

  // Determine timestamps for each milestone
  const milestoneTimes = {
    confirmed: order.acceptedAt || order.createdAt ? formatTime(order.acceptedAt || order.createdAt) : 'Just now',
    processing: order.preparingAt ? formatTime(order.preparingAt) : currentRank >= 2 ? 'In Progress' : 'Pending',
    packed: order.readyForPickupAt || order.packedAt ? formatTime(order.readyForPickupAt || order.packedAt) : currentRank >= 3 ? 'Packed' : 'Pending',
    shipped: order.shippedAt ? formatTime(order.shippedAt) : currentRank >= 4 ? 'Shipped' : 'Pending',
    in_transit: order.inTransitAt ? formatTime(order.inTransitAt) : currentRank >= 5 ? 'In Transit' : 'Pending',
    out_for_delivery: order.outForDeliveryAt ? formatTime(order.outForDeliveryAt) : currentRank >= 6 ? 'On the Way' : 'Pending',
    delivered: order.deliveredAt ? formatTime(order.deliveredAt) : currentRank >= 7 ? 'Completed' : 'Pending',
  };

  return STANDARD_MILESTONES.map((m) => {
    const completed = currentRank >= m.rank;
    const isCurrent = currentRank === m.rank;
    let desc = m.description;
    if (m.key === 'shipped' && partnerName) {
      desc = `Handed over to ${partnerName}`;
    }

    return {
      status: m.status,
      title: m.title,
      description: desc,
      time: completed ? (milestoneTimes[m.key] || 'Completed') : 'Pending',
      completed,
      isCurrent,
      rank: m.rank,
    };
  });
}

/**
 * Synchronize Parent Order from all sub-orders and delivery assignments
 * Returns updated parent Order document
 */
async function syncParentOrderStatus(orderOrId) {
  try {
    let parentOrder = null;
    if (typeof orderOrId === 'string' || orderOrId instanceof mongoose.Types.ObjectId) {
      const cleanId = orderOrId.toString().trim().replace(/^[#\s]+/, '');
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(cleanId);
      const caseRegex = new RegExp(`^${cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

      parentOrder = await Order.findOne({
        $or: [
          ...(isObjectId ? [{ _id: cleanId }] : []),
          { orderId: caseRegex },
          { orderNumber: caseRegex },
          { orderNumber: cleanId.toUpperCase() },
        ],
      });

      if (!parentOrder) {
        const sellerOrder = await SellerOrder.findOne({
          $or: [
            ...(isObjectId ? [{ _id: cleanId }] : []),
            { subOrderNumber: caseRegex },
            { subOrderNumber: cleanId.toUpperCase() },
            { orderNumber: caseRegex },
            { orderNumber: cleanId.toUpperCase() },
          ],
        });
        if (sellerOrder?.order) {
          parentOrder = await Order.findById(sellerOrder.order);
        }
      }
    } else if (orderOrId && orderOrId._id) {
      parentOrder = orderOrId;
    }

    if (!parentOrder) return null;

    // Fetch linked SellerOrders and Delivery
    const [subOrders, delivery] = await Promise.all([
      SellerOrder.find({
        $or: [{ order: parentOrder._id }, { orderNumber: parentOrder.orderNumber }],
      }),
      Delivery.findOne({
        $or: [{ order: parentOrder._id }, { orderNumber: parentOrder.orderNumber }],
      }).populate('deliveryPartner', 'name phone vehicleType vehicleNumber rating profilePhoto currentLocation'),
    ]);

    // Derive overall status from sub-orders and delivery
    let derivedStatus = 'confirmed';
    if (subOrders.length > 0) {
      const allCancelled = subOrders.every((so) => ['cancelled', 'rejected'].includes((so.status || '').toLowerCase()));
      const allDelivered = subOrders.every((so) => (so.status || '').toLowerCase() === 'delivered');

      if (allCancelled) {
        derivedStatus = 'cancelled';
      } else if (allDelivered) {
        derivedStatus = 'delivered';
      } else {
        // Collect all active statuses across sub-orders & delivery
        const activeStatuses = subOrders
          .map((so) => (so.status || '').toLowerCase())
          .filter((s) => !['cancelled', 'rejected'].includes(s));

        if (delivery?.status) {
          activeStatuses.push(delivery.status.toLowerCase());
        }

        // Find highest progression milestone
        let maxRank = 1;
        let bestStatus = 'confirmed';

        for (const s of activeStatuses) {
          const rank = STATUS_RANK[s] || 1;
          if (rank > maxRank) {
            maxRank = rank;
            bestStatus = s;
          }
        }

        // Canonical status mapping
        if (maxRank >= 7) derivedStatus = 'delivered';
        else if (maxRank >= 6) derivedStatus = 'out_for_delivery';
        else if (maxRank >= 5) derivedStatus = 'in_transit';
        else if (maxRank >= 4) derivedStatus = 'shipped';
        else if (maxRank >= 3) derivedStatus = 'packed';
        else if (maxRank >= 2) derivedStatus = 'processing';
        else derivedStatus = 'confirmed';
      }
    } else if (delivery?.status) {
      const dStat = delivery.status.toLowerCase();
      const r = STATUS_RANK[dStat] || 1;
      if (r >= 7) derivedStatus = 'delivered';
      else if (r >= 6) derivedStatus = 'out_for_delivery';
      else if (r >= 5) derivedStatus = 'in_transit';
      else if (r >= 4) derivedStatus = 'shipped';
      else if (r >= 3) derivedStatus = 'packed';
      else if (r >= 2) derivedStatus = 'processing';
      else derivedStatus = 'confirmed';
    }

    parentOrder.orderStatus = derivedStatus;

    // Collect newest timestamps from sub-orders / delivery
    const now = new Date();
    const rank = STATUS_RANK[derivedStatus] || 1;

    for (const so of subOrders) {
      if (so.acceptedAt && !parentOrder.acceptedAt) parentOrder.acceptedAt = so.acceptedAt;
      if (so.preparingAt && !parentOrder.preparingAt) parentOrder.preparingAt = so.preparingAt;
      if (so.readyForPickupAt && !parentOrder.readyForPickupAt) parentOrder.readyForPickupAt = so.readyForPickupAt;
      if (so.pickedUpAt && !parentOrder.pickedUpAt) parentOrder.pickedUpAt = so.pickedUpAt;
      if (so.shipping?.shippedAt && !parentOrder.shippedAt) parentOrder.shippedAt = so.shipping.shippedAt;
      if (so.outForDeliveryAt && !parentOrder.outForDeliveryAt) parentOrder.outForDeliveryAt = so.outForDeliveryAt;
      if (so.deliveredAt && !parentOrder.deliveredAt) parentOrder.deliveredAt = so.deliveredAt;
    }

    if (delivery?.pickupVerifiedAt && !parentOrder.pickedUpAt) parentOrder.pickedUpAt = delivery.pickupVerifiedAt;
    if (delivery?.deliveredAt && !parentOrder.deliveredAt) parentOrder.deliveredAt = delivery.deliveredAt;

    // Set timestamps corresponding to current progression rank if missing
    if (rank >= 1 && !parentOrder.acceptedAt) parentOrder.acceptedAt = parentOrder.createdAt || now;
    if (rank >= 2 && !parentOrder.preparingAt) parentOrder.preparingAt = now;
    if (rank >= 3 && !parentOrder.readyForPickupAt) parentOrder.readyForPickupAt = now;
    if (rank >= 4 && !parentOrder.shippedAt) parentOrder.shippedAt = now;
    if (rank >= 5 && !parentOrder.inTransitAt) parentOrder.inTransitAt = now;
    if (rank >= 6 && !parentOrder.outForDeliveryAt) parentOrder.outForDeliveryAt = now;
    if (rank >= 7) {
      if (!parentOrder.deliveredAt) parentOrder.deliveredAt = now;
      parentOrder.paymentStatus = 'Completed';
    }

    // Sync delivery partner info from sub-order or delivery document
    const activeSubOrderWithPartner = subOrders.find((so) => so.deliveryPartner || so.deliveryPartnerName);
    const partnerDoc = delivery?.deliveryPartner;

    if (partnerDoc || activeSubOrderWithPartner) {
      parentOrder.deliveryPartner = partnerDoc?._id || activeSubOrderWithPartner?.deliveryPartner || parentOrder.deliveryPartner;
      parentOrder.deliveryPartnerName = partnerDoc?.name || activeSubOrderWithPartner?.deliveryPartnerName || parentOrder.deliveryPartnerName;
      parentOrder.deliveryPartnerPhone = partnerDoc?.phone || activeSubOrderWithPartner?.deliveryPartnerPhone || parentOrder.deliveryPartnerPhone;
      parentOrder.deliveryPartnerVehicle =
        partnerDoc?.vehicleNumber || partnerDoc?.vehicleType || activeSubOrderWithPartner?.deliveryPartnerVehicleNumber || activeSubOrderWithPartner?.deliveryPartnerVehicleType || parentOrder.deliveryPartnerVehicle || 'Bike';
      parentOrder.courierPartner = `${parentOrder.deliveryPartnerName} (${parentOrder.deliveryPartnerVehicle || 'Delivery Partner'})`;
    }

    // Sync tracking numbers
    const activeShipping = subOrders.find((so) => so.shipping?.trackingNumber || so.shipping?.awbNumber);
    if (activeShipping?.shipping) {
      if (!parentOrder.trackingNumber) {
        parentOrder.trackingNumber = activeShipping.shipping.trackingNumber || activeShipping.shipping.awbNumber;
      }
      if (activeShipping.shipping.courierName) {
        parentOrder.courierPartner = activeShipping.shipping.courierName;
      }
    }

    // Build standard 8-milestone timeline
    const timeline = buildTrackingTimeline(parentOrder, derivedStatus, parentOrder.deliveryPartnerName);
    parentOrder.trackingTimeline = timeline.map((t) => ({
      status: t.status,
      time: t.time,
      completed: t.completed,
    }));

    await parentOrder.save({ validateBeforeSave: false });

    // Real-Time Socket.IO Broadcast to all interested subscribers
    try {
      const io = getIO();
      if (io) {
        const payload = {
          orderId: parentOrder.orderId || parentOrder.orderNumber,
          orderNumber: parentOrder.orderNumber,
          parentOrderId: parentOrder._id.toString(),
          _id: parentOrder._id.toString(),
          id: parentOrder._id.toString(),
          status: derivedStatus,
          orderStatus: derivedStatus,
          deliveryPartner: parentOrder.deliveryPartnerName
            ? {
                _id: parentOrder.deliveryPartner,
                name: parentOrder.deliveryPartnerName,
                phone: parentOrder.deliveryPartnerPhone,
                vehicle: parentOrder.deliveryPartnerVehicle,
              }
            : null,
          trackingTimeline: timeline,
          timeline: timeline,
          timestamp: new Date().toISOString(),
        };

        // Broadcast across all order aliases
        const aliases = [
          parentOrder.orderNumber,
          parentOrder.orderId,
          parentOrder._id.toString(),
          ...subOrders.map((s) => s.subOrderNumber),
        ].filter(Boolean);

        aliases.forEach((alias) => {
          emitToOrder(alias, 'order:status_updated', payload);
          emitToOrder(alias, 'status_updated', payload);
        });

        // Broadcast to customer room
        if (parentOrder.user) {
          const uId = parentOrder.user.toString();
          emitToCustomer(uId, 'customer:order_status_updated', payload);
          emitToCustomer(uId, 'order:status_updated', payload);
        }

        // Broadcast to seller and admin
        if (parentOrder.sellers && parentOrder.sellers.length > 0) {
          parentOrder.sellers.forEach((sId) => {
            emitToSeller(sId.toString(), 'seller:order_status_updated', payload);
          });
        }
        io.to('admin_room').emit('order_status_updated', payload);
      }
    } catch (sockErr) {
      console.warn('[orderSync] Socket broadcast warning:', sockErr?.message);
    }

    return {
      order: parentOrder,
      derivedStatus,
      timeline,
      subOrders,
    };
  } catch (err) {
    console.error('[orderSync] Error syncing parent order:', err);
    return null;
  }
}

module.exports = {
  STATUS_RANK,
  STANDARD_MILESTONES,
  formatTime,
  buildTrackingTimeline,
  syncParentOrderStatus,
};

