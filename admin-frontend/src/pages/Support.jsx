import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  Send,
  User,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Plus,
  Paperclip,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected Ticket Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Create Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    userType: 'customer',
    userId: '',
    orderId: '',
    subject: '',
    category: 'other',
    priority: 'medium',
    message: '',
  });
  const [creating, setCreating] = useState(false);

  // Fetch Tickets
  const fetchTickets = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await api.get('/support/tickets', { params });
      if (res.success && res.data) {
        setTickets(res.data.tickets || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Load ticket details when selected
  const openTicketDetails = async (ticket) => {
    setSelectedTicket(ticket);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/support/tickets/${ticket._id}`);
      if (res.success && res.data) {
        setTicketDetails(res.data);
      } else {
        setTicketDetails(ticket);
      }
    } catch (err) {
      toast.error('Failed to load full ticket thread');
      setTicketDetails(ticket);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Submit reply to ticket
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      setReplying(true);
      const res = await api.post(`/support/tickets/${selectedTicket._id}/reply`, {
        message: replyText.trim(),
      });
      if (res.success && res.data) {
        toast.success('Reply submitted successfully');
        setTicketDetails(res.data);
        setReplyText('');
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  // Update ticket status
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      setStatusUpdating(true);
      const res = await api.patch(`/support/tickets/${selectedTicket._id}/status`, {
        status: newStatus,
      });
      if (res.success && res.data) {
        toast.success(`Ticket status updated to ${newStatus}`);
        setTicketDetails(res.data);
        setSelectedTicket(res.data);
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Handle create ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!createForm.subject || !createForm.message) {
      toast.error('Please enter subject and message');
      return;
    }
    try {
      setCreating(true);
      const payload = { ...createForm };
      if (!payload.orderId) delete payload.orderId;
      if (!payload.userId) delete payload.userId;

      const res = await api.post('/support/tickets', payload);
      if (res.success) {
        toast.success('Support ticket created successfully');
        setShowCreateModal(false);
        setCreateForm({
          userType: 'customer',
          userId: '',
          orderId: '',
          subject: '',
          category: 'other',
          priority: 'medium',
          message: '',
        });
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  // Calculate quick stats
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'open').length;
  const progressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-900/70 p-6 rounded-3xl border border-indigo-100/60 dark:border-indigo-950/40 backdrop-blur-xl shadow-xl shadow-indigo-500/5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-lg shadow-pink-500/20">
              <LifeBuoy className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Support & Grievance Center
              </h1>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Manage and resolve customer, seller, and delivery boy complaints & inquiries
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => fetchTickets()}
            disabled={refreshing}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-pink-500/25 transition">
            <Plus className="w-4 h-4" />
            <span>Log New Ticket</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Total Tickets</span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <LifeBuoy className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">{totalCount}</div>
          <p className="text-[11px] font-semibold text-gray-500 mt-1">Logged in system</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-500 uppercase tracking-wider">Open / New</span>
            <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{openCount}</div>
          <p className="text-[11px] font-semibold text-gray-500 mt-1">Awaiting admin review</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-500 uppercase tracking-wider">In Investigation</span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{progressCount}</div>
          <p className="text-[11px] font-semibold text-gray-500 mt-1">Assigned & in progress</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-500 uppercase tracking-wider">Resolved</span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{resolvedCount}</div>
          <p className="text-[11px] font-semibold text-gray-500 mt-1">Successfully closed</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ticket ID, subject, customer name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs font-medium text-gray-900 dark:text-white border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 outline-none">
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 outline-none">
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-slate-800/50 text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider border-b border-gray-100 dark:border-slate-800">
              <tr>
                <th className="py-4 px-6">Ticket ID</th>
                <th className="py-4 px-6">User / Raised By</th>
                <th className="py-4 px-6">Subject & Category</th>
                <th className="py-4 px-6">Priority</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Created / Updated</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-gray-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-bold">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <LifeBuoy className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
                    No tickets found matching your criteria.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => {
                  const priorityColor =
                    ticket.priority === 'urgent'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-200'
                      : ticket.priority === 'high'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200'
                      : ticket.priority === 'medium'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200'
                      : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 border-gray-200';

                  const statusColor =
                    ticket.status === 'open'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200'
                      : ticket.status === 'in_progress'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200'
                      : ticket.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';

                  return (
                    <tr
                      key={ticket._id}
                      className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => openTicketDetails(ticket)}>
                      <td className="py-4 px-6 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {ticket.ticketId || ticket._id?.slice(-8)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-gray-600 dark:text-gray-300">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">
                              {ticket.user?.name || ticket.userName || 'Anonymous User'}
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase font-black tracking-wider">
                              {ticket.userType || 'Customer'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900 dark:text-white truncate max-w-xs">
                          {ticket.subject}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          Category: {ticket.category || 'General'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${priorityColor}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusColor}`}>
                          {ticket.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-[11px]">
                        <div>{new Date(ticket.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-gray-400">{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openTicketDetails(ticket);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-black hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition inline-flex items-center gap-1">
                          <span>Respond</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-slate-800 text-xs text-gray-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 disabled:opacity-40">
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Details & Discussion Thread Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-slate-800 shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">
                    {ticketDetails?.ticketId || selectedTicket.ticketId || selectedTicket._id?.slice(-8)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      ticketDetails?.status === 'open'
                        ? 'bg-rose-100 text-rose-700'
                        : ticketDetails?.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                    {ticketDetails?.status || selectedTicket.status}
                  </span>
                </div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white mt-1">
                  {ticketDetails?.subject || selectedTicket.subject}
                </h2>
              </div>
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setTicketDetails(null);
                }}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Messages Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {detailsLoading ? (
                <div className="py-12 text-center text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  Loading conversation thread...
                </div>
              ) : (
                <>
                  {/* Ticket Meta Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/40 border border-indigo-100/50 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">User Type</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 uppercase">
                        {ticketDetails?.userType || 'Customer'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">User Details</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {ticketDetails?.user?.name || ticketDetails?.userName || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">Category</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">
                        {ticketDetails?.category || 'General'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">Priority</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">
                        {ticketDetails?.priority || 'Normal'}
                      </span>
                    </div>
                  </div>

                  {/* Messages Timeline */}
                  <div className="space-y-4 pt-2">
                    {/* Initial Ticket Description */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="flex-1 bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-gray-900 dark:text-white">
                            {ticketDetails?.user?.name || 'Customer'} (Requester)
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {ticketDetails?.createdAt ? new Date(ticketDetails.createdAt).toLocaleString() : ''}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                          {ticketDetails?.description || ticketDetails?.message || selectedTicket.subject}
                        </p>
                      </div>
                    </div>

                    {/* Replies array */}
                    {ticketDetails?.messages?.map((msg, idx) => {
                      const isAdmin = msg.senderType === 'admin' || msg.senderType === 'support';
                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isAdmin
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                            }`}>
                            {isAdmin ? <LifeBuoy className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div
                            className={`flex-1 p-4 rounded-2xl text-xs leading-relaxed max-w-xl ${
                              isAdmin
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-tl-none border border-gray-100 dark:border-slate-700'
                            }`}>
                            <div className="flex items-center justify-between mb-1 text-[10px] opacity-80">
                              <span className="font-bold">
                                {isAdmin ? 'Support Team' : msg.senderName || 'User'}
                              </span>
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="whitespace-pre-line">{msg.message}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Quick Status Control & Reply Input Box */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 space-y-3">
              {/* Quick Status Bar */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-gray-500">Update Status:</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={statusUpdating || ticketDetails?.status === 'in_progress'}
                    onClick={() => handleUpdateStatus('in_progress')}
                    className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 font-bold hover:bg-amber-500/20 transition disabled:opacity-40">
                    Mark In-Progress
                  </button>
                  <button
                    disabled={statusUpdating || ticketDetails?.status === 'resolved'}
                    onClick={() => handleUpdateStatus('resolved')}
                    className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold hover:bg-emerald-500/20 transition disabled:opacity-40">
                    Mark Resolved
                  </button>
                  <button
                    disabled={statusUpdating || ticketDetails?.status === 'closed'}
                    onClick={() => handleUpdateStatus('closed')}
                    className="px-3 py-1 rounded-xl bg-slate-500/10 text-slate-600 font-bold hover:bg-slate-500/20 transition disabled:opacity-40">
                    Close Ticket
                  </button>
                </div>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type an official resolution or reply message..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={replying || !replyText.trim()}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition disabled:opacity-50">
                  <Send className="w-3.5 h-3.5" />
                  <span>{replying ? 'Sending...' : 'Send'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create New Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-slate-800 shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">Log Support / Complaint Ticket</h2>
                <p className="text-xs text-gray-500">Record a phone call or manual grievance in the system</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">User Type</label>
                  <select
                    value={createForm.userType}
                    onChange={(e) => setCreateForm({ ...createForm, userType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs font-semibold border border-gray-200 dark:border-slate-700">
                    <option value="customer">Customer</option>
                    <option value="seller">Seller</option>
                    <option value="delivery_partner">Delivery Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs font-semibold border border-gray-200 dark:border-slate-700">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">Category</label>
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs font-semibold border border-gray-200 dark:border-slate-700">
                  <option value="order_issue">Order / Delivery Issue</option>
                  <option value="refund">Refund / Payment Dispute</option>
                  <option value="seller_issue">Merchant Product Issue</option>
                  <option value="app_bug">App / Tech Glitch</option>
                  <option value="other">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Brief summary of the issue..."
                  value={createForm.subject}
                  onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs border border-gray-200 dark:border-slate-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Detailed Complaint / Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter full details of the customer/partner grievance..."
                  value={createForm.message}
                  onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs border border-gray-200 dark:border-slate-700"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-pink-500/20 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;

