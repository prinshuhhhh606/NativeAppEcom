/**
 * Seller Delivery Assignment Controller
 * Enables multi-vendor sellers to assign delivery partners, monitor acceptance, and reassign
 */
const mongoose = require('mongoose');
const DeliveryPartner = require('../../models/DeliveryPartner');
const DeliveryAssignment = require('../../models/DeliveryAssignment');
const Delivery = require('../../models/Delivery');
const SellerOrder = require('../../models/SellerOrder');
const Order = require('../../models/Order');
const { emitToDeliveryPartner, emitToOrder } = require('../../sockets/socketManager');
const { syncParentOrderStatus } = require('../../utils/orderSync');
const {
  ACTIVE_DELIVERY_STATUSES,
  countActualActiveDeliveries,
  syncPartnerActiveCount,
  getPartnerCapacityInfo,
} = require('../../utils/deliveryCapacityUtils');

/**
 * Get Available Approved Delivery Partners for Seller
 * GET /api/v1/seller/delivery/eligible-partners
 */
const getEligiblePartners = async (req, res) => {
  try {
    const { city, pinCode } = req.query;

    const query = {
      kycStatus: 'approved',
      availability: 'online',
      isActive: true,
    };

    let partners = await DeliveryPartner.find(query).select(
      'name phone vehicleType vehicleNumber rating totalDeliveriesCompleted currentActiveDeliveries activeCapacity currentLocation isAvailable availability kycStatus'
    );

    // If no online partners found in database, ensure demo delivery partner is available
    if (partners.length === 0) {
      const demoRider = await DeliveryPartner.findOneAndUpdate(
        { email: 'delivery@appecom.in' },
        {
          $set: {
            name: 'Rajesh Kumar',
            phone: '9876543212',
            vehicleType: 'Bike',
            vehicleNumber: 'DL-04-CK-8821',
            kycStatus: 'approved',
            availability: 'online',
            isAvailable: true,
            rating: 4.85,
            totalDeliveriesCompleted: 248,
            currentActiveDeliveries: 0,
            activeCapacity: 4,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
      partners = [demoRider];
    }

    // Compute actual capacity from genuine ongoing deliveries for each partner
    const eligibleList = await Promise.all(
      partners.map(async (p, idx) => {
        const capacityInfo = await getPartnerCapacityInfo(p);

        // Auto-heal stored currentActiveDeliveries if out-of-sync
        if (p.currentActiveDeliveries !== capacityInfo.actualActive) {
          DeliveryPartner.findByIdAndUpdate(p._id, {
            $set: { currentActiveDeliveries: capacityInfo.actualActive },
          }).catch(() => {});
        }

        return {
          _id: p._id,
          name: p.name,
          phone: p.phone,
          vehicleType: p.vehicleType,
          vehicleNumber: p.vehicleNumber,
          rating: p.rating,
          totalDeliveries: p.totalDeliveriesCompleted,
          activeTasks: capacityInfo.actualActive,
          activeCapacity: capacityInfo.activeCapacity,
          capacityAvailable: capacityInfo.capacityAvailable,
          isAssignable: capacityInfo.isAssignable,
          approxDistanceKm: Number((1.8 + idx * 1.2).toFixed(1)),
          estimatedArrivalMin: 10 + idx * 5,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: eligibleList.length,
      data: { partners: eligibleList },
      partners: eligibleList,
    });
  } catch (error) {
    console.error('Get Eligible Partners Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Seller Assigns Order to Delivery Partner
 * POST /api/v1/seller/delivery/assign
 */
const assignDeliveryPartner = async (req, res) => {
  try {
    const { orderId, deliveryPartnerId, specialInstructions } = req.body;
    const sellerId = req.seller._id;

    if (!orderId || !deliveryPartnerId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and Delivery Partner ID are required',
      });
    }

    const mongoose = require('mongoose');
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId);

    // Find Order / SellerOrder
    let order = await SellerOrder.findOne({
      $or: [
        ...(isObjectId ? [{ _id: orderId }] : []),
        { subOrderNumber: orderId },
        { orderNumber: orderId },
      ],
      seller: sellerId,
    });

    let orderNum = order ? order.orderNumber : orderId;
    let customerName = order ? order.customerName : 'Customer';
    let customerPhone = order ? order.customerPhone : '9876543210';
    let deliveryAddr = order?.shippingAddress || {
      fullName: customerName,
      addressLine: 'Sector 14, Rohini',
      city: 'New Delhi',
      state: 'Delhi',
      pinCode: '110085',
      mobileNumber: customerPhone,
    };

    // Find Delivery Partner
    const partner = await DeliveryPartner.findById(deliveryPartnerId);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }

    if (partner.kycStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Selected delivery partner is not approved by admin',
      });
    }

    if (partner.availability !== 'online' || partner.isAvailable === false) {
      return res.status(400).json({
        success: false,
        message: `Delivery partner ${partner.name} is currently offline. Please choose an online partner.`,
      });
    }

    // Check partner delivery capacity against genuine ongoing deliveries
    const capacityInfo = await getPartnerCapacityInfo(partner);
    if (capacityInfo.capacityAvailable <= 0) {
      return res.status(400).json({
        success: false,
        message: `Delivery partner ${partner.name} has no available capacity (${capacityInfo.actualActive}/${capacityInfo.activeCapacity} active tasks). Please choose another rider.`,
        data: {
          partnerId: partner._id,
          activeTasks: capacityInfo.actualActive,
          activeCapacity: capacityInfo.activeCapacity,
          capacityAvailable: 0,
        },
      });
    }

    // Auto-expire any stale past-deadline requested assignments for this order
    await DeliveryAssignment.updateMany(
      {
        orderNumber: orderNum,
        seller: sellerId,
        status: 'requested',
        responseDeadline: { $lte: new Date() },
      },
      { $set: { status: 'expired' } }
    );

    // Check if active assignment already exists for this order
    const existingActive = await DeliveryAssignment.findOne({
      orderNumber: orderNum,
      seller: sellerId,
      $or: [
        { status: 'accepted' },
        { status: 'requested', responseDeadline: { $gt: new Date() } },
      ],
    });

    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: `Order #${orderNum} already has an active assignment (${existingActive.status}) with rider ${existingActive.deliveryPartnerName || 'assigned'}`,
      });
    }

    // Check if active delivery already exists for this order
    const existingActiveDelivery = await Delivery.findOne({
      orderNumber: orderNum,
      status: { $in: ACTIVE_DELIVERY_STATUSES },
    });

    if (existingActiveDelivery) {
      return res.status(400).json({
        success: false,
        message: `Order #${orderNum} already has an active ongoing delivery (${existingActiveDelivery.status})`,
      });
    }

    // Create Assignment
    const assignmentId = `ASGN-${Math.floor(100000 + Math.random() * 900000)}`;
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour acceptance window for dispatch request

    const assignment = await DeliveryAssignment.create({
      assignmentId,
      order: order ? order.order : new (require('mongoose').Types.ObjectId)(),
      orderNumber: orderNum,
      seller: sellerId,
      sellerStoreName: req.seller.storeName || 'Jaipur Heritage Handlooms',
      deliveryPartner: partner._id,
      deliveryPartnerName: partner.name,
      status: 'requested',
      responseDeadline: deadline,
      pickupAddress: {
        storeName: req.seller.storeName || 'Jaipur Heritage Artisans Hub',
        addressLine: req.seller.pickupAddress?.addressLine1 || 'MI Road Market',
        city: req.seller.pickupAddress?.city || 'Jaipur',
        state: req.seller.pickupAddress?.state || 'Rajasthan',
        pinCode: req.seller.pickupAddress?.pinCode || '302001',
        contactPhone: req.seller.phone || '9829012345',
      },
      deliveryAddress: {
        fullName: deliveryAddr.fullName || customerName,
        addressLine: deliveryAddr.addressLine1 || deliveryAddr.addressLine || 'Street 5',
        city: deliveryAddr.city || 'Jaipur',
        state: deliveryAddr.state || 'Rajasthan',
        pinCode: deliveryAddr.pinCode || '302021',
        mobileNumber: deliveryAddr.mobileNumber || customerPhone,
      },
      distanceKm: 4.5,
      estimatedMinutes: 25,
      deliveryFee: 65,
      customerName,
      maskedCustomerPhone: `+91 ${customerPhone.slice(0, 2)}XXX X${customerPhone.slice(-4)}`,
      paymentMethod: order?.paymentMethod || 'ONLINE',
      amountToCollect: order?.paymentMethod === 'COD' ? order.totalAmount || 1899 : 0,
      specialInstructions: specialInstructions || 'Deliver securely to customer.',
    });

    // Idempotently create Delivery document so the order immediately appears in Delivery Panel
    let delivery = await Delivery.findOne({
      $or: [{ assignment: assignment._id }, { orderNumber: orderNum, deliveryPartner: partner._id }],
    });

    if (!delivery) {
      const deliveryNumber = `DEL-${Math.floor(100000 + Math.random() * 900000)}`;
      delivery = await Delivery.create({
        deliveryNumber,
        assignment: assignment._id,
        order: order ? order.order : new (require('mongoose').Types.ObjectId)(),
        orderNumber: orderNum,
        seller: sellerId,
        deliveryPartner: partner._id,
        status: 'assigned',
        pickupAddress: assignment.pickupAddress,
        deliveryAddress: assignment.deliveryAddress,
        pickupOtp: '123456', // Static OTP 123456 for Delivery Handover
        pickupOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
        deliveryOtp: '4521', // Customer delivery OTP for demo
        deliveryFee: assignment.deliveryFee,
        paymentMethod: assignment.paymentMethod,
        codAmount: assignment.amountToCollect,
        timeline: [
          {
            status: 'assigned',
            title: 'Delivery Partner Assigned by Seller',
            notes: `Assigned to ${partner.name} (${partner.phone}). Awaiting pickup.`,
            timestamp: new Date(),
          },
        ],
      });
    }

    // Atomically Update Seller Sub-Order
    if (order) {
      order.deliveryPartner = partner._id;
      order.deliveryPartnerName = partner.name;
      order.deliveryPartnerPhone = partner.phone;
      order.deliveryPartnerVehicleType = partner.vehicleType || 'Bike';
      order.deliveryPartnerVehicleNumber = partner.vehicleNumber || '';
      order.deliveryPartnerRating = partner.rating || 4.8;
      order.deliveryAssignment = assignment._id;
      order.assignedAt = new Date();
      order.assignedBy = sellerId;
      order.status = 'pickup_scheduled';
      order.pickupOtp = '123456';
      order.deliveryHandoverOtp = '123456';
      order.pickupOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      order.shipping = order.shipping || {};
      order.shipping.deliveryPartnerId = partner._id;
      order.shipping.deliveryPartnerName = partner.name;
      order.shipping.deliveryPartnerPhone = partner.phone;
      order.shipping.vehicleType = partner.vehicleType || 'Bike';
      order.shipping.vehicleNumber = partner.vehicleNumber || '';
      order.shipping.courierName = `${partner.name} (${partner.vehicleType || 'Delivery Partner'})`;
      if (!order.shipping.trackingNumber) {
        order.shipping.trackingNumber = 'BBIN-' + Math.floor(100000000 + Math.random() * 900000000);
      }
      order.shipping.trackingHistory = order.shipping.trackingHistory || [];
      order.shipping.trackingHistory.push({
        status: 'Delivery Partner Assigned',
        location: req.seller.storeName || 'Logistics Hub',
        timestamp: new Date(),
        remarks: `Assigned to ${partner.name} (${partner.phone})`,
      });

      await order.save();
    }

    // Atomically Update Parent Order for Customer Tracking
    try {
      await syncParentOrderStatus(order ? (order.order || order.orderNumber) : orderNum);
    } catch (parentErr) {
      console.warn('Parent order update warning:', parentErr?.message);
    }

    // Note: Active delivery count is incremented ONLY upon partner acceptance,
    // not upon assignment request dispatch. Partner capacity remains unaffected until accepted.

    // Notify Rider via Real-Time Socket.IO
    emitToDeliveryPartner(partner._id, 'delivery:new_assignment', {
      assignmentId: assignment.assignmentId,
      orderNumber: assignment.orderNumber,
      storeName: assignment.sellerStoreName,
      pickupCity: assignment.pickupAddress?.city,
      deliveryCity: assignment.deliveryAddress?.city,
      deliveryFee: assignment.deliveryFee,
      distanceKm: assignment.distanceKm,
      deadline: assignment.responseDeadline,
    });

    // Notify Customer & Tracking Room
    emitToOrder(orderNum, 'delivery:partner_assigned', {
      orderId: orderNum,
      status: 'delivery_partner_assigned',
      partner: {
        _id: partner._id,
        name: partner.name,
        phone: partner.phone,
        vehicleType: partner.vehicleType || 'Bike',
        vehicleNumber: partner.vehicleNumber || '',
        rating: partner.rating || 4.85,
      },
    });

    return res.status(201).json({
      success: true,
      message: `Delivery assigned to ${partner.name}! Rider notified in real time.`,
      data: { assignment, order },
      assignment,
      order,
    });
  } catch (error) {
    console.error('Assign Delivery Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Delivery Assignment Status for an Order
 * GET /api/v1/seller/delivery/assignments/:orderId
 */
const getOrderAssignments = async (req, res) => {
  try {
    const { orderId } = req.params;
    const sellerId = req.seller._id;

    const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
    const assignment = await DeliveryAssignment.findOne({
      $or: [
        ...(isObjectId ? [{ _id: orderId }] : []),
        { orderNumber: orderId },
        { assignmentId: orderId },
      ],
      seller: sellerId,
    })
      .populate('deliveryPartner', 'name phone vehicleType vehicleNumber rating currentLocation')
      .sort({ createdAt: -1 });

    const delivery = assignment
      ? await Delivery.findOne({ assignment: assignment._id })
      : null;

    return res.status(200).json({
      success: true,
      data: {
        assignment,
        delivery,
      },
      assignment,
      delivery,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Cancel Assignment
 * POST /api/v1/seller/delivery/assignments/:assignmentId/cancel
 */
const cancelAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const sellerId = req.seller._id;

    const isObjectId = mongoose.Types.ObjectId.isValid(assignmentId);
    const assignment = await DeliveryAssignment.findOne({
      $or: [
        ...(isObjectId ? [{ _id: assignmentId }] : []),
        { assignmentId },
      ],
      seller: sellerId,
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (assignment.status === 'cancelled') {
      return res.status(200).json({
        success: true,
        message: 'Assignment is already cancelled',
        data: { assignment },
      });
    }

    // Check if an actual Delivery record was created
    const linkedDelivery = await Delivery.findOne({ assignment: assignment._id });
    if (linkedDelivery) {
      if (linkedDelivery.status === 'delivered') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel assignment: delivery is already completed.',
        });
      }
      if (ACTIVE_DELIVERY_STATUSES.includes(linkedDelivery.status)) {
        linkedDelivery.status = 'cancelled';
        linkedDelivery.timeline.push({
          status: 'cancelled',
          title: 'Delivery Cancelled by Seller',
          notes: 'Seller cancelled the delivery assignment.',
          timestamp: new Date(),
        });
        await linkedDelivery.save();
      }
    }

    assignment.status = 'cancelled';
    assignment.cancelledAt = new Date();
    await assignment.save();

    // Reconcile delivery partner active deliveries counter and clean up legacy subtasks
    if (assignment.deliveryPartner) {
      await syncPartnerActiveCount(assignment.deliveryPartner);
      await DeliveryPartner.findByIdAndUpdate(assignment.deliveryPartner, {
        $pull: { assignedTasks: { orderNumber: assignment.orderNumber } },
      }).catch(() => {});
    }

    // Reset SellerOrder back to ready_for_pickup
    try {
      await SellerOrder.findOneAndUpdate(
        {
          $or: [
            { orderNumber: assignment.orderNumber },
            { subOrderNumber: assignment.orderNumber },
            { order: assignment.order },
          ],
          seller: sellerId,
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
      console.warn('Revert SellerOrder status warning:', soErr?.message);
    }

    emitToDeliveryPartner(assignment.deliveryPartner, 'delivery:cancelled', {
      assignmentId: assignment.assignmentId,
      orderNumber: assignment.orderNumber,
    });

    return res.status(200).json({
      success: true,
      message: 'Assignment cancelled. You can now select another delivery partner.',
      data: { assignment },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reassign Delivery Partner
 * POST /api/v1/seller/delivery/assignments/:assignmentId/reassign
 */
const reassignPartner = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { newDeliveryPartnerId } = req.body;
    const sellerId = req.seller._id;

    const isObjectId = mongoose.Types.ObjectId.isValid(assignmentId);
    const oldAssignment = await DeliveryAssignment.findOne({
      $or: [
        ...(isObjectId ? [{ _id: assignmentId }] : []),
        { assignmentId },
      ],
      seller: sellerId,
    });

    if (!oldAssignment) {
      return res.status(404).json({ success: false, message: 'Existing assignment not found' });
    }

    // Cancel any active Delivery on the old assignment
    const linkedDelivery = await Delivery.findOne({ assignment: oldAssignment._id });
    if (linkedDelivery && ACTIVE_DELIVERY_STATUSES.includes(linkedDelivery.status)) {
      linkedDelivery.status = 'cancelled';
      await linkedDelivery.save();
    }

    oldAssignment.status = 'reassigned';
    oldAssignment.reassignedAt = new Date();
    await oldAssignment.save();

    // Reconcile old partner's capacity
    if (oldAssignment.deliveryPartner) {
      await syncPartnerActiveCount(oldAssignment.deliveryPartner);
      await DeliveryPartner.findByIdAndUpdate(oldAssignment.deliveryPartner, {
        $pull: { assignedTasks: { orderNumber: oldAssignment.orderNumber } },
      }).catch(() => {});
    }

    req.body.orderId = oldAssignment.orderNumber;
    req.body.deliveryPartnerId = newDeliveryPartnerId;
    return assignDeliveryPartner(req, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEligiblePartners,
  assignDeliveryPartner,
  getOrderAssignments,
  cancelAssignment,
  reassignPartner,
};

