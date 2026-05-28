import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileText, IndianRupee, Settings } from 'lucide-react';

export default function AccountManagerSidebar() {
  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/account-manager/dashboard' },
    { icon: FileText, label: 'Orders', path: '/account-manager/orders' },
    { icon: IndianRupee, label: 'Payments', path: '/account-manager/payments' },
    { icon: Settings, label: 'Settings', path: '/account-manager/settings' },
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col transition-all duration-300">
      <div className="p-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Account Manager
        </h2>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
