/**
 * Delivery Operations Controller
 * Handles availability, request acceptance/decline, dual OTP verification, and GPS tracking
 */
const DeliveryPartner = require('../../models/DeliveryPartner');
const DeliveryAssignment = require('../../models/DeliveryAssignment');
const Delivery = require('../../models/Delivery');
const DeliveryEarning = require('../../models/DeliveryEarning');
const Order = require('../../models/Order');
const SellerOrder = require('../../models/SellerOrder');
const Seller = require('../../models/Seller');
const { calculateDistanceKm, calculateEtaMinutes } = require('../../utils/geoUtils');
const { emitToSeller, emitToAdmins, emitToTrackingRoom, emitOrderStatusUpdated } = require('../../sockets/socketManager');
const { syncParentOrderStatus } = require('../../utils/orderSync');
const {
  ACTIVE_DELIVERY_STATUSES,
  INACTIVE_DELIVERY_STATUSES,
  countActualActiveDeliveries,
  syncPartnerActiveCount,
  getPartnerCapacityInfo,
} = require('../../utils/deliveryCapacityUtils');

/**
 * Toggle Online / Offline Availability
 * POST /api/v1/delivery/availability
 */
const updateAvailability = async (req, res) => {
  try {
    const { availability, status } = req.body;
    const newStatus = availability || status;

    if (!['online', 'offline'].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'online' or 'offline'",
      });
    }

    const partner = await DeliveryPartner.findById(req.deliveryPartner._id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    if (newStatus === 'online' && partner.kycStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Only admin-approved partners can go online. Current status: ' + partner.kycStatus,
      });
    }

    partner.availability = newStatus;
    partner.isAvailable = newStatus === 'online';
    await partner.save();

    return res.status(200).json({
      success: true,
      message: `You are now ${newStatus.toUpperCase()}`,
      data: {
        availability: partner.availability,
        isAvailable: partner.isAvailable,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Dashboard KPIs
 * GET /api/v1/delivery/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner._id;
    const partner = await DeliveryPartner.findById(partnerId);

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    // Single source of truth: count genuine ongoing active deliveries from Delivery collection
    const activeDeliveriesCount = await countActualActiveDeliveries(partnerId);

    // Auto-heal stored field if out-of-sync
    if (partner.currentActiveDeliveries !== activeDeliveriesCount) {
      await DeliveryPartner.findByIdAndUpdate(partnerId, {
        $set: { currentActiveDeliveries: activeDeliveriesCount },
      }).catch(() => {});
    }

    // Today's completed count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayCompletedCount = await Delivery.countDocuments({
      deliveryPartner: partnerId,
      status: 'delivered',
      deliveredAt: { $gte: startOfToday },
    });

    // Pending incoming unexpired requests
    const pendingRequestsCount = await DeliveryAssignment.countDocuments({
      deliveryPartner: partnerId,
      status: 'requested',
      responseDeadline: { $gt: new Date() },
    });

    return res.status(200).json({
      success: true,
      data: {
        partner: {
          _id: partner._id,
          name: partner.name,
          email: partner.email,
          phone: partner.phone,
          vehicleType: partner.vehicleType,
          vehicleNumber: partner.vehicleNumber,
          kycStatus: partner.kycStatus,
          availability: partner.availability,
          isAvailable: partner.isAvailable,
          rating: partner.rating,
          acceptanceRate: partner.acceptanceRate,
          completionRate: partner.completionRate,
          earnings: partner.earnings,
          activeCapacity: partner.activeCapacity || 3,
          currentActiveDeliveries: activeDeliveriesCount,
          capacityAvailable: Math.max(0, (partner.activeCapacity || 3) - activeDeliveriesCount),
        },
        kpis: {
          todayDeliveries: todayCompletedCount,
          activeDeliveries: activeDeliveriesCount,
          pendingRequests: pendingRequestsCount,
          todayEarnings: partner.earnings?.todayEarned || 0,
          weekEarnings: partner.earnings?.weekEarned || 0,
          availableBalance: partner.earnings?.available || 0,
          pendingCashToDeposit: partner.earnings?.pending || 0,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Pending Delivery Requests
 * GET /api/v1/delivery/requests
 */
const getRequests = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner._id;

    if (req.deliveryPartner.kycStatus !== 'approved') {
      return res.status(200).json({
        success: true,
        count: 0,
        data: { requests: [] },
        requests: [],
        message: 'Account is pending admin verification. No delivery requests assigned.',
      });
    }

    // Auto-expire assignments whose response deadline has elapsed
    await DeliveryAssignment.updateMany(
      {
        deliveryPartner: partnerId,
        status: 'requested',
        responseDeadline: { $lte: new Date() },
      },
      { $set: { status: 'expired' } }
    );

    // Fetch active assignments assigned to this partner that haven't expired
    const requests = await DeliveryAssignment.find({
      deliveryPartner: partnerId,
      status: 'requested',
      responseDeadline: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: { requests },
      requests,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Accept Delivery Request
 * POST /api/v1/delivery/requests/:assignmentId/accept
 */
const acceptRequest = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const partnerId = req.deliveryPartner._id;

    if (req.deliveryPartner.kycStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Only admin-approved delivery partners can accept delivery assignments.',
      });
    }

    const assignment = await DeliveryAssignment.findOne({
      assignmentId: assignmentId,
      deliveryPartner: partnerId,
    });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Delivery assignment request not found',
      });
    }

    if (assignment.responseDeadline <= new Date()) {
      await DeliveryAssignment.findByIdAndUpdate(assignment._id, { $set: { status: 'expired' } });
      return res.status(400).json({
        success: false,
        message: 'This delivery request has expired.',
      });
    }

    const partner = await DeliveryPartner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found.',
      });
    }

    // Step 1: Check capacity against genuine ongoing deliveries
    const actualCount = await countActualActiveDeliveries(partnerId);
    const maxCapacity = Math.max(1, Number(partner.activeCapacity) || 3);

    if (actualCount >= maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `Active delivery limit reached (${actualCount}/${maxCapacity}). Cannot accept more deliveries.`,
        data: {
          actualActive: actualCount,
          activeCapacity: maxCapacity,
          capacityAvailable: 0,
        },
      });
    }

    if (assignment.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: `This assignment has already been ${assignment.status}`,
      });
    }


  

    // Atomic update on DeliveryAssignment to prevent duplicate/concurrent acceptance
    const updatedAssignment = await DeliveryAssignment.findOneAndUpdate(
      {
        _id: assignment._id,
        deliveryPartner: partnerId,
        status: 'requested',
        responseDeadline: { $gt: new Date() },
      },
      {
        $set: {
          status: 'accepted',
          acceptedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!updatedAssignment) {
      return res.status(409).json({
        success: false,
        message: 'Request expired or already accepted by another process.',
      });
    }

    // Atomic partner capacity reservation with $expr check
    const updatedPartner = await DeliveryPartner.findOneAndUpdate(
      {
        _id: partnerId,
        $expr: { $lt: ['$currentActiveDeliveries', '$activeCapacity'] },
      },
      {
        $inc: { currentActiveDeliveries: 1 },
      },
      { returnDocument: 'after' }
    );

    if (!updatedPartner) {
      const recheckedCount = await countActualActiveDeliveries(partnerId);
      if (recheckedCount >= maxCapacity) {
        await DeliveryAssignment.findByIdAndUpdate(assignment._id, {
          $set: { status: 'requested', acceptedAt: null },
        });
        return res.status(400).json({
          success: false,
          message: `Active delivery limit reached (${recheckedCount}/${maxCapacity}).`,
        });
      } else {
        await DeliveryPartner.findByIdAndUpdate(partnerId, {
          $set: { currentActiveDeliveries: recheckedCount + 1 },
        });
      }
    }

    // Idempotently create or update Delivery document
    let delivery = await Delivery.findOne({ assignment: updatedAssignment._id });
    if (!delivery) {
      const deliveryNumber = `DEL-${Math.floor(100000 + Math.random() * 900000)}`;
      delivery = await Delivery.create({
        deliveryNumber,
        assignment: updatedAssignment._id,
        order: updatedAssignment.order,
        orderNumber: updatedAssignment.orderNumber,
        seller: updatedAssignment.seller,
        deliveryPartner: partnerId,
        status: 'accepted',
        pickupAddress: updatedAssignment.pickupAddress,
        deliveryAddress: updatedAssignment.deliveryAddress,
        pickupOtp: '7821', // Predictable pickup OTP for demo
        deliveryOtp: '4521', // Customer delivery OTP for demo
        deliveryFee: updatedAssignment.deliveryFee,
        paymentMethod: updatedAssignment.paymentMethod,
        codAmount: updatedAssignment.amountToCollect,
        timeline: [
          {
            status: 'accepted',
            title: 'Delivery Request Accepted',
            notes: `${req.deliveryPartner.name} accepted delivery assignment.`,
            timestamp: new Date(),
          },
        ],
      });
    } else {
      delivery.status = 'accepted';
      delivery.deliveryPartner = partnerId;
      delivery.timeline.push({
        status: 'accepted',
        title: 'Delivery Request Accepted',
        notes: `${req.deliveryPartner.name} accepted delivery assignment.`,
        timestamp: new Date(),
      });
      await delivery.save();
    }

    // Sync partner currentActiveDeliveries with actual active Deliveries
    await syncPartnerActiveCount(partnerId);
 

    // Notify seller in real-time
    emitToSeller(assignment.seller, 'delivery:assignment_accepted', {
      assignmentId: assignment.assignmentId,
      orderNumber: assignment.orderNumber,
      deliveryNumber: delivery.deliveryNumber,
      riderName: req.deliveryPartner.name,
      riderPhone: req.deliveryPartner.phone,
      vehicle: req.deliveryPartner.vehicleNumber,
     acceptedAt: updatedAssignment.acceptedAt,
    });

    emitToAdmins('delivery:assignment_accepted', {
      assignmentId: assignment.assignmentId,
      riderName: req.deliveryPartner.name,
    });

    return res.status(200).json({
      success: true,
      message: 'Delivery request accepted successfully!',
      data: {
        assignment: updatedAssignment,
        delivery,
      },
      assignment: updatedAssignment,
      delivery,
    });
  } catch (error) {
    console.error('Accept Request Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Decline Delivery Request
 * POST /api/v1/delivery/requests/:assignmentId/decline
 */
const declineRequest = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { reason } = req.body;
    const partnerId = req.deliveryPartner._id;

    const updatedAssignment = await DeliveryAssignment.findOneAndUpdate(
      {
        assignmentId: assignmentId,
        deliveryPartner: partnerId,
        status: 'requested',
      },
      {
        $set: {
          status: 'declined',
          declinedAt: new Date(),
          declineReason: reason || 'Rider currently unavailable for this route',
        },
      },
      { returnDocument: 'after' }
    );

    if (!updatedAssignment) {
      const existing = await DeliveryAssignment.findOne({
        assignmentId: assignmentId,
        deliveryPartner: partnerId,
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Delivery assignment request not found',
        });
      }

      return res.status(400).json({
        success: false,
        message: `This assignment has already been ${existing.status}`,
      });
    }

    // Revert SellerOrder to ready_for_pickup so seller can reassign
    try {
      await SellerOrder.findOneAndUpdate(
        {
          $or: [
            { orderNumber: updatedAssignment.orderNumber },
            { subOrderNumber: updatedAssignment.orderNumber },
            { order: updatedAssignment.order },
          ],
        },
        {
          $set: {
            status: 'ready_for_pickup',
            deliveryPartner: null,
            deliveryPartnerName: '',
            deliveryPartnerPhone: '',
            deliveryAssignment: null,
          },
        }
      );
    } catch (soErr) {
      console.warn('Revert SellerOrder on decline error:', soErr?.message);
    }

    // Safely sync partner active count and remove from assignedTasks
    await syncPartnerActiveCount(partnerId);
    await DeliveryPartner.findByIdAndUpdate(partnerId, {
      $pull: { assignedTasks: { orderNumber: updatedAssignment.orderNumber } },
    }).catch(() => {});

    // Notify seller so they can reassign immediately
    emitToSeller(updatedAssignment.seller, 'delivery:assignment_declined', {
      assignmentId: updatedAssignment.assignmentId,
      orderNumber: updatedAssignment.orderNumber,
      reason: updatedAssignment.declineReason,
      declinedAt: updatedAssignment.declinedAt,
    });

    return res.status(200).json({
      success: true,
      message: 'Delivery request declined. Notified store.',
      data: { assignment: updatedAssignment },
      assignment: updatedAssignment,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Active Deliveries
 * GET /api/v1/delivery/deliveries/active
 */
const getActiveDeliveries = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner._id;

    // Delivery collection is the reliable single source of truth for ongoing active deliveries
    const deliveries = await Delivery.find({
      deliveryPartner: partnerId,
      status: {
        $in: ACTIVE_DELIVERY_STATUSES,
      },
    }).sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: deliveries.length,
      data: { deliveries },
      tasks: deliveries,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Single Delivery Details
 * GET /api/v1/delivery/deliveries/:deliveryId
 */
const getDeliveryById = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const delivery = await Delivery.findOne({
      $or: [{ _id: deliveryId }, { deliveryNumber: deliveryId }],
      deliveryPartner: req.deliveryPartner._id,
    });

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery record not found' });
    }

    return res.status(200).json({
      success: true,
      data: { delivery },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Step 1: Reached Seller Pickup Location
 * POST /api/v1/delivery/deliveries/:deliveryId/reached-pickup
 */
const reachedPickup = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const delivery = await Delivery.findOne({
      $or: [{ _id: deliveryId }, { deliveryNumber: deliveryId }],
      deliveryPartner: req.deliveryPartner._id,
    });

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    delivery.status = 'reached_pickup';
    delivery.timeline.push({
      status: 'reached_pickup',
      title: 'Reached Seller Pickup Point',
      notes: 'Rider arrived at store. Waiting for package handover and pickup OTP.',
      timestamp: new Date(),
    });
    await delivery.save();

    emitToSeller(delivery.seller, 'delivery:rider_reached_pickup', {
      deliveryNumber: delivery.deliveryNumber,
      orderNumber: delivery.orderNumber,
    });

    return res.status(200).json({
      success: true,
      message: 'Status updated: Reached Pickup Point',
      data: { delivery },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Step 2: Verify Store Pickup OTP & Confirm Handover
 * POST /api/v1/delivery/deliveries/:deliveryId/verify-pickup-otp
 */
const verifyPickupOtp = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: 'Pickup OTP is required' });
    }

    const delivery = await Delivery.findOne({
      $or: [{ _id: deliveryId }, { deliveryNumber: deliveryId }],
      deliveryPartner: req.deliveryPartner._id,
    });

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    // Validate OTP (matches stored pickupOtp or static '123456' / master demo '7821' / '1234')
    const submittedOtp = otp.trim();
    const isValidOtp =
      submittedOtp === '123456' ||
      (delivery.pickupOtp && submittedOtp === delivery.pickupOtp.trim()) ||
      submittedOtp === '7821' ||
      submittedOtp === '1234';

    if (!isValidOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Delivery Handover OTP. Please ask store staff for the correct 6-digit code (123456).',
      });
    }

    // Check expiry if set (10 minutes)
    if (delivery.pickupOtpExpiresAt && new Date() > new Date(delivery.pickupOtpExpiresAt)) {
      if (submittedOtp !== '123456') {
        return res.status(400).json({
          success: false,
          message: 'Delivery Handover OTP has expired. Please ask seller to generate a new OTP.',
        });
      }
    }

    delivery.status = 'picked_up';
    delivery.pickupOtpVerified = true;
    delivery.pickupVerifiedAt = new Date();
    delivery.timeline.push({
      status: 'picked_up',
      title: 'Order Handed Over to Delivery Partner',
      notes: 'Delivery Handover OTP (123456) verified. Package is now in transit with delivery partner.',
      timestamp: new Date(),
    });
    await delivery.save();

    // Synchronize SellerOrder and Parent Order
    try {
      await SellerOrder.updateMany(
        { $or: [{ order: delivery.order }, { orderNumber: delivery.orderNumber }] },
        {
          $set: {
            status: 'picked_up',
            pickedUpAt: delivery.pickupVerifiedAt,
            'shipping.pickedUpAt': delivery.pickupVerifiedAt,
          },
        }
      );

      await syncParentOrderStatus(delivery.order || delivery.orderNumber);
    } catch (syncErr) {
      console.warn('Pickup sync warning:', syncErr?.message);
    }

    emitToSeller(delivery.seller, 'delivery:order_picked_up', {
      deliveryNumber: delivery.deliveryNumber,
      orderNumber: delivery.orderNumber,
      pickedUpAt: delivery.pickupVerifiedAt,
    });

    return res.status(200).json({
      success: true,
      message: 'Pickup OTP verified! Package is now marked Picked Up.',
      data: { delivery },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Step 3: Out For Delivery (Doorstep Transit)
 * POST /api/v1/delivery/deliveries/:deliveryId/out-for-delivery
 */
const outForDelivery = async (req, res) => {
  try {
    const { deliveryId, taskId } = req.params;
    const targetId = deliveryId || taskId;
    const partnerId = req.deliveryPartner._id;

    let delivery = await Delivery.findOne({
      $or: [{ _id: targetId }, { deliveryNumber: targetId }],
      deliveryPartner: partnerId,
    });

    if (!delivery) {
      // Check legacy assignedTasks
      const partner = await DeliveryPartner.findById(partnerId);
      const subtask = partner?.assignedTasks?.id(targetId);
      if (subtask) {
        subtask.status = 'out_for_delivery';
        await partner.save();
        if (subtask.order) {
          await Order.findByIdAndUpdate(subtask.order, { orderStatus: 'out_for_delivery' });
        }
        return res.status(200).json({
          success: true,
          message: 'Status updated: Out for Delivery',
          data: { task: subtask },
        });
      }
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    delivery.status = 'out_for_delivery';
    delivery.outForDeliveryAt = new Date();
    delivery.timeline.push({
      status: 'out_for_delivery',
      title: 'Out for Doorstep Delivery',
      notes: 'Rider is on the way to the customer delivery address.',
      timestamp: new Date(),
    });
    await delivery.save();

    // Synchronize SellerOrder and Parent Order
    let updatedOrder = null;
    try {
      updatedOrder = await Order.findOneAndUpdate(
        { $or: [{ _id: delivery.order }, { orderNumber: delivery.orderNumber }] },
        { $set: { orderStatus: 'out_for_delivery' } },
        { new: true }
      );

      await SellerOrder.updateMany(
        { $or: [{ order: delivery.order }, { orderNumber: delivery.orderNumber }] },
        {
          $set: {
            status: 'out_for_delivery',
            outForDeliveryAt: new Date(),
          },
        }
      );

      await syncParentOrderStatus(delivery.order || delivery.orderNumber);
    } catch (syncErr) {
      console.warn('Out for delivery sync warning:', syncErr?.message);
    }

    // Emit Real-Time Tracking & Seller Sockets
    emitToTrackingRoom(delivery.orderNumber, 'status_updated', {
      orderStatus: 'out_for_delivery',
      status: 'out_for_delivery',
      deliveryPartner: {
        name: req.deliveryPartner.name,
        phone: req.deliveryPartner.phone,
        vehicleNumber: req.deliveryPartner.vehicleNumber,
      },
    });

    if (updatedOrder) {
      try {
        emitOrderStatusUpdated(updatedOrder);
      } catch (e) {}
    }

    emitToSeller(delivery.seller, 'delivery:out_for_delivery', {
      deliveryNumber: delivery.deliveryNumber,
      orderNumber: delivery.orderNumber,
    });

    return res.status(200).json({
      success: true,
      message: 'Status updated: Out for Delivery',
      data: { delivery, task: delivery },
      task: delivery,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Delivery Task Status (Unified for Delivery collection & assignedTasks)
 * PATCH /api/v1/delivery/tasks/:taskId/status
 */
const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body; // 'picked_up' | 'out_for_delivery' | 'reached_customer'
    const partnerId = req.deliveryPartner._id;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    if (status === 'out_for_delivery') {
      return await outForDelivery(req, res);
    }

    // 1. Check Delivery collection first
    let delivery = await Delivery.findOne({
      $or: [{ _id: taskId }, { deliveryNumber: taskId }],
      deliveryPartner: partnerId,
    });

    if (delivery) {
      if (status === 'picked_up') {
        delivery.status = 'picked_up';
        delivery.pickedUpAt = new Date();
        delivery.pickupOtpVerified = true;
        delivery.timeline.push({
          status: 'picked_up',
          title: 'Package Picked Up from Store',
          notes: `${req.deliveryPartner.name} received package from merchant hub.`,
          timestamp: new Date(),
        });
        await delivery.save();

        const updatedOrder = await Order.findOneAndUpdate(
          { $or: [{ _id: delivery.order }, { orderNumber: delivery.orderNumber }] },
          { $set: { orderStatus: 'shipped' } },
          { new: true }
        );

        await SellerOrder.updateMany(
          { $or: [{ order: delivery.order }, { orderNumber: delivery.orderNumber }] },
          { $set: { status: 'shipped', shippedAt: new Date() } }
        );

        try {
          await syncParentOrderStatus(delivery.order || delivery.orderNumber);
        } catch (syncErr) {}

        emitToTrackingRoom(delivery.orderNumber, 'status_updated', {
          orderStatus: 'shipped',
          status: 'shipped',
        });
        if (updatedOrder) {
          try {
            emitOrderStatusUpdated(updatedOrder);
          } catch (e) {}
        }
        emitToSeller(delivery.seller, 'delivery:picked_up', {
          deliveryNumber: delivery.deliveryNumber,
          orderNumber: delivery.orderNumber,
        });

        return res.status(200).json({
          success: true,
          message: 'Status updated: Picked Up',
          data: { delivery, task: delivery },
          task: delivery,
        });
      }

      if (status === 'reached_customer') {
        delivery.status = 'reached_customer';
        delivery.timeline.push({
          status: 'reached_customer',
          title: 'Reached Customer Doorstep',
          notes: 'Rider reached customer doorstep. Ready for OTP verification.',
          timestamp: new Date(),
        });
        await delivery.save();

        return res.status(200).json({
          success: true,
          message: 'Status updated: Reached Customer',
          data: { delivery, task: delivery },
          task: delivery,
        });
      }

      delivery.status = status;
      delivery.timeline.push({
        status,
        title: `Status updated to ${status.replace('_', ' ')}`,
        timestamp: new Date(),
      });
      await delivery.save();

      return res.status(200).json({
        success: true,
        message: `Task status updated to ${status}`,
        data: { delivery, task: delivery },
        task: delivery,
      });
    }

    // 2. Legacy fallback to partner.assignedTasks
    const partner = await DeliveryPartner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    const task = partner.assignedTasks.id(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Delivery task not found' });
    }

    task.status = status;
    await partner.save();

    if (task.order) {
      await Order.findByIdAndUpdate(task.order, {
        orderStatus: status === 'out_for_delivery' ? 'out_for_delivery' : 'processing',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Task marked as ${status}`,
      data: { task },
      task,
    });
  } catch (error) {
    console.error('Update Task Status Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Step 4: Reached Customer Doorstep
 * POST /api/v1/delivery/deliveries/:deliveryId/reached-customer
 */
const reachedCustomer = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const delivery = await Delivery.findOne({
      $or: [{ _id: deliveryId }, { deliveryNumber: deliveryId }],
      deliveryPartner: req.deliveryPartner._id,
    });

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    delivery.status = 'reached_customer';
    delivery.timeline.push({
      status: 'reached_customer',
      title: 'Reached Customer Doorstep',
      notes: 'Rider arrived at customer address. Ringing doorbell and requesting delivery OTP.',
      timestamp: new Date(),
    });
    await delivery.save();

    return res.status(200).json({
      success: true,
      message: 'Status updated: Reached Customer',
      data: { delivery },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Step 5: Verify Customer Delivery OTP & Complete Delivery
 * POST /api/v1/delivery/deliveries/:deliveryId/verify-delivery-otp
 */
const verifyDeliveryOtp = async (req, res) => {
  try {
    const { deliveryId, taskId } = req.params;
    const targetId = deliveryId || taskId;
    const { otp, proofPhotoUrl, receiverName } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: 'Customer delivery OTP is required' });
    }

    const partnerId = req.deliveryPartner._id;

    // Check Delivery model
    let delivery = await Delivery.findOne({
      $or: [{ _id: targetId }, { deliveryNumber: targetId }],
      deliveryPartner: partnerId,
    });

    // Idempotency: Prevent duplicate completion and duplicate counter decrement
    if (delivery && delivery.status === 'delivered') {
      return res.status(200).json({
        success: true,
        message: 'Delivery is already completed and verified.',
        data: { delivery },
      });
    }

    // If not found in Delivery model, check subdocument assignedTasks in DeliveryPartner
    if (!delivery) {
      const partner = await DeliveryPartner.findById(partnerId);
      const subtask = partner.assignedTasks.id(targetId);
      if (subtask) {
        if (subtask.status === 'delivered') {
          return res.status(200).json({
            success: true,
            message: 'Task is already completed.',
            data: { task: subtask },
          });
        }

        if (subtask.deliveryOtp !== otp.trim() && otp.trim() !== '4521' && otp.trim() !== '1234') {
          return res.status(400).json({
            success: false,
            message: 'Incorrect OTP. Please ask customer for the 4-digit verification code.',
          });
        }

        subtask.status = 'delivered';
        subtask.deliveredAt = new Date();
        partner.earnings.available += subtask.deliveryFee || 65;
        partner.earnings.totalEarned += subtask.deliveryFee || 65;
        partner.earnings.todayEarned += subtask.deliveryFee || 65;
        partner.totalDeliveriesCompleted += 1;
        await partner.save();

        await syncPartnerActiveCount(partnerId);

        return res.status(200).json({
          success: true,
          message: 'Delivery verified and completed! Earnings credited.',
          data: { task: subtask },
        });
      }

      return res.status(404).json({ success: false, message: 'Delivery record not found' });
    }

    // Verify OTP against stored deliveryOtp, linked order deliveryOtp, or demo master code '4521' / '1234'
    const allowedOtps = [
      (delivery.deliveryOtp || '').trim(),
      '4521',
      '1234',
    ];
    if (delivery.order) {
      try {
        const parentOrder = await Order.findById(delivery.order);
        if (parentOrder && parentOrder.deliveryOtp) {
          allowedOtps.push(parentOrder.deliveryOtp.trim());
        }
      } catch (e) {}
    }

    if (!allowedOtps.filter(Boolean).includes(otp.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP. Please ask customer for the 4-digit verification code.',
      });
    }

    delivery.status = 'delivered';
    delivery.deliveryOtpVerified = true;
    delivery.deliveredAt = new Date();
    if (delivery.paymentMethod === 'COD') {
      delivery.codCollected = true;
      delivery.codCollectedAt = new Date();
    }
    if (proofPhotoUrl) {
      delivery.proofOfDelivery = {
        photoUrl: proofPhotoUrl,
        receiverName: receiverName || delivery.deliveryAddress?.fullName,
      };
    }
    delivery.timeline.push({
      status: 'delivered',
      title: 'Delivered Successfully',
      notes: `Verified customer OTP ${otp}. Handed over package.`,
      timestamp: new Date(),
    });
    await delivery.save();

    // Credit Earning to Ledger
    await DeliveryEarning.create({
      deliveryPartner: partnerId,
      delivery: delivery._id,
      orderNumber: delivery.orderNumber,
      type: 'delivery_fee',
      baseFee: delivery.deliveryFee || 65,
      totalEarned: delivery.deliveryFee || 65,
      status: 'available',
      description: `Delivery payout for Order #${delivery.orderNumber}`,
    });

    // Update Partner Wallet & safely reconcile active deliveries counter
    const remainingActiveCount = await countActualActiveDeliveries(partnerId);
    await DeliveryPartner.findByIdAndUpdate(partnerId, {
      $inc: {
        'earnings.available': delivery.deliveryFee || 65,
        'earnings.totalEarned': delivery.deliveryFee || 65,
        'earnings.todayEarned': delivery.deliveryFee || 65,
        totalDeliveriesCompleted: 1,
      },
      $set: {
        currentActiveDeliveries: remainingActiveCount,
      },
      $pull: {
        assignedTasks: { orderNumber: delivery.orderNumber },
      },
    });

    // Update Customer Order and Seller Sub-Orders in Database
    if (delivery.orderNumber || delivery.order) {
      const orderFilter = delivery.order
        ? { _id: delivery.order }
        : { $or: [{ orderId: delivery.orderNumber }, { orderNumber: delivery.orderNumber }] };

      const orderUpdate = {
        orderStatus: 'Delivered',
        deliveredAt: new Date(),
        deliveryOtpVerified: true,
      };
      if (delivery.paymentMethod === 'COD') {
        orderUpdate.paymentStatus = 'Completed';
      }

      const updatedOrder = await Order.findOneAndUpdate(orderFilter, { $set: orderUpdate }, { new: true });
      if (updatedOrder) {
        try {
          emitOrderStatusUpdated(updatedOrder);
          emitToTrackingRoom(updatedOrder.orderId || updatedOrder.orderNumber, 'status_updated', {
            orderStatus: 'Delivered',
            deliveredAt: updatedOrder.deliveredAt,
          });
        } catch (e) {}
      }

      // Synchronize Seller Sub-Orders
      const sellerOrderUpdate = {
        status: 'delivered',
        ...(delivery.paymentMethod === 'COD' ? { paymentStatus: 'Completed' } : {}),
      };
      await SellerOrder.updateMany(
        { $or: [{ order: delivery.order }, { orderNumber: delivery.orderNumber }] },
        { $set: sellerOrderUpdate }
      );

      try {
        await syncParentOrderStatus(delivery.order || delivery.orderNumber);
      } catch (syncErr) {
        console.warn('Delivery complete sync warning:', syncErr?.message);
      }

      // Credit Seller Wallet with Net Earnings (Order Value - 10% Commission)
      const linkedSellerOrders = await SellerOrder.find({
        $or: [{ order: delivery.order }, { orderNumber: delivery.orderNumber }],
      });
      for (const so of linkedSellerOrders) {
        if (so.seller && so.netEarnings > 0) {
          await Seller.findByIdAndUpdate(so.seller, {
            $inc: {
              'balance.available': so.netEarnings,
              'balance.totalEarned': so.netEarnings,
            },
          });
        }
      }
    }

    // Emit Real-Time Socket Events
    emitToTrackingRoom(delivery.orderNumber, 'status_updated', {
      orderStatus: 'Delivered',
      status: 'Delivered',
      deliveredAt: delivery.deliveredAt,
    });
    emitToSeller(delivery.seller, 'delivery:delivered', {
      deliveryNumber: delivery.deliveryNumber,
      orderNumber: delivery.orderNumber,
      deliveredAt: delivery.deliveredAt,
    });
    emitToAdmins('delivery:delivered', {
      deliveryNumber: delivery.deliveryNumber,
      orderNumber: delivery.orderNumber,
    });

    return res.status(200).json({
      success: true,
      message: 'Delivery verified and completed! ₹' + (delivery.deliveryFee || 65) + ' credited to your wallet.',
      data: { delivery },
    });
  } catch (error) {
    console.error('Verify Delivery OTP Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Report Delivery Issue / Failure
 * POST /api/v1/delivery/deliveries/:deliveryId/failure
 */
const reportDeliveryFailure = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { reason, notes } = req.body;

    const delivery = await Delivery.findOne({
      $or: [{ _id: deliveryId }, { deliveryNumber: deliveryId }],
      deliveryPartner: req.deliveryPartner._id,
    });

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    if (delivery.status === 'delivery_failed') {
      return res.status(200).json({
        success: true,
        message: 'Delivery issue is already recorded.',
        data: { delivery },
      });
    }

    delivery.status = 'delivery_failed';
    delivery.failureReason = reason || 'customer_unavailable';
    delivery.failureNotes = notes || 'Customer was not reachable at the doorstep.';
    delivery.failedAt = new Date();
    delivery.timeline.push({
      status: 'delivery_failed',
      title: 'Delivery Attempt Failed',
      notes: `Reason: ${delivery.failureReason}. ${delivery.failureNotes}`,
      timestamp: new Date(),
    });
    await delivery.save();

    // Reconcile remaining active deliveries
    const remainingActiveCount = await countActualActiveDeliveries(req.deliveryPartner._id);
    await DeliveryPartner.findByIdAndUpdate(req.deliveryPartner._id, {
      $set: { currentActiveDeliveries: remainingActiveCount },
      $pull: { assignedTasks: { orderNumber: delivery.orderNumber } },
    });

    emitToSeller(delivery.seller, 'delivery:failed', {
      deliveryNumber: delivery.deliveryNumber,
      orderNumber: delivery.orderNumber,
      reason: delivery.failureReason,
    });

    return res.status(200).json({
      success: true,
      message: 'Delivery issue recorded. Dispatch team notified.',
      data: { delivery },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Real-Time GPS Location
 * POST /api/v1/delivery/location
 */
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, heading = 0, speed = 0, addressText, activeOrderId, deliveryId } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Coordinates are required' });
    }

    const partnerId = req.deliveryPartner._id;
    const partner = await DeliveryPartner.findByIdAndUpdate(
      partnerId,
      {
        $set: {
          'currentLocation.latitude': Number(latitude),
          'currentLocation.longitude': Number(longitude),
          'currentLocation.addressText': addressText || 'In Transit',
          'currentLocation.updatedAt': new Date(),
        },
      },
      { new: true }
    );

    // Look for active delivery for this rider
    let delivery = null;
    if (deliveryId) {
      delivery = await Delivery.findOne({
        $or: [{ _id: deliveryId }, { deliveryNumber: deliveryId }],
        deliveryPartner: partnerId,
      });
    } else if (activeOrderId) {
      delivery = await Delivery.findOne({
        $or: [{ orderNumber: activeOrderId }, { order: activeOrderId }],
        deliveryPartner: partnerId,
      });
    } else {
      delivery = await Delivery.findOne({
        deliveryPartner: partnerId,
        status: {
          $in: ['assigned', 'accepted', 'reached_pickup', 'picked_up', 'out_for_delivery', 'reached_customer'],
        },
      }).sort({ updatedAt: -1 });
    }

    let remainingKm = 2.5;
    let etaMinutes = 10;
    let targetOrderId = activeOrderId;

    if (delivery) {
      targetOrderId = delivery.orderNumber || delivery.order?.toString();
      delivery.currentLocation = {
        latitude: Number(latitude),
        longitude: Number(longitude),
        heading: Number(heading),
        speed: Number(speed),
        updatedAt: new Date(),
      };

      // Destination depends on whether order is on pickup leg or doorstep delivery leg
      const isOnDeliveryLeg = ['picked_up', 'out_for_delivery', 'reached_customer'].includes(delivery.status);
      const destLat = isOnDeliveryLeg
        ? delivery.deliveryAddress?.latitude || 26.9015
        : delivery.pickupAddress?.latitude || 26.9124;
      const destLon = isOnDeliveryLeg
        ? delivery.deliveryAddress?.longitude || 75.7421
        : delivery.pickupAddress?.longitude || 75.7873;

      remainingKm = calculateDistanceKm(Number(latitude), Number(longitude), destLat, destLon);
      etaMinutes = calculateEtaMinutes(remainingKm, partner.vehicleType);

      delivery.distanceRemaining = remainingKm;
      delivery.estimatedMinutes = etaMinutes;
      await delivery.save();

      // Update parent Order
      try {
        const orderFilter = delivery.order
          ? { _id: delivery.order }
          : { $or: [{ orderId: targetOrderId }, { orderNumber: targetOrderId }] };

        const orderUpdates = {
          'currentLocation.latitude': Number(latitude),
          'currentLocation.longitude': Number(longitude),
          'currentLocation.heading': Number(heading),
          'currentLocation.speed': Number(speed),
          'currentLocation.updatedAt': new Date(),
          distanceRemainingKm: remainingKm,
          estimatedMinutesRemaining: etaMinutes,
        };

        // If rider is less than 400m from customer doorstep and order is out_for_delivery, mark nearing_destination
        if (isOnDeliveryLeg && remainingKm <= 0.4 && delivery.status === 'out_for_delivery') {
          orderUpdates.orderStatus = 'nearing_destination';
        }

        const updatedOrder = await Order.findOneAndUpdate(orderFilter, { $set: orderUpdates }, { new: true });

        // Update SellerOrder
        await SellerOrder.updateMany(
          { $or: [{ order: delivery.order }, { orderNumber: targetOrderId }] },
          {
            $set: {
              'currentLocation.latitude': Number(latitude),
              'currentLocation.longitude': Number(longitude),
              'currentLocation.updatedAt': new Date(),
            },
          }
        );

        if (updatedOrder && delivery.seller) {
          emitToSeller(delivery.seller, 'delivery:location_updated', {
            orderId: updatedOrder.orderId || targetOrderId,
            orderNumber: updatedOrder.orderNumber,
            latitude: Number(latitude),
            longitude: Number(longitude),
            riderName: partner.name,
            distanceRemainingKm: remainingKm,
            etaMinutes,
            updatedAt: new Date(),
          });
        }
      } catch (orderErr) {
        console.warn('Update order location error:', orderErr?.message);
      }
    }

    // Broadcast live location to order tracking room
    if (targetOrderId) {
      emitToTrackingRoom(targetOrderId, 'delivery:location_updated', {
        orderId: targetOrderId,
        latitude: Number(latitude),
        longitude: Number(longitude),
        heading: Number(heading),
        speed: Number(speed),
        riderName: partner.name,
        riderPhone: partner.phone,
        vehicleType: partner.vehicleType,
        vehicleNumber: partner.vehicleNumber,
        distanceRemainingKm: remainingKm,
        etaMinutes,
        updatedAt: new Date(),
      });

      emitToTrackingRoom(targetOrderId, 'delivery:eta_updated', {
        orderId: targetOrderId,
        etaMinutes,
        distanceRemainingKm: remainingKm,
        updatedAt: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        location: partner.currentLocation,
        distanceRemainingKm: remainingKm,
        etaMinutes,
        activeOrderId: targetOrderId,
      },
    });
  } catch (error) {
    console.error('Update Location Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  updateAvailability,
  getDashboard,
  getRequests,
  acceptRequest,
  declineRequest,
  getActiveDeliveries,
  getDeliveryById,
  reachedPickup,
  verifyPickupOtp,
  outForDelivery,
  updateTaskStatus,
  reachedCustomer,
  verifyDeliveryOtp,
  reportDeliveryFailure,
  updateLocation,
};

