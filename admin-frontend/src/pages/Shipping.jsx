import React, { useState, useEffect } from 'react';
import { Truck, Search, MapPin, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const Shipping = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchShipments();
  }, [statusFilter]);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      let query = '/shipping?limit=25';
      if (statusFilter !== 'all') query += `&status=${statusFilter}`;
      const res = await api.get(query);
      setShipments(res.data || []);
    } catch (err) {
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (shipmentId, currentStatus) => {
    const nextStatus = currentStatus === 'Manifested' ? 'In Transit' : 'Delivered';
    try {
      await api.patch(`/shipping/${shipmentId}/status`, {
        status: nextStatus,
        location: 'Pan-India Regional Hub',
        activity: `Status advanced to ${nextStatus}`,
      });
      toast.success(`Shipment updated to ${nextStatus}`);
      fetchShipments();
    } catch (err) {
      toast.error('Failed to update shipment status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Logistics & Shipping
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Shiprocket-compatible dispatch monitoring, courier tracking, and milestone activity updates.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex space-x-1.5 overflow-x-auto text-xs">
        {['all', 'Manifested', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}>
            {st === 'all' ? 'All Shipments' : st}
          </button>
        ))}
      </div>

      {/* Shipments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Tracking AWB</th>
                <th className="py-3 px-4">Courier Partner</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Estimated Delivery</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading logistics data...
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    No shipments found in this view
                  </td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-blue-600">{s.trackingNumber}</p>
                      <p className="text-[10px] text-gray-400">Order: {s.order?.orderId}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">
                      {s.courierName}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                      {s.order?.shippingAddress?.city}, {s.order?.shippingAddress?.pinCode}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          s.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-950/60'
                        }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {s.estimatedDeliveryDate
                        ? new Date(s.estimatedDeliveryDate).toLocaleDateString('en-IN')
                        : '2-3 business days'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {s.status !== 'Delivered' && (
                        <button
                          onClick={() => handleUpdateStatus(s._id, s.status)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-colors">
                          Advance Status
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Shipping;

