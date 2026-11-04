import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Sellers from './pages/Sellers';
import DeliveryPartners from './pages/DeliveryPartners';
import Coupons from './pages/Coupons';
import Payments from './pages/Payments';
import Shipping from './pages/Shipping';
import Returns from './pages/Returns';
import Reviews from './pages/Reviews';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Franchises from './pages/Franchises';
import LiveDeliveries from './pages/LiveDeliveries';
import Commissions from './pages/Commissions';
import Payouts from './pages/Payouts';
import Support from './pages/Support';
import Notifications from './pages/Notifications';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '12px',
                  background: '#1e293b',
                  color: '#fff',
                  fontSize: '13px',
                },
              }}
            />

            <Routes>
              {/* Public Admin Auth Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Admin Control Center */}
              <Route path="/" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="products" element={<Products />} />
                <Route path="categories" element={<Categories />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="customers" element={<Customers />} />
                <Route path="sellers" element={<Sellers />} />
                <Route path="franchises" element={<Franchises />} />
                <Route path="delivery-partners" element={<DeliveryPartners />} />
                <Route path="live-deliveries" element={<LiveDeliveries />} />
                <Route path="commissions" element={<Commissions />} />
                <Route path="payouts" element={<Payouts />} />
                <Route path="support" element={<Support />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="coupons" element={<Coupons />} />
                <Route path="payments" element={<Payments />} />
                <Route path="shipping" element={<Shipping />} />
                <Route path="returns" element={<Returns />} />
                <Route path="reviews" element={<Reviews />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

