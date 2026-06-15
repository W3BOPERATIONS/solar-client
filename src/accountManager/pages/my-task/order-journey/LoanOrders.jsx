import React, { useState, useEffect } from 'react';
import { ChevronDown, Home, Building2, Zap, X, Upload, Check } from 'lucide-react';
import { locationAPI } from '../../../../api/api';
import api from '../../../../api/axios';

export default function LoanOrders() {
  const [activeLoanType, setActiveLoanType] = useState('Bank Loan');

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [clusters, setClusters] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);

  const [dashboardData, setDashboardData] = useState({});
  const [tableData, setTableData] = useState([]);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [selectedSupplyVendor, setSelectedSupplyVendor] = useState(null);
  const [toast, setToast] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleUploadSubmit = () => {
    if (selectedRowIndex !== null && selectedFile) {
      setToast({ message: `Payment confirmed! Receipt uploaded successfully.`, type: 'success' });
      setTimeout(() => setToast(null), 4000);
    }
    setIsModalOpen(false);
  };

  const inventoryVendors = dashboardData.inventoryVendors || [];

  const IconMap = {
    'Home': <Home size={24} />,
    'Building2': <Building2 size={24} />,
    'Zap': <Zap size={24} />
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/account-manager/create-order-data');
        if (response.data?.success) {
          setDashboardData(response.data.data);
          setTableData(response.data.data.tableData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };
    fetchDashboardData();
  }, []);

  const mapWithOrders = (data) => (data || []).map(item => ({ ...item, orders: Math.floor(Math.random() * 50) + 5 }));

  // Fetch initial countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const countryRes = await locationAPI.getAllCountries({ isActive: true });
        setCountries(mapWithOrders(countryRes.data?.data));
      } catch (error) {
        console.error("Failed to fetch countries", error);
      }
    };
    fetchCountries();
  }, []);

  // Fetch states when country is selected
  useEffect(() => {
    const fetchStates = async () => {
      if (!selectedCountry) {
        setStates([]);
        return;
      }
      try {
        const stateRes = await locationAPI.getAllStates({ isActive: true, countryId: selectedCountry });
        setStates(mapWithOrders(stateRes.data?.data));
      } catch (error) {
        console.error("Failed to fetch states", error);
      }
    };
    fetchStates();
  }, [selectedCountry]);

  // Fetch districts when state is selected
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedState) {
        setDistricts([]);
        return;
      }
      try {
        const districtRes = await locationAPI.getAllDistricts({ isActive: true, stateId: selectedState });
        setDistricts(mapWithOrders(districtRes.data?.data));
      } catch (error) {
        console.error("Failed to fetch districts", error);
      }
    };
    fetchDistricts();
  }, [selectedState]);

  // Fetch clusters when district is selected
  useEffect(() => {
    const fetchClusters = async () => {
      if (!selectedDistrict) {
        setClusters([]);
        return;
      }
      try {
        const clusterRes = await locationAPI.getAllClusters({ isActive: true, districtId: selectedDistrict });
        setClusters(mapWithOrders(clusterRes.data?.data));
      } catch (error) {
        console.error("Failed to fetch clusters", error);
      }
    };
    fetchClusters();
  }, [selectedDistrict]);

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-screen space-y-8">
      {/* Header */}
      <div className="bg-[#145a80] text-white p-4 rounded-lg flex justify-between items-center shadow-md">
        <h1 className="text-2xl font-bold tracking-wide">Order Management</h1>
        <div className="flex space-x-8">
          <div className="flex flex-col items-end">
            <span className="text-gray-200 text-xs uppercase tracking-wider font-semibold">Today's Task</span>
            <span className="text-white text-xl font-bold">12</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-yellow-300 text-xs uppercase tracking-wider font-semibold">Pending Task</span>
            <span className="text-yellow-400 text-xl font-bold">5</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-red-300 text-xs uppercase tracking-wider font-semibold">Overdue Task</span>
            <span className="text-red-400 text-xl font-bold">3</span>
          </div>
        </div>
      </div>

      {/* Loan Type Toggles */}
      <div className="flex justify-center space-x-6 mt-8">
        <button
          onClick={() => setActiveLoanType('Bank Loan')}
          className={`px-12 py-4 rounded-lg text-[15px] font-bold shadow-sm transition-all duration-200 ${
            activeLoanType === 'Bank Loan'
              ? 'bg-white text-[#142340] border-2 border-blue-500'
              : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
          }`}
        >
          Bank Loan
        </button>
        <button
          onClick={() => setActiveLoanType('Private Loan')}
          className={`px-12 py-4 rounded-lg text-[15px] font-bold shadow-sm transition-all duration-200 ${
            activeLoanType === 'Private Loan'
              ? 'bg-white text-[#142340] border-2 border-blue-500'
              : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
          }`}
        >
          Private Loan
        </button>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        {[
          { 
            label: 'Category', 
            placeholder: 'Select Category',
            options: dashboardData.dynamicDropdowns?.categories || ['Solar Panel 20', 'Inverter 8', 'Structure 15']
          },
          { 
            label: 'Sub Category', 
            placeholder: 'Select Sub Category',
            options: dashboardData.dynamicDropdowns?.categories || ['Sub Category 1', 'Sub Category 2']
          },
          { 
            label: 'Project Type', 
            placeholder: 'Select Project Type',
            options: dashboardData.dynamicDropdowns?.projectTypes || ['Commercial 12', 'Residential 45']
          },
          { 
            label: 'Sub Project Type', 
            placeholder: 'Select Sub Project Type',
            options: dashboardData.dynamicDropdowns?.subProjectTypes || ['Sub Project 1', 'Sub Project 2']
          },
        ].map((filter, idx) => (
          <div key={idx}>
            <label className="block text-[13px] text-gray-700 font-medium mb-1.5">{filter.label}</label>
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-300 text-gray-600 py-2.5 px-4 pr-8 rounded-lg text-sm w-full focus:outline-none focus:border-blue-400 shadow-sm transition-colors">
                <option value="">{filter.placeholder}</option>
                {filter.options.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Select Country Section */}
      <div className="mt-10">
        <h2 className="text-[14px] text-gray-800 font-medium mb-4">Select Country</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {countries.map((country, idx) => (
            <div 
              key={idx} 
              onClick={() => {
                setSelectedCountry(country._id);
                setSelectedState(null);
                setSelectedDistrict(null);
              }}
              className={`rounded-xl shadow-sm border p-6 flex flex-col items-center justify-center hover:shadow-md transition-all cursor-pointer ${selectedCountry === country._id ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-100'}`}
            >
              <h3 className={`text-lg font-bold ${selectedCountry === country._id ? 'text-blue-700' : 'text-gray-800'}`}>{country.name}</h3>
              <p className="text-[13px] text-gray-500 mt-2 font-medium">{country.orders} Orders</p>
            </div>
          ))}
        </div>
      </div>

      {/* Select State Section */}
      {selectedCountry && states.length > 0 && (
        <div className="mt-10">
          <h2 className="text-[14px] text-gray-800 font-medium mb-4">Select State</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {states.map((state, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  setSelectedState(state._id);
                  setSelectedDistrict(null);
                }}
                className={`rounded-xl shadow-sm border p-6 flex flex-col items-center justify-center hover:shadow-md transition-all cursor-pointer ${selectedState === state._id ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-100'}`}
              >
                <h3 className={`text-lg font-bold ${selectedState === state._id ? 'text-blue-700' : 'text-gray-800'}`}>{state.name}</h3>
                <p className="text-[13px] text-gray-500 mt-2 font-medium">{state.orders} Orders</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Select District Section */}
      {selectedState && districts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-[14px] text-gray-800 font-medium mb-4">Select District</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {districts.map((district, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedDistrict(district._id)}
                className={`rounded-xl shadow-sm border p-6 flex flex-col items-center justify-center hover:shadow-md transition-all cursor-pointer ${selectedDistrict === district._id ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-100'}`}
              >
                <h3 className={`text-lg font-bold ${selectedDistrict === district._id ? 'text-blue-700' : 'text-gray-800'}`}>{district.name}</h3>
                <p className="text-[13px] text-gray-500 mt-2 font-medium">{district.orders} Orders</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Select Cluster Section */}
      {selectedDistrict && clusters.length > 0 && (
        <div className="mt-10 mb-8">
          <h2 className="text-[14px] text-gray-800 font-medium mb-4">Select Cluster</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {clusters.map((cluster, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedCluster(cluster._id)}
                className={`rounded-xl shadow-sm border p-6 flex flex-col items-center justify-center hover:shadow-md transition-all cursor-pointer ${selectedCluster === cluster._id ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-100'}`}
              >
                <h3 className={`text-lg font-bold ${selectedCluster === cluster._id ? 'text-blue-700' : 'text-gray-800'}`}>{cluster.name}</h3>
                <p className="text-[13px] text-gray-500 mt-2 font-medium">{cluster.orders} Orders</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RENDER BOTTOM SECTIONS AFTER CLUSTER IS SELECTED */}
      {selectedCluster && dashboardData.categoryStats && (
        <div className="animate-fade-in mt-8 space-y-8">
          
          {/* Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboardData.categoryStats?.map((category, idx) => (
              <div key={idx} className={`bg-white p-5 rounded-lg border border-gray-200 border-l-4 shadow-sm flex flex-col justify-between ${category.colorClass?.split(' ')[0] || 'border-blue-500'}`}>
                <div className={`flex items-center space-x-2 mb-4 ${category.colorClass?.split(' ')[1] || 'text-blue-500'}`}>
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

          {/* Select Vendor Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-800 font-bold text-[15px]">Select Vendor Section</h2>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 font-medium">Order Status</span>
                  <select className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none">
                    <option>All</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 font-medium">Supply Type</span>
                  <select className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none">
                    <option>All</option>
                  </select>
                </div>
              </div>
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

          {/* Supply By Vendor Section */}
          <div className="mt-8">
            <h2 className="text-gray-800 font-bold text-[15px] mb-4">Supply By Vendor Section</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardData.vendors?.map((vendor, idx) => (
                <div key={`supply-${idx}`} className="bg-white rounded-lg border-2 shadow-sm p-4 relative flex flex-col justify-between" style={{ borderColor: idx === 0 ? '#ef4444' : idx === 1 ? '#0ea5e9' : idx === 2 ? '#eab308' : '#22c55e' }}>
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

          {/* Table */}
          <div className="mt-8 bg-white border border-gray-200 shadow-sm overflow-x-auto relative rounded-lg">
            <table className="w-full text-xs text-left min-w-[1200px]">
              <thead className="bg-[#7fb4eb] text-white">
                <tr>
                  <th className="px-3 py-3 font-medium">Partner Name</th>
                  <th className="px-3 py-3 font-medium text-center">Partner Logo</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium text-center">Type</th>
                  <th className="px-3 py-3 font-medium">Details</th>
                  <th className="px-3 py-3 font-medium">Loan Number</th>
                  <th className="px-3 py-3 font-medium">Loan Amount</th>
                  <th className="px-3 py-3 font-medium">Bank Name</th>
                  <th className="px-3 py-3 font-medium">Solar Panel</th>
                  <th className="px-3 py-3 font-medium">Inverter</th>
                  <th className="px-3 py-3 font-medium">BOS Kit</th>
                  <th className="px-3 py-3 font-medium text-center">Generate PI</th>
                  <th className="px-3 py-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 py-4 text-gray-800">{row.cpName}</td>
                    <td className="px-3 py-4">
                      <div className="flex justify-center">
                        <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center text-[7px] font-bold text-yellow-700 border border-yellow-200 shadow-sm overflow-hidden">
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
                    {/* Loan specific columns injected here */}
                    <td className="px-3 py-4 text-gray-800 font-medium">TZ349{Math.floor(Math.random()*10000)}</td>
                    <td className="px-3 py-4 font-bold text-gray-800 text-center">
                      {item.loanAmount ? `₹${item.loanAmount}` : '₹550,000'}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className="bg-gray-100 px-2 py-1 rounded text-[10px] text-gray-600 font-medium">
                        {item.bankName ? item.bankName : (idx % 2 === 0 ? 'State Bank of India' : 'HDFC Bank')}
                      </span>
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
                          setSelectedRowIndex(idx);
                          setSelectedFile(null);
                          setIsModalOpen(true);
                        }}
                        className="bg-[#2cb25d] hover:bg-green-600 text-white font-bold text-[10px] px-3 py-1.5 rounded transition-colors"
                      >
                        Generate PI
                      </button>
                    </td>
                    <td className="px-3 py-4 text-center">
                      {row.status === 'Confirmed' ? (
                        <span className="text-gray-600 px-2 py-1 text-[10px] rounded font-semibold">{row.status}</span>
                      ) : (
                        <span className="text-gray-600 px-2 py-1 text-[10px] rounded font-semibold">{row.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    setIsVendorModalOpen(false);
                    alert("Vendor successfully assigned for supply!");
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

      {/* Upload Payment Receipt Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg w-[400px] overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b">
              <h3 className="font-bold text-gray-800">Generate PI & Upload Receipt</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">Please enter the received payment amount and upload the receipt to generate PI.</p>
              
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

    </div>
  );
}
