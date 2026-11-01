const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    shiprocketShipmentId: {
      type: String,
      trim: true,
    },
    courierName: {
      type: String,
      default: 'Delhivery Pan-India Express',
    },
    courierId: {
      type: String,
    },
    trackingNumber: {
      type: String,
      required: true,
      index: true,
    },
    awbCode: {
      type: String,
    },
    labelUrl: {
      type: String,
    },
    manifestUrl: {
      type: String,
    },
    shippingCharge: {
      type: Number,
      default: 40,
    },
    status: {
      type: String,
      enum: ['Manifested', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'RTO Initiated', 'RTO Delivered', 'Cancelled'],
      default: 'Manifested',
    },
    estimatedDeliveryDate: {
      type: Date,
    },
    pickupScheduledDate: {
      type: Date,
    },
    activityLog: [
      {
        status: String,
        activity: String,
        location: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Shipment', shipmentSchema);

