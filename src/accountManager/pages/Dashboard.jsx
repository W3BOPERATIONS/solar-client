import React from 'react';

export default function AccountManagerDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Account Manager Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder Stats Cards */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Orders</h3>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Payments</h3>
          <p className="text-3xl font-bold text-gray-900">₹0</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900">₹0</p>
        </div>
      </div>
    </div>
  );
}
