import React, { useState, useEffect } from 'react';
import {
  Bike,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  Phone,
  Mail,
  RefreshCw,
  Truck,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const DeliveryPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, [page, statusFilter]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      let query = `/delivery-partners?page=${page}&limit=15`;
      if (statusFilter !== 'all') query += `&status=${statusFilter}`;
      if (search.trim()) query += `&search=${encodeURIComponent(search.trim())}`;

      const res = await api.get(query);
      const list = res.data || res.partners || [];
      setPartners(list);
      setTotalPages(res.pagination?.totalPages || res.pagination?.pages || 1);
      setTotalCount(res.pagination?.totalCount || list.length);
    } catch (err) {
      toast.error('Failed to load registered delivery partners from database');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPartners();
  };

  const handleUpdateStatus = async (partnerId, newStatus, remarks = '') => {
    setActionLoading(true);
    try {
      await api.patch(`/delivery-partners/${partnerId}/status`, {
        status: newStatus,
        adminRemarks: remarks,
      });
      toast.success(`Delivery Partner status updated to "${newStatus.toUpperCase()}"`);
      setIsDetailOpen(false);
      fetchPartners();
    } catch (err) {
      toast.error(err.message || 'Failed to update partner status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-400">
            <CheckCircle className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'pending':
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
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
            <Bike className="w-7 h-7 text-teal-600" />
            Delivery Fleet Partners Management
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real-time registered delivery rider records from MongoDB database ({totalCount} riders total)
          </p>
        </div>

        <button
          onClick={fetchPartners}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Fleet</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by rider name, phone, license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </form>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { label: 'All Fleet Riders', value: 'all' },
            { label: 'Pending Approval', value: 'pending' },
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
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Partners Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Rider Name
                </th>
                <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Contact Info
                </th>
                <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Vehicle & License
                </th>
                <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Operating Hub
                </th>
                <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  KYC Status
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
                    <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching real delivery partner records from database...
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    <Bike className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No delivery riders found matching criteria.
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr
                    key={p._id}
                    className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-700 dark:text-teal-400 font-black text-xs">
                          {p.name?.slice(0, 2).toUpperCase()}
                        </div>
                        {p.name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{p.phone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span>{p.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {p.vehicleType || 'Bike'} ({p.vehicleNumber || 'N/A'})
                      </div>
                      <div className="text-[10px] text-gray-400">
                        DL: {p.drivingLicenseNumber || 'Not provided'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      <div>{p.address?.city || 'New Delhi'}</div>
                      <div className="text-[10px] text-gray-400">PIN: {p.address?.pinCode || '110001'}</div>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(p.kycStatus)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {p.kycStatus !== 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(p._id, 'approved', 'Verified Fleet Rider')}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] shadow-sm transition"
                            title="Approve Delivery Rider"
                          >
                            Approve
                          </button>
                        )}
                        {p.kycStatus !== 'rejected' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(p._id, 'rejected', 'License verification failed')
                            }
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] shadow-sm transition"
                            title="Reject Delivery Rider"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPartner(p);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                          title="View Rider Profile"
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

      {/* Delivery Rider Modal */}
      {isDetailOpen && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-gray-100 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 font-bold">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                    {selectedPartner.name}
                  </h3>
                  <p className="text-xs text-gray-500">Fleet ID: {selectedPartner._id}</p>
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
                <span className="text-[10px] uppercase font-bold text-gray-400">Vehicle Type & Reg</span>
                <p className="font-bold text-gray-900 dark:text-white">
                  {selectedPartner.vehicleType} ({selectedPartner.vehicleNumber})
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">KYC Status</span>
                <div>{getStatusBadge(selectedPartner.kycStatus)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Driving License</span>
                <p className="font-bold text-gray-900 dark:text-white">
                  {selectedPartner.drivingLicenseNumber}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Mobile Phone</span>
                <p className="font-bold text-gray-900 dark:text-white">{selectedPartner.phone}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Registered Email</span>
                <p className="font-bold text-gray-900 dark:text-white">{selectedPartner.email}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Operating City</span>
                <p className="font-bold text-gray-900 dark:text-white">
                  {selectedPartner.address?.city || 'New Delhi'} ({selectedPartner.address?.pinCode || '110001'})
                </p>
              </div>
            </div>

            {selectedPartner.adminRemarks && (
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-xs text-gray-700 dark:text-gray-300">
                <span className="font-bold">Admin Remarks:</span> {selectedPartner.adminRemarks}
              </div>
            )}

            {/* Approval / Rejection Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
              {selectedPartner.kycStatus !== 'approved' && (
                <button
                  onClick={() => handleUpdateStatus(selectedPartner._id, 'approved', 'Verified Fleet Rider')}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20"
                >
                  ✓ Approve Rider
                </button>
              )}
              {selectedPartner.kycStatus !== 'rejected' && (
                <button
                  onClick={() =>
                    handleUpdateStatus(
                      selectedPartner._id,
                      'rejected',
                      'License or vehicle verification rejected'
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

export default DeliveryPartners;

