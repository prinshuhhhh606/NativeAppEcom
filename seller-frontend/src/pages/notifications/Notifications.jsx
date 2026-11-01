import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, RefreshCw, ShoppingBag, ShieldCheck, CreditCard, AlertTriangle } from 'lucide-react';
import sellerService from '../../services/sellerService';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setUnreadCount } = useSocket();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await sellerService.getNotifications();
      const list = res.data.notifications || res.data || [];
      setNotifications(list);
      const unread = list.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await sellerService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Failed to mark read');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-5 h-5 text-indigo-500" />;
      case 'payout':
        return <CreditCard className="w-5 h-5 text-emerald-500" />;
      case 'approval':
        return <ShieldCheck className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Notification Center
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real-time alerts on buyer orders, catalog compliance, and payout transfers.
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-slate-700">
        {notifications.length > 0 ? (
          notifications.map((item) => (
            <div
              key={item._id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                item.isRead ? 'opacity-70 bg-transparent' : 'bg-emerald-50/20 dark:bg-emerald-950/10'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-2xl bg-gray-100 dark:bg-slate-700 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{item.message}</p>
                  <span className="text-[10px] text-gray-400 mt-1.5 inline-block">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {!item.isRead && (
                <button
                  onClick={() => handleMarkRead(item._id)}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors whitespace-nowrap"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-500" />
            <p className="text-sm font-semibold">No notifications to display</p>
            <p className="text-xs text-gray-500 mt-1">You are completely up to date!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

