const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const mongoose = require('mongoose');
const env = require('../src/config/env');
const Seller = require('../src/models/Seller');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const SellerOrder = require('../src/models/SellerOrder');
const User = require('../src/models/User');

async function seedOrders() {
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('Connected to MongoDB');

    // Find sellers
    const sellers = await Seller.find({ status: 'approved' });
    console.log(`Found ${sellers.length} approved sellers.`);

    if (sellers.length === 0) {
      console.log('No approved sellers found!');
      process.exit(1);
    }

    // Find or create customer user
    let customer = await User.findOne({ role: 'customer' });
    if (!customer) {
      customer = await User.findOne();
    }

    const customerId = customer ? customer._id : new mongoose.Types.ObjectId();

    // Find products
    const products = await Product.find({ isActive: true });
    console.log(`Found ${products.length} products.`);

    const sampleCustomers = [
      { name: 'Aarav Sharma', phone: '9829012345', email: 'aarav.sharma@gmail.com', city: 'Jaipur', state: 'Rajasthan', pin: '302001', address: '42, Govind Marg, Raja Park' },
      { name: 'Priya Patel', phone: '9898023456', email: 'priya.patel@gmail.com', city: 'Ahmedabad', state: 'Gujarat', pin: '380015', address: 'B-204, Satellite Towers, Bodakdev' },
      { name: 'Rohan Verma', phone: '9811034567', email: 'rohan.verma@yahoo.com', city: 'New Delhi', state: 'Delhi', pin: '110001', address: '12/A, Connaught Circus' },
      { name: 'Sneha Kulkarni', phone: '9822045678', email: 'sneha.k@gmail.com', city: 'Pune', state: 'Maharashtra', pin: '411004', address: 'Flat 10, Shivaji Nagar' },
      { name: 'Vikramaditya Rao', phone: '9845056789', email: 'vikram.rao@outlook.com', city: 'Bengaluru', state: 'Karnataka', pin: '560001', address: '78, Brigade Road, Ashok Nagar' },
      { name: 'Ananya Mukherjee', phone: '9830067890', email: 'ananya.m@gmail.com', city: 'Kolkata', state: 'West Bengal', pin: '700029', address: '15, Southern Avenue' },
      { name: 'Kavita Menon', phone: '9847078901', email: 'kavita.menon@gmail.com', city: 'Kochi', state: 'Kerala', pin: '682016', address: 'Flat 4B, Marine Drive Enclave' },
    ];

    const couriers = ['Delhivery', 'BlueDart', 'Shadowfax', 'DTDC', 'India Post', 'Shiprocket'];
    const paymentMethods = ['COD', 'ONLINE', 'UPI', 'CARD', 'NETBANKING'];

    const statuses = [
      'new',
      'pending',
      'confirmed',
      'accepted',
      'processing',
      'packing',
      'packed',
      'ready_to_ship',
      'pickup_scheduled',
      'shipped',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'return_requested',
      'return_approved',
      'returned',
      'refunded',
      'ndr',
      'rto',
    ];

    let createdTotal = 0;

    for (const seller of sellers) {
      // Find or assign products to this seller
      let sellerProducts = await Product.find({ seller: seller._id });
      if (sellerProducts.length === 0) {
        sellerProducts = products.slice(0, 3);
        for (const p of sellerProducts) {
          p.seller = seller._id;
          await p.save();
        }
      }

      console.log(`Processing seller "${seller.name || seller.storeName}" (${seller._id}) with ${sellerProducts.length} products...`);

      // Check existing count
      const existing = await SellerOrder.countDocuments({ seller: seller._id });
      if (existing >= 8) {
        console.log(`Seller already has ${existing} orders. Ensuring varied status coverage...`);
      }

      for (let i = 0; i < statuses.length; i++) {
        const st = statuses[i];
        // Check if an order with this status already exists for this seller
        const existsWithStatus = await SellerOrder.findOne({ seller: seller._id, status: st });
        if (existsWithStatus) continue;

        const cust = sampleCustomers[i % sampleCustomers.length];
        const prod = sellerProducts[i % sellerProducts.length] || products[0];
        const courier = couriers[i % couriers.length];
        const pm = paymentMethods[i % paymentMethods.length];
        const qty = (i % 3) + 1;
        const price = prod?.price || 1299;
        const subtotal = price * qty;
        const commissionAmount = Math.round(subtotal * 0.1);
        const netEarnings = subtotal - commissionAmount;

        const dateOffset = (statuses.length - i) * 12; // hours ago
        const orderDate = new Date(Date.now() - dateOffset * 60 * 60 * 1000);

        const orderCode = Math.floor(100000 + Math.random() * 900000);
        const parentOrderId = `BBIN-${orderCode}`;
        const subOrderNum = `SO-${orderCode}-S1`;
        const awb = `AWB${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        const trackingNum = `${courier.substring(0, 3).toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;

        // Tracking history
        const trackingHistory = [
          {
            status: 'Order Placed',
            location: cust.city,
            timestamp: orderDate,
            remarks: 'Customer checked out via mobile application',
          },
        ];

        if (!['new', 'pending'].includes(st)) {
          trackingHistory.push({
            status: 'Order Confirmed',
            location: seller.storeName || 'Jaipur Facility',
            timestamp: new Date(orderDate.getTime() + 15 * 60 * 1000),
            remarks: 'Confirmed and payment verified',
          });
        }

        if (['processing', 'packing', 'packed', 'ready_to_ship', 'pickup_scheduled', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(st)) {
          trackingHistory.push({
            status: 'Packaging Complete',
            location: seller.storeName || 'Jaipur Facility',
            timestamp: new Date(orderDate.getTime() + 60 * 60 * 1000),
            remarks: 'Packed with security tamper-proof bag',
          });
        }

        if (['ready_to_ship', 'pickup_scheduled', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(st)) {
          trackingHistory.push({
            status: 'Shipping Label Generated',
            location: seller.storeName || 'Jaipur Facility',
            timestamp: new Date(orderDate.getTime() + 90 * 60 * 1000),
            remarks: `Courier: ${courier}, AWB: ${awb}`,
          });
        }

        if (['pickup_scheduled', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(st)) {
          trackingHistory.push({
            status: 'Pickup Scheduled',
            location: seller.storeName || 'Jaipur Facility',
            timestamp: new Date(orderDate.getTime() + 120 * 60 * 1000),
            remarks: 'Courier representative assigned for warehouse dispatch',
          });
        }

        if (['shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(st)) {
          trackingHistory.push({
            status: 'Shipped from Hub',
            location: 'Jaipur Logistics Center',
            timestamp: new Date(orderDate.getTime() + 180 * 60 * 1000),
            remarks: `In transit via ${courier}`,
          });
        }

        if (['in_transit', 'out_for_delivery', 'delivered'].includes(st)) {
          trackingHistory.push({
            status: 'In Transit',
            location: `${cust.city} Distribution Center`,
            timestamp: new Date(orderDate.getTime() + 300 * 60 * 1000),
            remarks: 'Reached destination terminal hub',
          });
        }

        if (['out_for_delivery', 'delivered'].includes(st)) {
          trackingHistory.push({
            status: 'Out for Delivery',
            location: cust.city,
            timestamp: new Date(orderDate.getTime() + 360 * 60 * 1000),
            remarks: 'Delivery executive is out for delivery with OTP',
          });
        }

        if (st === 'delivered') {
          trackingHistory.push({
            status: 'Delivered',
            location: cust.address,
            timestamp: new Date(orderDate.getTime() + 400 * 60 * 1000),
            remarks: 'Delivered successfully to customer',
          });
        }

        if (st === 'cancelled') {
          trackingHistory.push({
            status: 'Order Cancelled',
            location: seller.storeName || 'Store',
            timestamp: new Date(orderDate.getTime() + 30 * 60 * 1000),
            remarks: 'Customer requested cancellation before shipment',
          });
        }

        if (['return_requested', 'return_approved', 'returned', 'refunded'].includes(st)) {
          trackingHistory.push({
            status: 'Return Initiated',
            location: cust.city,
            timestamp: new Date(orderDate.getTime() + 500 * 60 * 1000),
            remarks: 'Customer requested return: Size did not fit properly',
          });
        }

        // Create Parent Order
        const parentOrder = await Order.create({
          orderId: parentOrderId,
          orderNumber: parentOrderId,
          user: customerId,
          sellers: [seller._id],
          items: [
            {
              product: prod._id,
              name: prod.productName || prod.name || 'Artisan Product',
              price,
              quantity: qty,
              selectedVariant: { size: 'Standard', color: 'Natural' },
              image: prod.images?.[0] || '',
            },
          ],
          deliveryAddress: {
            fullName: cust.name,
            mobileNumber: cust.phone,
            phone: cust.phone,
            addressLine1: cust.address,
            city: cust.city,
            state: cust.state,
            pinCode: cust.pin,
            addressType: 'Home',
          },
          shippingAddress: {
            fullName: cust.name,
            phone: cust.phone,
            addressLine1: cust.address,
            city: cust.city,
            state: cust.state,
            pinCode: cust.pin,
            addressType: 'Home',
          },
          subtotal,
          totalAmount: subtotal,
          paymentMethod: pm,
          paymentStatus: pm === 'COD' && st !== 'delivered' ? 'Pending' : 'Completed',
          orderStatus: st === 'delivered' ? 'Delivered' : st === 'cancelled' ? 'Cancelled' : ['shipped', 'in_transit', 'out_for_delivery'].includes(st) ? 'Shipped' : 'Confirmed',
          createdAt: orderDate,
        });

        // Create SellerOrder
        const so = await SellerOrder.create({
          subOrderNumber: subOrderNum,
          order: parentOrder._id,
          orderNumber: parentOrderId,
          seller: seller._id,
          user: customerId,
          customerName: cust.name,
          customerPhone: cust.phone,
          customerEmail: cust.email,
          shippingAddress: {
            fullName: cust.name,
            mobileNumber: cust.phone,
            addressLine1: cust.address,
            city: cust.city,
            state: cust.state,
            pinCode: cust.pin,
          },
          items: [
            {
              product: prod._id,
              name: prod.productName || prod.name || 'Artisan Product',
              sku: prod.sku || `SKU-${orderCode}`,
              price,
              quantity: qty,
              selectedVariant: { size: 'Standard', color: 'Natural' },
              image: prod.images?.[0] || '',
              gstPercentage: 18,
            },
          ],
          itemCount: qty,
          subtotal,
          commissionRate: 10,
          commissionAmount,
          netEarnings,
          status: st,
          paymentMethod: pm,
          paymentStatus: pm === 'COD' && st !== 'delivered' ? 'Pending' : st === 'refunded' ? 'Refunded' : 'Completed',
          shipping: {
            courierName: courier,
            trackingNumber: trackingNum,
            awbNumber: awb,
            weight: 0.8,
            dimensions: { length: 22, width: 16, height: 8 },
            pickupScheduledDate: new Date(orderDate.getTime() + 24 * 60 * 60 * 1000),
            pickupSlot: 'Morning (10:00 AM - 01:00 PM)',
            shippedAt: ['shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(st) ? new Date(orderDate.getTime() + 180 * 60 * 1000) : undefined,
            deliveredAt: st === 'delivered' ? new Date(orderDate.getTime() + 400 * 60 * 1000) : undefined,
            trackingHistory,
          },
          cancelledReason: st === 'cancelled' ? 'Customer requested cancellation before dispatch' : undefined,
          cancelledAt: st === 'cancelled' ? new Date(orderDate.getTime() + 30 * 60 * 1000) : undefined,
          cancellationSource: st === 'cancelled' ? 'customer' : undefined,
          returnReason: ['return_requested', 'return_approved', 'returned', 'refunded'].includes(st) ? 'Size does not fit / color variation from photos' : undefined,
          returnStatus: st === 'return_requested' ? 'requested' : st === 'return_approved' ? 'approved' : st === 'returned' ? 'received' : st === 'refunded' ? 'refunded' : 'none',
          returnDetails: ['return_requested', 'return_approved', 'returned', 'refunded'].includes(st)
            ? {
                reason: 'Size does not fit / color variation from photos',
                requestDate: new Date(orderDate.getTime() + 500 * 60 * 1000),
                approvedDate: ['return_approved', 'returned', 'refunded'].includes(st) ? new Date(orderDate.getTime() + 520 * 60 * 1000) : undefined,
                refundAmount: subtotal,
                status: st === 'return_requested' ? 'requested' : st === 'return_approved' ? 'approved' : st === 'returned' ? 'received' : 'refund_completed',
              }
            : undefined,
          createdAt: orderDate,
        });

        parentOrder.sellerOrders = [so._id];
        await parentOrder.save();

        createdTotal++;
      }
    }

    console.log(`Successfully seeded ${createdTotal} varied status seller orders!`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedOrders();

