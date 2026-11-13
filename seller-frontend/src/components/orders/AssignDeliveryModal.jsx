import React, { useState, useEffect } from 'react';
import {
  Bike,
  X,
  Search,
  Star,
  CheckCircle,
  Phone,
  Truck,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import sellerService from '../../services/sellerService';
import toast from 'react-hot-toast';

export const AssignDeliveryModal = ({ isOpen, onClose, order, onAssigned }) => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [search, setSearch] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchEligiblePartners();
    }
  }, [isOpen]);

  const fetchEligiblePartners = async () => {
    setLoading(true);
    try {
      const res = await sellerService.getEligibleDeliveryPartners();
      const list = res.data?.partners || res.partners || [];
      setPartners(list);
    } catch (err) {
      toast.error('Failed to load eligible delivery partners.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  const filteredPartners = partners.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.vehicleNumber?.toLowerCase().includes(q) ||
      p.vehicleType?.toLowerCase().includes(q)
    );
  });

  const handleAssign = async (partner) => {
    setAssigningId(partner._id);
    try {
      const res = await sellerService.assignDeliveryPartner({
        orderId: order._id,
        deliveryPartnerId: partner._id,
        specialInstructions: specialInstructions.trim() || 'Deliver securely to customer.',
      });

      toast.success(`Order assigned to ${partner.name}! Rider notified in real time.`);
      if (onAssigned) {
        onAssigned(res.data?.order || res.order);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to assign delivery partner.');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <span>Assign Delivery Partner</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-400">
                  Fleet Network
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Order #{order.subOrderNumber || order.orderNumber} • Destination:{' '}
                {order.shippingAddress?.city || 'Jaipur'} ({order.shippingAddress?.pinCode || ''})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Special Instructions Input */}
        <div>
          <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase mb-1">
            Pickup & Delivery Instructions (Optional)
          </label>
          <input
            type="text"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="e.g. Call before arrival, fragile package handle with care"
            className="w-full px-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search delivery partner by name, vehicle, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Partner List */}
        <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
              <span>Finding available approved delivery riders...</span>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-xs bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
              <Bike className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
              <p className="font-bold text-gray-700 dark:text-gray-300">No Online Delivery Partners Found</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
                Please ensure delivery riders are registered, approved by admin, and toggled 'Online' in their Delivery App.
              </p>
              <button
                onClick={fetchEligiblePartners}
                className="mt-3 px-3 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition"
              >
                Refresh Rider List
              </button>
            </div>
          ) : (
            filteredPartners.map((partner) => (
              <div
                key={partner._id}
                className="p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 hover:border-teal-500/50 hover:bg-teal-50/20 dark:hover:bg-teal-950/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-400 font-black text-sm flex items-center justify-center shrink-0">
                    {partner.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-xs text-gray-900 dark:text-white">
                        {partner.name}
                      </h4>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {partner.rating || 4.85}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {partner.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        {partner.vehicleType || 'Bike'} ({partner.vehicleNumber || 'Reg'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold">
                        ● Online & Ready
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {partner.activeTasks ?? 0}/{partner.activeCapacity ?? 3} Active Tasks
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={assigningId === partner._id}
                  onClick={() => handleAssign(partner)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all shrink-0 flex items-center justify-center gap-1.5"
                >
                  {assigningId === partner._id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assign Rider</span>
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer info note */}
        <div className="pt-2 border-t border-gray-100 dark:border-slate-800 text-[11px] text-gray-500 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Only verified, admin-approved delivery partners in active online status are eligible for order assignment.
          </span>
        </div>
      </div>
    </div>
  );
};

export default AssignDeliveryModal;
