const SupportTicket = require('../../models/SupportTicket');
const AuditLog = require('../../models/AuditLog');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

/**
 * 1. Get Support Tickets with Pagination & Filters
 * GET /api/v1/admin/support/tickets
 */
const getTickets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, category, priority, userType, search } = req.query;

  const query = {};
  if (status && status !== 'all') query.status = status;
  if (category && category !== 'all') query.category = category;
  if (priority && priority !== 'all') query.priority = priority;
  if (userType && userType !== 'all') query.userType = userType;

  if (search) {
    query.$or = [
      { ticketId: new RegExp(search, 'i') },
      { subject: new RegExp(search, 'i') },
      { userName: new RegExp(search, 'i') },
      { userEmail: new RegExp(search, 'i') },
      { relatedOrderNumber: new RegExp(search, 'i') },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [tickets, total] = await Promise.all([
    SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('assignedTo', 'name email role')
      .lean(),
    SupportTicket.countDocuments(query),
  ]);

  return successResponse(res, tickets, 'Support tickets retrieved successfully', 200, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    pages: Math.ceil(total / parseInt(limit, 10)),
  });
});

/**
 * 2. Get Single Support Ticket Details
 * GET /api/v1/admin/support/tickets/:id
 */
const getTicketDetails = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id)
    .populate('assignedTo', 'name email role')
    .populate('relatedOrder', 'orderId orderNumber totalAmount orderStatus paymentStatus')
    .lean();

  if (!ticket) {
    return errorResponse(res, 'Support ticket not found', 404);
  }

  return successResponse(res, ticket, 'Support ticket details retrieved successfully');
});

/**
 * 3. Create Support Ticket (Admin on behalf of customer / seller / fleet)
 * POST /api/v1/admin/support/tickets
 */
const createTicket = asyncHandler(async (req, res) => {
  const {
    userType,
    userId,
    userName,
    userEmail,
    userPhone,
    category,
    subject,
    description,
    message,
    priority,
    relatedOrderNumber,
  } = req.body;

  const finalDesc = description || message;
  const finalName = userName || req.body.customerName || req.admin?.name || 'Customer';

  if (!userType || !subject || !finalDesc) {
    return errorResponse(res, 'Please provide userType, subject, and description/message', 400);
  }

  const randNum = Math.floor(10000 + Math.random() * 90000);
  const ticketId = `TKT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${randNum}`;

  const ticket = await SupportTicket.create({
    ticketId,
    userType,
    user: userId || null,
    userName: finalName.trim(),
    userEmail: userEmail ? userEmail.trim().toLowerCase() : '',
    userPhone: userPhone ? userPhone.trim() : '',
    category: category || 'order_issue',
    subject: subject.trim(),
    description: finalDesc.trim(),
    priority: priority || 'medium',
    relatedOrderNumber: relatedOrderNumber ? relatedOrderNumber.trim() : '',
    status: 'open',
    messages: [
      {
        senderRole: 'admin',
        senderName: req.admin?.name || 'Customer Support Admin',
        message: description.trim(),
        createdAt: new Date(),
      },
    ],
  });

  return successResponse(res, ticket, 'Support ticket created successfully', 201);
});

/**
 * 4. Reply to Ticket
 * POST /api/v1/admin/support/tickets/:id/reply
 */
const replyTicket = asyncHandler(async (req, res) => {
  const { message, attachments = [] } = req.body;
  if (!message || !message.trim()) {
    return errorResponse(res, 'Message content is required', 400);
  }

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    return errorResponse(res, 'Support ticket not found', 404);
  }

  const replyMsg = {
    senderRole: 'admin',
    senderName: req.admin?.name || 'Support Executive',
    message: message.trim(),
    attachments,
    createdAt: new Date(),
  };

  ticket.messages.push(replyMsg);
  if (ticket.status === 'open') {
    ticket.status = 'in_progress';
  }
  await ticket.save();

  return successResponse(res, ticket, 'Reply added successfully');
});

/**
 * 5. Update Ticket Status & Resolution
 * PATCH /api/v1/admin/support/tickets/:id/status
 */
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status, resolutionNotes } = req.body;
  if (!['open', 'in_progress', 'waiting_for_response', 'resolved', 'closed'].includes(status)) {
    return errorResponse(res, 'Invalid ticket status', 400);
  }

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    return errorResponse(res, 'Support ticket not found', 404);
  }

  const previousStatus = ticket.status;
  ticket.status = status;
  if (resolutionNotes) ticket.resolutionNotes = resolutionNotes.trim();
  if (status === 'resolved' || status === 'closed') {
    ticket.resolvedAt = new Date();
  }

  await ticket.save();

  // Audit Log
  if (req.admin) {
    try {
      await AuditLog.create({
        admin: req.admin._id,
        adminName: req.admin.name || 'Admin',
        adminEmail: req.admin.email || '',
        action: 'TICKET_STATUS_UPDATED',
        module: 'support',
        targetId: ticket._id.toString(),
        details: { previousStatus, newStatus: status, resolutionNotes },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (e) {}
  }

  return successResponse(res, ticket, `Ticket status updated to ${status}`);
});

/**
 * 6. Assign Ticket to Staff
 * PATCH /api/v1/admin/support/tickets/:id/assign
 */
const assignTicket = asyncHandler(async (req, res) => {
  const { adminId, adminName } = req.body;
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    return errorResponse(res, 'Support ticket not found', 404);
  }

  ticket.assignedTo = adminId || null;
  ticket.assignedToName = adminName || '';
  if (adminId && ticket.status === 'open') {
    ticket.status = 'in_progress';
  }
  await ticket.save();

  return successResponse(res, ticket, 'Ticket assigned successfully');
});

module.exports = {
  getTickets,
  getTicketDetails,
  createTicket,
  replyTicket,
  updateTicketStatus,
  assignTicket,
};
