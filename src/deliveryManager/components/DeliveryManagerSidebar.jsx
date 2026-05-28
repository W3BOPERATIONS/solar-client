import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Truck, Box, Settings } from 'lucide-react';

export default function DeliveryManagerSidebar() {
  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/delivery-manager/dashboard' },
    { icon: Truck, label: 'Active Deliveries', path: '/delivery-manager/active' },
    { icon: Box, label: 'Inventory', path: '/delivery-manager/inventory' },
    { icon: Settings, label: 'Settings', path: '/delivery-manager/settings' },
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col transition-all duration-300">
      <div className="p-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
          Delivery Manager
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
                  ? 'bg-orange-50 text-orange-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-orange-600'
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
