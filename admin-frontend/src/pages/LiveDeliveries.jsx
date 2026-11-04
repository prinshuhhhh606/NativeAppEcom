import React, { useState, useEffect } from 'react';
import {
  Bike,
  Navigation,
  MapPin,
  Clock,
  Phone,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  Radio,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const LiveDeliveries = () => {
  const [fleetData, setFleetData] = useState({
    activeDeliveries: [],
    onlineRiders: [],
    totalActiveDeliveries: 0,
    totalOnlineRiders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  useEffect(() => {
    fetchLiveFleet();
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(fetchLiveFleet, 10000); // 10s live pulse
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchLiveFleet = async () => {
    try {
      const res = await api.get('/delivery-partners/live-map');
      setFleetData(res.data || {});
    } catch (err) {
      console.warn('Failed to load fleet monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const activeDeliveries = fleetData.activeDeliveries || [];
  const onlineRiders = fleetData.onlineRiders || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0B0F19] p-6 rounded-2xl border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Radio className="text-emerald-500 animate-pulse" />
            Live Delivery Fleet Command Center
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time GPS telemetry, active in-transit dispatches & delivery partner monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              autoRefresh
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                : 'bg-gray-50 dark:bg-slate-900 border-gray-200 text-gray-500'
            }`}>
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'}`} />
            {autoRefresh ? 'Live Streaming (10s)' : 'Auto-refresh Paused'}
          </button>

          <button
            onClick={fetchLiveFleet}
            className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition"
            title="Refresh Fleet Telemetry">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>In-Transit Deliveries</span>
            <Navigation className="text-blue-500" size={18} />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {activeDeliveries.length}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Online Riders on Duty</span>
            <Bike className="text-emerald-500" size={18} />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {onlineRiders.length}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Verified Fleet</span>
            <UserCheck className="text-purple-500" size={18} />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {onlineRiders.filter((r) => r.isAvailable).length} Available
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Telemetry Status</span>
            <CheckCircle className="text-teal-500" size={18} />
          </div>
          <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-2">Active</p>
        </div>
      </div>

      {/* Active Deliveries Telemetry Grid */}
      <div className="bg-white dark:bg-[#0B0F19] rounded-2xl border border-indigo-100/60 dark:border-indigo-950/40 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin size={18} className="text-indigo-600" />
            Live Delivery Telemetry Streams ({activeDeliveries.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/75 dark:bg-slate-900/50 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Delivery Partner</th>
                <th className="py-3.5 px-4">Store Pickup</th>
                <th className="py-3.5 px-4">Customer Destination</th>
                <th className="py-3.5 px-4">GPS Coordinates</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400">
                    Connecting to live telemetry fleet streams...
                  </td>
                </tr>
              ) : activeDeliveries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400">
                    No active deliveries in transit at this moment.
                  </td>
                </tr>
              ) : (
                activeDeliveries.map((d) => (
                  <tr key={d.deliveryId} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        #{d.orderId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                          {(d.partner?.name || 'R').charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white block">
                            {d.partner?.name || 'Partner Assigned'}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">
                            {d.partner?.vehicleType || 'Bike'} • {d.partner?.vehicleNumber || 'DL-Reg'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-gray-800 dark:text-gray-200 block font-medium">
                        {d.pickup?.storeName || 'Merchant Store'}
                      </span>
                      <span className="text-[11px] text-gray-400 block truncate max-w-xs">
                        {d.pickup?.addressLine || d.pickup?.city || 'Jaipur Hub'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-gray-800 dark:text-gray-200 block font-medium">
                        {d.destination?.fullName || 'Customer'}
                      </span>
                      <span className="text-[11px] text-gray-400 block truncate max-w-xs">
                        {d.destination?.city || 'Jaipur'}, {d.destination?.pinCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-mono text-gray-700 dark:text-gray-300 block font-bold">
                        {d.currentLocation?.latitude ? `${Number(d.currentLocation.latitude).toFixed(4)}, ${Number(d.currentLocation.longitude).toFixed(4)}` : '26.9124, 75.7873'}
                      </span>
                      <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live GPS Ping
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                        {String(d.status).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {d.partner?.phone ? (
                        <a
                          href={`tel:${d.partner.phone}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition">
                          <Phone size={12} />
                          Call
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
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

export default LiveDeliveries;

