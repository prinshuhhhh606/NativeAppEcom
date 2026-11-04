import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0B0F19]">
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-pink-500 animate-spin-slow flex items-center justify-center shadow-2xl shadow-indigo-500/50" />
          <div className="absolute inset-0 m-auto w-8 h-8 rounded-2xl bg-[#0B0F19] flex items-center justify-center text-white font-black text-xs">
            BB
          </div>
        </div>
        <p className="text-xs font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-pulse">
          Starting Bharat Bazaar Executive Hub...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F6FB] via-[#F8FAFF] to-[#EFF6FF] dark:from-[#0B0F19] dark:via-[#0F172A] dark:to-[#0B0F19] flex flex-col">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <Header isCollapsed={isCollapsed} setIsMobileOpen={setIsMobileOpen} />

      <main
        className={`flex-1 transition-all duration-300 pt-24 px-4 sm:px-6 lg:px-8 pb-14
          ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
        `}>
        <div className="max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

