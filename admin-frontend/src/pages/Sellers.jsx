import React, { useState, useEffect, useCallback } from 'react';
import {
  Store,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  Phone,
  Mail,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Ban,
  Building2,
  Calendar,
  User,
  Percent,
  Download,
  CreditCard,
  FileText,
  MapPin,
  ExternalLink,
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

  // Franchise list for assigning
  const [franchises, setFranchises] = useState([]);

  // Detail Modal
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection Reason Modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [sellerToReject, setSellerToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');

  // Commission Override Modal
  const [commissionModalOpen, setCommissionModalOpen] = useState(false);
  const [sellerForCommission, setSellerForCommission] = useState(null);
  const [customCommission, setCustomCommission] = useState(10);
  const [savingCommission, setSavingCommission] = useState(false);

  // Franchise Assignment Modal
  const [franchiseModalOpen, setFranchiseModalOpen] = useState(false);
  const [sellerForFranchise, setSellerForFranchise] = useState(null);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState('');
  const [assigningFranchise, setAssigningFranchise] = useState(false);

  const fetchSellers = useCallback(async () => {
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
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  // Load franchises
  useEffect(() => {
    const fetchFranchises = async () => {
      try {
        const res = await api.get('/franchises');
        if (res.data?.franchises) {
          setFranchises(res.data.franchises);
        }
      } catch (err) {
        // non-blocking
      }
    };
    fetchFranchises();
  }, []);

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
      toast.success(`Seller status updated to "${newStatus.toUpperCase()}" successfully`);
      if (isDetailOpen) setIsDetailOpen(false);
      if (isRejectModalOpen) {
        setIsRejectModalOpen(false);
        setSellerToReject(null);
        setRejectionReason('');
      }
      fetchSellers();
    } catch (err) {
      toast.error(err.message || 'Failed to update seller status');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (seller) => {
    setSellerToReject(seller);
    setRejectionReason('');
    setRejectionError('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setRejectionError('Please provide a mandatory reason for rejecting this seller.');
      return;
    }
    if (!sellerToReject) return;
    handleUpdateStatus(sellerToReject._id, 'rejected', rejectionReason.trim());
  };

  // Commission Override
  const openCommissionModal = (seller) => {
    setSellerForCommission(seller);
    setCustomCommission(seller.commissionRate ?? seller.commissionPercentage ?? 10);
    setCommissionModalOpen(true);
  };

  const handleSaveCommission = async (e) => {
    e.preventDefault();
    if (!sellerForCommission) return;
    try {
      setSavingCommission(true);
      await api.patch(`/sellers/${sellerForCommission._id}/commission`, {
        commissionRate: Number(customCommission),
      });
      toast.success('Seller commission updated successfully');
      setCommissionModalOpen(false);
      fetchSellers();
    } catch (err) {
      toast.error(err.message || 'Failed to update commission');
    } finally {
      setSavingCommission(false);
    }
  };

  // Franchise Assignment
  const openFranchiseModal = (seller) => {
    setSellerForFranchise(seller);
    setSelectedFranchiseId(seller.franchise?._id || seller.franchise || '');
    setFranchiseModalOpen(true);
  };

  const handleAssignFranchise = async (e) => {
    e.preventDefault();
    if (!sellerForFranchise || !selectedFranchiseId) {
      toast.error('Please choose a franchise');
      return;
    }
    try {
      setAssigningFranchise(true);
      await api.post(`/franchises/${selectedFranchiseId}/assign-seller`, {
        sellerId: sellerForFranchise._id,
      });
      toast.success('Seller assigned to franchise hub successfully');
      setFranchiseModalOpen(false);
      fetchSellers();
    } catch (err) {
      toast.error(err.message || 'Failed to assign franchise');
    } finally {
      setAssigningFranchise(false);
    }
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('appecom_admin_token');
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1/admin';
    fetch(`${baseUrl}/reports/export-csv?type=sellers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sellers_directory_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Vendors CSV exported');
      })
      .catch(() => toast.error('Failed to export CSV'));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            APPROVED
          </span>
        );
      case 'pending':
      case 'pending_verification':
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            PENDING
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/60 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            REJECTED
          </span>
        );
      case 'suspended':
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Ban className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            SUSPENDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            {status?.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/70 dark:bg-slate-900/70 p-6 rounded-3xl border border-indigo-100/60 dark:border-indigo-950/40 backdrop-blur-xl shadow-xl shadow-indigo-500/5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Store size={22} />
            </div>
            <span>Vendor Approvals & Stores Hub</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Inspect new merchant onboarding applications, review KYC, assign franchises, or configure commissions ({totalCount} vendors registered)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchSellers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-950/60 text-xs font-black text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700 transition shadow-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Vendors</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel p-4 rounded-3xl border border-indigo-100 dark:border-indigo-950/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
          <input
            type="text"
            placeholder="Search by vendor name, store, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-indigo-50/50 dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-950/60 rounded-2xl text-xs font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </form>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { label: 'All Vendors', value: 'all', activeGrad: 'from-blue-600 to-indigo-600' },
            { label: 'Pending Approval', value: 'pending', activeGrad: 'from-amber-500 to-orange-500' },
            { label: 'Approved', value: 'approved', activeGrad: 'from-emerald-500 to-teal-500' },
            { label: 'Rejected', value: 'rejected', activeGrad: 'from-rose-500 to-pink-600' },
            { label: 'Suspended', value: 'suspended', activeGrad: 'from-slate-600 to-slate-800' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                statusFilter === tab.value
                  ? `bg-gradient-to-r ${tab.activeGrad} text-white shadow-md shadow-black/10 ring-1 ring-white/20`
                  : 'bg-gray-100 dark:bg-slate-800/80 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sellers Data Table */}
      <div className="glass-panel rounded-3xl border border-indigo-100 dark:border-indigo-950/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                <th className="py-4 px-6 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Seller & Store Name
                </th>
                <th className="py-4 px-6 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Contact Info
                </th>
                <th className="py-4 px-6 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Franchise
                </th>
                <th className="py-4 px-6 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Commission
                </th>
                <th className="py-4 px-6 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="py-4 px-6 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Fetching registered sellers from database...
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
                sellers.map((s) => {
                  const isPending =
                    s.status === 'pending' ||
                    s.status === 'pending_verification' ||
                    s.status === 'under_review';
                  const isApproved = s.status === 'approved';
                  const isSuspended = s.status === 'suspended' || s.status === 'blocked';
                  const isRejected = s.status === 'rejected';

                  return (
                    <tr
                      key={s._id}
                      className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-indigo-500" />
                          <span>{s.businessName || s.storeName || s.name}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          <span>{s.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{s.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{s.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {s.franchise ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200">
                            {s.franchise.name || 'Assigned'}
                          </span>
                        ) : (
                          <button
                            onClick={() => openFranchiseModal(s)}
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                            + Assign Area
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => openCommissionModal(s)}
                          className="inline-flex items-center gap-1 text-xs font-black text-amber-600 hover:underline">
                          <Percent className="w-3 h-3" />
                          <span>{s.commissionRate ?? s.commissionPercentage ?? 10}%</span>
                        </button>
                      </td>
                      <td className="py-4 px-6">{getStatusBadge(s.status)}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {(isPending || isSuspended || isRejected) && (
                            <button
                              onClick={() => handleUpdateStatus(s._id, 'approved')}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition disabled:opacity-50"
                              title="Approve Seller">
                              Approve
                            </button>
                          )}

                          {(isPending || (!isRejected && !isSuspended)) && (
                            <button
                              onClick={() => openRejectModal(s)}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-sm transition disabled:opacity-50"
                              title="Reject Application">
                              Reject
                            </button>
                          )}

                          {isApproved && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(
                                  s._id,
                                  'suspended',
                                  'Account suspended by administrator'
                                )
                              }
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-bold text-[11px] shadow-sm transition disabled:opacity-50"
                              title="Suspend Seller">
                              Suspend
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedSeller(s);
                              setIsDetailOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                            title="Inspect KYC Documents">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seller KYC & Profile Drawer */}
      {isDetailOpen && selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-100 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 font-bold">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-gray-900 dark:text-white">
                    {selectedSeller.businessName || selectedSeller.storeName || selectedSeller.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">ID: {selectedSeller._id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* KYC & Verification Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                Compliance & KYC Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 dark:bg-slate-800/50 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">GSTIN Number</span>
                  <p className="font-mono font-bold text-gray-900 dark:text-white">
                    {selectedSeller.gstNumber || selectedSeller.gstin || 'Not Provided'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">PAN Card</span>
                  <p className="font-mono font-bold text-gray-900 dark:text-white">
                    {selectedSeller.panNumber || 'Not Provided'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-3.5 rounded-2xl space-y-1 col-span-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Registered Store Address</span>
                  <p className="text-gray-800 dark:text-gray-200">
                    {selectedSeller.address?.addressLine || selectedSeller.addressLine || 'Central Market'},{' '}
                    {selectedSeller.address?.city || selectedSeller.city || 'Mumbai'},{' '}
                    {selectedSeller.address?.state || selectedSeller.state || 'Maharashtra'} -{' '}
                    {selectedSeller.address?.pinCode || selectedSeller.pincode || '400001'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-3.5 rounded-2xl space-y-1 col-span-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Bank Settlement Details</span>
                  <p className="font-mono font-bold text-gray-900 dark:text-white">
                    A/C: {selectedSeller.bankDetails?.accountNumber || 'XXXXXXXXXXXX'} | IFSC:{' '}
                    {selectedSeller.bankDetails?.ifscCode || 'HDFC0001234'} ({selectedSeller.bankDetails?.bankName || 'HDFC Bank'})
                  </p>
                </div>
              </div>
            </div>

            {selectedSeller.rejectionReason && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-3.5 rounded-2xl text-xs text-rose-700 dark:text-rose-400">
                <span className="font-bold">Rejection Reason:</span> {selectedSeller.rejectionReason}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
              {selectedSeller.status !== 'approved' && (
                <button
                  onClick={() => handleUpdateStatus(selectedSeller._id, 'approved')}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md">
                  ✓ Approve Seller
                </button>
              )}
              {selectedSeller.status === 'approved' && (
                <button
                  onClick={() =>
                    handleUpdateStatus(
                      selectedSeller._id,
                      'suspended',
                      'Account suspended by administrator'
                    )
                  }
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs shadow-md">
                  Suspend Account
                </button>
              )}
              {selectedSeller.status !== 'rejected' && (
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    openRejectModal(selectedSeller);
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md">
                  ✕ Reject Application
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Rejection Reason Dialog Modal */}
      {isRejectModalOpen && sellerToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-gray-100 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                  Reject Seller Registration
                </h3>
              </div>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              You are rejecting <span className="font-bold text-gray-900 dark:text-white">{sellerToReject.name}</span> ({sellerToReject.email}).
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (rejectionError) setRejectionError('');
                  }}
                  placeholder="e.g. Incomplete GST credentials or invalid store verification."
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-rose-500"
                />
                {rejectionError && (
                  <p className="mt-1 text-[11px] text-rose-600 font-semibold">{rejectionError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-gray-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-50">
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Commission Override Modal */}
      {commissionModalOpen && sellerForCommission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-gray-100 dark:border-slate-800 shadow-2xl">
            <h3 className="font-black text-base text-gray-900 dark:text-white mb-1">
              Store Commission Override
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Adjust marketplace fee for {sellerForCommission.businessName || sellerForCommission.name}
            </p>

            <form onSubmit={handleSaveCommission} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Commission Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={customCommission}
                  onChange={(e) => setCustomCommission(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCommissionModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-gray-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCommission}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-md disabled:opacity-50">
                  {savingCommission ? 'Saving...' : 'Save Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Franchise Assignment Modal */}
      {franchiseModalOpen && sellerForFranchise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-gray-100 dark:border-slate-800 shadow-2xl">
            <h3 className="font-black text-base text-gray-900 dark:text-white mb-1">
              Assign to Franchise Hub
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Connect {sellerForFranchise.businessName || sellerForFranchise.name} to a regional franchise
            </p>

            <form onSubmit={handleAssignFranchise} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Regional Franchise
                </label>
                <select
                  value={selectedFranchiseId}
                  onChange={(e) => setSelectedFranchiseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 outline-none"
                  required>
                  <option value="">-- Choose Franchise --</option>
                  {franchises.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.serviceAreaCity || 'Area'}) - {f.commissionPercentage}%
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFranchiseModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-gray-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningFranchise}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md disabled:opacity-50">
                  {assigningFranchise ? 'Assigning...' : 'Assign Hub'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sellers;
