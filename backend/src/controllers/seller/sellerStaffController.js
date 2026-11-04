/**
 * Seller Staff & Employee Management Controller
 * Role-based employee access, shift scheduling, and attendance logging
 */
const SellerStaff = require('../../models/SellerStaff');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

/**
 * List all store employees
 * GET /api/v1/seller/staff
 */
const getStaff = asyncHandler(async (req, res) => {
  const staff = await SellerStaff.find({ seller: req.seller._id }).sort({ createdAt: -1 });
  return successResponse(res, staff, 'Store staff fetched successfully');
});

/**
 * Invite / Add store employee
 * POST /api/v1/seller/staff
 */
const inviteStaff = asyncHandler(async (req, res) => {
  const { name, email, phone, role = 'packing_staff', shift, permissions = [] } = req.body || {};

  if (!name || !email) {
    return errorResponse(res, 'Employee name and email are required', 400);
  }

  const existing = await SellerStaff.findOne({ seller: req.seller._id, email: email.toLowerCase().trim() });
  if (existing) {
    return errorResponse(res, 'An employee with this email already exists in your store team', 409);
  }

  // Default permissions based on role
  let defaultPermissions = permissions;
  if (!defaultPermissions || defaultPermissions.length === 0) {
    switch (role) {
      case 'owner':
      case 'manager':
        defaultPermissions = [
          'orders:view',
          'orders:edit',
          'orders:bulk_process',
          'inventory:view',
          'inventory:edit',
          'products:view',
          'products:edit',
          'reports:view',
          'messages:respond',
          'disputes:file',
        ];
        break;
      case 'order_manager':
        defaultPermissions = ['orders:view', 'orders:edit', 'orders:bulk_process', 'messages:respond'];
        break;
      case 'inventory_manager':
        defaultPermissions = ['inventory:view', 'inventory:edit', 'products:view', 'products:edit'];
        break;
      case 'packing_staff':
      default:
        defaultPermissions = ['orders:view', 'inventory:view'];
        break;
    }
  }

  const employee = await SellerStaff.create({
    seller: req.seller._id,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: (phone || '').trim(),
    role,
    shift: shift || 'Regular (10:00 AM - 07:00 PM)',
    permissions: defaultPermissions,
    status: 'active',
  });

  return successResponse(res, employee, 'Employee added to store team successfully', 201);
});

/**
 * Update employee details & permissions
 * PUT /api/v1/seller/staff/:id
 */
const updateStaff = asyncHandler(async (req, res) => {
  const employee = await SellerStaff.findOne({ _id: req.params.id, seller: req.seller._id });
  if (!employee) {
    return errorResponse(res, 'Staff member not found or access denied', 404);
  }

  const { name, phone, role, shift, permissions, status } = req.body || {};

  if (name) employee.name = name.trim();
  if (phone !== undefined) employee.phone = phone.trim();
  if (role) employee.role = role;
  if (shift) employee.shift = shift;
  if (permissions) employee.permissions = permissions;
  if (status) employee.status = status;

  await employee.save();

  return successResponse(res, employee, 'Employee updated successfully');
});

/**
 * Revoke or restore staff access
 * PATCH /api/v1/seller/staff/:id/status
 */
const toggleStaffStatus = asyncHandler(async (req, res) => {
  const employee = await SellerStaff.findOne({ _id: req.params.id, seller: req.seller._id });
  if (!employee) {
    return errorResponse(res, 'Staff member not found', 404);
  }

  const newStatus = employee.status === 'active' ? 'revoked' : 'active';
  employee.status = newStatus;
  await employee.save();

  return successResponse(
    res,
    employee,
    `Staff access ${newStatus === 'active' ? 'restored' : 'revoked'} successfully`
  );
});

/**
 * Record attendance check-in / check-out
 * POST /api/v1/seller/staff/:id/attendance
 */
const recordAttendance = asyncHandler(async (req, res) => {
  const employee = await SellerStaff.findOne({ _id: req.params.id, seller: req.seller._id });
  if (!employee) {
    return errorResponse(res, 'Staff member not found', 404);
  }

  const { status = 'present', notes = '', checkIn, checkOut } = req.body || {};

  employee.attendance.unshift({
    date: new Date(),
    checkIn: checkIn ? new Date(checkIn) : new Date(),
    checkOut: checkOut ? new Date(checkOut) : null,
    status,
    notes,
  });

  // Keep last 30 attendance records
  if (employee.attendance.length > 30) {
    employee.attendance = employee.attendance.slice(0, 30);
  }

  await employee.save();

  return successResponse(res, employee, 'Attendance record updated successfully');
});

/**
 * Remove staff employee
 * DELETE /api/v1/seller/staff/:id
 */
const deleteStaff = asyncHandler(async (req, res) => {
  const employee = await SellerStaff.findOne({ _id: req.params.id, seller: req.seller._id });
  if (!employee) {
    return errorResponse(res, 'Staff member not found', 404);
  }

  await SellerStaff.deleteOne({ _id: employee._id });
  return successResponse(res, { deletedId: employee._id }, 'Employee removed from store team');
});

module.exports = {
  getStaff,
  inviteStaff,
  updateStaff,
  toggleStaffStatus,
  recordAttendance,
  deleteStaff,
};

