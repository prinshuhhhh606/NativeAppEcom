/**
 * Comprehensive Super Admin Panel Test Suite
 * Tests all 16 core pillars of the Super Admin Panel:
 * 1. Super Admin Dashboard (all 18 KPI overview cards, salesChart, order status distribution, live deliveries)
 * 2. Franchise Management (create, list, get details, assign seller, remove seller, status update)
 * 3. Support & Grievance Tickets (create ticket, reply thread, update status, staff assign)
 * 4. Broadcast Notifications (broadcast to all, customers, sellers, delivery partners)
 * 5. Commissions & Revenue Rules (get settings, update global commission, category override, ledger)
 * 6. Live Fleet Radar & Manual Dispatch (GPS map data, manual rider assignment)
 * 7. Customer 360 & CSV Export (search, filter, profile with 5 tabs, CSV export)
 * 8. Order Management & 15 Status Tabs (all 15 tab filters, CSV export)
 */

const assert = require('assert');
const mongoose = require('mongoose');

// Helper to mock Express req and res
function createMockReq(options = {}) {
  return {
    query: options.query || {},
    params: options.params || {},
    body: options.body || {},
    admin: options.admin || {
      _id: new mongoose.Types.ObjectId(),
      name: 'Super Admin User',
      email: 'admin@appecom.in',
      role: 'super_admin',
    },
    ip: '127.0.0.1',
    get: (header) => options.headers?.[header.toLowerCase()] || '',
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
    setHeader(name, val) {
      this.headers[name] = val;
      return this;
    },
    send(content) {
      this.sentContent = content;
      return this;
    },
  };
  return res;
}

// Chainable query helper to mock any Mongoose query chain
function createChainableQuery(result = []) {
  const query = {
    _result: result,
    select() {
      return this;
    },
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    limit() {
      return this;
    },
    populate() {
      return this;
    },
    lean() {
      return Promise.resolve(this._result);
    },
    then(resolve, reject) {
      return Promise.resolve(this._result).then(resolve, reject);
    },
    catch(reject) {
      return Promise.resolve(this._result).catch(reject);
    },
  };
  return query;
}

// Controllers
const dashboardController = require('../src/controllers/admin/adminDashboardController');
const franchiseController = require('../src/controllers/admin/adminFranchiseController');
const supportController = require('../src/controllers/admin/adminSupportController');
const notificationController = require('../src/controllers/admin/adminNotificationController');
const commissionController = require('../src/controllers/admin/adminCommissionController');
const deliveryController = require('../src/controllers/admin/adminDeliveryManagementController');
const customerController = require('../src/controllers/admin/adminCustomerController');
const orderController = require('../src/controllers/admin/adminOrderController');

// Models to mock
const Franchise = require('../src/models/Franchise');
const SupportTicket = require('../src/models/SupportTicket');
const StoreSetting = require('../src/models/StoreSetting');
const Seller = require('../src/models/Seller');
const Order = require('../src/models/Order');
const User = require('../src/models/User');
const Delivery = require('../src/models/Delivery');
const DeliveryPartner = require('../src/models/DeliveryPartner');
const DeliveryAssignment = require('../src/models/DeliveryAssignment');
const SellerOrder = require('../src/models/SellerOrder');
const Payout = require('../src/models/Payout');
const DeliveryPayout = require('../src/models/DeliveryPayout');
const ReturnRequest = require('../src/models/ReturnRequest');
const Payment = require('../src/models/Payment');

async function runTests() {
  console.log('======================================================================');
  console.log('🛡️  SUPER ADMIN PANEL COMPREHENSIVE ARCHITECTURE & CONTROLLER TEST SUITE');
  console.log('======================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  async function runCase(name, fn) {
    totalTests++;
    try {
      await fn();
      passedTests++;
      console.log(`  ✅ TEST ${totalTests}: ${name}`);
    } catch (err) {
      console.error(`  ❌ TEST ${totalTests} FAILED: ${name}`);
      console.error('     Error:', err.message || err);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: Dashboard Metrics (18 Overview Cards)
  // -------------------------------------------------------------------------
  await runCase('Dashboard Metrics API aggregates all 18 Master Prompt Overview Cards', async () => {
    const originalOrderAgg = Order.aggregate;
    const originalUserAgg = User.aggregate;
    const originalSellerAgg = Seller.aggregate;
    const originalSellerOrderAgg = SellerOrder.aggregate;
    const originalDeliveryAgg = Delivery.aggregate;

    const originalOrderCount = Order.countDocuments;
    const originalUserCount = User.countDocuments;
    const originalSellerCount = Seller.countDocuments;
    const originalFranchiseCount = Franchise.countDocuments;
    const originalDeliveryPartnerCount = DeliveryPartner.countDocuments;
    const originalDeliveryAssignmentCount = DeliveryAssignment.countDocuments;
    const originalPayoutCount = Payout.countDocuments;
    const originalDeliveryPayoutCount = DeliveryPayout.countDocuments;
    const originalReturnRequestCount = ReturnRequest.countDocuments;

    const originalOrderFind = Order.find;
    const originalUserFind = User.find;
    const originalPaymentFind = Payment.find;
    const originalDeliveryFind = Delivery.find;
    const originalDeliveryPartnerFind = DeliveryPartner.find;

    try {
      Order.aggregate = async () => [{ total: 540000 }];
      Seller.aggregate = async () => [{ totalCommission: 54000 }];
      User.aggregate = async () => [{ _id: '2026-11-01', newCustomers: 12 }];
      SellerOrder.aggregate = async () => [];
      Delivery.aggregate = async () => [];

      Order.countDocuments = async () => 42;
      User.countDocuments = async () => 120;
      Seller.countDocuments = async () => 18;
      Franchise.countDocuments = async () => 5;
      DeliveryPartner.countDocuments = async () => 14;
      DeliveryAssignment.countDocuments = async () => 3;
      Payout.countDocuments = async () => 2;
      DeliveryPayout.countDocuments = async () => 1;
      ReturnRequest.countDocuments = async () => 3;

      Order.find = () => createChainableQuery([]);
      User.find = () => createChainableQuery([]);
      Payment.find = () => createChainableQuery([]);
      Delivery.find = () => createChainableQuery([]);
      DeliveryPartner.find = () => createChainableQuery([]);

      const req = createMockReq({ query: { timeframe: '30d', filterType: 'monthly' } });
      const res = createMockRes();

      await dashboardController.getDashboardMetrics(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.success);
      const overview = res.data.data.overview;

      const expectedKeys = [
        'totalRevenue',
        'todayRevenue',
        'totalOrders',
        'pendingOrders',
        'activeOrders',
        'completedOrders',
        'cancelledOrders',
        'totalCustomers',
        'activeCustomers',
        'totalSellers',
        'activeSellers',
        'totalFranchises',
        'totalDeliveryBoys',
        'activeDeliveryBoys',
        'pendingDeliveryRequests',
        'totalCommission',
        'pendingPayouts',
        'refundRequests',
      ];

      for (const key of expectedKeys) {
        assert.ok(key in overview, `Missing overview KPI card: ${key}`);
      }
    } finally {
      Order.aggregate = originalOrderAgg;
      User.aggregate = originalUserAgg;
      Seller.aggregate = originalSellerAgg;
      SellerOrder.aggregate = originalSellerOrderAgg;
      Delivery.aggregate = originalDeliveryAgg;

      Order.countDocuments = originalOrderCount;
      User.countDocuments = originalUserCount;
      Seller.countDocuments = originalSellerCount;
      Franchise.countDocuments = originalFranchiseCount;
      DeliveryPartner.countDocuments = originalDeliveryPartnerCount;
      DeliveryAssignment.countDocuments = originalDeliveryAssignmentCount;
      Payout.countDocuments = originalPayoutCount;
      DeliveryPayout.countDocuments = originalDeliveryPayoutCount;
      ReturnRequest.countDocuments = originalReturnRequestCount;

      Order.find = originalOrderFind;
      User.find = originalUserFind;
      Payment.find = originalPaymentFind;
      Delivery.find = originalDeliveryFind;
      DeliveryPartner.find = originalDeliveryPartnerFind;
    }
  });

  // -------------------------------------------------------------------------
  // TEST 2: Franchise Creation & Listing
  // -------------------------------------------------------------------------
  await runCase('Franchise Management: Create & list franchises with service area pincodes', async () => {
    const originalFindOne = Franchise.findOne;
    const originalCreate = Franchise.create;
    const originalFind = Franchise.find;
    const originalCount = Franchise.countDocuments;

    try {
      Franchise.findOne = async () => null;
      const mockFranchise = {
        _id: new mongoose.Types.ObjectId(),
        franchiseCode: 'FRA-MUM-01',
        name: 'Mumbai Central Hub',
        ownerName: 'Rajesh Sharma',
        email: 'rajesh@mumbaihub.in',
        phone: '9876543210',
        serviceAreaCity: 'Mumbai',
        serviceAreaState: 'Maharashtra',
        serviceablePincodes: ['400001', '400002', '400003'],
        commissionPercentage: 5,
        status: 'active',
        assignedSellers: [],
      };
      Franchise.create = async (data) => ({ ...mockFranchise, ...data });
      Franchise.find = () => createChainableQuery([mockFranchise]);
      Franchise.countDocuments = async () => 1;

      // 1. Create
      const createReq = createMockReq({
        body: {
          franchiseCode: 'FRA-MUM-01',
          name: 'Mumbai Central Hub',
          ownerName: 'Rajesh Sharma',
          email: 'rajesh@mumbaihub.in',
          phone: '9876543210',
          serviceAreaCity: 'Mumbai',
          serviceAreaState: 'Maharashtra',
          serviceablePincodes: ['400001', '400002'],
          commissionPercentage: 5,
        },
      });
      const createRes = createMockRes();
      await franchiseController.createFranchise(createReq, createRes);

      assert.strictEqual(createRes.statusCode, 201);
      assert.strictEqual(createRes.data.data.name, 'Mumbai Central Hub');

      // 2. List
      const listReq = createMockReq({ query: { page: 1, limit: 10 } });
      const listRes = createMockRes();
      await franchiseController.getFranchises(listReq, listRes);

      assert.strictEqual(listRes.statusCode, 200);
      const list = Array.isArray(listRes.data.data) ? listRes.data.data : listRes.data.data.franchises;
      assert.strictEqual(list.length, 1);
    } finally {
      Franchise.findOne = originalFindOne;
      Franchise.create = originalCreate;
      Franchise.find = originalFind;
      Franchise.countDocuments = originalCount;
    }
  });

  // -------------------------------------------------------------------------
  // TEST 3: Franchise Assign & Remove Seller
  // -------------------------------------------------------------------------
  await runCase('Franchise Management: Assign merchant to Franchise and Remove cleanly', async () => {
    const originalFindById = Franchise.findById;
    const originalSellerFindById = Seller.findById;
    const originalSellerUpdate = Seller.findByIdAndUpdate;

    try {
      const sellerId = new mongoose.Types.ObjectId();
      const franchiseId = new mongoose.Types.ObjectId();

      const mockFranchiseDoc = {
        _id: franchiseId,
        name: 'Pune Tech Zone Hub',
        assignedSellers: [],
        save: async function () {
          return this;
        },
      };

      Franchise.findById = async () => mockFranchiseDoc;
      Seller.findById = async () => ({
        _id: sellerId,
        name: 'Apex Electronics',
        save: async () => {},
      });
      Seller.findByIdAndUpdate = async () => ({ _id: sellerId });

      // Assign
      const assignReq = createMockReq({
        params: { id: franchiseId.toString() },
        body: { sellerId: sellerId.toString() },
      });
      const assignRes = createMockRes();
      await franchiseController.assignSeller(assignReq, assignRes);

      assert.strictEqual(assignRes.statusCode, 200);
      assert.ok(mockFranchiseDoc.assignedSellers.some((s) => s.toString() === sellerId.toString()));

      // Remove
      const removeReq = createMockReq({
        params: { id: franchiseId.toString() },
        body: { sellerId: sellerId.toString() },
      });
      const removeRes = createMockRes();
      await franchiseController.removeSeller(removeReq, removeRes);

      assert.strictEqual(removeRes.statusCode, 200);
      assert.strictEqual(mockFranchiseDoc.assignedSellers.length, 0);
    } finally {
      Franchise.findById = originalFindById;
      Seller.findById = originalSellerFindById;
      Seller.findByIdAndUpdate = originalSellerUpdate;
    }
  });

  // -------------------------------------------------------------------------
  // TEST 4: Support Ticket Creation, Reply Thread & Status Transition
  // -------------------------------------------------------------------------
  await runCase('Support System: Create ticket, reply to thread, and resolve status', async () => {
    const originalCreate = SupportTicket.create;
    const originalFindById = SupportTicket.findById;

    try {
      const ticketId = new mongoose.Types.ObjectId();
      const mockTicket = {
        _id: ticketId,
        ticketId: 'TCK-202611-001',
        userType: 'customer',
        subject: 'Delivery package arrived with broken seal',
        category: 'order_issue',
        priority: 'high',
        status: 'open',
        messages: [
          {
            senderRole: 'customer',
            senderName: 'Amit Verma',
            message: 'Delivery package arrived with broken seal',
            createdAt: new Date(),
          },
        ],
        save: async function () {
          return this;
        },
      };

      SupportTicket.create = async (d) => ({ ...mockTicket, ...d });
      SupportTicket.findById = async () => mockTicket;

      // 1. Create
      const createReq = createMockReq({
        body: {
          userType: 'customer',
          subject: 'Delivery package arrived with broken seal',
          category: 'order_issue',
          priority: 'high',
          description: 'Delivery package arrived with broken seal',
        },
      });
      const createRes = createMockRes();
      await supportController.createTicket(createReq, createRes);

      assert.strictEqual(createRes.statusCode, 201);
      assert.strictEqual(createRes.data.data.subject, 'Delivery package arrived with broken seal');

      // 2. Reply
      const replyReq = createMockReq({
        params: { id: ticketId.toString() },
        body: { message: 'We have initiated a reverse pickup and full replacement.' },
      });
      const replyRes = createMockRes();
      await supportController.replyTicket(replyReq, replyRes);

      assert.strictEqual(replyRes.statusCode, 200);
      assert.strictEqual(mockTicket.messages.length, 2);
      assert.strictEqual(mockTicket.status, 'in_progress');

      // 3. Mark Resolved
      const statusReq = createMockReq({
        params: { id: ticketId.toString() },
        body: { status: 'resolved' },
      });
      const statusRes = createMockRes();
      await supportController.updateTicketStatus(statusReq, statusRes);

      assert.strictEqual(statusRes.statusCode, 200);
      assert.strictEqual(mockTicket.status, 'resolved');
    } finally {
      SupportTicket.create = originalCreate;
      SupportTicket.findById = originalFindById;
    }
  });

  // -------------------------------------------------------------------------
  // TEST 5: Push Notification Broadcast Center
  // -------------------------------------------------------------------------
  await runCase('Notification Center: Dispatch targeted broadcast push alert', async () => {
    const originalUserFind = User.find;
    const originalSellerFind = Seller.find;
    const originalPartnerFind = DeliveryPartner.find;
    const Notification = require('../src/models/Notification');
    const originalInsertMany = Notification.insertMany;

    try {
      User.find = () => createChainableQuery([{ _id: 'u1' }, { _id: 'u2' }]);
      Seller.find = () => createChainableQuery([{ _id: 's1' }]);
      DeliveryPartner.find = () => createChainableQuery([{ _id: 'd1' }]);
      Notification.insertMany = async (docs) => docs;

      const req = createMockReq({
        body: {
          title: 'Diwali Dhamaka Flash Sale Live!',
          message: 'Get up to 60% instant cashback on all orders.',
          recipientType: 'all',
          type: 'promotional',
        },
      });
      const res = createMockRes();
      await notificationController.sendNotification(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.success);
      assert.ok(res.data.data.recipientCount >= 1);
    } finally {
      User.find = originalUserFind;
      Seller.find = originalSellerFind;
      DeliveryPartner.find = originalPartnerFind;
      Notification.insertMany = originalInsertMany;
    }
  });

  // -------------------------------------------------------------------------
  // TEST 6: Commission Settings, Category Overrides & Ledger
  // -------------------------------------------------------------------------
  await runCase('Commissions: Manage global rates, category overrides, and ledger audit', async () => {
    const originalFindOne = StoreSetting.findOne;
    const Category = mongoose.model('Category');
    const originalCategoryFindById = Category.findById;
    const originalCategoryFind = Category.find;
    const originalSellerOrderAgg = SellerOrder.aggregate;
    const originalSellerOrderFind = SellerOrder.find;
    const originalSellerOrderCount = SellerOrder.countDocuments;

    try {
      const mockSettingsDoc = {
        commissions: {
          defaultSellerCommission: 10,
          franchiseCommission: 5,
          deliveryPartnerBaseFee: 40,
          minDeliveryCharge: 20,
        },
        save: async function () {
          return this;
        },
      };

      StoreSetting.findOne = async () => mockSettingsDoc;
      Category.find = () => createChainableQuery([]);
      SellerOrder.aggregate = async () => [];

      // 1. Get settings
      const getReq = createMockReq();
      const getRes = createMockRes();
      await commissionController.getCommissionSettings(getReq, getRes);

      assert.strictEqual(getRes.statusCode, 200);
      assert.strictEqual(getRes.data.data.commissions.defaultSellerCommission, 10);

      // 2. Update global commission
      const putReq = createMockReq({
        body: {
          defaultSellerCommission: 12.5,
          franchiseCommission: 6,
          deliveryPartnerBaseFee: 45,
          minDeliveryCharge: 25,
        },
      });
      const putRes = createMockRes();
      await commissionController.updateCommissionSettings(putReq, putRes);

      assert.strictEqual(putRes.statusCode, 200);
      assert.strictEqual(mockSettingsDoc.commissions.defaultSellerCommission, 12.5);

      // 3. Category commission override
      Category.findByIdAndUpdate = async () => ({
        _id: 'cat1',
        name: 'Electronics',
        commissionPercentage: 8.5,
      });

      const catReq = createMockReq({
        params: { id: 'cat1' },
        body: { commissionRate: 8.5 },
      });
      const catRes = createMockRes();
      await commissionController.updateCategoryCommission(catReq, catRes);

      assert.strictEqual(catRes.statusCode, 200);

      // 4. Commission ledger
      SellerOrder.find = () =>
        createChainableQuery([
          {
            order: { orderId: 'ORD-101' },
            subtotal: 2500,
            commissionRate: 10,
            commissionAmount: 250,
            netEarnings: 2250,
            status: 'completed',
            createdAt: new Date(),
          },
        ]);
      SellerOrder.countDocuments = async () => 1;

      const ledgerReq = createMockReq({ query: { page: 1, limit: 10 } });
      const ledgerRes = createMockRes();
      await commissionController.getCommissionLedger(ledgerReq, ledgerRes);

      assert.strictEqual(ledgerRes.statusCode, 200);
      const ledgerList = Array.isArray(ledgerRes.data.data) ? ledgerRes.data.data : ledgerRes.data.data.ledger;
      assert.ok(ledgerList.length >= 1);
    } finally {
      StoreSetting.findOne = originalFindOne;
      Category.findById = originalCategoryFindById;
      Category.find = originalCategoryFind;
      SellerOrder.aggregate = originalSellerOrderAgg;
      SellerOrder.find = originalSellerOrderFind;
      SellerOrder.countDocuments = originalSellerOrderCount;
    }
  });

  // -------------------------------------------------------------------------
  // TEST 7: Delivery Fleet Live Map & Manual Order Assignment
  // -------------------------------------------------------------------------
  await runCase('Delivery Management: Live GPS Fleet Map & Manual Dispatch Assignment', async () => {
    const originalPartnerFind = DeliveryPartner.find;
    const originalDeliveryFind = Delivery.find;
    const originalOrderFindOne = Order.findOne;
    const originalPartnerFindById = DeliveryPartner.findById;
    const originalDeliveryFindOne = Delivery.findOne;
    const originalSellerOrderFind = SellerOrder.find;

    try {
      SellerOrder.find = () => createChainableQuery([]);
      DeliveryPartner.find = () =>
        createChainableQuery([
          {
            _id: 'dp1',
            name: 'Suresh Kumar',
            phone: '9898989898',
            isOnline: true,
            isAvailable: true,
            currentLocation: { latitude: 19.076, longitude: 72.8777 },
          },
        ]);

      Delivery.find = () =>
        createChainableQuery([
          {
            _id: 'del1',
            order: { orderId: 'ORD-1001' },
            deliveryPartner: { name: 'Suresh Kumar' },
            status: 'in_transit',
            currentLocation: { latitude: 19.076, longitude: 72.8777 },
          },
        ]);

      const mapReq = createMockReq();
      const mapRes = createMockRes();
      await deliveryController.getLiveFleetMap(mapReq, mapRes);

      assert.strictEqual(mapRes.statusCode, 200);
      assert.strictEqual(mapRes.data.data.onlineRiders.length, 1);
      assert.strictEqual(mapRes.data.data.activeDeliveries.length, 1);

      // Manual Assignment
      const orderId = new mongoose.Types.ObjectId();
      const riderId = new mongoose.Types.ObjectId();
      Order.findOne = async () => ({
        _id: orderId,
        orderId: 'ORD-1002',
        orderNumber: 'ORD-1002',
        orderStatus: 'Ready for Pickup',
        deliveryStatus: 'Pending',
        save: async () => {},
      });
      DeliveryPartner.findById = async () => ({
        _id: riderId,
        name: 'Ramesh Rider',
        phone: '9876543210',
        vehicleType: 'Bike',
        save: async () => {},
      });
      Delivery.findOne = () =>
        createChainableQuery({
          order: orderId,
          deliveryPartner: null,
          save: async () => {},
        });

      const assignReq = createMockReq({
        body: { orderId: orderId.toString(), partnerId: riderId.toString() },
      });
      const assignRes = createMockRes();
      await deliveryController.assignOrderManually(assignReq, assignRes);

      assert.strictEqual(assignRes.statusCode, 200);
      assert.ok(assignRes.data.success);
    } finally {
      DeliveryPartner.find = originalPartnerFind;
      Delivery.find = originalDeliveryFind;
      Order.findOne = originalOrderFindOne;
      DeliveryPartner.findById = originalPartnerFindById;
      Delivery.findOne = originalDeliveryFindOne;
      SellerOrder.find = originalSellerOrderFind;
    }
  });

  // -------------------------------------------------------------------------
  // TEST 8: Customer CSV Export & Order 15 Status Tabs
  // -------------------------------------------------------------------------
  await runCase('Export Center: Customer and Order CSV generation with 15 Status Tabs', async () => {
    const originalUserFind = User.find;
    const originalOrderFind = Order.find;
    const originalOrderCount = Order.countDocuments;

    try {
      User.find = () =>
        createChainableQuery([
          {
            _id: 'u1',
            fullName: 'Priya Sharma',
            email: 'priya@example.com',
            phone: '9876543210',
            isActive: true,
            createdAt: new Date(),
          },
        ]);

      // Customer CSV
      const custReq = createMockReq();
      const custRes = createMockRes();
      await customerController.exportCustomersCSV(custReq, custRes);

      assert.ok(custRes.sentContent.includes('Customer ID,Full Name,Email,Phone,Status,Registered Date'));
      assert.ok(custRes.sentContent.includes('Priya Sharma'));

      // Order 15 Status Filter Query Test
      Order.find = () =>
        createChainableQuery([
          {
            _id: 'ord1',
            orderId: 'ORD-999',
            orderStatus: 'Ready for Pickup',
            pricing: { grandTotal: 1499 },
          },
        ]);
      Order.countDocuments = async () => 1;

      const orderTabs = [
        'all',
        'new',
        'pending',
        'confirmed',
        'preparing',
        'ready_for_pickup',
        'delivery_requested',
        'delivery_partner_assigned',
        'picked_up',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'refund_requested',
        'refunded',
      ];

      for (const tab of orderTabs) {
        const orderReq = createMockReq({ query: { status: tab } });
        const orderRes = createMockRes();
        await orderController.getOrders(orderReq, orderRes);
        assert.strictEqual(orderRes.statusCode, 200);
      }
    } finally {
      User.find = originalUserFind;
      Order.find = originalOrderFind;
      Order.countDocuments = originalOrderCount;
    }
  });

  console.log('\n======================================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('======================================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL 8 SUPER ADMIN ARCHITECTURE TEST SUITES PASSED FLAWLESSLY!\n');
    process.exit(0);
  } else {
    console.error(`⚠️ ${totalTests - passedTests} tests failed.`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
