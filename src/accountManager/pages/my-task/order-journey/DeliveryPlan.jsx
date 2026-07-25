import React, { useState, useEffect } from 'react';
import { ChevronDown, Home, Building2, Zap, Settings } from 'lucide-react';
import api from '../../../../api/axios';

export default function DeliveryPlan({ onNext }) {
  const [dashboardData, setDashboardData] = useState({});
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/dashboard/account-manager/create-order-data');
        if (res.data && res.data.success) {
          setDashboardData(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };
    fetchDashboardData();

    // Load dynamic ungrouped orders from localStorage
    const localOrders = JSON.parse(localStorage.getItem('deliveryPlanOrders') || '[]');
    if (localOrders.length > 0) {
      setOrders(localOrders);
    } else {
      setOrders([
        { id: 'ORD0003', groupNo: '3', kw: '3 KW', location: 'Rajkot', areaType: 'Urban', deliveryType: 'Regular', vendorName: 'Industrial Client', labelNumber: 'LBL-ORD0003-Ind', inverterLabelNumber: 'INV-ORD0003-Ind', bosLabelNumber: 'BOS-ORD0003-Ind' },
        { id: 'ORD0003', groupNo: '3', kw: '9 KW', location: 'Vadodara', areaType: 'Rural', deliveryType: 'Express', vendorName: 'Commercial Client', labelNumber: 'LBL-ORD0003-Comm', inverterLabelNumber: 'INV-ORD0003-Comm', bosLabelNumber: 'BOS-ORD0003-Comm' },
      ]);
    }
  }, []);

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-screen space-y-6">
      {/* Header */}
      <div className="bg-[#2c4b75] text-white p-4 rounded flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">Delivery Plan Management</h1>
        <div className="flex space-x-4 text-xs font-semibold">
          <span>Today's Task</span>
          <span className="text-yellow-400">Pending Task</span>
          <span className="text-red-400">Overdue Task</span>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Select Category', options: dashboardData.dynamicDropdowns?.categories || [] },
            { label: 'Select Sub Categ', options: dashboardData.dynamicDropdowns?.subCategories || [] },
            { label: 'Project Type', options: dashboardData.dynamicDropdowns?.projectTypes ? [...dashboardData.dynamicDropdowns.projectTypes, 'Customize', 'ComboKit'] : ['Customize', 'ComboKit'] },
            { label: 'Select Sub type', options: dashboardData.dynamicDropdowns?.subProjectTypes || [] },
            { label: 'Select Cluster', options: dashboardData.dynamicDropdowns?.clusters || [] },
            { label: 'Select Delivery', options: dashboardData.dynamicDropdowns?.deliveryZones || [] },
          ].map((filter, idx) => (
            <div key={idx} className="relative">
              <select className="appearance-none bg-white border border-gray-300 text-gray-700 py-1.5 px-3 pr-8 rounded text-sm w-36 focus:outline-none">
                <option value="">{filter.label}</option>
                {filter.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <ChevronDown size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 items-center justify-between">
         <div className="relative">
            <select className="appearance-none bg-white border border-gray-300 text-gray-700 py-1.5 px-3 pr-8 rounded text-sm w-36 focus:outline-none">
              <option value="">Select Area Type</option>
              {(dashboardData.dynamicDropdowns?.areaTypes || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <ChevronDown size={14} />
            </div>
         </div>
         <div className="flex space-x-2 w-full md:w-auto justify-center md:justify-start">
           {/* Client requested removing the standalone buttons and putting them in the Project Type filter instead */}
         </div>
      </div>


      {/* Zone Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        <div className="bg-white border-t-4 border-t-red-400 p-4 rounded shadow-sm text-center">
           <h3 className="text-red-400 font-bold text-[15px] mb-1">North Zone</h3>
           <p className="text-gray-500 text-[11px] mb-1">Orders</p>
           <p className="text-lg font-bold text-gray-800">15</p>
        </div>
        <div className="bg-white border-t-4 border-t-teal-400 p-4 rounded shadow-sm text-center">
           <h3 className="text-teal-400 font-bold text-[15px] mb-1">South Zone</h3>
           <p className="text-gray-500 text-[11px] mb-1">Orders</p>
           <p className="text-lg font-bold text-gray-800">12</p>
        </div>
        <div className="bg-white border-t-4 border-t-green-400 p-4 rounded shadow-sm text-center">
           <h3 className="text-green-400 font-bold text-[15px] mb-1">East Zone</h3>
           <p className="text-gray-500 text-[11px] mb-1">Orders</p>
           <p className="text-lg font-bold text-gray-800">8</p>
        </div>
        <div className="bg-white border-t-4 border-t-yellow-500 p-4 rounded shadow-sm text-center">
           <h3 className="text-yellow-500 font-bold text-[15px] mb-1">West Zone</h3>
           <p className="text-gray-500 text-[11px] mb-1">Orders</p>
           <p className="text-lg font-bold text-gray-800">10</p>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col xl:flex-row gap-6 mt-4">
        {/* Left Side */}
        <div className="flex-1 space-y-6">
          {/* Map */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-4">
            <h3 className="font-bold text-gray-800 text-[15px] mb-3">Rajkot Map</h3>
            <div className="w-full h-80 bg-gray-200 rounded overflow-hidden relative">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Gujarat_district_map.svg/1200px-Gujarat_district_map.svg.png" 
                alt="Map Placeholder" 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className="bg-black/60 text-white px-3 py-1 rounded text-sm shadow">Interactive Map View Placeholder</span>
              </div>
            </div>
          </div>

          {/* Pending Delivery Orders Table */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 text-[15px] mb-4">Pending Delivery Orders</h3>
            
            <div className="flex flex-wrap justify-between items-center mb-4 text-[11px] font-bold">
               <div className="flex space-x-4 items-center mb-2 sm:mb-0">
                  <span className="bg-[#0b74ba] text-white px-2 py-1 rounded">All</span>
                  <span className="text-green-500 cursor-pointer">Regular</span>
                  <span className="text-yellow-500 cursor-pointer">Express</span>
                  <span className="text-red-500 cursor-pointer">Prime</span>
               </div>
               <div className="flex space-x-4 items-center">
                  <span className="bg-[#0b74ba] text-white px-2 py-1 rounded">All</span>
                  <span className="text-green-500 cursor-pointer">Rural</span>
                  <span className="text-yellow-500 cursor-pointer">Urban</span>
               </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded">
              <table className="w-full text-xs text-left min-w-[700px]">
                <thead className="bg-[#7fb4eb] text-white">
                  <tr>
                    <th className="px-3 py-3 font-medium border-r border-blue-300 w-10 text-center">
                      <input type="checkbox" className="h-3 w-3 rounded" />
                    </th>
                    <th className="px-3 py-3 font-medium border-r border-blue-300">delivery no.</th>
                    <th className="px-3 py-3 font-medium border-r border-blue-300">group no.</th>
                    <th className="px-3 py-3 font-medium border-r border-blue-300">Details</th>
                    <th className="px-3 py-3 font-medium border-r border-blue-300">Location</th>
                    <th className="px-3 py-3 font-medium border-r border-blue-300 text-center">Area Type</th>
                    <th className="px-3 py-3 font-medium text-center">Delivery Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-4 border-r border-gray-100 text-center">
                        <input type="checkbox" className="h-3 w-3 rounded" />
                      </td>
                      <td className="px-3 py-4 border-r border-gray-100 font-medium text-gray-700">{row.no || row.id}</td>
                      <td className="px-3 py-4 border-r border-gray-100 text-gray-700 font-bold text-center">
                         {row.groupNo || '1'}
                      </td>
                      <td className="px-3 py-4 border-r border-gray-100 text-gray-700 leading-tight space-y-1">
                         <div><span className="font-bold text-gray-900 text-xs">{row.vendorName || 'N/A'}</span></div>
                         <div><span className="font-bold text-red-600">Capacity:</span> <span className="font-medium">{row.kw}</span></div>
                         {row.labelNumber && row.labelNumber !== '-' && (
                           <div><span className="font-semibold text-gray-500">Main Label:</span> <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-700 font-mono font-bold border border-gray-200">{row.labelNumber}</code></div>
                         )}
                         {row.inverterLabelNumber && row.inverterLabelNumber !== '-' && (
                           <div><span className="font-semibold text-gray-500">Inverter Label:</span> <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-700 font-mono font-bold border border-gray-200">{row.inverterLabelNumber}</code></div>
                         )}
                         {row.bosLabelNumber && row.bosLabelNumber !== '-' && (
                           <div><span className="font-semibold text-gray-500">BOS Kit Label:</span> <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-700 font-mono font-bold border border-gray-200">{row.bosLabelNumber}</code></div>
                         )}
                      </td>
                      <td className="px-3 py-4 border-r border-gray-100 text-gray-700">{row.location}</td>
                      <td className="px-3 py-4 border-r border-gray-100 text-center">
                         <span className={`text-[10px] font-bold px-3 py-1 rounded text-white ${row.areaType === 'Urban' ? 'bg-[#0b74ba]' : 'bg-[#ffc107] text-gray-900'}`}>
                           {row.areaType}
                         </span>
                      </td>
                      <td className="px-3 py-4 text-center">
                         <span className={`text-[10px] font-bold px-3 py-1 rounded text-white ${
                           row.deliveryType === 'Regular' ? 'bg-[#2cb25d]' :
                           row.deliveryType === 'Express' ? 'bg-[#ffc107] text-gray-900' : 'bg-[#e53935]'
                         }`}>
                           {row.deliveryType}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap justify-between items-center text-xs font-semibold text-gray-600 mt-6">
               <div className="space-y-1">
                  <p>Total KW: <span className="text-[#0b74ba]">33.5</span></p>
                  <p>Total KM: <span className="text-[#2cb25d]">115</span></p>
               </div>
               <div className="text-right space-y-1">
                  <p>Per Kw Rs: <span className="text-[#0b74ba]">500</span></p>
                  <p>Betchmark Price Per Kw: <span className="text-[#2cb25d]">600</span></p>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side: Create Delivery Plan Form */}
        <div className="xl:w-[350px] flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden sticky top-6">
             <div className="bg-[#f4f7f9] p-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-800 text-[15px]">Create Delivery Plan</h3>
             </div>
             <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Delivery Type</label>
                  <select className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded text-sm focus:outline-none focus:border-blue-400">
                    <option>Select Type</option>
                    {(dashboardData.dynamicDropdowns?.deliveryTypes || []).map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Vehicle Type</label>
                  <select className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded text-sm focus:outline-none focus:border-blue-400">
                    <option>Select Vehicle</option>
                    {(dashboardData.dynamicDropdowns?.vehicleTypes || []).map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Driver</label>
                  <select className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded text-sm focus:outline-none focus:border-blue-400">
                    <option>Select Driver</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Delivery Per KW Charges</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 text-sm font-semibold">₹</span>
                    <input type="text" value="500" readOnly className="w-full bg-white border border-gray-300 text-gray-700 py-2 pl-7 pr-3 rounded text-sm focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Estimated Delivery Date</label>
                  <input type="date" className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded text-sm focus:outline-none focus:border-blue-400 text-gray-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Special Instructions</label>
                  <textarea rows="4" className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded text-sm focus:outline-none focus:border-blue-400"></textarea>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Select Delivery Week</label>
                  <select className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded text-sm focus:outline-none focus:border-blue-400">
                    <option>Week --, ----</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Available Slots</label>
                  <p className="text-xs text-gray-500 mt-1">None selected</p>
                </div>
                
                <div className="pt-3 flex space-x-3">
                   <button 
                     onClick={() => {
                       alert("Delivery Plan Confirmed!");
                       if (onNext) onNext();
                     }}
                     className="bg-[#0b74ba] hover:bg-blue-700 text-white font-bold text-[12px] px-5 py-2.5 rounded w-max shadow-sm transition"
                   >
                     Confirm Delivery Plan & Next
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
