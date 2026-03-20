import React from 'react';
import { Settings, MapPin, Calendar, Clock, CheckCircle2, AlertTriangle, Search, Filter } from 'lucide-react';

export default function ServiceProjects() {
  const stats = [
    { label: 'Pending Service', value: '8', color: 'bg-blue-100 text-blue-600', icon: Clock },
    { label: 'In Progress', value: '4', color: 'bg-yellow-100 text-yellow-600', icon: Settings },
    { label: 'Resolved Today', value: '5', color: 'bg-green-100 text-green-600', icon: CheckCircle2 },
    { label: 'High Priority', value: '3', color: 'bg-red-100 text-red-600', icon: AlertTriangle },
  ];

  const services = [
    { id: 'SRV-2024', customer: 'Rajesh Kumar', system: '5kW Rooftop', type: 'AMC Visit', date: '2026-03-22', status: 'Pending' },
    { id: 'SRV-2025', customer: 'Amit Patel', system: '3kW Solar Pump', type: 'Fault Repair', date: '2026-03-20', status: 'In Progress' },
    { id: 'SRV-2026', customer: 'Sanjay Singh', system: '10kW Residential', type: 'Installation Audit', date: '2026-03-19', status: 'Overdue' },
  ];

  return (
    <div className="p-6 text-gray-800">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="text-blue-600 animate-spin-slow" /> Project Service
        </h1>
        <p className="text-gray-500 mt-1">Track and manage service requests and AMC visits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search service..." 
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 transition text-gray-600">
            <Filter size={16} /> Filters
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase">
                <th className="px-6 py-4 font-semibold">Service ID</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Service Type</th>
                <th className="px-6 py-4 font-semibold">Scheduled Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {services.map((srv) => (
                <tr key={srv.id} className="hover:bg-gray-50 transition border-b border-gray-100">
                  <td className="px-6 py-4 font-medium text-blue-600">{srv.id}</td>
                  <td className="px-6 py-4">{srv.customer}</td>
                  <td className="px-6 py-4 font-semibold">{srv.type}</td>
                  <td className="px-6 py-4 flex items-center gap-1"><Calendar size={14}/> {srv.date}</td>
                  <td className="px-6 py-4 uppercase">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold 
                      ${srv.status === 'Pending' ? 'bg-blue-100 text-blue-700' : 
                        srv.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'}`}>
                      {srv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:underline">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
