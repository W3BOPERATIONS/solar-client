import React, { useState, useEffect } from 'react';
import { ChevronDown, Zap, Settings } from 'lucide-react';
import api from '../../../../api/axios';

export default function VendorPay({ onNext, sharedOrderData }) {
  const tableData = [];

  const initialComboData = [];

  const [dashboardData, setDashboardData] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
  const [kitMode, setKitMode] = useState('ComboKit');
  const [componentFilter, setComponentFilter] = useState('All');
  const [completedOrders, setCompletedOrders] = useState([]);
  const [generatedOrdersCache, setGeneratedOrdersCache] = useState([]);

  useEffect(() => {
    try {
      const savedCompleted = JSON.parse(localStorage.getItem('completedVendorPayments') || '[]');
      setCompletedOrders(savedCompleted);
      
      const savedGenerated = JSON.parse(localStorage.getItem('generatedVendorPayments') || '[]');
      setGeneratedOrdersCache(savedGenerated);
    } catch(e) {}
  }, []);

  // Dynamically calculate combo data for generated orders
  const generatedOrders = (sharedOrderData || []).filter(o => o.status === 'Generated' && !completedOrders.some(c => c.orderId === o.id));
  const dynamicComboData = generatedOrders.flatMap(o => {
    const subs = o.subCustomers && o.subCustomers.length > 0 ? o.subCustomers : [{ name: o.customer || 'Single Project' }];
    const totalPanelsStr = o.equipment?.panels || '0';
    const totalNumPanels = parseInt(totalPanelsStr.replace(/\D/g, '')) || 0;
    const base = o.amount?.base || 0;
    const gst = o.amount?.gst || 0;
    const totalAmount = base + (base * gst / 100);

    return subs.map(sub => {
      const panelsPerSub = Math.round(totalNumPanels / subs.length);
      const capacityPerSub = o.panelDetails?.totalCapacity ? (o.panelDetails.totalCapacity / subs.length) : (panelsPerSub * 500);
      const kwPerSub = (capacityPerSub / 1000).toFixed(1) + ' KW';
      const pricePerSub = totalAmount / subs.length;

      return {
        vendorName: o.vendorName || 'N/A',
        brand: o.panelDetails?.brand || 'Mixed',
        product: sub.name || 'Combo Kit',
        technology: o.panelDetails?.technology || 'Polycrystalline',
        projectType: 'Commercial',
        wattPeak: o.panelDetails?.wattage || '-',
        totalKW: kwPerSub,
        totalPanels: panelsPerSub.toString(),
        totalPrice: pricePerSub.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
        deadline: 'Pending Proc.'
      };
    });
  });

  const validCompletedOrders = completedOrders.map(c => {
    const o = generatedOrdersCache.find(g => g.id === c.orderId) || (sharedOrderData || []).find(o => o.id === c.orderId);
    return { ...c, originalOrder: o };
  }).filter(c => c.originalOrder);

  const completedComboData = validCompletedOrders.map(c => {
    const o = c.originalOrder;
    const panelsStr = o.equipment?.panels || '0';
    const numPanels = parseInt(panelsStr.replace(/\D/g, '')) || 0;
    const totalCapacity = o.panelDetails?.totalCapacity || (numPanels * 500);
    const totalKw = (totalCapacity / 1000).toFixed(1) + ' KW';
    
    return {
      orderId: o.id,
      procurementNo: c.procurementNo || '-',
      vendorName: o.vendorName || 'N/A',
      brand: 'Mixed',
      product: `Custom Combo Kit (${o.subCustomers?.length || 1} Projects)`,
      technology: o.panelDetails?.technology || 'Polycrystalline',
      projectType: 'Mixed',
      wattPeak: o.panelDetails?.wattage || '-',
      totalKW: totalKw,
      totalPanels: numPanels.toString(),
      totalPrice: typeof c.amount === 'string' ? c.amount.replace('₹', '') : c.amount || '-',
      deadline: 'Paid',
      originalOrder: o
    };
  });

  // Only show data that has been successfully paid in Warehouse Vendor Pay
  const comboData = [...completedComboData];

  let displayData = [];
  if (kitMode === 'ComboKit') {
    displayData = comboData;
  } else {
    displayData = tableData;
    if (componentFilter !== 'All') {
      displayData = displayData.filter(row => row.product === componentFilter);
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(displayData.map((_, idx) => idx));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (idx) => {
    if (selectedRows.includes(idx)) {
      setSelectedRows(selectedRows.filter(i => i !== idx));
    } else {
      setSelectedRows([...selectedRows, idx]);
    }
  };

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
  }, []);

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-screen space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-[#145a80] p-4 text-white flex justify-between items-center shadow rounded-lg">
        <h1 className="text-lg font-bold">Procurement Number</h1>
        <div className="flex space-x-4 items-center">
          <span className="bg-yellow-500 px-3 py-1 text-[11px] font-bold rounded-full border border-yellow-400 text-white shadow-sm">Status: Procurement Pending</span>
        </div>
      </div>

      <div className="flex space-x-4">
         <button className="bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded text-xs font-bold hover:bg-blue-100 transition shadow-sm">Pending Days Filter</button>
         <button className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded text-xs font-bold hover:bg-red-100 transition shadow-sm">Overdue Days Filter</button>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button 
          onClick={() => { setKitMode('ComboKit'); setSelectedRows([]); }}
          className={`${kitMode === 'ComboKit' ? 'bg-[#0b74ba] text-white' : 'bg-transparent text-[#0b74ba] border border-[#0b74ba] hover:bg-blue-50'} text-xs font-semibold px-4 py-2 rounded shadow flex items-center space-x-1 transition`}>
          <Zap size={14}/><span>ComboKit</span>
        </button>
        <button 
          onClick={() => { setKitMode('CustomizeKit'); setSelectedRows([]); }}
          className={`${kitMode === 'CustomizeKit' ? 'bg-[#0b74ba] text-white' : 'bg-transparent text-[#0b74ba] border border-[#0b74ba] hover:bg-blue-50'} text-xs font-semibold px-4 py-2 rounded shadow flex items-center space-x-1 transition`}>
          <Settings size={14}/><span>Customize Kit</span>
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4 mt-4">
        <div>
          <label className="block text-gray-700 font-medium text-[12px] mb-1">Order Type</label>
          <div className="relative w-40">
            <select className="appearance-none w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-700 focus:outline-none focus:border-blue-400 bg-white">
              <option>All</option>
              <option>Cash</option>
              <option>Loan</option>
              <option>EMI</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium text-[12px] mb-1">Order Since</label>
          <div className="relative w-40">
            <select className="appearance-none w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-700 focus:outline-none focus:border-blue-400 bg-white">
              <option>All</option>
              <option>Today</option>
              <option>Last 3 Days</option>
              <option>Last 7 Days</option>
              <option>Last 15 Days</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>

        {kitMode === 'CustomizeKit' && (
          <div>
            <label className="block text-gray-700 font-medium text-[12px] mb-1">Component Type</label>
            <div className="relative w-40">
              <select 
                value={componentFilter}
                onChange={(e) => setComponentFilter(e.target.value)}
                className="appearance-none w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-700 focus:outline-none focus:border-blue-400 bg-white"
              >
                <option value="All">All Components</option>
                <option value="Solar Panel">Solar Panel</option>
                <option value="Inverter">Inverter</option>
                <option value="BOS Kit">BOS Kit</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-gray-700 font-medium text-[12px] mb-1">Solar Panel Brand</label>
          <div className="relative w-40">
            <select className="appearance-none w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-700 focus:outline-none focus:border-blue-400 bg-white">
              <option value="">All</option>
              {dashboardData.panelBrands && dashboardData.panelBrands.length > 0 ? (
                dashboardData.panelBrands.map((brand, idx) => (
                  <option key={idx} value={brand}>{brand}</option>
                ))
              ) : (
                <>
                  <option>WAAREE</option>
                  <option>Adani</option>
                  <option>Tata Power</option>
                  <option>Vikram Solar</option>
                </>
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-x-auto mt-6">
        <table className="w-full text-xs text-left min-w-[1100px]">
          <thead className="bg-[#7fb4eb] text-white">
            <tr>
              <th className="px-4 py-3 font-medium border-r border-blue-300 w-12 text-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded cursor-pointer"
                  onChange={handleSelectAll}
                  checked={selectedRows.length === displayData.length && displayData.length > 0}
                />
              </th>
              <th className="px-4 py-3 font-medium border-r border-blue-300 w-[100px]">Order Number</th>
              <th className="px-4 py-3 font-medium border-r border-blue-300 w-[130px]">Procurement Number</th>
              <th className="px-4 py-3 font-medium border-r border-blue-300 w-[120px]">Vendor Name</th>
              <th className="px-3 py-3 font-medium border-r border-blue-300">Brand</th>
              <th className="px-3 py-3 font-medium border-r border-blue-300">Product</th>
              <th className="px-3 py-3 font-medium border-r border-blue-300">Technology</th>
              <th className="px-3 py-3 font-medium border-r border-blue-300">Project Type</th>
              <th className="px-3 py-3 font-medium border-r border-blue-300">Watt Peak</th>
              <th className="px-3 py-3 font-medium border-r border-blue-300">Total KW</th>
              <th className="px-3 py-3 font-medium border-r border-blue-300">Total Panels</th>
              <th className="px-3 py-3 font-medium border-r border-blue-300">Total Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-4 border-r border-gray-100 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded cursor-pointer text-blue-600"
                    onChange={() => handleSelectRow(idx)}
                    checked={selectedRows.includes(idx)}
                  />
                </td>
                <td className="px-4 py-4 border-r border-gray-100 text-gray-700 font-bold text-center">
                  {row.orderId || '-'}
                </td>
                <td className="px-4 py-4 border-r border-gray-100 text-blue-700 font-bold text-center">
                  {row.procurementNo || '-'}
                </td>
                <td className="px-4 py-4 border-r border-gray-100 text-gray-700 font-medium break-words leading-tight">
                  {row.vendorName}
                </td>
                <td className="px-3 py-4 border-r border-gray-100 text-gray-700">{row.brand}</td>
                <td className="px-3 py-4 border-r border-gray-100 text-gray-700 font-bold">{row.product}</td>
                <td className="px-3 py-4 border-r border-gray-100 text-gray-700">{row.technology}</td>
                <td className="px-3 py-4 border-r border-gray-100 text-gray-700">{row.projectType}</td>
                <td className="px-3 py-4 border-r border-gray-100 text-gray-700">{row.wattPeak}</td>
                <td className="px-3 py-4 border-r border-gray-100 text-gray-700">{row.totalKW}</td>
                <td className="px-3 py-4 border-r border-gray-100 text-gray-700">{row.totalPanels}</td>
                <td className="px-3 py-4 border-r border-gray-100 text-gray-700 font-medium">₹{row.totalPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer Actions */}
      <div className="flex justify-end mt-6 pb-6 space-x-4">
        <button 
          onClick={() => alert("Payment Made to Vendor!")}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded text-[13px] font-bold shadow-md transition"
        >
          Make Payment to Vendor
        </button>
        <button 
          onClick={onNext}
          className="bg-[#2cb25d] hover:bg-green-700 text-white px-6 py-2.5 rounded text-[13px] font-bold shadow-md transition flex items-center"
        >
          Generate Procurement Number <ChevronDown size={16} className="ml-1 -rotate-90"/>
        </button>
      </div>
    </div>
  );
}
