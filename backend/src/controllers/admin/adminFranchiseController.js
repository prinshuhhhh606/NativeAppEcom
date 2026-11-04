const Franchise = require('../../models/Franchise');
const Seller = require('../../models/Seller');
const Order = require('../../models/Order');
const AuditLog = require('../../models/AuditLog');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

/**
 * 1. List Franchises with Pagination, Search & Filters
 * GET /api/v1/admin/franchises
 */
const getFranchises = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status, city } = req.query;

  const query = {};
  if (status && status !== 'all') {
    query.status = status;
  }
  if (city) {
    query.serviceAreaCity = new RegExp(city, 'i');
  }
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { franchiseCode: new RegExp(search, 'i') },
      { ownerName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [franchises, total] = await Promise.all([
    Franchise.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('assignedSellers', 'storeName ownerName phone email status')
      .lean(),
    Franchise.countDocuments(query),
  ]);

  return successResponse(
    res,
    franchises,
    'Franchises retrieved successfully',
    200,
    {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      pages: Math.ceil(total / parseInt(limit, 10)),
    }
  );
});

/**
 * 2. Get Single Franchise Details
 * GET /api/v1/admin/franchises/:id
 */
const getFranchiseDetails = asyncHandler(async (req, res) => {
  const franchise = await Franchise.findById(req.params.id)
    .populate('assignedSellers', 'storeName ownerName phone email address status businessType')
    .lean();

  if (!franchise) {
    return errorResponse(res, 'Franchise not found', 404);
  }

  return successResponse(res, franchise, 'Franchise details retrieved successfully');
});

/**
 * 3. Create New Franchise
 * POST /api/v1/admin/franchises
 */
const createFranchise = asyncHandler(async (req, res) => {
  const {
    name,
    ownerName,
    email,
    phone,
    serviceAreaCity,
    serviceAreaState,
    serviceablePincodes,
    commissionPercentage,
    bankDetails,
    address,
  } = req.body;

  if (!name || !ownerName || !email || !phone || !serviceAreaCity || !serviceAreaState) {
    return errorResponse(res, 'Please provide all required franchise details', 400);
  }

  const existingEmail = await Franchise.findOne({ email: email.toLowerCase().trim() });
  if (existingEmail) {
    return errorResponse(res, 'Franchise with this email already exists', 400);
  }

  // Generate unique franchise code e.g. FRAN-JPR-7821
  const cityCode = serviceAreaCity.substring(0, 3).toUpperCase();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const franchiseCode = `FRAN-${cityCode}-${randNum}`;

  const franchise = await Franchise.create({
    franchiseCode,
    name: name.trim(),
    ownerName: ownerName.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    serviceAreaCity: serviceAreaCity.trim(),
    serviceAreaState: serviceAreaState.trim(),
    serviceablePincodes: Array.isArray(serviceablePincodes) ? serviceablePincodes : [],
    commissionPercentage: commissionPercentage !== undefined ? Number(commissionPercentage) : 3.5,
    bankDetails: bankDetails || {},
    address: address || {},
    status: 'active',
  });

  // Log Audit
  if (req.admin) {
    try {
      await AuditLog.create({
        admin: req.admin._id,
        adminName: req.admin.name || 'Super Admin',
        adminEmail: req.admin.email || '',
        action: 'FRANCHISE_CREATED',
        module: 'franchises',
        targetId: franchise._id.toString(),
        details: { franchiseCode: franchise.franchiseCode, name: franchise.name },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (e) {}
  }

  return successResponse(res, franchise, 'Franchise created successfully', 201);
});

/**
 * 4. Update Franchise Details
 * PUT /api/v1/admin/franchises/:id
 */
const updateFranchise = asyncHandler(async (req, res) => {
  const franchise = await Franchise.findById(req.params.id);
  if (!franchise) {
    return errorResponse(res, 'Franchise not found', 404);
  }

  const {
    name,
    ownerName,
    phone,
    serviceAreaCity,
    serviceAreaState,
    serviceablePincodes,
    commissionPercentage,
    bankDetails,
    address,
  } = req.body;

  if (name) franchise.name = name.trim();
  if (ownerName) franchise.ownerName = ownerName.trim();
  if (phone) franchise.phone = phone.trim();
  if (serviceAreaCity) franchise.serviceAreaCity = serviceAreaCity.trim();
  if (serviceAreaState) franchise.serviceAreaState = serviceAreaState.trim();
  if (serviceablePincodes) franchise.serviceablePincodes = serviceablePincodes;
  if (commissionPercentage !== undefined) franchise.commissionPercentage = Number(commissionPercentage);
  if (bankDetails) franchise.bankDetails = { ...franchise.bankDetails, ...bankDetails };
  if (address) franchise.address = { ...franchise.address, ...address };

  await franchise.save();

  return successResponse(res, franchise, 'Franchise updated successfully');
});

/**
 * 5. Update Franchise Status (approve / suspend / activate / deactivate)
 * PATCH /api/v1/admin/franchises/:id/status
 */
const updateFranchiseStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  if (!['pending', 'active', 'suspended', 'inactive'].includes(status)) {
    return errorResponse(res, 'Invalid franchise status', 400);
  }

  const franchise = await Franchise.findById(req.params.id);
  if (!franchise) {
    return errorResponse(res, 'Franchise not found', 404);
  }

  const previousStatus = franchise.status;
  franchise.status = status;
  await franchise.save();

  // Audit log
  if (req.admin) {
    try {
      await AuditLog.create({
        admin: req.admin._id,
        adminName: req.admin.name || 'Super Admin',
        adminEmail: req.admin.email || '',
        action: 'FRANCHISE_STATUS_UPDATED',
        module: 'franchises',
        targetId: franchise._id.toString(),
        details: { previousStatus, newStatus: status, reason },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (e) {}
  }

  return successResponse(
    res,
    franchise,
    `Franchise status successfully changed to ${status}`
  );
});

/**
 * 6. Assign Seller to Franchise
 * POST /api/v1/admin/franchises/:id/assign-seller
 */
const assignSeller = asyncHandler(async (req, res) => {
  const { sellerId } = req.body;
  if (!sellerId) {
    return errorResponse(res, 'Seller ID is required', 400);
  }

  const [franchise, seller] = await Promise.all([
    Franchise.findById(req.params.id),
    Seller.findById(sellerId),
  ]);

  if (!franchise) return errorResponse(res, 'Franchise not found', 404);
  if (!seller) return errorResponse(res, 'Seller not found', 404);

  // Add to assignedSellers if not already added
  if (!franchise.assignedSellers.includes(seller._id)) {
    franchise.assignedSellers.push(seller._id);
    await franchise.save();
  }

  // Link franchise in seller doc
  seller.franchise = franchise._id;
  await seller.save();

  return successResponse(
    res,
    { franchiseId: franchise._id, sellerId: seller._id },
    `Seller ${seller.storeName || seller.ownerName} successfully assigned to ${franchise.name}`
  );
});

/**
 * 7. Remove Seller from Franchise
 * POST /api/v1/admin/franchises/:id/remove-seller
 */
const removeSeller = asyncHandler(async (req, res) => {
  const { sellerId } = req.body;
  const franchise = await Franchise.findById(req.params.id);
  if (!franchise) return errorResponse(res, 'Franchise not found', 404);

  franchise.assignedSellers = franchise.assignedSellers.filter(
    (id) => id.toString() !== sellerId.toString()
  );
  await franchise.save();

  await Seller.findByIdAndUpdate(sellerId, { $set: { franchise: null } });

  return successResponse(
    res,
    { franchiseId: franchise._id, sellerId },
    'Seller removed from franchise successfully'
  );
});

module.exports = {
  getFranchises,
  getFranchiseDetails,
  createFranchise,
  updateFranchise,
  updateFranchiseStatus,
  assignSeller,
  removeSeller,
};

