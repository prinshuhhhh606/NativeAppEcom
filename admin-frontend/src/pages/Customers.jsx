import React, { useState, useEffect } from 'react';
import { Users, Search, Ban, CheckCircle, Eye, X, MapPin, Phone, Mail, ShoppingBag } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Drawer
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let query = `/customers?page=${page}&limit=15`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(query);
      setCustomers(res.data || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

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
      setIsDetailOpen(true);
    } catch (err) {
      toast.error('Failed to load customer profile');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Registered Pan-India shoppers, lifetime spend, order histories, and account status controls.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchCustomers();
          }}
          className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={17} />
          <input
            type="text"
            placeholder="Search customer by name, email, or 10-digit mobile number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
          />
        </form>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4">Total Orders</th>
                <th className="py-3 px-4">Lifetime Spend</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading customer data...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    No customers found matching search
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 font-mono text-gray-700 dark:text-gray-300">
                      {c.phone || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                      {c.totalOrders || 0}
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-600">
                      ₹{Number(c.totalSpent || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}>
                        {c.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenDetail(c._id)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          title={c.isActive ? 'Block Customer' : 'Unblock Customer'}
                          className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 ${
                            c.isActive ? 'text-gray-400 hover:text-rose-600' : 'text-emerald-600'
                          }`}>
                          {c.isActive ? <Ban size={15} /> : <CheckCircle size={15} />}
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

      {/* Customer Details Drawer */}
      {isDetailOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg h-full shadow-2xl p-6 overflow-y-auto border-l border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                  Customer Profile
                </h3>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              {/* Profile card */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center space-x-4">
                <img
                  src={selectedCustomer.customer?.avatar || 'https://via.placeholder.com/60'}
                  alt={selectedCustomer.customer?.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500/40"
                />
                <div>
                  <h4 className="font-extrabold text-base text-gray-900 dark:text-white">
                    {selectedCustomer.customer?.name}
                  </h4>
                  <p className="text-xs text-gray-500">{selectedCustomer.customer?.email}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {selectedCustomer.customer?.phone || 'No phone registered'}
                  </p>
                </div>
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-gray-100 dark:border-slate-800 text-xs">
                  <span className="text-gray-400">Total Orders</span>
                  <p className="font-black text-lg text-gray-900 dark:text-white">
                    {selectedCustomer.stats?.totalOrders || 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 dark:border-slate-800 text-xs">
                  <span className="text-gray-400">Lifetime Spend</span>
                  <p className="font-black text-lg text-emerald-600">
                    ₹{Number(selectedCustomer.stats?.totalSpent || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Saved Indian Delivery Addresses */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">
                  Saved Delivery Addresses ({selectedCustomer.addresses?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedCustomer.addresses?.map((addr) => (
                    <div
                      key={addr._id}
                      className="p-3 rounded-xl border border-gray-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {addr.fullName} ({addr.addressType})
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500">
                        {addr.addressLine1}, {addr.city}, {addr.state} - {addr.pinCode}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Orders List */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">
                  Recent Orders
                </h4>
                <div className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
                  {selectedCustomer.orders?.slice(0, 5).map((o) => (
                    <div key={o._id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-blue-600">{o.orderId}</span>
                        <p className="text-[10px] text-gray-400">
                          {new Date(o.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{o.pricing?.grandTotal}</p>
                        <span className="text-[10px] text-gray-500">{o.orderStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-slate-800 text-white text-xs font-bold">
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;

