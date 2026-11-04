import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Ban,
  CheckCircle,
  Eye,
  X,
  MapPin,
  Phone,
  Mail,
  ShoppingBag,
  Download,
  Edit,
  CreditCard,
  RotateCcw,
  LifeBuoy,
  Filter,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);

  // Detail Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'addresses', 'payments', 'refunds', 'tickets'

  // Edit Modal
  const [editCustomer, setEditCustomer] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', isActive: true });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/customers', { params });
      setCustomers(res.data || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleToggleStatus = async (customer) => {
    try {
      const res = await api.patch(`/customers/${customer._id}/toggle-status`);
      toast.success(res.message);
      setCustomers((prev) =>
        prev.map((c) => (c._id === customer._id ? { ...c, isActive: !c.isActive } : c))
      );
    } catch (err) {
      toast.error(err.message || 'Failed to toggle customer status');
    }
  };

  const handleOpenDetail = async (customerId) => {
    try {
      const res = await api.get(`/customers/${customerId}`);
      setSelectedCustomer(res.data);
      setActiveTab('orders');
      setIsDetailOpen(true);
    } catch (err) {
      toast.error('Failed to load customer profile');
    }
  };

  const handleOpenEdit = (c) => {
    setEditCustomer(c);
    setEditForm({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      isActive: c.isActive !== false,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editCustomer) return;
    try {
      setSavingEdit(true);
      const res = await api.put(`/customers/${editCustomer._id}`, editForm);
      if (res.success) {
        toast.success('Customer updated successfully');
        setIsEditOpen(false);
        fetchCustomers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update customer');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('appecom_admin_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1/admin';
      const response = await fetch(`${baseUrl}/customers/export/csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to generate CSV export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Customer directory exported to CSV');
    } catch (err) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-900/70 p-6 rounded-3xl border border-indigo-100/60 dark:border-indigo-950/40 backdrop-blur-xl shadow-xl shadow-indigo-500/5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Customer Directory
            </h1>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Shopper profiles, total spending, order history, refund disputes, and account security
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          <button
            onClick={() => fetchCustomers()}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and Status Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, email, or 10-digit mobile number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs font-medium text-gray-900 dark:text-white border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 outline-none">
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="blocked">Blocked Only</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-slate-800/50 text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider border-b border-gray-100 dark:border-slate-800">
              <tr>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Mobile Number</th>
                <th className="py-4 px-6">Joined Date</th>
                <th className="py-4 px-6">Total Orders</th>
                <th className="py-4 px-6">Lifetime Spend</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-gray-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading customers directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <img
                          src={c.avatar || 'https://via.placeholder.com/40'}
                          alt={c.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-gray-200"
                        />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{c.name}</p>
                          <p className="text-[10px] text-gray-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-gray-800 dark:text-gray-200">
                      {c.phone || c.mobile || 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">
                      {c.totalOrders || 0}
                    </td>
                    <td className="py-4 px-6 font-black text-emerald-600">
                      ₹{Number(c.totalSpent || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          c.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200'
                        }`}>
                        {c.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenDetail(c._id)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                          title="View 360 Profile">
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                          title="Edit Customer">
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          title={c.isActive ? 'Block Customer' : 'Unblock Customer'}
                          className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 ${
                            c.isActive ? 'text-gray-400 hover:text-rose-600' : 'text-emerald-600'
                          }`}>
                          {c.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex space-x-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40">
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer 360 Full Modal */}
      {isDetailOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-full shadow-2xl p-6 overflow-y-auto border-l border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <h3 className="font-black text-lg text-gray-900 dark:text-white">
                  Customer 360° Profile
                </h3>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {/* Profile Card */}
              <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100 dark:border-slate-800 flex items-center space-x-4">
                <img
                  src={selectedCustomer.customer?.avatar || 'https://via.placeholder.com/60'}
                  alt={selectedCustomer.customer?.name}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500/40"
                />
                <div>
                  <h4 className="font-black text-lg text-gray-900 dark:text-white">
                    {selectedCustomer.customer?.name}
                  </h4>
                  <p className="text-xs text-gray-500">{selectedCustomer.customer?.email}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {selectedCustomer.customer?.phone || 'No phone registered'}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        selectedCustomer.customer?.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                      {selectedCustomer.customer?.isActive ? 'Active Account' : 'Blocked'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-black text-gray-400">Total Orders</span>
                  <p className="font-black text-xl text-gray-900 dark:text-white mt-1">
                    {selectedCustomer.stats?.totalOrders || 0}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-black text-gray-400">Total Spent</span>
                  <p className="font-black text-xl text-emerald-600 mt-1">
                    ₹{Number(selectedCustomer.stats?.totalSpent || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-black text-gray-400">Cancelled</span>
                  <p className="font-black text-xl text-rose-600 mt-1">
                    {selectedCustomer.stats?.cancelledOrders || 0}
                  </p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-100 dark:border-slate-800 gap-4 text-xs font-bold">
                {[
                  { id: 'orders', label: 'Orders', icon: ShoppingBag },
                  { id: 'addresses', label: 'Addresses', icon: MapPin },
                  { id: 'payments', label: 'Payments', icon: CreditCard },
                  { id: 'refunds', label: 'Refunds', icon: RotateCcw },
                  { id: 'tickets', label: 'Complaints', icon: LifeBuoy },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-2.5 flex items-center gap-1.5 transition ${
                        isActive
                          ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
              <div className="space-y-3">
                {activeTab === 'orders' && (
                  <div className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
                    {selectedCustomer.orders?.length === 0 ? (
                      <p className="text-gray-400 py-4 text-center">No orders placed by customer yet</p>
                    ) : (
                      selectedCustomer.orders?.map((o) => (
                        <div key={o._id} className="py-3 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              #{o.orderId || o.orderNumber}
                            </span>
                            <p className="text-[10px] text-gray-400">
                              {new Date(o.createdAt).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-gray-900 dark:text-white">
                              ₹{o.totalAmount || o.pricing?.grandTotal || 0}
                            </p>
                            <span className="text-[10px] uppercase font-bold text-gray-500">
                              {o.orderStatus}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'addresses' && (
                  <div className="space-y-2">
                    {selectedCustomer.addresses?.length === 0 ? (
                      <p className="text-gray-400 py-4 text-center">No delivery addresses saved</p>
                    ) : (
                      selectedCustomer.addresses?.map((addr) => (
                        <div
                          key={addr._id}
                          className="p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800 text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-800 dark:text-gray-200">
                              {addr.fullName} ({addr.addressType})
                            </span>
                            {addr.isDefault && (
                              <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500">
                            {addr.addressLine1}, {addr.city}, {addr.state} - {addr.pinCode}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">Phone: {addr.phone}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div className="space-y-2">
                    {selectedCustomer.payments?.length === 0 ? (
                      <p className="text-gray-400 py-4 text-center">No transaction records found</p>
                    ) : (
                      selectedCustomer.payments?.map((pay) => (
                        <div
                          key={pay._id}
                          className="p-3 rounded-2xl border border-gray-100 dark:border-slate-800 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-mono text-[11px] text-gray-500">
                              {pay.paymentId || pay._id?.slice(-8)}
                            </span>
                            <p className="text-[10px] text-gray-400 capitalize">{pay.paymentMethod}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-gray-900 dark:text-white">₹{pay.amount}</span>
                            <p className="text-[10px] font-bold text-emerald-600 capitalize">{pay.status}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'refunds' && (
                  <div className="space-y-2">
                    {selectedCustomer.refunds?.length === 0 ? (
                      <p className="text-gray-400 py-4 text-center">No refund claims filed</p>
                    ) : (
                      selectedCustomer.refunds?.map((ref) => (
                        <div
                          key={ref._id}
                          className="p-3 rounded-2xl border border-gray-100 dark:border-slate-800 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-gray-800 dark:text-gray-200">
                              Reason: {ref.reason || 'Order Return'}
                            </span>
                            <p className="text-[10px] text-gray-400">Order: #{ref.order?.orderId}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-rose-600">₹{ref.amount}</span>
                            <p className="text-[10px] font-bold text-gray-500 uppercase">{ref.status}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'tickets' && (
                  <div className="space-y-2">
                    {selectedCustomer.complaints?.length === 0 ? (
                      <p className="text-gray-400 py-4 text-center">No complaints logged</p>
                    ) : (
                      selectedCustomer.complaints?.map((ticket) => (
                        <div
                          key={ticket._id}
                          className="p-3 rounded-2xl border border-gray-100 dark:border-slate-800 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-gray-800 dark:text-gray-200">
                              {ticket.subject}
                            </span>
                            <p className="text-[10px] text-gray-400">
                              Ticket ID: {ticket.ticketId || ticket._id?.slice(-8)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-50 text-indigo-600">
                              {ticket.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="w-full py-3 rounded-2xl bg-gray-900 dark:bg-slate-800 text-white text-xs font-bold">
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditOpen && editCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-800 shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-gray-900 dark:text-white">Edit Customer Profile</h3>
                <p className="text-xs text-gray-500">Update contact and account status</p>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Account Status
                </label>
                <select
                  value={editForm.isActive ? 'active' : 'blocked'}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 outline-none">
                  <option value="active">Active (Access Granted)</option>
                  <option value="blocked">Blocked (Login Suspended)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50">
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
