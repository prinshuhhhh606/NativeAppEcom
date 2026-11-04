import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Send,
  Users,
  Store,
  Bike,
  Building,
  RefreshCw,
  Megaphone,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipientType: 'all',
    type: 'promotional',
    link: '',
  });

  // Fetch dispatched notification history
  const fetchNotifications = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/notifications');
      if (res.success && res.data) {
        setNotifications(res.data.notifications || res.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load notifications history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle send notification
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please enter notification title and message');
      return;
    }

    try {
      setSending(true);
      const res = await api.post('/notifications/send', formData);
      if (res.success) {
        toast.success(res.message || 'Push notification broadcasted successfully!');
        setFormData({
          title: '',
          message: '',
          recipientType: 'all',
          type: 'promotional',
          link: '',
        });
        fetchNotifications();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-900/70 p-6 rounded-3xl border border-indigo-100/60 dark:border-indigo-950/40 backdrop-blur-xl shadow-xl shadow-indigo-500/5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white shadow-lg shadow-indigo-500/25">
            <Megaphone className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Push Notification Center</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h1>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Broadcast announcements, offers, and operational alerts to users, sellers, franchises, and fleet
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchNotifications()}
          disabled={refreshing}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Notification Card */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm h-fit">
          <h2 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-500" />
            <span>Compose Broadcast</span>
          </h2>

          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                Audience / Target Group
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'All Users', icon: Users },
                  { id: 'customers', label: 'Customers', icon: Users },
                  { id: 'sellers', label: 'Sellers', icon: Store },
                  { id: 'delivery_partners', label: 'Delivery Boys', icon: Bike },
                ].map((aud) => {
                  const Icon = aud.icon;
                  const isSelected = formData.recipientType === aud.id;
                  return (
                    <button
                      type="button"
                      key={aud.id}
                      onClick={() => setFormData({ ...formData, recipientType: aud.id })}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition text-left ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'
                      }`}>
                      <Icon className="w-4 h-4" />
                      <span>{aud.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                Notification Category
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs font-semibold text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-700 outline-none">
                <option value="promotional">Promotional / Festival Sale</option>
                <option value="system">System / Maintenance Update</option>
                <option value="order_update">Order Alert Broadcast</option>
                <option value="payout_update">Payout Notification</option>
                <option value="emergency">High Priority / Urgent Alert</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">Notification Title</label>
              <input
                type="text"
                placeholder="e.g. Mega Weekend Sale is Live! 50% Off"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                Message Body
              </label>
              <textarea
                rows={4}
                placeholder="Write your push notification message..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                Deep-link / Action URL (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. /category/electronics or /order/123"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-xs text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-black text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50">
              <Send className="w-4 h-4" />
              <span>{sending ? 'Broadcasting...' : 'Broadcast Push Notification'}</span>
            </button>
          </form>
        </div>

        {/* Sent History Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              <span>Broadcast Activity Log</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 dark:bg-slate-800/50 text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider border-b border-gray-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Title & Details</th>
                    <th className="py-3 px-4">Target Group</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Date Dispatched</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-gray-300 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Loading notifications log...
                      </td>
                    </tr>
                  ) : notifications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        No previous push broadcasts found.
                      </td>
                    </tr>
                  ) : (
                    notifications.map((notif, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900 dark:text-white max-w-xs truncate">
                            {notif.title}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate max-w-xs">{notif.message}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                            {notif.recipientType || notif.targetRole || 'All'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                            {notif.type || 'promotional'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Just now'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Delivered</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;

