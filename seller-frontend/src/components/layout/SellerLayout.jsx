import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

export const SellerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Sidebar / Android App Navigation Drawer */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 transition-all duration-300 min-w-0">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8 min-w-0 overflow-x-hidden">
          {/* Child Page Content */}
          <Outlet />
        </main>

        {/* Fixed Mobile Bottom Navigation Bar (Home, Products, Orders, Earnings, Profile) */}
        <BottomNav onOpenMenu={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
};

export default SellerLayout;
