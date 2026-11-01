import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Store, Shield, Truck, FileText, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    storeName: '',
    contactEmail: '',
    contactPhone: '',
    gstNumber: '',
    invoicePrefix: '',
    timezone: 'Asia/Kolkata',
    maintenanceMode: false,
    shipping: {
      freeShippingThreshold: 499,
      standardCharge: 40,
      expressSurcharge: 50,
      codAvailable: true,
    },
    policies: {
      returnWindowDays: 7,
      returnPolicyText: '',
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.data) setSettings(res.data);
    } catch (err) {
      toast.error('Failed to load store settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Store settings saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Store & Business Settings
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Configure GST, Pan-India shipping fees, free delivery limits and invoice numbering.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm shadow-blue-500/30 disabled:opacity-50">
          <Save size={16} />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Store Details */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center space-x-2 border-b border-gray-100 dark:border-slate-800 pb-3">
            <Store size={18} className="text-blue-600" />
            <span>Storefront & Contact Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Store Business Name
              </label>
              <input
                type="text"
                value={settings.storeName || ''}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Support Email Address
              </label>
              <input
                type="email"
                value={settings.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Support Phone Number
              </label>
              <input
                type="text"
                value={settings.contactPhone || ''}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Timezone
              </label>
              <input
                type="text"
                disabled
                value="Asia/Kolkata (IST)"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* GST & Invoicing */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center space-x-2 border-b border-gray-100 dark:border-slate-800 pb-3">
            <Shield size={18} className="text-emerald-600" />
            <span>GST & Tax Compliance</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                GSTIN (15-Digit Indian GST Number)
              </label>
              <input
                type="text"
                value={settings.gstNumber || ''}
                onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value.toUpperCase() })}
                placeholder="29ABCDE1234F1Z5"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={settings.invoicePrefix || ''}
                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                placeholder="INV-BBIN-"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none"
              />
            </div>
          </div>
        </div>

        {/* Pan India Shipping & Delivery Rules */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center space-x-2 border-b border-gray-100 dark:border-slate-800 pb-3">
            <Truck size={18} className="text-purple-600" />
            <span>Pan-India Shipping & Delivery Rules</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Free Delivery Threshold (₹)
              </label>
              <input
                type="number"
                value={settings.shipping?.freeShippingThreshold || 499}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: { ...settings.shipping, freeShippingThreshold: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
              />
              <span className="text-[10px] text-gray-400">Orders above this get free shipping</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Standard Shipping Fee (₹)
              </label>
              <input
                type="number"
                value={settings.shipping?.standardCharge || 40}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: { ...settings.shipping, standardCharge: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Express Surcharge (₹)
              </label>
              <input
                type="number"
                value={settings.shipping?.expressSurcharge || 50}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: { ...settings.shipping, expressSurcharge: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.shipping?.codAvailable ?? true}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: { ...settings.shipping, codAvailable: e.target.checked },
                  })
                }
                className="rounded text-blue-600"
              />
              <span>Enable Cash on Delivery (COD) across serviceable PIN codes</span>
            </label>
          </div>
        </div>

        {/* Return Policies */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center space-x-2 border-b border-gray-100 dark:border-slate-800 pb-3">
            <FileText size={18} className="text-amber-600" />
            <span>Return & Refund Policies</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Customer Return Window (Days from Delivery)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={settings.policies?.returnWindowDays || 7}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  policies: { ...settings.policies, returnWindowDays: Number(e.target.value) },
                })
              }
              className="w-32 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Store Policy Text
            </label>
            <textarea
              rows="3"
              value={settings.policies?.returnPolicyText || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  policies: { ...settings.policies, returnPolicyText: e.target.value },
                })
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;

