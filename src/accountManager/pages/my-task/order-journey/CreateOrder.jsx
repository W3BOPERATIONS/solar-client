import React, { useState, useEffect } from 'react';
import { ChevronDown, Home, Building2, Zap, X, Upload, Check } from 'lucide-react';
import api from '../../../../api/axios';

export default function CreateOrder() {
  const [dashboardData, setDashboardData] = useState({
    headerCounters: { todayTasks: 0, pendingTasks: 0, overdueTasks: 0 },
    locationCounters: [],
    locationHierarchy: {},
    categoryStats: [],
    vendors: []
  });

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [activeTab, setActiveTab] = useState('ComboKit');

  const locationHierarchy = dashboardData?.locationHierarchy || {};

  const availableCountries = Object.keys(locationHierarchy);
  const availableStates = (selectedCountry && selectedCountry !== 'All' && locationHierarchy[selectedCountry]) ? Object.keys(locationHierarchy[selectedCountry]) : [];
  const availableDistricts = (selectedState && selectedState !== 'All' && selectedCountry && locationHierarchy[selectedCountry]?.[selectedState]) ? Object.keys(locationHierarchy[selectedCountry][selectedState]) : [];
  const availableClusters = (selectedDistrict && selectedDistrict !== 'All' && selectedState && selectedCountry && locationHierarchy[selectedCountry]?.[selectedState]?.[selectedDistrict]) ? locationHierarchy[selectedCountry][selectedState][selectedDistrict] : [];

  const IconMap = {
    'Home': <Home size={24} />,
    'Building2': <Building2 size={24} />,
    'Zap': <Zap size={24} />
  };

  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/account-manager/create-order-data');
        if (response.data?.success) {
          setDashboardData(response.data.data);
          setTableData(response.data.data.tableData);
        }
      } catch (error) {
        console.error("Failed to fetch Create Order data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Vendor Inventory Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [selectedSupplyVendor, setSelectedSupplyVendor] = useState(null);

  const inventoryVendors = [
    {
      id: 1,
      name: 'Rajesh Solar Distributors',
      panels: { total: '150 Panels', breakDown: ['Adani: 80', 'Waaree: 40', 'Vikram: 30'] },
      inverters: { total: '35 Units', breakDown: ['Adani: 20', 'Tata: 15'] },
      bosKits: { total: '45 Kits', breakDown: ['Generic: 25', 'Premium: 20'] }
    },
    {
      id: 2,
      name: 'Mayank Solar Distributors',
      panels: { total: '120 Panels', breakDown: ['Waaree: 60', 'Adani: 30', 'Tata: 30'] },
      inverters: { total: '25 Units', breakDown: ['Waaree: 15', 'Generic: 10'] },
      bosKits: { total: '30 Kits', breakDown: ['Standard: 18', 'Economy: 12'] }
    },
    {
      id: 3,
      name: 'Sun Solar Distributors',
      panels: { total: '100 Panels', breakDown: ['Vikram: 50', 'Waaree: 25', 'Tata: 25'] },
      inverters: { total: '20 Units', breakDown: ['Vikram: 10', 'Adani: 10'] },
      bosKits: { total: '22 Kits', breakDown: ['Essential: 12', 'Pro: 10'] }
    },
    {
      id: 4,
      name: 'Vijay Solar Distributors',
      panels: { total: '90 Panels', breakDown: ['Tata: 70', 'Adani: 20'] },
      inverters: { total: '18 Units', breakDown: ['Tata: 10', 'Waaree: 8'] },
      bosKits: { total: '20 Kits', breakDown: ['Tata: 12', 'Universal: 8'] }
    }
  ];

  const handleConfirmClick = (index) => {
    setSelectedRowIndex(index);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleUploadSubmit = () => {
    if (selectedRowIndex !== null && selectedFile) {
      const updatedData = tableData.filter((_, idx) => idx !== selectedRowIndex);
      setTableData(updatedData);
      setToast({ message: `Payment confirmed! Order has been moved to Delivery Plan.`, type: 'success' });
      setTimeout(() => setToast(null), 4000);
    }
    setIsModalOpen(false);
  };

  const handleGeneratePI = (index) => {
    const updatedData = [...tableData];
    updatedData[index].piGenerated = true;
    setTableData(updatedData);
    setToast({ message: `Proforma Invoice (PI) generated and sent to ${updatedData[index].cpName}!`, type: 'success' });
    setTimeout(() => setToast(null), 4000);
  };

  if (isLoading) return <div className="p-6 text-center text-gray-500">Loading Order Management...</div>;

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-screen space-y-8 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 text-white px-6 py-3 rounded shadow-lg animate-fade-in flex items-center space-x-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.type === 'error' ? <X size={20} /> : <Check size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#145a80] text-white p-4 rounded-lg flex justify-between items-center shadow-md">
        <h1 className="text-2xl font-bold tracking-wide">Order Management</h1>
        <div className="flex space-x-8">
          <div className="flex flex-col items-end">
            <span className="text-gray-200 text-xs uppercase tracking-wider font-semibold">Today's Task</span>
            <span className="text-white text-xl font-bold">{dashboardData.headerCounters.todayTasks}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-yellow-300 text-xs uppercase tracking-wider font-semibold">Pending Task</span>
            <span className="text-yellow-400 text-xl font-bold">{dashboardData.headerCounters.pendingTasks}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-red-300 text-xs uppercase tracking-wider font-semibold">Overdue Task</span>
            <span className="text-red-400 text-xl font-bold">{dashboardData.headerCounters.overdueTasks}</span>
          </div>
        </div>
      </div>


      {/* Location Card Selection UI */}
      <div className="space-y-6">
        {/* Country */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 text-[15px]">Select Country</h3>
            <button className="text-blue-500 text-xs hover:underline">Select All</button>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            <div 
              onClick={() => setSelectedCountry('All')}
              className={`flex-shrink-0 cursor-pointer w-48 p-4 rounded-lg border text-center transition-all ${selectedCountry === 'All' ? 'bg-[#ebf5ff] border-blue-400' : 'bg-white border-gray-200'}`}
            >
              <p className="font-bold text-sm text-gray-800">All Countries</p>
              <p className="text-[10px] text-gray-400 uppercase mt-1">ALL</p>
            </div>
            {availableCountries.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedCountry(item)}
                className={`flex-shrink-0 cursor-pointer w-48 p-4 rounded-lg border text-center transition-all ${selectedCountry === item ? 'bg-[#ebf5ff] border-blue-400' : 'bg-white border-gray-200'}`}
              >
                <p className="font-bold text-sm text-gray-800">{item}</p>
                <p className="text-[10px] text-gray-400 uppercase mt-1">{item.substring(0, 2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* State */}
        {selectedCountry && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 text-[15px]">Select State</h3>
              <button className="text-blue-500 text-xs hover:underline">Select All</button>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
              <div 
                onClick={() => setSelectedState('All')}
                className={`flex-shrink-0 cursor-pointer w-48 p-4 rounded-lg border text-center transition-all ${selectedState === 'All' ? 'bg-[#ebf5ff] border-blue-400' : 'bg-white border-gray-200'}`}
              >
                <p className="font-bold text-sm text-gray-800">All States</p>
                <p className="text-[10px] text-gray-400 uppercase mt-1">ALL</p>
              </div>
              {availableStates.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedState(item)}
                className={`flex-shrink-0 cursor-pointer w-48 p-4 rounded-lg border text-center transition-all ${selectedState === item ? 'bg-[#ebf5ff] border-blue-400' : 'bg-white border-gray-200'}`}
              >
                <p className="font-bold text-sm text-gray-800">{item}</p>
                <p className="text-[10px] text-gray-400 uppercase mt-1">{item.substring(0, 2)}</p>
              </div>
            ))}
          </div>
          </div>
        )}

        {/* District */}
        {selectedState && availableDistricts.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 text-[15px]">Select District</h3>
              <button className="text-blue-500 text-xs hover:underline">Select All</button>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
              <div 
                onClick={() => setSelectedDistrict('All')}
                className={`flex-shrink-0 cursor-pointer w-48 p-4 rounded-lg border text-center transition-all ${selectedDistrict === 'All' ? 'bg-[#ebf5ff] border-blue-400' : 'bg-white border-gray-200'}`}
              >
                <p className="font-bold text-sm text-gray-800">All Districts</p>
                <p className="text-[10px] text-gray-400 uppercase mt-1">ALL</p>
              </div>
              {availableDistricts.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedDistrict(item)}
                  className={`flex-shrink-0 cursor-pointer w-48 p-4 rounded-lg border text-center transition-all ${selectedDistrict === item ? 'bg-[#ebf5ff] border-blue-400' : 'bg-white border-gray-200'}`}
                >
                  <p className="font-bold text-sm text-gray-800">{item}</p>
                  <p className="text-[10px] text-gray-400 uppercase mt-1">DIST</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cluster */}
        {selectedDistrict && availableClusters.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 text-[15px]">Select Cluster</h3>
              <button className="text-blue-500 text-xs hover:underline">Select All</button>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
              <div 
                onClick={() => setSelectedCluster('All')}
                className={`flex-shrink-0 cursor-pointer w-48 p-4 rounded-lg border text-center transition-all ${selectedCluster === 'All' ? 'bg-[#ebf5ff] border-blue-400' : 'bg-white border-gray-200'}`}
              >
                <p className="font-bold text-sm text-gray-800">All Clusters</p>
                <p className="text-[10px] text-gray-400 uppercase mt-1">ALL</p>
              </div>
              {availableClusters.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedCluster(item)}
                  className={`flex-shrink-0 cursor-pointer w-48 p-4 rounded-lg border text-center transition-all ${selectedCluster === item ? 'bg-[#ebf5ff] border-blue-400' : 'bg-white border-gray-200'}`}
                >
                  <p className="font-bold text-sm text-gray-800">{item}</p>
                  <p className="text-[10px] text-gray-400 uppercase mt-1">CLST</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs / Buttons */}
      <div className="flex space-x-2 mt-6 lg:mt-0 justify-end">
         <button 
           onClick={() => setActiveTab('ComboKit')}
           className={`${activeTab === 'ComboKit' ? 'bg-green-600 ring-2 ring-green-300' : 'bg-[#2cb25d]'} text-white text-xs font-semibold px-4 py-1.5 rounded shadow-sm hover:bg-green-700 transition`}
         >
           Combo kit
         </button>
         <button 
           onClick={() => setActiveTab('CustomizeKit')}
           className={`${activeTab === 'CustomizeKit' ? 'bg-blue-700 ring-2 ring-blue-300' : 'bg-[#0b74ba]'} text-white text-xs font-semibold px-4 py-1.5 rounded shadow-sm hover:bg-blue-800 transition`}
         >
           Customize Kit
         </button>
         <button className="bg-purple-600 text-white text-xs font-semibold px-4 py-1.5 rounded shadow-sm hover:bg-purple-700 transition">
           Bulk Buy
         </button>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dashboardData.categoryStats?.map((category, idx) => (
          <div key={idx} className={`bg-white p-5 rounded-lg border border-gray-200 border-l-4 shadow-sm flex flex-col justify-between ${category.colorClass.split(' ')[0]}`}>
            <div className={`flex items-center space-x-2 mb-4 ${category.colorClass.split(' ')[1]}`}>
              {IconMap[category.icon] || <Zap size={24} />}
              <span className="text-xl font-bold">{category.title}</span>
            </div>
            <div className="flex justify-between mt-2">
              <div className="text-center">
                 <p className="text-xs text-gray-500">Total Order</p>
                 <p className="text-lg font-bold text-gray-800">{category.total}</p>
              </div>
              <div className="text-center">
                 <p className="text-xs text-gray-500">Overdue Order</p>
                 <p className="text-lg font-bold text-yellow-500">{category.overdue}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Global Filters */}
      <div className="mt-6 flex space-x-2 mb-4 items-center">
        <div className="flex flex-col">
          <label className="text-[10px] text-gray-500 font-semibold mb-1">Select solar panel brand</label>
          <select className="border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option>All Brands</option>
            {dashboardData?.panelBrands?.map((brand, idx) => (
              <option key={idx} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] text-gray-500 font-semibold mb-1">Order Status</label>
          <select className="border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-700 bg-white">
            <option>All Order Status</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] text-gray-500 font-semibold mb-1">Supply Type</label>
          <select className="border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-700 bg-white">
            <option>All Supply Type</option>
          </select>
        </div>
      </div>

      {/* Conditional Rendering based on Tabs */}
      {activeTab === 'ComboKit' ? (
        <>
          <div className="mt-6 bg-white border border-gray-200 shadow-sm overflow-x-auto relative rounded-lg">
            <table className="w-full text-xs text-left min-w-[1000px]">
              <thead className="bg-[#7fb4eb] text-white">
                <tr>
                  <th className="px-3 py-3 font-medium">Partner Name</th>
                  <th className="px-3 py-3 font-medium text-center">Partner Logo</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium text-center">Type</th>
                  <th className="px-3 py-3 font-medium">Details</th>
                  <th className="px-3 py-3 font-medium">Solar Panel</th>
                  <th className="px-3 py-3 font-medium">Inverter</th>
                  <th className="px-3 py-3 font-medium">BOS Kit</th>
                  <th className="px-3 py-3 font-medium text-center">Generate Payment Receipt</th>
                  <th className="px-3 py-3 font-medium text-center">Status</th>
                  <th className="px-3 py-3 font-medium text-center">Order No.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 py-4 text-gray-800">{row.cpName}</td>
                    <td className="px-3 py-4">
                      <div className="flex justify-center">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[7px] font-bold text-blue-700 border border-blue-200 shadow-sm overflow-hidden">
                           CP
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-gray-800">{row.customer}</td>
                    <td className="px-3 py-4 text-center">
                      <button className="bg-[#0b74ba] text-white text-[10px] font-medium px-2 py-1 rounded">Customize</button>
                    </td>
                    <td className="px-3 py-4 space-y-1 text-gray-800">
                      <p className="font-bold">KW: <span className="font-normal">{row.kw}</span></p>
                      <p className="font-bold">₹: <span className="font-normal">{row.price}</span></p>
                      <p className="font-bold">Payment: <span className="font-normal">{row.payment}</span></p>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-col space-y-1.5">
                        <div className="flex items-center space-x-1.5">
                           <span className="bg-green-100 border border-green-300 text-[8px] text-green-700 px-1 py-0.5 rounded font-bold w-12 text-center">Waaree</span>
                           <span className="text-[10px] font-medium text-gray-600">3</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                           <span className="bg-blue-100 border border-blue-300 text-[8px] text-blue-700 px-1 py-0.5 rounded font-bold w-12 text-center">Adani</span>
                           <span className="text-[10px] font-medium text-gray-600">2</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-col space-y-1.5">
                        <div className="flex items-center space-x-1.5">
                           <span className="bg-purple-100 border border-purple-300 text-[8px] text-purple-700 px-1 py-0.5 rounded font-bold w-12 text-center">Waaree</span>
                           <span className="text-[10px] font-medium text-gray-600">1</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                       <div className="flex items-center space-x-1.5">
                          <span className="bg-blue-100 border border-blue-300 text-[8px] text-blue-700 px-1 py-0.5 rounded font-bold w-12 text-center">Adani</span>
                          <span className="text-[10px] font-medium text-gray-600">1</span>
                       </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <button 
                        onClick={() => {
                          if ((row.solarPanelInventory || 0) > 0) {
                            handleConfirmClick(idx);
                          } else {
                            setToast({ message: 'Insufficient Solar Panel Inventory!', type: 'error' });
                            setTimeout(() => setToast(null), 3000);
                          }
                        }}
                        disabled={(row.solarPanelInventory || 0) === 0}
                        className={`${(row.solarPanelInventory || 0) === 0 ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-[#2cb25d] hover:bg-green-600'} text-white font-bold text-[10px] px-3 py-1.5 rounded transition-colors`}
                      >
                        Generate
                      </button>
                    </td>
                    <td className="px-3 py-4 text-center">
                      {row.status === 'Confirmed' ? (
                        <span className="bg-[#2cb25d] text-white px-2 py-1 text-[10px] rounded font-semibold">{row.status}</span>
                      ) : (
                        <span className="bg-yellow-400 text-white px-2 py-1 text-[10px] rounded font-semibold">{row.status}</span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-center text-gray-800 font-medium">
                      {row.status === 'Confirmed' ? row.orderNo : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {/* Vendor Section for Customise Kit */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-800 font-bold text-[15px]">Select Vendor Section</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardData.vendors?.map((vendor, idx) => (
                <div key={idx} className="bg-white rounded-lg border-2 shadow-sm p-4 relative flex flex-col justify-between" style={{ borderColor: idx === 0 ? '#ef4444' : idx === 1 ? '#0ea5e9' : idx === 2 ? '#eab308' : '#22c55e' }}>
                  
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-800 mb-4">{vendor.name}</h3>
                    <div className="flex justify-between text-center mb-3">
                      <div>
                        <p className="text-[10px] text-gray-500">Total Orders</p>
                        <p className="font-bold text-lg text-gray-800">{vendor.orders}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Total KW</p>
                        <p className="font-bold text-lg text-[#0b74ba]">{vendor.kw} KW</p>
                      </div>
                    </div>
                    <div className="text-center mb-4">
                       <p className="text-[10px] text-gray-500">Total Panels</p>
                       <p className="font-bold text-md text-[#0b74ba]">{vendor.panels} Panels</p>
                    </div>
                    <div className="flex justify-between text-center border-t border-gray-100 pt-3">
                      <div>
                        <p className="text-[10px] text-gray-500">Technology</p>
                        <p className="font-bold text-[11px] text-green-600">{vendor.tech}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Watt Peak</p>
                        <p className="font-bold text-[11px] text-[#0b74ba]">{vendor.watt} Wp</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-4">
                      <button 
                        onClick={() => setIsVendorModalOpen(true)}
                        className="bg-[#0b74ba] hover:bg-blue-700 transition text-white text-[9px] font-bold px-2 py-1 rounded shadow-sm"
                      >
                        Supply by Vendors
                      </button>
                      <button className="bg-[#2cb25d] text-white text-[9px] font-bold px-2 py-1 rounded">Download P.O</button>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border text-[10px]">
                       <p className="text-gray-500 mb-1">Vendors & Payment Status</p>
                       <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-gray-700">Accept Order?</span>
                          {vendor.accepted ? (
                            <span className="bg-green-500 text-white px-2 py-0.5 rounded-sm font-bold text-[8px]">Accepted</span>
                          ) : (
                            <span className="bg-yellow-400 text-white px-2 py-0.5 rounded-sm font-bold text-[8px]">Pending</span>
                          )}
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800">{vendor.supplier}</span>
                          <span className="bg-yellow-400 text-white px-2 py-0.5 rounded-sm font-bold text-[8px]">{vendor.paymentStatus}</span>
                       </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Upload Payment Receipt Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg w-[400px] overflow-hidden">
            <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b">
              <h3 className="font-bold text-gray-800">Upload Payment Receipt</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">Please enter the received payment amount and upload the receipt to confirm the order.</p>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Received Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="Enter partial or full amount" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  accept="image/*,.pdf"
                />
                <Upload size={32} className="text-blue-500 mb-2" />
                <p className="text-sm font-medium text-gray-700">Click or drag file here</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 5MB</p>
              </div>

              {selectedFile && (
                <div className="mt-3 bg-green-50 text-green-700 text-xs px-3 py-2 rounded font-medium flex items-center">
                  Selected: {selectedFile.name}
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-4 py-3 border-t flex justify-end space-x-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
              <button 
                onClick={handleUploadSubmit} 
                disabled={!selectedFile}
                className={`px-4 py-1.5 text-sm font-bold text-white rounded transition-colors ${selectedFile ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
              >
                Upload & Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Vendors & View Inventory Modal */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#1a1a2e]">Select Vendors & View Inventory</h2>
              <button 
                onClick={() => setIsVendorModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 focus:outline-none transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f0f2f5] text-gray-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold w-12 text-center"></th>
                      <th className="px-4 py-3 font-semibold">Vendor</th>
                      <th className="px-4 py-3 font-semibold">Solar Panels</th>
                      <th className="px-4 py-3 font-semibold">Inverters</th>
                      <th className="px-4 py-3 font-semibold">BOS Kits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {inventoryVendors.map((vendor) => (
                      <tr 
                        key={vendor.id} 
                        className={`hover:bg-blue-50 transition-colors cursor-pointer ${selectedSupplyVendor === vendor.id ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedSupplyVendor(vendor.id)}
                      >
                        <td className="px-4 py-4 text-center">
                          <input 
                            type="radio" 
                            name="vendor_select"
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            checked={selectedSupplyVendor === vendor.id}
                            onChange={() => setSelectedSupplyVendor(vendor.id)}
                          />
                        </td>
                        <td className="px-4 py-4 font-bold text-gray-800">
                          {vendor.name}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-[13px] text-gray-800 mb-1">{vendor.panels.total}</p>
                          <div className="text-[10px] text-gray-500 space-y-0.5">
                            {vendor.panels.breakDown.map((line, i) => <p key={i}>{line}</p>)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-[13px] text-gray-800 mb-1">{vendor.inverters.total}</p>
                          <div className="text-[10px] text-gray-500 space-y-0.5">
                            {vendor.inverters.breakDown.map((line, i) => <p key={i}>{line}</p>)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-[13px] text-gray-800 mb-1">{vendor.bosKits.total}</p>
                          <div className="text-[10px] text-gray-500 space-y-0.5">
                            {vendor.bosKits.breakDown.map((line, i) => <p key={i}>{line}</p>)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-5 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={() => setIsVendorModalOpen(false)}
                className="px-5 py-2 text-sm font-semibold text-white bg-gray-500 rounded shadow-sm hover:bg-gray-600 transition"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  if(selectedSupplyVendor) {
                    setToast({ message: 'Vendor successfully assigned for supply!', type: 'success' });
                    setTimeout(() => setToast(null), 3000);
                    setIsVendorModalOpen(false);
                  }
                }}
                className={`px-5 py-2 text-sm font-semibold text-white rounded shadow-sm transition ${selectedSupplyVendor ? 'bg-[#0b74ba] hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
                disabled={!selectedSupplyVendor}
              >
                Proceed with Selected
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
