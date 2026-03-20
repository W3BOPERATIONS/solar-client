import React from 'react';
import { ClipboardList, MapPin, Search, Filter, MessageSquare, History, User } from 'lucide-react';

export default function TrackServiceProjects() {
  const ongoingServices = [
    { id: 'T-SRV-3001', technician: 'Rahul Sharma', customer: 'Sita Devi', location: 'Rajkot', stage: 'On-route', lastUpdate: '10 mins ago' },
    { id: 'T-SRV-3002', technician: 'Vikram Singh', customer: 'Om Prakash', location: 'Ahmedabad', stage: 'Checking Faults', lastUpdate: '5 mins ago' },
    { id: 'T-SRV-3003', technician: 'Pankaj Kumar', customer: 'Virendra Dave', location: 'Vadodara', stage: 'Parts Required', lastUpdate: '1 hour ago' },
  ];

  return (
    <div className="p-6 text-gray-800">
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white shadow-xl">
        <h1 className="text-3xl font-extrabold flex items-center gap-3">
          <ClipboardList size={32} /> Service Tracking Center
        </h1>
        <p className="mt-2 text-blue-100 opacity-90 max-w-2xl">
          Real-time tracking of on-field service technicians and ticket statuses across all districts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History size={20} className="text-blue-600" /> Active Service Logs
            </h2>
            <button className="text-sm font-medium text-blue-600 hover:underline">View All History</button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {ongoingServices.map((srv) => (
              <div key={srv.id} className="p-5 hover:bg-gray-50/50 transition cursor-pointer flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-lg text-xs tracking-wider">
                      {srv.id}
                    </span>
                    <span className="text-gray-400 text-xs">Updated {srv.lastUpdate}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition">
                    Customer: {srv.customer}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><User size={14}/> {srv.technician}</span>
                    <span className="flex items-center gap-1"><MapPin size={14}/> {srv.location}</span>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-2">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ring-1 ring-inset
                    ${srv.stage === 'On-route' ? 'bg-indigo-50 text-indigo-700 ring-indigo-200' : 
                      srv.stage === 'Checking Faults' ? 'bg-yellow-50 text-yellow-700 ring-yellow-200' : 
                      'bg-orange-50 text-orange-700 ring-orange-200'}`}>
                    {srv.stage}
                  </span>
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-full transition shadow-sm border border-gray-100">
                      <MessageSquare size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-full transition shadow-sm border border-gray-100">
                      <History size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit space-y-6">
          <h2 className="text-xl font-bold">Quick Analysis</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Resolution Rate</span>
              <span className="font-bold text-green-600">92%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full w-[92%]" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Technician Utilization</span>
              <span className="font-bold text-blue-600">85%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full w-[85%]" />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Service Health Overview</h3>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600">Smooth - 12 Teams active</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-xs text-gray-600">Low Speed - 4 Pending Tasks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
