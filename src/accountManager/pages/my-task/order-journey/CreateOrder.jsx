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
  const [currentPONumber, setCurrentPONumber] = useState('');

  // 4-Step Solarkit Order Creation Form State
  const [isSolarkitOrderModalOpen, setIsSolarkitOrderModalOpen] = useState(false);
  const [orderFormStep, setOrderFormStep] = useState(1);
  const [orderType, setOrderType] = useState('PO Order'); // 'PO Order' | 'One Order'
  const [poNumberInput, setPoNumberInput] = useState('');
  const [poValidityDateInput, setPoValidityDateInput] = useState('');
  const [selectedRegularBuyer, setSelectedRegularBuyer] = useState('');
  const [buyerGstInput, setBuyerGstInput] = useState('');
  const [projectTypeInput, setProjectTypeInput] = useState('Residential Subsidy');
  const [districtInput, setDistrictInput] = useState('Ahmedabad');
  const [capacityKwInput, setCapacityKwInput] = useState('5');
  const [productTypeInput, setProductTypeInput] = useState('Solarkit');
  const [numberOfKitsInput, setNumberOfKitsInput] = useState(1);
  const [orderAmountInput, setOrderAmountInput] = useState(259600);
  const [inventorySource, setInventorySource] = useState('Warehouse Inventory'); // 'Warehouse Inventory' | 'Vendor Inventory'

  // Generated Order Details State
  const [generatedOrderDetails, setGeneratedOrderDetails] = useState(null);

  const regularBuyersList = [
    { name: 'SunSolar EPC Solutions Pvt Ltd', gst: '24AAACS1423N1Z5', district: 'Ahmedabad' },
    { name: 'Gujarat Green Energy EPC', gst: '24BBBCS2345M1Z8', district: 'Surat' },
    { name: 'Adani Solar EPC', gst: '24CCCCS3456L1Z2', district: 'Vadodara' },
    { name: 'Rajkot Renewable Systems', gst: '24DDDCS4567K1Z4', district: 'Rajkot' }
  ];

  const handleSelectRegularBuyer = (buyerName) => {
    setSelectedRegularBuyer(buyerName);
    const found = regularBuyersList.find(b => b.name === buyerName);
    if (found) {
      setBuyerGstInput(found.gst);
      if (found.district) setDistrictInput(found.district);
    }
  };

  const handleGenerateSolarkitPI = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newOrderNo = `ORD-${randomSuffix}`;
    const newPiNo = `PI-2026-0${Math.floor(40 + Math.random() * 50)}`;
    const trackingLink = `${window.location.origin}/epc/order-tracking/${newOrderNo}`;

    const newOrderObj = {
      orderNumber: newOrderNo,
      piNumber: newPiNo,
      orderType,
      poNumber: orderType === 'PO Order' ? (poNumberInput || `PO-GUJ-${randomSuffix}`) : 'N/A',
      poValidity: orderType === 'PO Order' ? (poValidityDateInput || '2026-10-31') : 'N/A',
      buyerName: selectedRegularBuyer || 'Gujarat EPC Buyer',
      buyerGst: buyerGstInput || '24AAACS1423N1Z5',
      district: districtInput,
      projectType: projectTypeInput,
      capacity: `${capacityKwInput} KW`,
      productType: productTypeInput,
      numberOfKits: parseInt(numberOfKitsInput, 10) || 1,
      basicAmount: Math.round(orderAmountInput / 1.18),
      gstAmount: Math.round(orderAmountInput - (orderAmountInput / 1.18)),
      totalAmount: parseFloat(orderAmountInput),
      amountReceived: 0,
      balanceAmount: parseFloat(orderAmountInput),
      paymentStatus: 'Payment Pending',
      orderStatus: inventorySource === 'Warehouse Inventory' ? 'At Warehouse' : 'Order Created',
      deliveryMilestones: [
        { id: 1, name: 'Order Created', date: new Date().toLocaleDateString(), completed: true, active: false },
        { id: 2, name: 'Payment Confirmed', date: 'Pending', completed: false, active: false },
        { id: 3, name: 'Order Confirmed', date: 'Pending', completed: false, active: false },
        { id: 4, name: 'Material Ready', date: 'Pending', completed: false, active: false },
        { id: 5, name: 'Delivery Plan Created', date: 'Pending', completed: false, active: false },
        { id: 6, name: 'Dispatched', date: 'Pending', completed: false, active: false },
        { id: 7, name: 'Out for Delivery', date: 'Pending', completed: false, active: false },
        { id: 8, name: 'Delivered', date: 'Pending', completed: false, active: false }
      ],
      trackingLink
    };

    setGeneratedOrderDetails(newOrderObj);

    // Save to localStorage for Performa Invoice module & Buyer view
    try {
      const existing = JSON.parse(localStorage.getItem('solarOrdersList') || '[]');
      existing.unshift(newOrderObj);
      localStorage.setItem('solarOrdersList', JSON.stringify(existing));
    } catch (e) {
      console.error(e);
    }

    setOrderFormStep(3);
  };



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
      let currentOrderCount = parseInt(localStorage.getItem('orderCounter') || '0', 10);
      currentOrderCount += 1;
      localStorage.setItem('orderCounter', currentOrderCount.toString());
      const newOrderId = `ORD${String(currentOrderCount).padStart(4, '0')}`;

      const generatedPO = currentPONumber || `PO-${Math.floor(100000 + Math.random() * 900000)}`;

      const groupedOrder = {
        id: newOrderId,
        poNumber: generatedPO,
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
    setCurrentPONumber('');
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
      <div className="flex flex-wrap space-x-2 mt-6 lg:mt-0 justify-end items-center gap-2">
        <button
          onClick={() => {
            setOrderFormStep(1);
            setIsSolarkitOrderModalOpen(true);
          }}
          className="bg-gradient-to-r from-[#145a80] to-[#0b74ba] hover:from-[#0f4461] hover:to-[#085a93] text-white text-xs font-bold px-4 py-1.5 rounded shadow-sm hover:shadow transition-all flex items-center gap-1.5 border border-blue-800/30"
        >
          <FileText size={14} className="text-blue-200" />
          + Create Solarkit Order (4 Steps)
        </button>
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
                  if (!currentPONumber) {
                    setCurrentPONumber(`PO-${Math.floor(100000 + Math.random() * 900000)}`);
                  }
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
                        <p className="text-sm font-mono text-gray-600 mt-1">{currentPONumber}</p>
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

      {/* 4-Step Solarkit Order Creation Modal */}
      {isSolarkitOrderModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in border border-gray-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#145a80] to-blue-900 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-blue-200">Accounts Login Module</span>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  Create Solarkit Order — Gujarat State Business
                </h2>
              </div>
              <button 
                onClick={() => setIsSolarkitOrderModalOpen(false)}
                className="text-gray-300 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex justify-between text-xs font-semibold text-slate-600">
              <span className={orderFormStep === 1 ? 'text-blue-700 font-bold border-b-2 border-blue-700 pb-0.5' : ''}>
                1. Order Type
              </span>
              <span className={orderFormStep === 2 ? 'text-blue-700 font-bold border-b-2 border-blue-700 pb-0.5' : ''}>
                2. Project & Product
              </span>
              <span className={orderFormStep === 3 ? 'text-blue-700 font-bold border-b-2 border-blue-700 pb-0.5' : ''}>
                3. Generate PI & Link
              </span>
              <span className={orderFormStep === 4 ? 'text-blue-700 font-bold border-b-2 border-blue-700 pb-0.5' : ''}>
                4. Share Link
              </span>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
              
              {/* STEP 1: Select Order Type */}
              {orderFormStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Step 1 — Select Order Type</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setOrderType('PO Order')}
                      className={`p-4 rounded-xl border-2 text-left font-bold text-sm transition-all ${
                        orderType === 'PO Order' 
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span>PO Order</span>
                        {orderType === 'PO Order' && <Check size={16} className="text-blue-600" />}
                      </div>
                      <p className="text-[11px] font-normal text-slate-500">Includes PO Number & Validity Date tracking</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderType('One Order')}
                      className={`p-4 rounded-xl border-2 text-left font-bold text-sm transition-all ${
                        orderType === 'One Order' 
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span>One Order</span>
                        {orderType === 'One Order' && <Check size={16} className="text-blue-600" />}
                      </div>
                      <p className="text-[11px] font-normal text-slate-500">Single one-time order without PO contract</p>
                    </button>
                  </div>

                  {/* Regular Buyer Selection or Custom GST */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Select Buyer from Regular Buyer OR enter Buyer GST Number
                    </label>
                    
                    <select
                      value={selectedRegularBuyer}
                      onChange={(e) => handleSelectRegularBuyer(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">-- Select Regular Buyer (Auto-populates details) --</option>
                      {regularBuyersList.map((buyer, idx) => (
                        <option key={idx} value={buyer.name}>{buyer.name} ({buyer.district})</option>
                      ))}
                    </select>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Buyer GST Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 24AAACS1423N1Z5"
                          value={buyerGstInput}
                          onChange={(e) => setBuyerGstInput(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono uppercase focus:ring-2 focus:ring-blue-400"
                        />
                      </div>

                      {orderType === 'PO Order' && (
                        <>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">PO Number</label>
                            <input
                              type="text"
                              placeholder="e.g. PO-GUJ-2026-88"
                              value={poNumberInput}
                              onChange={(e) => setPoNumberInput(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">PO Validity Date</label>
                            <input
                              type="date"
                              value={poValidityDateInput}
                              onChange={(e) => setPoValidityDateInput(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-400"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Project & Product Details */}
              {orderFormStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Step 2 — Project & Product Details</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Project Type</label>
                      <select
                        value={projectTypeInput}
                        onChange={(e) => setProjectTypeInput(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                      >
                        <option value="Residential Subsidy">Residential Subsidy</option>
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Industrial">Industrial</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Gujarat District Location</label>
                      <select
                        value={districtInput}
                        onChange={(e) => setDistrictInput(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                      >
                        <option value="Ahmedabad">Ahmedabad</option>
                        <option value="Surat">Surat</option>
                        <option value="Vadodara">Vadodara</option>
                        <option value="Rajkot">Rajkot</option>
                        <option value="Bhavnagar">Bhavnagar</option>
                        <option value="Gandhinagar">Gandhinagar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Capacity (KW)</label>
                      <input
                        type="number"
                        placeholder="e.g. 5"
                        value={capacityKwInput}
                        onChange={(e) => setCapacityKwInput(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Product Type</label>
                      <select
                        value={productTypeInput}
                        onChange={(e) => setProductTypeInput(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                      >
                        <option value="Solarkit">Solarkit</option>
                        <option value="BOSKit">BOSKit</option>
                        <option value="Other approved products">Other approved products</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">No. of Kits</label>
                      <input
                        type="number"
                        value={numberOfKitsInput}
                        onChange={(e) => setNumberOfKitsInput(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Total Order Amount (₹)</label>
                      <input
                        type="number"
                        value={orderAmountInput}
                        onChange={(e) => setOrderAmountInput(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold text-blue-700"
                      />
                    </div>
                  </div>

                  {/* Section 9 Critical System Rule: Inventory Stock Source */}
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mt-4 space-y-2">
                    <label className="block text-xs font-bold text-amber-900">
                      Inventory Stock Allocation Source (Critical System Rule)
                    </label>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setInventorySource('Warehouse Inventory')}
                        className={`p-3 rounded-lg border text-left font-semibold transition ${
                          inventorySource === 'Warehouse Inventory'
                            ? 'bg-amber-600 text-white border-amber-700 shadow'
                            : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <p className="font-bold text-xs">Warehouse Inventory</p>
                        <p className="text-[10px] opacity-90 mt-0.5">Directly At Warehouse (Skips vendor procurement)</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInventorySource('Vendor Inventory')}
                        className={`p-3 rounded-lg border text-left font-semibold transition ${
                          inventorySource === 'Vendor Inventory'
                            ? 'bg-amber-600 text-white border-amber-700 shadow'
                            : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <p className="font-bold text-xs">Vendor Inventory</p>
                        <p className="text-[10px] opacity-90 mt-0.5">Standard Vendor PO Procurement Path</p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Generate PI & Order Link */}
              {orderFormStep === 3 && generatedOrderDetails && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 flex items-center space-x-3">
                    <Check className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm">Performa Invoice (PI) & Order Link Successfully Generated!</h4>
                      <p className="text-xs text-emerald-700 mt-0.5">PI recorded automatically in Accounts Login → Performa Invoice Module.</p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2 border-b pb-2">
                      <div>
                        <span className="text-slate-400 block">PI Number</span>
                        <strong className="text-blue-700 text-sm">{generatedOrderDetails.piNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Order Number</span>
                        <strong className="text-slate-800 text-sm">{generatedOrderDetails.orderNumber}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-b pb-2">
                      <div>
                        <span className="text-slate-400 block">Buyer Name</span>
                        <strong className="text-slate-800">{generatedOrderDetails.buyerName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Total Amount</span>
                        <strong className="text-emerald-700 text-sm">₹{generatedOrderDetails.totalAmount.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Generated Order Link (Payment Link + Customer Order Tracking)</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          readOnly
                          value={generatedOrderDetails.trackingLink}
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono bg-slate-50 text-blue-700"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedOrderDetails.trackingLink);
                            setToast({ message: 'Order Link copied to clipboard!', type: 'success' });
                            setTimeout(() => setToast(null), 3000);
                          }}
                          className="bg-blue-600 text-white font-bold text-xs px-3 py-2 rounded-lg hover:bg-blue-700 shrink-0"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Share Order Link with Buyer */}
              {orderFormStep === 4 && generatedOrderDetails && (
                <div className="space-y-4 animate-fade-in text-center py-4">
                  <FileText className="w-12 h-12 text-blue-600 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">Share Generated Order Link with Buyer</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    The buyer will open this link to access their order and customer-facing delivery tracking via Solarkits EPC Login.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Hello ${generatedOrderDetails.buyerName}, here is your Solarkits Order Link for ${generatedOrderDetails.orderNumber}: ${generatedOrderDetails.trackingLink}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold p-3 rounded-xl transition flex flex-col items-center justify-center gap-1 shadow"
                    >
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={`mailto:?subject=${encodeURIComponent(`Solarkits Order Link - ${generatedOrderDetails.orderNumber}`)}&body=${encodeURIComponent(`Hello ${generatedOrderDetails.buyerName},\n\nYour Performa Invoice ${generatedOrderDetails.piNumber} is ready. Access your order & payment tracking link here: ${generatedOrderDetails.trackingLink}`)}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold p-3 rounded-xl transition flex flex-col items-center justify-center gap-1 shadow"
                    >
                      <span>Email</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        window.open(`https://wa.me/?text=${encodeURIComponent(`Order Link: ${generatedOrderDetails.trackingLink}`)}`, '_blank');
                        window.open(`mailto:?subject=Order Link&body=${encodeURIComponent(generatedOrderDetails.trackingLink)}`);
                      }}
                      className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold p-3 rounded-xl transition flex flex-col items-center justify-center gap-1 shadow"
                    >
                      <span>WhatsApp + Email</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
              {orderFormStep > 1 && orderFormStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setOrderFormStep(prev => prev - 1)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Back
                </button>
              ) : <div></div>}

              {orderFormStep === 1 && (
                <button
                  type="button"
                  onClick={() => setOrderFormStep(2)}
                  className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow"
                >
                  Next: Project Details ➔
                </button>
              )}

              {orderFormStep === 2 && (
                <button
                  type="button"
                  onClick={handleGenerateSolarkitPI}
                  className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow"
                >
                  Generate PI & Link ➔
                </button>
              )}

              {orderFormStep === 3 && (
                <button
                  type="button"
                  onClick={() => setOrderFormStep(4)}
                  className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow"
                >
                  Next: Share Link ➔
                </button>
              )}

              {orderFormStep === 4 && (
                <button
                  type="button"
                  onClick={() => setIsSolarkitOrderModalOpen(false)}
                  className="px-6 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow"
                >
                  Done & Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
