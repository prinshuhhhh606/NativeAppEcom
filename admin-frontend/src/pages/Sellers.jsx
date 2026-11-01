import React, { useState, useEffect } from 'react';
import {
  Store,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const Sellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSellers();
  }, [page, statusFilter]);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      let query = `/sellers?page=${page}&limit=15`;
      if (statusFilter !== 'all') query += `&status=${statusFilter}`;
      if (search.trim()) query += `&search=${encodeURIComponent(search.trim())}`;

      const res = await api.get(query);
      const list = res.data || res.sellers || [];
      setSellers(list);
      setTotalPages(res.pagination?.totalPages || res.pagination?.pages || 1);
      setTotalCount(res.pagination?.totalCount || list.length);
    } catch (err) {
      toast.error('Failed to load registered sellers from database');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSellers();
  };

  const handleUpdateStatus = async (sellerId, newStatus, reason = '') => {
    setActionLoading(true);
    try {
      await api.patch(`/sellers/${sellerId}/status`, {
        status: newStatus,
        rejectionReason: reason,
      });
      toast.success(`Seller status updated to "${newStatus.replace('_', ' ').toUpperCase()}"`);
      setIsDetailOpen(false);
      fetchSellers();
    } catch (err) {
      toast.error(err.message || 'Failed to update seller status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'pending_verification':
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            Pending Approval
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Store className="w-7 h-7 text-indigo-600" />
            Multi-Vendor Sellers Management
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real-time registered seller records from MongoDB database ({totalCount} vendors total)
          </p>
        </div>

        <button
          onClick={fetchSellers}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Database</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by store, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { label: 'All Vendors', value: 'all' },
            { label: 'Pending Approval', value: 'pending_verification' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.value
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sellers Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Store / Vendor Name
                </th>
                <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Contact Info
                </th>
                <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Location
                </th>
                <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Registered Date
                </th>
                <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Account Status
                </th>
                <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching real seller records from database...
                  </td>
                </tr>
              ) : sellers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    <Store className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No registered sellers found matching criteria.
                  </td>
                </tr>
              ) : (
                sellers.map((s) => (
                  <tr
                    key={s._id}
                    className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {s.storeName || s.businessName}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        Owner: {s.name} • {s.businessType || 'Store'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span>{s.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{s.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      <div>
                        {s.address?.city || 'Jaipur'}, {s.address?.state || 'Rajasthan'}
                      </div>
                      <div className="text-[10px] text-gray-400">PIN: {s.address?.pinCode || '302001'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(s.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {s.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(s._id, 'approved')}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition"
                            title="Approve Seller Store"
                          >
                            Approve
                          </button>
                        )}
                        {s.status !== 'rejected' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                s._id,
                                'rejected',
                                'Verification criteria not met'
                              )
                            }
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] shadow-sm transition"
                            title="Reject Seller Store"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedSeller(s);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                          title="View Full Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seller Profile Drawer / Modal */}
      {isDetailOpen && selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-gray-100 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                    {selectedSeller.storeName || selectedSeller.businessName}
                  </h3>
                  <p className="text-xs text-gray-500">ID: {selectedSeller._id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Owner Name</span>
                <p className="font-bold text-gray-900 dark:text-white">{selectedSeller.name}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Account Status</span>
                <div>{getStatusBadge(selectedSeller.status)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Email Address</span>
                <p className="font-bold text-gray-900 dark:text-white">{selectedSeller.email}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Mobile Phone</span>
                <p className="font-bold text-gray-900 dark:text-white">{selectedSeller.phone}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">PAN / GSTIN</span>
                <p className="font-bold text-gray-900 dark:text-white">
                  {selectedSeller.panNumber || 'Not submitted'} / {selectedSeller.gstin || 'Unregistered'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Warehouse City</span>
                <p className="font-bold text-gray-900 dark:text-white">
                  {selectedSeller.address?.city || 'Jaipur'}, {selectedSeller.address?.pinCode || '302001'}
                </p>
              </div>
            </div>

            {selectedSeller.rejectionReason && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-3 rounded-xl text-xs text-red-700 dark:text-red-400">
                <span className="font-bold">Rejection Reason:</span> {selectedSeller.rejectionReason}
              </div>
            )}

            {/* Approval / Rejection Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
              {selectedSeller.status !== 'approved' && (
                <button
                  onClick={() => handleUpdateStatus(selectedSeller._id, 'approved')}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  ✓ Approve Seller Store
                </button>
              )}
              {selectedSeller.status !== 'rejected' && (
                <button
                  onClick={() =>
                    handleUpdateStatus(
                      selectedSeller._id,
                      'rejected',
                      'Registration documentation does not match criteria'
                    )
                  }
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20"
                >
                  ✕ Reject Application
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sellers;

