import React, { useState, useEffect } from 'react';
import {
  Store,
  Lock,
  Building,
  ShieldCheck,
  Save,
  RefreshCw,
  Clock,
  Truck,
  Calendar,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Palmtree,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import sellerService from '../../services/sellerService';
import toast from 'react-hot-toast';

export const Settings = () => {
  const { seller, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'address' | 'automation' | 'delivery' | 'security'
  const [loading, setLoading] = useState(false);

  // Store Profile State
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    storeName: '',
    businessDescription: '',
    storeLogo: '',
    storeBanner: '',
  });

  // Password State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Pickup Address State
  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    state: '',
    pinCode: '',
    country: 'India',
  });

  // Store Automation State (Section G)
  const [automationData, setAutomationData] = useState({
    vacationMode: {
      enabled: false,
      message: 'Our store is temporarily away on vacation. Orders placed will be processed upon our return.',
      startDate: '',
      endDate: '',
    },
    operatingHours: {
      openTime: '09:00',
      closeTime: '21:00',
      closedDays: ['Sunday'],
    },
    autoAcceptOrders: {
      enabled: false,
      maxOrderValue: 10000,
    },
    orderPrepTimeMinutes: 30,
    cutoffTime: '18:00',
    isStoreOpen: true,
  });

  // Delivery Zones State (Sections I & J)
  const [deliveryData, setDeliveryData] = useState({
    zones: [
      { radiusKm: 3, fee: 30, freeAbove: 399, enabled: true },
      { radiusKm: 5, fee: 40, freeAbove: 499, enabled: true },
      { radiusKm: 10, fee: 60, freeAbove: 799, enabled: true },
      { radiusKm: 15, fee: 90, freeAbove: 999, enabled: false },
      { radiusKm: 20, fee: 120, freeAbove: 1499, enabled: false },
    ],
    sameDayDelivery: true,
    expressDelivery: false,
    scheduledSlots: [
      { slot: 'Morning (09:00 AM - 12:00 PM)', enabled: true },
      { slot: 'Afternoon (01:00 PM - 05:00 PM)', enabled: true },
      { slot: 'Evening (06:00 PM - 09:00 PM)', enabled: true },
    ],
    partnerPreferences: {
      autoAssign: true,
      autoAssignTimeoutSeconds: 120,
      maxBatchOrders: 3,
      useOwnStaff: false,
    },
  });

  useEffect(() => {
    if (seller) {
      setProfileData({
        name: seller.name || '',
        phone: seller.phone || '',
        storeName: seller.storeName || '',
        businessDescription: seller.businessDescription || '',
        storeLogo: seller.storeLogo || '',
        storeBanner: seller.storeBanner || '',
      });

      setAddressData({
        street: seller.address?.street || '',
        city: seller.address?.city || '',
        state: seller.address?.state || '',
        pinCode: seller.address?.pinCode || '',
        country: seller.address?.country || 'India',
      });
    }

    // Load Automation & Delivery settings
    const loadSettings = async () => {
      try {
        const res = await sellerService.getStoreAutomation();
        if (res.data?.automation) {
          setAutomationData((prev) => ({ ...prev, ...res.data.automation }));
        }
        if (res.data?.deliverySettings && res.data.deliverySettings.zones?.length > 0) {
          setDeliveryData((prev) => ({ ...prev, ...res.data.deliverySettings }));
        }
      } catch (e) {
        console.warn('Failed to load automation settings', e);
      }
    };
    loadSettings();
  }, [seller]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sellerService.updateProfile(profileData);
      toast.success('Store profile updated successfully!');
      await refreshProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await sellerService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sellerService.updateProfile({ address: addressData });
      toast.success('Pickup warehouse address updated!');
      await refreshProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to update address');
    } finally {
      setLoading(false);
    }
  };

  const handleAutomationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sellerService.updateStoreAutomation(automationData);
      toast.success('Store automation & hours saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save automation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sellerService.updateDeliveryZones(deliveryData);
      toast.success('Delivery zones & fleet preferences saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save delivery zones');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Store & Account Settings
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Storefront branding, warehouse pickup address, automation, delivery radius zones, and credentials.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700 space-x-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'profile'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Store className="w-4 h-4" />
          Storefront Branding
        </button>

        <button
          onClick={() => setActiveTab('address')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'address'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Building className="w-4 h-4" />
          Pickup Address
        </button>

        <button
          onClick={() => setActiveTab('automation')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'automation'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          Store Automation & Hours
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'delivery'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Truck className="w-4 h-4" />
          Delivery Zones & Fleet
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'security'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security & Password
        </button>
      </div>

      {/* Tab 1: Profile & Store Branding */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Merchant Owner Name *
              </label>
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Registered Contact Mobile
              </label>
              <input
                type="text"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Storefront Display Name *
              </label>
              <input
                type="text"
                required
                value={profileData.storeName}
                onChange={(e) => setProfileData({ ...profileData, storeName: e.target.value })}
                className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Store Story & Description
              </label>
              <textarea
                rows={3}
                value={profileData.businessDescription}
                onChange={(e) => setProfileData({ ...profileData, businessDescription: e.target.value })}
                placeholder="Share your artisan heritage and product specialty with buyers..."
                className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Branding'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Pickup Address */}
      {activeTab === 'address' && (
        <form onSubmit={handleAddressSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Warehouse / Shop Street Address *
              </label>
              <input
                type="text"
                required
                value={addressData.street}
                onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                City *
              </label>
              <input
                type="text"
                required
                value={addressData.city}
                onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                State *
              </label>
              <input
                type="text"
                required
                value={addressData.state}
                onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                PIN Code *
              </label>
              <input
                type="text"
                required
                value={addressData.pinCode}
                onChange={(e) => setAddressData({ ...addressData, pinCode: e.target.value })}
                className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Warehouse Address'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Store Automation (Section G) */}
      {activeTab === 'automation' && (
        <form onSubmit={handleAutomationSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-6">
          {/* Vacation Mode Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palmtree className="w-5 h-5 text-amber-600" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    Store Vacation Mode
                  </h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Temporarily pause incoming order obligations during holidays or festivals.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={automationData.vacationMode.enabled}
                onChange={(e) =>
                  setAutomationData({
                    ...automationData,
                    vacationMode: { ...automationData.vacationMode, enabled: e.target.checked },
                  })
                }
                className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-gray-300"
              />
            </div>

            {automationData.vacationMode.enabled && (
              <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-900/60 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-300">
                    Custom Customer Vacation Notice
                  </label>
                  <input
                    type="text"
                    value={automationData.vacationMode.message}
                    onChange={(e) =>
                      setAutomationData({
                        ...automationData,
                        vacationMode: { ...automationData.vacationMode, message: e.target.value },
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Operating Hours & Cutoff Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Opening Time
              </label>
              <input
                type="time"
                value={automationData.operatingHours.openTime}
                onChange={(e) =>
                  setAutomationData({
                    ...automationData,
                    operatingHours: { ...automationData.operatingHours, openTime: e.target.value },
                  })
                }
                className="mt-1 block w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Closing Time
              </label>
              <input
                type="time"
                value={automationData.operatingHours.closeTime}
                onChange={(e) =>
                  setAutomationData({
                    ...automationData,
                    operatingHours: { ...automationData.operatingHours, closeTime: e.target.value },
                  })
                }
                className="mt-1 block w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Daily Order Cut-Off Time
              </label>
              <input
                type="time"
                value={automationData.cutoffTime}
                onChange={(e) =>
                  setAutomationData({
                    ...automationData,
                    cutoffTime: e.target.value,
                  })
                }
                className="mt-1 block w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Auto Acceptance & Prep Time */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                  Automatic Order Acceptance
                </span>
                <span className="text-[11px] text-gray-400">
                  Automatically move incoming orders below a monetary threshold directly into packing status.
                </span>
              </div>
              <input
                type="checkbox"
                checked={automationData.autoAcceptOrders.enabled}
                onChange={(e) =>
                  setAutomationData({
                    ...automationData,
                    autoAcceptOrders: { ...automationData.autoAcceptOrders, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
              />
            </div>

            {automationData.autoAcceptOrders.enabled && (
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400">
                  Max Order Value for Auto-Acceptance (INR)
                </label>
                <input
                  type="number"
                  value={automationData.autoAcceptOrders.maxOrderValue}
                  onChange={(e) =>
                    setAutomationData({
                      ...automationData,
                      autoAcceptOrders: { ...automationData.autoAcceptOrders, maxOrderValue: Number(e.target.value) },
                    })
                  }
                  className="mt-1 block w-48 px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-xl text-xs font-bold"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Automation Rules'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Delivery Zones (Sections I & J) */}
      {activeTab === 'delivery' && (
        <form onSubmit={handleDeliverySubmit} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-6">
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
              Hyperlocal Radius Delivery Zones (3KM - 20KM)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Set custom delivery charges and free shipping order thresholds for each radius ring around your warehouse.
            </p>
          </div>

          <div className="space-y-3">
            {deliveryData.zones.map((zone, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
                  zone.enabled
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-gray-200 dark:border-slate-700 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={zone.enabled}
                    onChange={(e) => {
                      const updated = [...deliveryData.zones];
                      updated[idx].enabled = e.target.checked;
                      setDeliveryData({ ...deliveryData, zones: updated });
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <div>
                    <span className="font-bold text-xs text-gray-900 dark:text-white block">
                      Zone {idx + 1}: Up to {zone.radiusKm} KM Radius
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Standard hyperlocal bike / scooter dispatch
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold block">Delivery Fee</label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-gray-400">₹</span>
                      <input
                        type="number"
                        value={zone.fee}
                        onChange={(e) => {
                          const updated = [...deliveryData.zones];
                          updated[idx].fee = Number(e.target.value);
                          setDeliveryData({ ...deliveryData, zones: updated });
                        }}
                        className="w-16 px-2 py-1 bg-white dark:bg-slate-800 border rounded-lg font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold block">Free Shipping Above</label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-gray-400">₹</span>
                      <input
                        type="number"
                        value={zone.freeAbove}
                        onChange={(e) => {
                          const updated = [...deliveryData.zones];
                          updated[idx].freeAbove = Number(e.target.value);
                          setDeliveryData({ ...deliveryData, zones: updated });
                        }}
                        className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border rounded-lg font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Smart Delivery Matching Preferences */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Smart Delivery Fleet Matching (Section J)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border">
                <div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 block">Auto-Assign Nearest Partner</span>
                  <span className="text-[10px] text-gray-400">Dispatches ping to closest idle rider</span>
                </div>
                <input
                  type="checkbox"
                  checked={deliveryData.partnerPreferences.autoAssign}
                  onChange={(e) =>
                    setDeliveryData({
                      ...deliveryData,
                      partnerPreferences: { ...deliveryData.partnerPreferences, autoAssign: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border">
                <div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 block">Dispatch Timeout (Seconds)</span>
                  <span className="text-[10px] text-gray-400">Auto-reassign if rider does not accept</span>
                </div>
                <input
                  type="number"
                  value={deliveryData.partnerPreferences.autoAssignTimeoutSeconds}
                  onChange={(e) =>
                    setDeliveryData({
                      ...deliveryData,
                      partnerPreferences: {
                        ...deliveryData.partnerPreferences,
                        autoAssignTimeoutSeconds: Number(e.target.value),
                      },
                    })
                  }
                  className="w-20 px-2 py-1 bg-gray-50 dark:bg-slate-900 border rounded-lg font-bold text-right"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Delivery & Fleet Preferences'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 5: Security & Password */}
      {activeTab === 'security' && (
        <form onSubmit={handlePasswordSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-5 max-w-lg">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Current Password *
            </label>
            <input
              type="password"
              required
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              New Password *
            </label>
            <input
              type="password"
              required
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Confirm New Password *
            </label>
            <input
              type="password"
              required
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Settings;
