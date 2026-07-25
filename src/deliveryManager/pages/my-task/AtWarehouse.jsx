import React, { useState } from 'react';
import { Settings, Box, Check, Coffee, Eye, X, FileText } from 'lucide-react';

export default function AtWarehouse() {
  const [deliverySchedule, setDeliverySchedule] = useState([]);
  
  // State for Group Modal (Shows customers belonging to the selected group/brand)
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null); // { brand: string, type: 'Inverter' | 'BOS Kit', row: any }

  // State for Label Generation Modal
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedLabelItem, setSelectedLabelItem] = useState(null);
  const [createdLabelIds, setCreatedLabelIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('createdLabelIds') || '[]');
    } catch (e) {
      return [];
    }
  });

  const loadData = () => {
    try {
      const storedInward = JSON.parse(localStorage.getItem('inwardOrdersData') || '[]');
      // Filter only those where status is 'Inward Matched Successfully'
      const matchedInwards = storedInward.filter(item => item.status === 'Inward Matched Successfully');
      
      const mapped = matchedInwards.map((item) => {
        const qty = parseInt(item.totalUnits) || 15;
        return {
          no: `DEL-${item.orderNo}`,
          location: 'Rajkot',
          panel: { qty: qty, spec: `${item.wattPeak} ${item.brand}`, checked: true },
          inverter: { qty: 1, spec: '5KW Hybrid', checked: true },
          bos: { qty: 1, spec: 'Full Kit', checked: true },
          kw: item.totalKw || '8.0 KW',
          vehicle: 'Bolero',
          driver: 'Rajesh Kumar',
          status: item.deliveryStatus || 'Pending',
          originalOrderNo: item.orderNo,
          brand: item.brand,
          wattPeak: item.wattPeak,
          technology: item.technology,
          projectType: item.projectType,
          totalUnits: qty,
          totalKw: item.totalKw,
          receivedDate: item.receivedDate,
          vendorName: item.vendorName,
          poNumber: item.poNumber,
          poAmount: item.poAmount,
          sku: item.sku
        };
      });
      setDeliverySchedule(mapped);
    } catch (e) {
      console.error("Error loading warehouse data", e);
    }
  };

  React.useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    window.addEventListener('focus', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('focus', loadData);
    };
  }, []);

  const handleDone = (index) => {
    const updated = [...deliverySchedule];
    updated[index].status = 'Completed';
    setDeliverySchedule(updated);
    
    try {
      const storedInward = JSON.parse(localStorage.getItem('inwardOrdersData') || '[]');
      const updatedInward = storedInward.map(item => {
        if (item.orderNo === updated[index].originalOrderNo) {
          return { ...item, deliveryStatus: 'Completed' };
        }
        return item;
      });
      localStorage.setItem('inwardOrdersData', JSON.stringify(updatedInward));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenGroup = (brand, type, row) => {
    const generated = JSON.parse(localStorage.getItem('generatedVendorPayments') || '[]');
    const orderData = generated.find(o => o.id === row.originalOrderNo);
    setSelectedGroup({ brand, type, row, orderData });
    setShowGroupModal(true);
  };

  const handleCreateLabel = (item, labelType = 'General', specificSku = null, specDetail = null) => {
    setSelectedLabelItem({
      ...item,
      labelType,
      sku: specificSku || item.sku,
      specDetail: specDetail
    });
    setShowLabelModal(true);
  };

  const handleMoveToDeliveryPlan = () => {
    const subCustomers = getSubCustomersList();
    const existingOrders = JSON.parse(localStorage.getItem('deliveryPlanOrders') || '[]');
    
    // Map each customer to an individual order item
    const newItems = subCustomers.map(c => ({
      id: c.rawItem.originalOrderNo,
      no: c.rawItem.no,
      vendorName: c.name,
      address: c.rawItem.address,
      pincode: c.rawItem.pincode,
      panel: c.panel,
      bosKit: c.bosKit,
      inverter: c.inverter,
      labelNumber: c.labelNumber,
      inverterLabelNumber: c.inverterLabelNumber,
      bosLabelNumber: c.bosLabelNumber,
      location: c.rawItem.location,
      kw: c.kw,
      driver: c.rawItem.driver,
      vehicle: c.rawItem.vehicle,
      deliveryType: 'Regular', // Default delivery type
      areaType: 'Urban' // Default area type
    }));

    // Merge without duplicates based on subcustomer name + order no
    const filtered = existingOrders.filter(e => !newItems.some(n => n.vendorName === e.vendorName && n.id === e.id));
    const merged = [...filtered, ...newItems];

    localStorage.setItem('deliveryPlanOrders', JSON.stringify(merged));
    setShowGroupModal(false);
    alert("All customers in this group have been moved to the Delivery Plan!");
  };

  // Get items belonging to the clicked order's project group
  const getGroupItems = () => {
    if (!selectedGroup) return [];
    
    const clickedOrderNo = selectedGroup.row?.originalOrderNo || '';
    
    // Group of 6 Projects for ORD0007
    if (clickedOrderNo === 'ORD0007') {
      return [
        {
          no: 'DEL-ORD0005',
          originalOrderNo: 'ORD0005',
          vendorName: 'Apex Manufacturing',
          poNumber: 'PO-963652-A',
          sku: 'PROC-ORD0005-781',
          location: 'Surat',
          totalKw: '15 KW',
          totalUnits: 30,
          brand: 'Waaree',
          projectType: 'Commercial',
          driver: 'Rajesh Kumar',
          vehicle: 'Bolero',
          receivedDate: '01-07-2026'
        },
        {
          no: 'DEL-ORD0006',
          originalOrderNo: 'ORD0006',
          vendorName: 'Bright Future School',
          poNumber: 'PO-963652-B',
          sku: 'PROC-ORD0006-854',
          location: 'Rajkot',
          totalKw: '8 KW',
          totalUnits: 15,
          brand: 'Adani',
          projectType: 'Commercial',
          driver: 'Rajesh Kumar',
          vehicle: 'Bolero',
          receivedDate: '01-07-2026'
        },
        {
          no: 'DEL-ORD0007',
          originalOrderNo: 'ORD0007',
          vendorName: 'Global Logistics Hub',
          poNumber: 'PO-963652-C',
          sku: 'PROC-ORD0007-889',
          location: 'Rajkot',
          totalKw: '20 KW',
          totalUnits: 40,
          brand: 'Tata',
          projectType: 'Commercial',
          driver: 'Rajesh Kumar',
          vehicle: 'Bolero',
          receivedDate: '01-07-2026'
        },
        {
          no: 'DEL-ORD0008',
          originalOrderNo: 'ORD0008',
          vendorName: 'Harmony Residency',
          poNumber: 'PO-963652-D',
          sku: 'PROC-ORD0008-102',
          location: 'Rajkot',
          totalKw: '4 KW',
          totalUnits: 8,
          brand: 'Vikram',
          projectType: 'Commercial',
          driver: 'Rajesh Kumar',
          vehicle: 'Bolero',
          receivedDate: '01-07-2026'
        },
        {
          no: 'DEL-ORD0009',
          originalOrderNo: 'ORD0009',
          vendorName: 'City Mall Rooftop',
          poNumber: 'PO-963652-E',
          sku: 'PROC-ORD0009-445',
          location: 'Rajkot',
          totalKw: '25 KW',
          totalUnits: 50,
          brand: 'Waaree',
          projectType: 'Commercial',
          driver: 'Rajesh Kumar',
          vehicle: 'Bolero',
          receivedDate: '01-07-2026'
        },
        {
          no: 'DEL-ORD0010',
          originalOrderNo: 'ORD0010',
          vendorName: 'TechPark Innovations',
          poNumber: 'PO-963652-F',
          sku: 'PROC-ORD0010-901',
          location: 'Rajkot',
          totalKw: '12 KW',
          totalUnits: 24,
          brand: 'Adani',
          projectType: 'Commercial',
          driver: 'Rajesh Kumar',
          vehicle: 'Bolero',
          receivedDate: '01-07-2026'
        }
      ];
    }

    // Group of 3 Projects for ORD0006
    if (clickedOrderNo === 'ORD0006') {
      return [
        {
          no: 'DEL-ORD0006',
          originalOrderNo: 'ORD0006',
          vendorName: 'Bright Future School',
          poNumber: 'PO-885930-A',
          sku: 'PROC-ORD0006-101',
          location: 'Rajkot',
          totalKw: '8 KW',
          totalUnits: 15,
          brand: 'Adani',
          projectType: 'Commercial',
          driver: 'Rajesh Kumar',
          vehicle: 'Bolero',
          receivedDate: '01-07-2026'
        },
        {
          no: 'DEL-ORD0002',
          originalOrderNo: 'ORD0002',
          vendorName: 'EcoPower Industrial',
          poNumber: 'PO-885930-B',
          sku: 'PROC-ORD0002-202',
          location: 'Ahmedabad',
          totalKw: '3 KW',
          totalUnits: 6,
          brand: 'Adani',
          projectType: 'Commercial',
          driver: 'Rajesh Kumar',
          vehicle: 'Bolero',
          receivedDate: '01-07-2026'
        },
        {
          no: 'DEL-ORD0001',
          originalOrderNo: 'ORD0001',
          vendorName: 'Green Energy Setup',
          poNumber: 'PO-885930-C',
          sku: 'PROC-ORD0001-303',
          location: 'Surat',
          totalKw: '10 KW',
          totalUnits: 20,
          brand: 'Waaree',
          projectType: 'Commercial',
          driver: 'Rajesh Kumar',
          vehicle: 'Bolero',
          receivedDate: '01-07-2026'
        }
      ];
    }

    // Group of 4 Projects for ORD0008
    if (clickedOrderNo === 'ORD0008') {
      return [
        {
          no: 'DEL-ORD0008',
          originalOrderNo: 'ORD0008',
          vendorName: 'Harmony Residency',
          poNumber: 'PO-774411-A',
          sku: 'PROC-ORD0008-201',
          location: 'Rajkot',
          totalKw: '4 KW',
          totalUnits: 8,
          brand: 'Vikram',
          projectType: 'Commercial',
          driver: 'Rajesh Kumar',
          vehicle: 'Bolero',
          receivedDate: '01-07-2026'
        },
        {
          no: 'DEL-ORD0003',
          originalOrderNo: 'ORD0003',
          vendorName: 'SolarTech Commercial',
          poNumber: 'PO-774411-B',
          sku: 'PROC-ORD0003-202',
          location: 'Vadodara',
          totalKw: '9 KW',
          totalUnits: 18,
          brand: 'Tata',
          projectType: 'Commercial',
          driver: 'Rajesh Kumar',
          vehicle: 'Bolero',
          receivedDate: '01-07-2026'
        },
        {
          no: 'DEL-ORD0004',
          originalOrderNo: 'ORD0004',
          vendorName: 'SunRise Apartments',
          poNumber: 'PO-774411-C',
          sku: 'PROC-ORD0004-203',
          location: 'Rajkot',
          totalKw: '5 KW',
          totalUnits: 10,
          brand: 'Vikram',
          projectType: 'Commercial',
          driver: 'Rajesh Kumar',
          vehicle: 'Bolero',
          receivedDate: '01-07-2026'
        },
        {
          no: 'DEL-ORD0005',
          originalOrderNo: 'ORD0005',
          vendorName: 'Apex Manufacturing',
          poNumber: 'PO-774411-D',
          sku: 'PROC-ORD0005-204',
          location: 'Surat',
          totalKw: '15 KW',
          totalUnits: 30,
          brand: 'Waaree',
          projectType: 'Commercial',
          driver: 'Rajesh Kumar',
          vehicle: 'Bolero',
          receivedDate: '01-07-2026'
        }
      ];
    }

    // Default: If no specific group list is configured, show the clicked row itself as a single item list
    if (selectedGroup.row) {
      return [selectedGroup.row];
    }

    return [];
  };

  const getLabelExtraDetails = (location, inverter, bosKit) => {
    let address = "Main Road Office Area, Gujarat";
    let pincode = "360001";
    const loc = (location || '').toLowerCase();
    if (loc.includes('rajkot')) {
      address = "405, Kalavad Road, opposite Krystal Mall, Rajkot, Gujarat";
      pincode = "360005";
    } else if (loc.includes('surat')) {
      address = "Block C, 3rd Floor, Shreeram Business Hub, Adajan, Surat, Gujarat";
      pincode = "395009";
    } else if (loc.includes('ahmedabad')) {
      address = "Plot 12, GIDC Electronics Zone, Sector 26, Gandhinagar, Ahmedabad, Gujarat";
      pincode = "382028";
    } else if (loc.includes('vadodara')) {
      address = "102, Ocean Building, Vikram Sarabhai Marg, Vadiwadi, Vadodara, Gujarat";
      pincode = "390007";
    }

    let inverterDetails = "Solarkits 5KW Smart Hybrid Inverter, Pure Sine Wave, Dual MPPT Tracker, 48V DC Battery Support, LCD Display with App monitoring";
    const inv = (inverter || '').toLowerCase();
    if (inv.includes('goodwe')) {
      inverterDetails = "GoodWe 3kW Single Phase Smart Inverter (GW3000-NS), Max Efficiency 97.8%, Integrated DC Switch, WiFi Monitoring Module";
    } else if (inv.includes('sungrow')) {
      inverterDetails = "Sungrow 10kW Three Phase Grid-Tied Inverter (SG10RT), Dual MPPT, LCD Display, Smart IV Curve Diagnosis, Built-in SPD Type II";
    } else if (inv.includes('luminous')) {
      inverterDetails = "Luminous 5kW Hybrid Inverter (NXG+ 5000), Pure Sine Wave, Solar Prioritization Logic, Intelligent Battery Charging System";
    }

    let bosDetails = "Full Installation BOS Accessories Kit: Distribution Box, 4mm² Solar Cable, Earthing Electrodes, MC4 Connectors, Lightning Arrester";
    const bos = (bosKit || '').toLowerCase();
    if (bos.includes('premium')) {
      bosDetails = "Premium BOS Kit: IP66 AC/DC Distribution Box with SPD (Class II) & MCB, 4mm² Solar DC Cable (100m Red/Black), 3x Copper bonded Earthing Electrodes (17.2mm x 10ft), 50m Earthing Wire, 15x MC4 Connectors, 1x LA";
    } else if (bos.includes('standard') || bos.includes('full')) {
      bosDetails = "Standard BOS Kit: IP65 AC/DC Distribution Box with MCB, 4mm² Solar Cable (50m Red/Black), 2x Chemical Earthing Electrodes (2m), 25m Earthing Wire, 10x MC4 Connectors, 1x Lighting Arrester";
    } else if (bos.includes('economy')) {
      bosDetails = "Economy BOS Kit: Standard Distribution Box, 4mm² Solar Cable (30m Red/Black), 2x Earthing Rods (1.2m), 15m Earthing Wire, 6x MC4 Connectors";
    }

    return { address, pincode, inverterDetails, bosDetails };
  };

  const getSubCustomersList = () => {
    if (!selectedGroup) return [];
    
    // If we have real orderData with subCustomers, use it!
    if (selectedGroup.orderData && selectedGroup.orderData.subCustomers && selectedGroup.orderData.subCustomers.length > 0) {
      return selectedGroup.orderData.subCustomers.map(c => {
        const name = typeof c === 'string' ? c : c.name;
        const partner = typeof c === 'string' ? 'N/A' : (c.partner || 'N/A');
        const kw = typeof c === 'string' ? '0' : (c.kw || '0');
        const panel = typeof c === 'string' ? 'N/A' : (c.panel || 'N/A');
        const bosKit = typeof c === 'string' ? 'N/A' : (c.bosKit || 'N/A');
        const inverter = typeof c === 'string' ? 'N/A' : (c.inverter || 'N/A');
        const labelNumber = typeof c === 'string' ? 'N/A' : (c.labelNumber || 'N/A');
        
        const originalOrderNo = selectedGroup.row?.originalOrderNo || 'ORD-UNKNOWN';
        const cleanName = name.replace(/\s+/g, '');
        const inverterSku = `INV-${originalOrderNo}-${cleanName}`;
        const bosSku = `BOS-${originalOrderNo}-${cleanName}`;
        const mainSku = labelNumber !== 'N/A' ? labelNumber : `LBL-${originalOrderNo}-${cleanName}`;

        const locationVal = selectedGroup.row?.location || 'Rajkot';
        const { address, pincode, inverterDetails, bosDetails } = getLabelExtraDetails(locationVal, inverter, bosKit);

        // Build raw item for barcode / label printing
        const rawItem = {
          no: selectedGroup.row?.no || 'DEL-ORD-UNKNOWN',
          originalOrderNo: originalOrderNo,
          vendorName: name,
          poNumber: partner,
          sku: mainSku,
          location: locationVal,
          address,
          pincode,
          inverterDetails,
          bosDetails,
          totalKw: `${kw} KW`,
          totalUnits: selectedGroup.row?.totalUnits || 15,
          brand: selectedGroup.brand || 'Adani',
          projectType: selectedGroup.row?.projectType || 'Commercial',
          driver: selectedGroup.row?.driver || 'Rajesh Kumar',
          vehicle: selectedGroup.row?.vehicle || 'Bolero',
          receivedDate: selectedGroup.row?.receivedDate || '01-07-2026'
        };

        const isLabelCreated = createdLabelIds.includes(rawItem.sku);
        const isInverterLabelCreated = createdLabelIds.includes(inverterSku);
        const isBosLabelCreated = createdLabelIds.includes(bosSku);

        return {
          name,
          partner,
          kw: `${kw} KW`,
          panel: panel !== 'N/A' ? panel : `${selectedGroup.row?.panel?.qty || 15} x ${selectedGroup.brand || 'Tata'}`,
          bosKit: bosKit !== 'N/A' ? bosKit : 'Full Kit',
          inverter: inverter !== 'N/A' ? inverter : '5KW Hybrid',
          labelNumber: isLabelCreated ? rawItem.sku : '-',
          inverterSku,
          bosSku,
          inverterLabelNumber: isInverterLabelCreated ? inverterSku : '-',
          bosLabelNumber: isBosLabelCreated ? bosSku : '-',
          rawItem
        };
      });
    }

    // Otherwise, map getGroupItems() mock data to the same structure
    const groupItems = getGroupItems();
    return groupItems.map(item => {
      const originalOrderNo = item.originalOrderNo || 'ORD-UNKNOWN';
      const cleanName = (item.vendorName || 'N/A').replace(/\s+/g, '');
      const inverterSku = `INV-${originalOrderNo}-${cleanName}`;
      const bosSku = `BOS-${originalOrderNo}-${cleanName}`;
      const mainSku = item.sku || `LBL-${originalOrderNo}-${cleanName}`;

      const locationVal = item.location || 'Rajkot';
      const mockInverterVal = `5KW Hybrid`;
      const mockBosVal = `Full Kit`;
      const { address, pincode, inverterDetails, bosDetails } = getLabelExtraDetails(locationVal, mockInverterVal, mockBosVal);

      const isLabelCreated = createdLabelIds.includes(mainSku);
      const isInverterLabelCreated = createdLabelIds.includes(inverterSku);
      const isBosLabelCreated = createdLabelIds.includes(bosSku);

      return {
        name: item.vendorName || 'N/A',
        partner: item.poNumber || 'N/A',
        kw: item.totalKw || '0',
        panel: `${item.totalUnits} x ${item.brand || 'Solar Panel'}`,
        bosKit: `Full Kit`,
        inverter: `5KW Hybrid`,
        labelNumber: isLabelCreated ? mainSku : '-',
        inverterSku,
        bosSku,
        inverterLabelNumber: isInverterLabelCreated ? inverterSku : '-',
        bosLabelNumber: isBosLabelCreated ? bosSku : '-',
        rawItem: { 
          ...item, 
          sku: mainSku,
          address,
          pincode,
          inverterDetails,
          bosDetails
        }
      };
    });
  };

  // Dynamically group inventory items from matched inwards
  const adaniSolarPanels = deliverySchedule.filter(item => (item.brand || '').toLowerCase().includes('adani'));
  const wareeSolarPanels = deliverySchedule.filter(item => (item.brand || '').toLowerCase().includes('waree') || (item.brand || '').toLowerCase().includes('tata') || (item.brand || '').toLowerCase().includes('vikram') || !(item.brand || '').toLowerCase().includes('adani'));

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-4 lg:p-6 space-y-6 pb-20">
      
      {/* Header */}
      <div className="bg-[#315783] text-white px-6 py-4 rounded-sm shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-wide">At Warehouse</h1>
      </div>

      {/* Top Action Buttons */}
      <div className="flex justify-center space-x-2">
        <button className="bg-[#1D74B7] hover:bg-[#155a8e] text-white px-4 py-1.5 rounded flex items-center text-sm font-medium shadow-sm transition-colors">
          <Settings className="w-4 h-4 mr-1.5" />
          Customize
        </button>
        <button className="bg-[#2FA041] hover:bg-[#237d32] text-white px-4 py-1.5 rounded flex items-center text-sm font-medium shadow-sm transition-colors">
          <Box className="w-4 h-4 mr-1.5" />
          ComboKit
        </button>
      </div>

      {/* Delivery Schedule Section */}
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-[#1D74B7] font-bold text-[15px]">Delivery Schedule</h2>
          <select className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option>All Brands</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          {deliverySchedule.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-semibold">
              No delivery schedules active. Match inwards first to see items here.
            </div>
          ) : (
            <table className="w-full text-[13px] text-center">
              <thead className="text-white bg-[#74B8FA]">
                <tr>
                  <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Delivery<br/>No.</th>
                  <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Location</th>
                  <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Solar Panel</th>
                  <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Inverter</th>
                  <th className="px-4 py-3 font-semibold border-r border-blue-300/30">BOS Kit</th>
                  <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Total<br/>KW</th>
                  <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Vehicle<br/>Type</th>
                  <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Driver</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {deliverySchedule.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50 text-gray-700">
                    <td className="px-4 py-4 border-r border-gray-100 whitespace-nowrap">{row.no}</td>
                    <td className="px-4 py-4 border-r border-gray-100">{row.location}</td>
                    <td className="px-4 py-4 border-r border-gray-100">
                      <div className="flex items-center justify-center space-x-1.5">
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${row.panel.checked ? 'bg-[#2FA041]' : 'border border-gray-400'}`}>
                          {row.panel.checked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-medium whitespace-nowrap">{row.panel.qty} x {row.panel.spec}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-r border-gray-100 font-sans">
                      <div className="flex items-center justify-center space-x-2">
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${row.inverter.checked ? 'bg-[#2FA041]' : 'border border-gray-400'}`}>
                          {row.inverter.checked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-medium whitespace-nowrap text-xs">{row.inverter.qty} x {row.inverter.spec}</span>
                        <button 
                          onClick={() => handleOpenGroup(row.brand || 'Other', 'Inverter', row)}
                          title="View Group Customers"
                          className="text-blue-600 hover:text-blue-800 transition p-1 hover:bg-blue-50 rounded"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-r border-gray-100 font-sans">
                      <div className="flex items-center justify-center space-x-2">
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${row.bos.checked ? 'bg-[#2FA041]' : 'border border-gray-400'}`}>
                          {row.bos.checked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-medium whitespace-nowrap text-xs">{row.bos.qty} x {row.bos.spec}</span>
                        <button 
                          onClick={() => handleOpenGroup(row.brand || 'Other', 'BOS Kit', row)}
                          title="View Group Customers"
                          className="text-blue-600 hover:text-blue-800 transition p-1 hover:bg-blue-50 rounded"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-r border-gray-100">{row.kw}</td>
                    <td className="px-4 py-4 border-r border-gray-100">{row.vehicle}</td>
                    <td className="px-4 py-4 border-r border-gray-100">{row.driver}</td>
                    <td className="px-4 py-4">
                      {row.status === 'Completed' ? (
                        <span className="text-green-600 font-bold text-xs bg-green-50 px-2.5 py-1 rounded border border-green-200">Done</span>
                      ) : (
                        <button 
                          onClick={() => handleDone(idx)}
                          className="bg-[#2FA041] hover:bg-[#237d32] text-white px-4 py-1.5 rounded font-medium text-xs transition-colors"
                        >
                          Done
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <hr className="border-gray-300 border-2 rounded-full" />

      {/* Current Warehouse Inventory Header */}
      <div className="flex justify-between items-center py-2">
        <h2 className="text-[#1D74B7] font-bold text-[15px]">Current Warehouse Inventory</h2>
        <div className="flex items-center space-x-3">
          <select className="border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option>All Project Types</option>
          </select>
          <select className="border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option>All Brands</option>
          </select>
          <select className="border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option>All Components</option>
          </select>
          <button className="bg-[#0F1E32] hover:bg-[#1a304d] text-white px-3 py-1.5 rounded-full flex items-center shadow text-xs font-semibold ml-2 transition-colors">
            <Coffee className="w-3.5 h-3.5 mr-1.5" />
            Break Time
          </button>
        </div>
      </div>

      {/* Solar Panels Inventory */}
      <div className="space-y-4">
        <h3 className="text-gray-800 font-bold text-lg">Solar Panels Inventory</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Adani Card */}
          <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center">
              <span className="text-xl font-bold text-blue-700 tracking-tight mr-1">adani</span>
              <span className="text-xl text-gray-400 font-light">|</span>
              <span className="text-gray-600 font-medium ml-2 text-[15px]">Solar</span>
            </div>
            <div className="overflow-x-auto flex-1">
              {adaniSolarPanels.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs">No Adani Solar Panels in warehouse</div>
              ) : (
                <table className="w-full text-[13px] text-center h-full">
                  <thead className="text-white bg-[#74B8FA]">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold border-r border-blue-300/30">Model</th>
                      <th className="px-3 py-2.5 font-semibold border-r border-blue-300/30">Technology</th>
                      <th className="px-3 py-2.5 font-semibold border-r border-blue-300/30">Project Type</th>
                      <th className="px-3 py-2.5 font-semibold border-r border-blue-300/30">Quantity</th>
                      <th className="px-3 py-2.5 font-semibold">KW<br/>Available</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {adaniSolarPanels.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-3 border-r border-gray-100 font-medium">{row.wattPeak}</td>
                        <td className="px-3 py-3 border-r border-gray-100">{row.technology}</td>
                        <td className="px-3 py-3 border-r border-gray-100">{row.projectType}</td>
                        <td className="px-3 py-3 border-r border-gray-100">{row.totalUnits}</td>
                        <td className="px-3 py-3">{row.totalKw}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Waree / Other Brands Card */}
          <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center">
              <span className="text-xl font-bold text-green-600 tracking-tight mr-1 italic">OTHER BRANDS</span>
            </div>
            <div className="overflow-x-auto flex-1">
              {wareeSolarPanels.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs">No Other Solar Panels in warehouse</div>
              ) : (
                <table className="w-full text-[13px] text-center h-full">
                  <thead className="text-white bg-[#74B8FA]">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold border-r border-blue-300/30">Model</th>
                      <th className="px-3 py-2.5 font-semibold border-r border-blue-300/30">Technology</th>
                      <th className="px-3 py-2.5 font-semibold border-r border-blue-300/30">Project<br/>Type</th>
                      <th className="px-3 py-2.5 font-semibold border-r border-blue-300/30">Quantity</th>
                      <th className="px-3 py-2.5 font-semibold">KW<br/>Available</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {wareeSolarPanels.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-3 border-r border-gray-100 font-medium">{row.wattPeak} ({row.brand})</td>
                        <td className="px-3 py-3 border-r border-gray-100">{row.technology}</td>
                        <td className="px-3 py-3 border-r border-gray-100">{row.projectType}</td>
                        <td className="px-3 py-3 border-r border-gray-100">{row.totalUnits}</td>
                        <td className="px-3 py-3">{row.totalKw}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Inverters Inventory */}
      <div className="space-y-4">
        <h3 className="text-gray-800 font-bold text-lg">Inverters Inventory</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Adani Card */}
          <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center">
              <span className="text-xl font-bold text-blue-700 tracking-tight mr-1">adani</span>
              <span className="text-xl text-gray-400 font-light">|</span>
              <span className="text-gray-600 font-medium ml-2 text-[15px]">Solar</span>
            </div>
            <div className="overflow-x-auto flex-1">
              {adaniSolarPanels.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs">No Adani Inverters in warehouse</div>
              ) : (
                <table className="w-full text-[13px] text-center h-full">
                  <thead className="text-white bg-[#74B8FA]">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold border-r border-blue-300/30">Model</th>
                      <th className="px-3 py-2.5 font-semibold border-r border-blue-300/30">Type</th>
                      <th className="px-3 py-2.5 font-semibold border-r border-blue-300/30">Project Type</th>
                      <th className="px-3 py-2.5 font-semibold border-r border-blue-300/30">Quantity</th>
                      <th className="px-3 py-2.5 font-semibold font-sans">KW Available</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {adaniSolarPanels.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-4 border-r border-gray-100 font-medium">5KW Hybrid</td>
                        <td className="px-3 py-4 border-r border-gray-100">Hybrid</td>
                        <td className="px-3 py-4 border-r border-gray-100">{row.projectType}</td>
                        <td className="px-3 py-4 border-r border-gray-100">1</td>
                        <td className="px-3 py-4">5 KW</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Other Brands Card */}
          <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center">
              <span className="text-xl font-bold text-green-600 tracking-tight mr-1 italic">OTHER BRANDS</span>
            </div>
            <div className="overflow-x-auto flex-1">
              {wareeSolarPanels.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs">No Other Inverters in warehouse</div>
              ) : (
                <table className="w-full text-[13px] text-center h-full">
                  <thead className="text-white bg-[#74B8FA]">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold border-r border-blue-300/30">Model</th>
                      <th className="px-3 py-2.5 font-semibold border-r border-blue-300/30">Type</th>
                      <th className="px-3 py-2.5 font-semibold border-r border-blue-300/30">Project Type</th>
                      <th className="px-3 py-2.5 font-semibold border-r border-blue-300/30">Quantity</th>
                      <th className="px-3 py-2.5 font-semibold">KW Available</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {wareeSolarPanels.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-3 border-r border-gray-100 font-medium">5KW On-grid ({row.brand})</td>
                        <td className="px-3 py-3 border-r border-gray-100">On-grid</td>
                        <td className="px-3 py-3 border-r border-gray-100">{row.projectType}</td>
                        <td className="px-3 py-3 border-r border-gray-100">1</td>
                        <td className="px-3 py-3">5 KW</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* BOS Kits */}
      <div className="space-y-4">
        <h3 className="text-gray-800 font-bold text-lg">BOS Kits</h3>
        <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
            <h4 className="text-gray-800 font-bold text-[15px]">BOS Kits</h4>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto border border-gray-200 rounded-sm">
              {deliverySchedule.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs">No BOS Kits in warehouse</div>
              ) : (
                <table className="w-full text-[13px] text-left">
                  <thead className="text-white bg-[#74B8FA]">
                    <tr>
                      <th className="px-5 py-2.5 font-semibold border-r border-blue-300/30">Brand</th>
                      <th className="px-5 py-2.5 font-semibold border-r border-blue-300/30">Project Type</th>
                      <th className="px-5 py-2.5 font-semibold border-r border-blue-300/30">Quantity</th>
                      <th className="px-5 py-2.5 font-semibold">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {deliverySchedule.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-5 py-3.5 border-r border-gray-100">{row.brand}</td>
                        <td className="px-5 py-3.5 border-r border-gray-100">{row.projectType}</td>
                        <td className="px-5 py-3.5 border-r border-gray-100">1</td>
                        <td className="px-5 py-3.5">{row.receivedDate || '01-07-2025'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {showGroupModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-blue-50">
              <h2 className="text-xl font-bold text-[#145a80] flex items-center">
                <FileText size={24} className="mr-2 text-[#1D74B7]" /> Customer Details - {selectedGroup.row?.no || selectedGroup.brand}
              </h2>
              <button
                onClick={() => setShowGroupModal(false)}
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-sm overflow-y-auto flex-1 custom-scrollbar bg-gray-50">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">Main Vendor / Project Group</p>
                    <p className="font-semibold text-gray-800 text-lg">{selectedGroup.row?.vendorName || selectedGroup.brand}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">Allocation Type</p>
                    <span className="px-3 py-1 rounded text-xs font-bold bg-[#1D74B7] text-white uppercase">
                      {selectedGroup.type}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-500 font-bold mb-3 uppercase tracking-wider">Included Customers & Projects</p>
                  <div className="border border-gray-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-100 text-gray-700">
                        <tr>
                          <th className="px-4 py-3 font-semibold border-r border-gray-200">Customer Name</th>
                          <th className="px-4 py-3 font-semibold border-r border-gray-200">Partner/PO Name</th>
                          <th className="px-4 py-3 font-semibold text-center border-r border-gray-200">Capacity</th>
                          <th className="px-4 py-3 font-semibold text-center border-r border-gray-200">Panel</th>
                          <th className="px-4 py-3 font-semibold text-center border-r border-gray-200">BOS Kit</th>
                          <th className="px-4 py-3 font-semibold text-center border-r border-gray-200">BOS Kit Label</th>
                          <th className="px-4 py-3 font-semibold text-center border-r border-gray-200">Inverter</th>
                          <th className="px-4 py-3 font-semibold text-center border-r border-gray-200">Inverter Label</th>
                          <th className="px-4 py-3 font-semibold text-center border-r border-gray-200">Label Number</th>
                          <th className="px-4 py-3 font-semibold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {getSubCustomersList().length === 0 ? (
                          <tr>
                            <td colSpan="10" className="px-4 py-6 text-center text-gray-500 italic">No customer details available.</td>
                          </tr>
                        ) : (
                          getSubCustomersList().map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors text-gray-700">
                              <td className="px-4 py-3 font-medium text-gray-800 border-r border-gray-100">{c.name}</td>
                              <td className="px-4 py-3 text-gray-600 border-r border-gray-100">{c.partner}</td>
                              <td className="px-4 py-3 text-center font-medium bg-gray-50/50 border-r border-gray-100">{c.kw}</td>
                              <td className="px-4 py-3 text-center text-gray-600 border-r border-gray-100">{c.panel}</td>
                              <td className="px-4 py-3 text-center text-gray-600 border-r border-gray-100">{c.bosKit}</td>
                              <td className="px-4 py-3 text-center border-r border-gray-100">
                                {c.bosLabelNumber !== '-' ? (
                                  <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">{c.bosLabelNumber}</span>
                                ) : (
                                  <button
                                    onClick={() => handleCreateLabel(c.rawItem, 'BOS Kit', c.bosSku, c.bosKit)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold shadow-sm transition"
                                  >
                                    Create Label
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-600 border-r border-gray-100">{c.inverter}</td>
                              <td className="px-4 py-3 text-center border-r border-gray-100">
                                {c.inverterLabelNumber !== '-' ? (
                                  <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">{c.inverterLabelNumber}</span>
                                ) : (
                                  <button
                                    onClick={() => handleCreateLabel(c.rawItem, 'Inverter', c.inverterSku, c.inverter)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold shadow-sm transition"
                                  >
                                    Create Label
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-xs text-gray-600 border-r border-gray-100">{c.labelNumber}</td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => handleCreateLabel(c.rawItem)}
                                  className="bg-[#2FA041] hover:bg-[#237d32] text-white px-3 py-1 rounded text-xs font-bold shadow-sm transition"
                                >
                                  Create Label
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              {getSubCustomersList().length > 0 && getSubCustomersList().every(c => c.labelNumber !== '-' && c.inverterLabelNumber !== '-' && c.bosLabelNumber !== '-') ? (
                <button
                  onClick={handleMoveToDeliveryPlan}
                  className="px-5 py-2 text-sm font-bold text-white bg-[#2FA041] rounded shadow-sm hover:bg-[#237d32] transition"
                >
                  Next Step
                </button>
              ) : (
                <button
                  disabled
                  className="px-5 py-2 text-sm font-bold text-gray-400 bg-gray-200 rounded shadow-sm cursor-not-allowed"
                  title="Generate all labels for all customers first"
                >
                  Next Step (Generate Labels first)
                </button>
              )}
              <button
                onClick={() => setShowGroupModal(false)}
                className="px-5 py-2 text-sm font-bold text-white bg-[#1D74B7] rounded shadow-sm hover:bg-[#155a8e] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Label Preview Modal */}
      {showLabelModal && selectedLabelItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-[#1D74B7] text-white">
              <h3 className="text-sm font-bold uppercase tracking-wider">
                {selectedLabelItem.labelType === 'Inverter' 
                  ? 'Inverter Identification Label' 
                  : selectedLabelItem.labelType === 'BOS Kit' 
                  ? 'BOS Kit Identification Label' 
                  : 'Dispatch Identification Label'}
              </h3>
              <button 
                onClick={() => setShowLabelModal(false)}
                className="text-white hover:text-gray-200 bg-white/10 hover:bg-white/20 rounded-full p-1 transition"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Label Body (Stylized for identification) */}
            <div className="p-6 bg-gray-50 flex justify-center">
              <div className="bg-white border-2 border-dashed border-gray-400 p-6 rounded-md shadow-md w-full font-mono text-xs text-gray-800 space-y-4">
                <div className="text-center border-b pb-2 border-gray-200">
                  <h2 className="text-base font-bold tracking-widest text-[#18395C]">SOLARKITS ERP</h2>
                  <p className="text-[9px] text-gray-500 uppercase mt-0.5 font-bold">WAREHOUSE IDENTIFICATION LABEL</p>
                </div>
                
                <div className="space-y-2.5">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block font-bold">Destination Location</span>
                    <span className="font-bold text-sm text-[#1D74B7]">{selectedLabelItem.location} Client</span>
                  </div>
                  <div className="border-t border-gray-100 pt-1.5">
                    <span className="text-[10px] text-gray-400 uppercase block font-bold">Customer Details</span>
                    <span className="font-bold text-xs text-gray-950 block">{selectedLabelItem.vendorName}</span>
                    <span className="text-[10px] text-gray-600 block leading-tight mt-0.5">{selectedLabelItem.address}</span>
                    <span className="text-[10px] text-gray-800 font-bold block mt-0.5">PIN Code: {selectedLabelItem.pincode}</span>
                  </div>
                  <div className="pt-1.5 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 uppercase block">Order ID</span>
                    <span className="font-bold text-gray-900">{selectedLabelItem.originalOrderNo}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 uppercase block font-bold">Item Details</span>
                    <span className="font-bold text-gray-900 text-xs block">
                      {selectedLabelItem.labelType === 'Inverter' 
                        ? 'Inverter Unit' 
                        : selectedLabelItem.labelType === 'BOS Kit' 
                        ? 'BOS Installation Kit' 
                        : (selectedGroup?.type === 'Inverter' ? '5KW Hybrid Inverter' : 'BOS Full Kit')}
                    </span>
                    <span className="block text-[10px] text-blue-800 font-semibold mt-0.5">
                      Selected: {selectedLabelItem.specDetail || selectedLabelItem.brand}
                    </span>
                    {(selectedLabelItem.labelType === 'Inverter' || selectedLabelItem.labelType === 'BOS Kit') && (
                      <div className="mt-1.5 p-2 bg-gray-50 border border-gray-200 rounded text-[9.5px] leading-relaxed text-gray-700 font-sans whitespace-normal break-words max-w-full">
                        <span className="font-bold text-gray-900 block mb-0.5 uppercase tracking-wide text-[8px] text-gray-500">Technical Contents & Specs:</span>
                        {selectedLabelItem.labelType === 'Inverter' 
                          ? (selectedLabelItem.inverterDetails || '5KW Hybrid Inverter')
                          : (selectedLabelItem.bosDetails || 'BOS Accessories Kit')}
                      </div>
                    )}
                  </div>
                  <div className="pt-1.5 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 uppercase block">Dispatch Run Details</span>
                    <span className="font-semibold text-gray-900">{selectedLabelItem.driver} ({selectedLabelItem.vehicle})</span>
                  </div>
                </div>

                {/* Mock barcode code blocks */}
                <div className="pt-4 flex flex-col items-center justify-center space-y-1">
                  <div className="h-10 bg-black w-4/5 flex space-x-0.5 items-end justify-center px-2">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="bg-white h-full" 
                        style={{ width: `${(i % 3 === 0 ? 3 : (i % 2 === 0 ? 1 : 2))}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] tracking-widest text-gray-500">{selectedLabelItem.sku || `${selectedLabelItem.originalOrderNo}-DISP`}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 flex justify-end space-x-2 bg-gray-100">
              <button 
                onClick={() => {
                  if (selectedLabelItem?.sku) {
                    const updated = [...createdLabelIds, selectedLabelItem.sku];
                    setCreatedLabelIds(updated);
                    localStorage.setItem('createdLabelIds', JSON.stringify(updated));
                  }
                  setShowLabelModal(false);
                }}
                className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition"
              >
                Save Label
              </button>
              <button 
                onClick={() => {
                  if (selectedLabelItem?.sku) {
                    const updated = [...createdLabelIds, selectedLabelItem.sku];
                    setCreatedLabelIds(updated);
                    localStorage.setItem('createdLabelIds', JSON.stringify(updated));
                  }
                  window.print();
                }}
                className="px-4 py-1.5 bg-[#2FA041] text-white rounded text-xs font-semibold hover:bg-green-700 transition"
              >
                Print Label
              </button>
              <button 
                onClick={() => setShowLabelModal(false)}
                className="px-4 py-1.5 bg-gray-600 text-white rounded text-xs font-semibold hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-white rounded shadow-sm border border-gray-100 text-center py-4 text-[13px] font-semibold text-[#18395C] mt-8">
        Copyright © 2025 Solarkits. All Rights Reserved.
      </div>

    </div>
  );
}
