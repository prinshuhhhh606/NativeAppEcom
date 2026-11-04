import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Store,
  DollarSign,
  MapPin,
  ExternalLink,
  Edit,
  UserCheck,
  UserX,
  Users,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const Franchises = () => {
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [allSellers, setAllSellers] = useState([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFranchise, setSelectedFranchise] = useState(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    serviceAreaCity: '',
    serviceAreaState: '',
    serviceablePincodes: '',
    commissionPercentage: 3.5,
  });

  const [assignSellerId, setAssignSellerId] = useState('');

  useEffect(() => {
    fetchFranchises();
    fetchSellers();
  }, [statusFilter]);

  const fetchFranchises = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/franchises?status=${statusFilter}&search=${search}`);
      setFranchises(res.data || []);
    } catch (err) {
      toast.error('Failed to load franchises');
    } finally {
      setLoading(false);
    }
  };

  const fetchSellers = async () => {
    try {
      const res = await api.get('/sellers?limit=100');
      setAllSellers(res.data?.sellers || res.data || []);
    } catch (err) {}
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFranchises();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const pincodes = form.serviceablePincodes
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      await api.post('/franchises', {
        ...form,
        serviceablePincodes: pincodes,
        commissionPercentage: Number(form.commissionPercentage),
      });
      toast.success('Franchise created successfully!');
      setShowCreateModal(false);
      setForm({
        name: '',
        ownerName: '',
        email: '',
        phone: '',
        serviceAreaCity: '',
        serviceAreaState: '',
        serviceablePincodes: '',
        commissionPercentage: 3.5,
      });
      fetchFranchises();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create franchise');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/franchises/${id}/status`, { status });
      toast.success(`Franchise status updated to ${status}`);
      fetchFranchises();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleAssignSeller = async () => {
    if (!assignSellerId || !selectedFranchise) return;
    try {
      await api.post(`/franchises/${selectedFranchise._id}/assign-seller`, {
        sellerId: assignSellerId,
      });
      toast.success('Seller assigned to franchise successfully');
      setShowAssignModal(false);
      setAssignSellerId('');
      fetchFranchises();
    } catch (err) {
      toast.error('Failed to assign seller');
    }
  };

  const handleRemoveSeller = async (franchiseId, sellerId) => {
    try {
      await api.post(`/franchises/${franchiseId}/remove-seller`, { sellerId });
      toast.success('Seller unassigned from franchise');
      fetchFranchises();
    } catch (err) {
      toast.error('Failed to remove seller');
    }
  };

  const totalFranchises = franchises.length;
  const activeFranchises = franchises.filter((f) => f.status === 'active').length;
  const totalCommission = franchises.reduce((acc, f) => acc + (f.metrics?.totalCommission || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0B0F19] p-6 rounded-2xl border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="text-indigo-600" />
            Franchise Operations & Hubs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage regional franchise partners, territorial service zones, assigned merchants & commissions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:opacity-95 transition">
          <Plus size={18} />
          Create New Franchise
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Franchises</span>
            <Building2 className="text-blue-500" size={18} />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">{totalFranchises}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Active Operations</span>
            <CheckCircle className="text-emerald-500" size={18} />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{activeFranchises}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Commission</span>
            <DollarSign className="text-purple-500" size={18} />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            ₹{totalCommission.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Service Zones</span>
            <MapPin className="text-pink-500" size={18} />
          </div>
          <p className="text-2xl font-black text-pink-600 dark:text-pink-400 mt-2">Pan India</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-[#0B0F19] p-4 rounded-xl border border-gray-100 dark:border-slate-800">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search code, name, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-300">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0B0F19] rounded-2xl border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/75 dark:bg-slate-900/50 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Franchise</th>
                <th className="py-3.5 px-4">Territory / Area</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Assigned Sellers</th>
                <th className="py-3.5 px-4">Commission</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400">
                    Loading franchises...
                  </td>
                </tr>
              ) : franchises.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400">
                    No franchises found matching criteria.
                  </td>
                </tr>
              ) : (
                franchises.map((f) => (
                  <tr key={f._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white block">{f.name}</span>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                          {f.franchiseCode}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-gray-800 dark:text-gray-200 font-medium block">
                        {f.serviceAreaCity}, {f.serviceAreaState}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {f.serviceablePincodes?.length || 0} Pincodes covered
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-gray-800 dark:text-gray-200 block font-medium">{f.ownerName}</span>
                      <span className="text-xs text-gray-500 block">{f.email}</span>
                      <span className="text-xs text-gray-400 font-mono">{f.phone}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => {
                          setSelectedFranchise(f);
                          setShowAssignModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 transition">
                        <Store size={14} />
                        <span>{f.assignedSellers?.length || 0} Sellers</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {f.commissionPercentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                          f.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : f.status === 'suspended'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {f.status !== 'active' ? (
                          <button
                            onClick={() => handleStatusChange(f._id, 'active')}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                            title="Activate / Approve">
                            <UserCheck size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(f._id, 'suspended')}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                            title="Suspend Franchise">
                            <UserX size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Franchise Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0B0F19] rounded-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-slate-800 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Register New Franchise</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Franchise Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jaipur Central Territorial Hub"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Owner Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Owner Full Name"
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="franchise@domain.in"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="Jaipur"
                    value={form.serviceAreaCity}
                    onChange={(e) => setForm({ ...form, serviceAreaCity: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State</label>
                  <input
                    type="text"
                    required
                    placeholder="Rajasthan"
                    value={form.serviceAreaState}
                    onChange={(e) => setForm({ ...form, serviceAreaState: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Covered Pincodes</label>
                  <input
                    type="text"
                    placeholder="302001, 302002"
                    value={form.serviceablePincodes}
                    onChange={(e) => setForm({ ...form, serviceablePincodes: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Commission %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.commissionPercentage}
                    onChange={(e) => setForm({ ...form, commissionPercentage: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition">
                  Register Franchise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Seller Modal */}
      {showAssignModal && selectedFranchise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0B0F19] rounded-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-slate-800 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Merchants in {selectedFranchise.name}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Assign active registered sellers to this territorial franchise for localized order routing.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign New Seller</label>
              <div className="flex gap-2">
                <select
                  value={assignSellerId}
                  onChange={(e) => setAssignSellerId(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl">
                  <option value="">Select a merchant to assign...</option>
                  {allSellers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.storeName || s.ownerName} ({s.email})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignSeller}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition">
                  Assign
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">
                Currently Assigned ({selectedFranchise.assignedSellers?.length || 0})
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedFranchise.assignedSellers?.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">No merchants assigned yet.</p>
                ) : (
                  selectedFranchise.assignedSellers.map((s) => (
                    <div
                      key={s._id}
                      className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white block">{s.storeName}</span>
                        <span className="text-[10px] text-gray-400">{s.phone}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveSeller(selectedFranchise._id, s._id)}
                        className="text-xs text-rose-500 font-bold hover:underline">
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Franchises;

