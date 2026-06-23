import React, { useState, useEffect } from 'react';
import { ChevronDown, Home, Building2, Zap, X, Upload, Check, FileText, AlertTriangle } from 'lucide-react';
import api from '../../../../api/axios';
import { getAllManufacturers } from '../../../../services/brand/brandApi';

const IconMap = {
  'Home': <Home size={24} />,
  'Building2': <Building2 size={24} />,
  'Zap': <Zap size={24} />
};

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

export default function CreateOrder({ onNext, setSharedOrderData, dashboardData: initialDashboardData, setDashboardData: setGlobalDashboardData }) {
  const [dashboardData, setDashboardData] = useState({
    headerCounters: { todayTasks: 0, pendingTasks: 0, overdueTasks: 0 },
    locationCounters: [],
    locationHierarchy: {},
    categoryStats: [],
    vendors: []
  });

  const [activeTab, setActiveTab] = useState('ComboKit');

  const [panelBrandFilter, setPanelBrandFilter] = useState('All');
  const [technologyFilter, setTechnologyFilter] = useState('All');
  const [wattageFilter, setWattageFilter] = useState('All');
  
  const [selectedRows, setSelectedRows] = useState([]);



  const [tableData, setTableData] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const filteredTableData = React.useMemo(() => {
    return tableData.filter((row, idx) => {
      const mockBrand = idx === 0 ? ['Waaree', 'Adani'] : idx === 1 ? ['Tata', 'Waaree'] : ['Vikram', 'Adani', 'Waaree', 'Tata'];
      const mockTech = idx === 0 ? 'Monocrystalline' : idx === 1 ? 'Polycrystalline' : 'Bifacial';
      const mockWatt = idx === 0 ? '540W' : idx === 1 ? '500W' : '550W';

      if (panelBrandFilter !== 'All' && !mockBrand.includes(panelBrandFilter)) return false;
      if (technologyFilter !== 'All' && technologyFilter !== mockTech) return false;
      if (wattageFilter !== 'All' && wattageFilter !== mockWatt) return false;

      return true;
    });
  }, [tableData, panelBrandFilter, technologyFilter, wattageFilter]);

  const totalSummary = React.useMemo(() => {
    let panels = 0;
    let kw = 0;

    filteredTableData.forEach((row) => {
      if (row.kw) {
        kw += parseFloat(row.kw) || 0;
      }

      const originalIdx = tableData.indexOf(row);
      const mockBrand = originalIdx === 0 ? ['Waaree', 'Adani'] : originalIdx === 1 ? ['Tata', 'Waaree'] : ['Vikram', 'Adani', 'Waaree', 'Tata'];

      if (panelBrandFilter !== 'All') {
        const brandIndex = mockBrand.indexOf(panelBrandFilter);
        if (brandIndex === 0) panels += 3;
        else if (brandIndex === 1) panels += 2;
        else if (brandIndex > 1) panels += 1;
      } else {
        panels += 5;
      }
    });

    return {
      panels,
      kw: kw.toFixed(1).replace(/\.0$/, '') // Remove trailing .0 if integer
    };
  }, [filteredTableData, tableData, panelBrandFilter]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const manufacturersData = await getAllManufacturers();
        setManufacturers(manufacturersData || []);
        
        if (!initialDashboardData) {
          const response = await api.get('/dashboard/account-manager/create-order-data');
          if (response.data?.success) {
            setDashboardData(response.data.data);
            setTableData(response.data.data.tableData || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch Create Order data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [initialDashboardData]);

  useEffect(() => {
    if (initialDashboardData) {
      setDashboardData(initialDashboardData);
      setTableData(initialDashboardData.tableData || []);
    }
  }, [initialDashboardData]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Vendor Inventory Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [selectedSupplyVendor, setSelectedSupplyVendor] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [enteredPrice, setEnteredPrice] = useState('');
  const [tentativeDays, setTentativeDays] = useState('');
  const [gstPercent, setGstPercent] = useState('');
  const [isDoubleConfirmOpen, setIsDoubleConfirmOpen] = useState(false);
  const [vendorEmail, setVendorEmail] = useState('');



  const inventoryStats = React.useMemo(() => {
    let available = 0;
    
    inventoryVendors.forEach(vendor => {
      vendor.panels.breakDown.forEach(line => {
        const [brand, countStr] = line.split(':');
        const count = parseInt(countStr.trim(), 10) || 0;
        
        if (panelBrandFilter === 'All' || brand.trim() === panelBrandFilter) {
          available += count;
        }
      });
    });

    let required = 0;
    if (selectedRows.length > 0) {
      selectedRows.forEach(idx => {
        const row = filteredTableData[idx];
        if (!row) return;
        const originalIdx = tableData.indexOf(row);
        const mockBrand = originalIdx === 0 ? ['Waaree', 'Adani'] : originalIdx === 1 ? ['Tata', 'Waaree'] : ['Vikram', 'Adani', 'Waaree', 'Tata'];
        
        if (panelBrandFilter !== 'All') {
          const brandIndex = mockBrand.indexOf(panelBrandFilter);
          if (brandIndex === 0) required += 3;
          else if (brandIndex === 1) required += 2;
          else if (brandIndex > 1) required += 1;
        } else {
          required += 5;
        }
      });
    } else {
      required = totalSummary.panels;
    }

    return {
      available,
      required
    };
  }, [panelBrandFilter, selectedRows, filteredTableData, tableData, totalSummary.panels]);

  const selectedOrderDetails = React.useMemo(() => {
    const requiredBreakdown = {};
    const techs = new Set();
    const watts = new Set();
    let totalCalculatedWattage = 0;
    
    if (selectedRows.length > 0) {
      selectedRows.forEach(idx => {
        const row = filteredTableData[idx];
        if (!row) return;
        const originalIdx = tableData.indexOf(row);
        const mockBrand = originalIdx === 0 ? ['Waaree', 'Adani'] : originalIdx === 1 ? ['Tata', 'Waaree'] : ['Vikram', 'Adani', 'Waaree', 'Tata'];
        const mockTech = originalIdx === 0 ? 'Monocrystalline' : originalIdx === 1 ? 'Polycrystalline' : 'Bifacial';
        const mockWatt = originalIdx === 0 ? '540W' : originalIdx === 1 ? '500W' : '550W';
        
        techs.add(mockTech);
        watts.add(mockWatt);
        
        let panelsForThisRow = 0;
        if (panelBrandFilter !== 'All') {
          const brandIndex = mockBrand.indexOf(panelBrandFilter);
          if (brandIndex === 0) {
            panelsForThisRow = 3;
            requiredBreakdown[panelBrandFilter] = (requiredBreakdown[panelBrandFilter] || 0) + 3;
          } else if (brandIndex === 1) {
            panelsForThisRow = 2;
            requiredBreakdown[panelBrandFilter] = (requiredBreakdown[panelBrandFilter] || 0) + 2;
          } else if (brandIndex > 1) {
            panelsForThisRow = 1;
            requiredBreakdown[panelBrandFilter] = (requiredBreakdown[panelBrandFilter] || 0) + 1;
          }
        } else {
           panelsForThisRow = 5;
           if (mockBrand[0]) requiredBreakdown[mockBrand[0]] = (requiredBreakdown[mockBrand[0]] || 0) + 5;
        }
        totalCalculatedWattage += panelsForThisRow * (parseInt(mockWatt) || 0);
      });
    } else {
       requiredBreakdown['Mixed Brands'] = totalSummary.panels;
    }
    
    const techString = technologyFilter !== 'All' ? technologyFilter : Array.from(techs).join(', ') || 'Mixed Technology';
    const wattString = wattageFilter !== 'All' ? wattageFilter : Array.from(watts).join(', ') || 'Mixed Wattage';

    return {
      requiredBreakdown,
      techString,
      wattString,
      totalCalculatedWattage
    };
  }, [selectedRows, filteredTableData, tableData, panelBrandFilter, technologyFilter, wattageFilter, totalSummary.panels]);

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

  const handleFinalConfirm = () => {
    const vendor = inventoryVendors.find(v => v.id === selectedSupplyVendor);
    const selectedData = selectedRows.map(idx => filteredTableData[idx]);

    if (setSharedOrderData && selectedData.length > 0) {
      const groupedOrder = {
        id: `PO${Math.floor(100000 + Math.random() * 900000)}`,
        customer: selectedData.length > 1 ? `Group of ${selectedData.length} Projects` : (selectedData[0].customer || 'Customer'),
        subCustomers: selectedData.map(row => ({ ...row, name: row.customer, partner: row.cpName || 'N/A' })),
        paymentMode: 'Bank Transfer',
        utr: 'Pending',
        status: 'Pending',
        vendorName: vendor.name,
        pendingDays: Math.floor(Math.random() * 8) + 2, // Mock 2-9 days pending
        overdueDays: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : 0, // 50% chance of 1-5 days overdue
        equipment: {
          panels: `${inventoryStats.required} Panels`,
          inverters: `${selectedData.length} Units`,
          bos: `${selectedData.length} Kits`
        },
        panelDetails: {
          brands: selectedOrderDetails.requiredBreakdown,
          technology: selectedOrderDetails.techString,
          wattage: selectedOrderDetails.wattString,
          totalCapacity: selectedOrderDetails.totalCalculatedWattage
        },
        amount: {
          base: enteredPrice ? (selectedOrderDetails.totalCalculatedWattage * parseFloat(enteredPrice)) : 0,
          gst: gstPercent ? parseFloat(gstPercent) : 0
        }
      };
      
      setSharedOrderData(prev => [...prev, groupedOrder]);
    }

    const updatedData = tableData.filter(row => !selectedData.includes(row));
    setTableData(updatedData);
    if (setGlobalDashboardData) {
      setGlobalDashboardData(prev => ({ ...prev, tableData: updatedData }));
    }
    setToast({ 
      message: vendorEmail 
        ? `PO Generated and emailed to ${vendorEmail}! ${selectedData.length} Order(s) moved to Procurement.` 
        : `PO Generated! ${selectedData.length} Order(s) moved to Procurement.`, 
      type: 'success' 
    });
    setIsDoubleConfirmOpen(false);
    setIsPreviewModalOpen(false);
    setSelectedRowIndex(null);
    setSelectedRows([]);
    setSelectedSupplyVendor(null);
    if (onNext) {
      setTimeout(() => {
        onNext();
      }, 1000);
    }
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
      <div className="mt-6 flex flex-wrap space-x-2 gap-y-3 mb-4 items-center">
        <div className="flex flex-col">
          <label className="text-[10px] text-gray-500 font-semibold mb-1">Select solar panel brand</label>
          <select
            value={panelBrandFilter}
            onChange={(e) => {
              setPanelBrandFilter(e.target.value);
              setTechnologyFilter('All');
              setWattageFilter('All');
            }}
            className="border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option value="All">All Brands</option>
            {dashboardData?.panelBrands?.map((brand, idx) => (
              <option key={idx} value={brand}>{brand}</option>
            )) || (
                <>
                  <option value="Waaree">Waaree</option>
                  <option value="Adani">Adani</option>
                  <option value="Tata">Tata</option>
                  <option value="Vikram">Vikram</option>
                </>
              )}
          </select>
        </div>

        {panelBrandFilter !== 'All' && (
          <>
            <div className="flex flex-col animate-fade-in">
              <label className="text-[10px] text-gray-500 font-semibold mb-1">Solar Panel Technology</label>
              <select
                value={technologyFilter}
                onChange={(e) => setTechnologyFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                <option value="All">All Technologies</option>
                <option value="Monocrystalline">Monocrystalline</option>
                <option value="Polycrystalline">Polycrystalline</option>
                <option value="Bifacial">Bifacial</option>
                <option value="Half-Cut">Half-Cut</option>
              </select>
            </div>
            <div className="flex flex-col animate-fade-in">
              <label className="text-[10px] text-gray-500 font-semibold mb-1">Wattage</label>
              <select
                value={wattageFilter}
                onChange={(e) => setWattageFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                <option value="All">All Wattages</option>
                <option value="500W">500W</option>
                <option value="540W">540W</option>
                <option value="550W">550W</option>
                <option value="600W">600W</option>
              </select>
            </div>
          </>
        )}

        {/*
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
        */}

        <div className="ml-auto flex items-end space-x-4 pl-4 border-l border-gray-200">
          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-[#145a80] mb-1 uppercase tracking-wider">Inventory</span>
            <div className="min-w-[5rem] px-2 h-8 border border-blue-300 rounded flex items-center justify-center text-sm font-bold bg-white shadow-sm text-gray-700 relative overflow-hidden">
              <div className="absolute inset-y-0 left-1/2 w-[1px] bg-blue-300 transform -translate-x-1/2 skew-x-[-15deg]"></div>
              <span className="flex-1 text-center pr-2 z-10 text-green-600">{inventoryStats.required}</span>
              <span className="flex-1 text-center pl-2 z-10 text-gray-500">{inventoryStats.available}</span>
            </div>
          </div>
          <button 
            onClick={() => setIsVendorModalOpen(true)}
            disabled={selectedRows.length === 0 || inventoryStats.available < inventoryStats.required}
            className={`border-2 border-[#145a80] font-bold px-6 h-8 rounded transition-all shadow-sm text-[12px] uppercase tracking-wide flex items-center justify-center ${(selectedRows.length === 0 || inventoryStats.available < inventoryStats.required) ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' : 'text-white bg-[#145a80] hover:bg-[#0f4461]'}`}
          >
            Procure Inventory
          </button>
        </div>
      </div>

      {/* Conditional Rendering based on Tabs */}
      {activeTab === 'ComboKit' ? (
        <>
          <div className="mt-6 bg-white border border-gray-200 shadow-sm overflow-x-auto relative rounded-lg">
            <table className="w-full text-xs text-left min-w-[1000px]">
              <thead className="bg-[#ebf5ff]">
                {/* Client Requested Procurement Summary Row */}
                <tr className="border-b-2 border-blue-300">
                  <td colSpan="9" className="p-0">
                    <div className="flex flex-wrap items-center justify-between p-4">
                      <div className="flex items-center space-x-4 border-r border-blue-200 pr-6 lg:pr-12">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-[#145a80] mb-2 uppercase tracking-wider">{panelBrandFilter !== 'All' ? panelBrandFilter : 'Brand'}</span>
                          <div className="w-16 h-16 rounded-full border-2 border-blue-300 flex items-center justify-center bg-white shadow-inner overflow-hidden">
                            {(() => {
                              const selectedManufacturer = manufacturers.find(m => m.brand?.toLowerCase() === panelBrandFilter?.toLowerCase());
                              if (selectedManufacturer && selectedManufacturer.brandLogo) {
                                return <img src={selectedManufacturer.brandLogo} alt={panelBrandFilter} className="w-full h-full object-contain p-2" />;
                              }
                              return <span className="text-gray-500 font-bold text-xs">Logo</span>;
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 border-r border-blue-200 px-6 lg:px-12 flex-1 justify-center">
                        <span className="font-bold text-gray-800 text-base lg:text-lg">Total No. solar panel</span>
                        <div className="min-w-[4rem] px-2 h-12 border-2 border-blue-300 rounded-lg flex items-center justify-center text-xl font-bold bg-white shadow-inner text-[#145a80]">
                          {totalSummary.panels}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 border-r border-blue-200 px-6 lg:px-12 justify-center">
                        <div className="min-w-[4rem] px-2 h-12 border-2 border-blue-300 rounded-lg flex items-center justify-center text-xl font-bold bg-white shadow-inner text-[#145a80]">
                          {totalSummary.kw}
                        </div>
                        <span className="font-bold text-gray-800 text-base lg:text-lg">W</span>
                      </div>

                      <div className="pl-6 lg:pl-12 flex items-center">
                        <button 
                          onClick={() => setIsVendorModalOpen(true)}
                          disabled={selectedRows.length === 0 || inventoryStats.available < inventoryStats.required}
                          className={`border-2 border-[#145a80] font-bold px-8 py-2.5 rounded-lg transition-all shadow-md text-base uppercase tracking-wide ${(selectedRows.length === 0 || inventoryStats.available < inventoryStats.required) ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' : 'text-[#145a80] hover:bg-[#145a80] hover:text-white'}`}
                        >
                          Procure
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </thead>
              <thead className="bg-[#7fb4eb] text-white">
                <tr>
                  <th className="px-3 py-3 font-medium text-center">
                    <input 
                      type="checkbox" 
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      checked={filteredTableData.length > 0 && selectedRows.length === filteredTableData.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(filteredTableData.map((_, idx) => idx));
                        } else {
                          setSelectedRows([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-3 py-3 font-medium">Partner Name</th>
                  <th className="px-3 py-3 font-medium text-center">Partner Logo</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium text-center">Type</th>
                  <th className="px-3 py-3 font-medium">Details</th>
                  <th className="px-3 py-3 font-medium">Solar Panel</th>
                  <th className="px-3 py-3 font-medium">Inverter</th>
                  <th className="px-3 py-3 font-medium">BOS Kit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTableData.map((row, idx) => {
                  const originalIdx = tableData.indexOf(row);
                  const mockBrand = originalIdx === 0 ? ['Waaree', 'Adani'] : originalIdx === 1 ? ['Tata', 'Waaree'] : ['Vikram', 'Adani', 'Waaree', 'Tata'];
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          checked={selectedRows.includes(idx)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows(prev => [...prev, idx]);
                            } else {
                              setSelectedRows(prev => prev.filter(i => i !== idx));
                            }
                          }}
                        />
                      </td>
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
                        <p className="font-bold">W: <span className="font-normal">{row.kw}</span></p>
                        <p className="font-bold">₹: <span className="font-normal">{row.price}</span></p>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-col space-y-1.5">
                          {mockBrand.slice(0, 2).map((b, i) => (
                            <div key={i} className="flex items-center space-x-1.5">
                              <span className={`bg-${i === 0 ? 'green' : 'blue'}-100 border border-${i === 0 ? 'green' : 'blue'}-300 text-[8px] text-${i === 0 ? 'green' : 'blue'}-700 px-1 py-0.5 rounded font-bold w-12 text-center`}>{b}</span>
                              <span className="text-[10px] font-medium text-gray-600">{i === 0 ? '3' : '2'}</span>
                            </div>
                          ))}
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
                    </tr>
                  );
                })}
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
                        <p className="text-[10px] text-gray-500">Total W</p>
                        <p className="font-bold text-lg text-[#0b74ba]">{vendor.kw} W</p>
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
                  setIsVendorModalOpen(false);
                  setIsPreviewModalOpen(true);
                }}
                className={`px-5 py-2 text-sm font-semibold text-white rounded shadow-sm transition ${selectedSupplyVendor ? 'bg-[#0b74ba] hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
                disabled={!selectedSupplyVendor}
              >
                Generate PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PO Preview Modal */}
      {isPreviewModalOpen && selectedSupplyVendor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-fade-in border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-[#f8f9fa]">
              <h2 className="text-xl font-bold text-[#145a80] flex items-center">
                <FileText size={24} className="mr-2" /> Purchase Order Preview
              </h2>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 focus:outline-none transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1">
              {(() => {
                const vendor = inventoryVendors.find(v => v.id === selectedSupplyVendor);
                const selectedData = selectedRows.map(idx => filteredTableData[idx]);
                const { requiredBreakdown, techString, wattString, totalCalculatedWattage } = selectedOrderDetails;
                
                return (
                  <div className="space-y-6">
                    <div className="flex justify-between border-b border-gray-100 pb-5">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Supplier</p>
                        <h3 className="font-bold text-[#0b74ba] text-lg">{vendor.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">Authorized Distributor</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">PO Details</p>
                        <p className="font-bold text-gray-800 text-sm">Date: {new Date().toLocaleDateString()}</p>
                        <p className="text-sm font-mono text-gray-600 mt-1">PO-{Math.floor(100000 + Math.random() * 900000)}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-800 mb-3 text-sm">Order Summary</h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-[#f0f2f5] text-gray-700">
                            <tr>
                              <th className="px-5 py-3 font-semibold">Item Description</th>
                              <th className="px-5 py-3 font-semibold text-center w-32">Solar Panel Qty</th>
                              <th className="px-5 py-3 font-semibold text-center w-32">Rs per W</th>
                              <th className="px-5 py-3 font-semibold text-center w-32">Benchmark Price</th>
                              <th className="px-5 py-3 font-semibold w-24 text-center">Tentative Days</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            <tr className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-4 text-gray-800">
                                <p className="font-bold text-base text-gray-900 mb-2">Solar Panels</p>
                                <div className="text-sm text-gray-600 space-y-2.5">
                                  <div className="flex items-center">
                                    <span className="w-24 font-semibold text-gray-700">Technology:</span> 
                                    <span className="bg-gray-100 px-2 py-0.5 rounded font-medium text-gray-800">{techString}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="w-24 font-semibold text-gray-700">Wattage:</span> 
                                    <span className="bg-gray-100 px-2 py-0.5 rounded font-medium text-gray-800">{wattString}</span>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-700 block mb-1.5">Brand Breakdown:</span>
                                    <div className="flex flex-wrap gap-2">
                                      {Object.entries(requiredBreakdown).map(([brand, count]) => (
                                        <div key={brand} className="flex items-center bg-blue-50 border border-blue-200 rounded px-2.5 py-1 text-xs">
                                          <span className="font-bold text-blue-800 mr-1.5">{brand}:</span>
                                          <span className="text-blue-900 font-medium">{count} Panels</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <p className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500">Procurement for {selectedData.length} customer projects</p>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-center font-bold text-[#145a80] text-lg align-top">{inventoryStats.required}</td>
                              <td className="px-5 py-4 text-center align-top">
                                <input 
                                  type="number" 
                                  value={enteredPrice}
                                  onChange={(e) => setEnteredPrice(e.target.value)}
                                  placeholder="Enter Price" 
                                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#145a80] focus:ring-1 focus:ring-[#145a80]" 
                                />
                              </td>
                              <td className="px-5 py-4 text-center align-top">
                                <div className="font-bold text-gray-700">₹ 45</div>
                                <div className="text-[10px] text-gray-500">Per W</div>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <input 
                                  type="number" 
                                  value={tentativeDays}
                                  onChange={(e) => setTentativeDays(e.target.value)}
                                  placeholder="Days" 
                                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#145a80] focus:ring-1 focus:ring-[#145a80]" 
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Total Amount Section */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 flex justify-between items-center shadow-sm">
                      <div className="text-gray-600">
                        <p className="text-sm">Total Capacity: <span className="font-bold text-gray-800">{totalCalculatedWattage} W</span></p>
                        <p className="text-xs text-gray-500 mt-1">Calculated as: Total W × Rs per W</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Estimated Amount</p>
                        <p className="text-2xl font-bold text-[#145a80]">
                          {enteredPrice && !isNaN(enteredPrice) && parseFloat(enteredPrice) > 0 
                            ? `₹ ${(parseFloat(totalCalculatedWattage) * parseFloat(enteredPrice)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` 
                            : '₹ 0'}
                        </p>
                      </div>
                    </div>

                    {/* GST Section */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="text-gray-600">
                          <p className="text-sm font-bold text-gray-800">GST (%)</p>
                          <p className="text-xs text-gray-500 mt-1">Manually add applicable GST</p>
                        </div>
                        <div className="w-32">
                          <input 
                            type="number" 
                            value={gstPercent}
                            onChange={(e) => setGstPercent(e.target.value)}
                            placeholder="Enter %" 
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#145a80] focus:ring-1 focus:ring-[#145a80] text-right" 
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <div className="text-gray-600">
                          <p className="text-sm font-bold text-gray-800">Total Estimated Price</p>
                          <p className="text-xs text-gray-500 mt-1">Including GST</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-[#2cb25d]">
                            {(() => {
                              const baseAmount = enteredPrice && !isNaN(enteredPrice) && parseFloat(enteredPrice) > 0 
                                ? parseFloat(totalCalculatedWattage) * parseFloat(enteredPrice) 
                                : 0;
                              const gst = gstPercent && !isNaN(gstPercent) ? parseFloat(gstPercent) : 0;
                              const totalWithGst = baseAmount + (baseAmount * gst / 100);
                              return `₹ ${totalWithGst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#e8f4fc] p-4 rounded-lg border border-[#bae0f5] flex items-start space-x-3">
                      <div className="text-[#0b74ba] mt-0.5 flex-shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                      </div>
                      <p className="text-sm text-[#0b74ba] leading-relaxed">
                        This Purchase Order will be generated and sent to <b>{vendor.name}</b>. Once accepted by the vendor, the materials will be procured for the selected <b>{selectedData.length}</b> orders and moved to the next stage.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsPreviewModalOpen(false);
                  setIsVendorModalOpen(true);
                }}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-100 hover:text-gray-800 transition"
              >
                &larr; Back to Vendors
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsDoubleConfirmOpen(true)}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-[#2cb25d] hover:bg-green-700 rounded shadow-md transition flex items-center"
                >
                  <Check size={18} className="mr-2" />
                  Confirm & Send PO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Double Confirmation Modal */}
      {isDoubleConfirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 transform scale-100 transition-all duration-300">
            {/* Header with warning icon */}
            <div className="flex items-center space-x-3 p-5 bg-amber-50 border-b border-amber-100">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Double Confirmation</h3>
                <p className="text-xs text-amber-800">Please verify the details before sending the PO</p>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Are you sure you want to generate and send this Purchase Order?
              </p>
              
              {(() => {
                const vendor = inventoryVendors.find(v => v.id === selectedSupplyVendor);
                const baseAmount = enteredPrice && !isNaN(enteredPrice) && parseFloat(enteredPrice) > 0 
                  ? parseFloat(selectedOrderDetails.totalCalculatedWattage) * parseFloat(enteredPrice) 
                  : 0;
                const gst = gstPercent && !isNaN(gstPercent) ? parseFloat(gstPercent) : 0;
                const totalWithGst = baseAmount + (baseAmount * gst / 100);

                return (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-xs space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                      <span className="text-gray-500 font-medium">Vendor Name:</span>
                      <span className="font-bold text-gray-800 text-sm">{vendor?.name || 'N/A'}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 py-1">
                      <div>
                        <span className="text-gray-500 font-medium block mb-0.5">Total Panels:</span>
                        <span className="font-bold text-gray-800">{inventoryStats.required} Panels</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium block mb-0.5">Total Capacity:</span>
                        <span className="font-bold text-gray-800">{selectedOrderDetails.totalCalculatedWattage} W</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium block mb-0.5">Technology:</span>
                        <span className="font-bold text-gray-800">{selectedOrderDetails.techString}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium block mb-0.5">Wattage:</span>
                        <span className="font-bold text-gray-800">{selectedOrderDetails.wattString}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <span className="text-gray-500 font-medium block mb-1.5">Brand Breakdown:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(selectedOrderDetails.requiredBreakdown).map(([brand, count]) => {
                          const manufacturer = manufacturers.find(m => m.brand?.toLowerCase() === brand?.toLowerCase());
                          return (
                            <div key={brand} className="flex items-center bg-white border border-gray-200 shadow-sm rounded px-2 py-1 text-[10px]">
                              {manufacturer && manufacturer.brandLogo ? (
                                <img src={manufacturer.brandLogo} alt={brand} className="w-4 h-4 object-contain mr-1.5 bg-white rounded-full p-0.5 border border-gray-100" />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center mr-1.5 border border-gray-200 text-[6px] font-bold text-gray-500">
                                  {brand.substring(0, 1)}
                                </div>
                              )}
                              <span className="font-bold text-gray-700 mr-1">{brand}:</span>
                              <span className="text-blue-700 font-bold">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="text-gray-500 font-medium">Total Estimated Price:</span>
                      <span className="font-bold text-green-600 text-base">
                        ₹ {totalWithGst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                );
              })()}
              
              <div className="mt-4 bg-white border border-gray-200 rounded-lg p-3">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Vendor Email Address</label>
                <input 
                  type="email" 
                  value={vendorEmail}
                  onChange={(e) => setVendorEmail(e.target.value)}
                  placeholder="e.g. orders@vendor.com" 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" 
                />
              </div>

              <p className="text-xs text-gray-400 italic mt-3">
                * Once confirmed, this action cannot be undone and the order details will be forwarded to the vendor.
              </p>
            </div>

            {/* Action buttons */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setIsDoubleConfirmOpen(false)}
                className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition"
              >
                Go Back
              </button>
              <button
                onClick={handleFinalConfirm}
                className="px-6 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center"
              >
                <Check size={16} className="mr-1.5" />
                Yes, Send PO
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
