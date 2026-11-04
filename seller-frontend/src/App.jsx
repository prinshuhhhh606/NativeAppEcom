import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import SellerLayout from './components/layout/SellerLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Operational Pages
import Dashboard from './pages/dashboard/Dashboard';
import Products from './pages/products/Products';
import Inventory from './pages/inventory/Inventory';
import Orders from './pages/orders/Orders';
import Returns from './pages/returns/Returns';
import Earnings from './pages/earnings/Earnings';
import Payouts from './pages/payouts/Payouts';
import Reviews from './pages/reviews/Reviews';
import Notifications from './pages/notifications/Notifications';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import Staff from './pages/staff/Staff';
import Accounting from './pages/accounting/Accounting';
import Protection from './pages/protection/Protection';
import Growth from './pages/growth/Growth';
import HelpCenter from './pages/help/HelpCenter';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Seller Central Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SellerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="orders" element={<Orders />} />
        <Route path="shipping" element={<Orders initialMode="shipping" />} />
        <Route path="staff" element={<Staff />} />
        <Route path="accounting" element={<Accounting />} />
        <Route path="protection" element={<Protection />} />
        <Route path="growth" element={<Growth />} />
        <Route path="help" element={<HelpCenter />} />
        <Route path="returns" element={<Returns />} />
        <Route path="earnings" element={<Earnings />} />
        <Route path="payouts" element={<Payouts />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

