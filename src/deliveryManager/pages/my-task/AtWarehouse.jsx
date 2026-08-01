import React, { useState, useEffect, useRef } from 'react';
import { Settings, Box, Check, Coffee, Eye, X, FileText, RotateCcw, Trash2, AlertTriangle, Search, Filter, Users, Building2, Home, Zap, Layers, Sun } from 'lucide-react';

export default function AtWarehouse() {
  const [deliverySchedule, setDeliverySchedule] = useState([]);
  
  // Filter States for Delivery Schedule
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [selectedBrandFilter, setSelectedBrandFilter] = useState('All');
  const [selectedProjectTypeFilter, setSelectedProjectTypeFilter] = useState('All');
  const [selectedCapacityFilter, setSelectedCapacityFilter] = useState('All');
  const [activeCardFilter, setActiveCardFilter] = useState('All');

  // Location Card Filter States (Country, State, District)
  const [selectedCountryCard, setSelectedCountryCard] = useState('All');
  const [selectedStateCard, setSelectedStateCard] = useState('All');
  const [selectedDistrictCard, setSelectedDistrictCard] = useState('All');
  
  // State for Group Modal (Shows customers belonging to the selected group/brand)
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null); // { brand: string, type: 'Inverter' | 'BOS Kit', row: any }

  // State for Inventory Check Modal
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedInventoryRow, setSelectedInventoryRow] = useState(null);
  const [inventoryCustomersList, setInventoryCustomersList] = useState([]);
  const [isViewOnlyModal, setIsViewOnlyModal] = useState(false);
  
  // Track inventory verification state per customer
  const [customerInventoryStatusMap, setCustomerInventoryStatusMap] = useState(() => {
    try {
      const stored = localStorage.getItem('customerInventoryStatusMap');
      if (stored) return JSON.parse(stored);
      return {};
    } catch (e) {
      return {};
    }
  });

  // Track generated label codes per customer & component
  const [customerLabelsMap, setCustomerLabelsMap] = useState(() => {
    try {
      const stored = localStorage.getItem('customerLabelsMap');
      if (stored) return JSON.parse(stored);
      return {};
    } catch (e) {
      return {};
    }
  });

  // State for Customer Label Options Modal
  const [showCustomerLabelSelectionModal, setShowCustomerLabelSelectionModal] = useState(false);
  const [selectedLabelCustomer, setSelectedLabelCustomer] = useState(null);

  const handleOpenCustomerLabelSelection = (cust) => {
    setSelectedLabelCustomer(cust);
    setShowCustomerLabelSelectionModal(true);
  };

  const handleGenerateFullCustomerLabel = (cust) => {
    const custKey = cust.name + '_' + (cust.parentRow?.no || cust.rawItem?.no || 'DEL');
    const masterCode = `LBL-${cust.parentRow?.no || 'ORD'}-MASTER`;
    const labelKey = custKey + '_Full Order Master';
    const panelKey = custKey + '_Solar Panel';
    const inverterKey = custKey + '_Inverter';
    const bosKey = custKey + '_BOS Kit';
    const panelCode = `LBL-${cust.parentRow?.no || 'ORD'}-PANEL`;
    const inverterCode = `INV-${cust.parentRow?.no || 'ORD'}-UNIT`;
    const bosCode = `BOS-${cust.parentRow?.no || 'ORD'}-KIT`;

    const updatedMap = {
      ...customerLabelsMap,
      [labelKey]: masterCode,
      [panelKey]: customerLabelsMap[panelKey] || panelCode,
      [inverterKey]: customerLabelsMap[inverterKey] || inverterCode,
      [bosKey]: customerLabelsMap[bosKey] || bosCode,
    };
    setCustomerLabelsMap(updatedMap);
    try {
      localStorage.setItem('customerLabelsMap', JSON.stringify(updatedMap));
    } catch (e) {
      console.error(e);
    }

    const existingOrders = JSON.parse(localStorage.getItem('deliveryPlanOrders') || '[]');
    const newItem = {
      id: cust.parentRow?.originalOrderNo || cust.rawItem?.originalOrderNo || 'ORD',
      no: cust.parentRow?.no || cust.rawItem?.no || 'DEL-ORD',
      vendorName: cust.name,
      partner: cust.partner || cust.rawItem?.partner || cust.parentRow?.partner || 'Tata Solar',
      address: cust.rawItem?.address || 'Gujarat',
      pincode: cust.rawItem?.pincode || '360001',
      panel: `${cust.panelQty || 15} Pcs (${cust.panelSpec || cust.panel || 'Tata'})`,
      bosKit: `${cust.bosQty || 1} Kit (Full Kit)`,
      inverter: `${cust.inverterQty || 1} Pc (5KW Hybrid)`,
      labelNumber: masterCode,
      inverterLabelNumber: inverterCode,
      bosLabelNumber: bosCode,
      location: cust.rawItem?.location || 'Rajkot',
      kw: cust.kw,
      driver: cust.rawItem?.driver || 'Assign Driver',
      vehicle: cust.rawItem?.vehicle || 'Truck 407',
      deliveryType: 'Regular',
      areaType: 'Urban'
    };

    const filtered = existingOrders.filter(e => !(e.vendorName === newItem.vendorName && e.no === newItem.no));
    const merged = [newItem, ...filtered];
    localStorage.setItem('deliveryPlanOrders', JSON.stringify(merged));

    handleCreateLabel(cust.rawItem || cust, 'Full Order Master', masterCode, 'Complete Solar System Kit (Panels + Inverter + BOS)');
    setShowCustomerLabelSelectionModal(false);
  };
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedLabelItem, setSelectedLabelItem] = useState(null);
  const [createdLabelIds, setCreatedLabelIds] = useState(() => {
    try {
      const stored = localStorage.getItem('createdLabelIds');
      if (stored) return JSON.parse(stored);
      return [];
    } catch (e) {
      return [];
    }
  });

  const handleCreateLabel = (item, labelType = 'General', specificSku = null, specDetail = null) => {
    const labelCode = specificSku || `${item.no || 'DEL'}-${labelType.toUpperCase().replace(/\s+/g, '')}`;
    
    if (selectedLabelCustomer) {
      const custKey = selectedLabelCustomer.name + '_' + (selectedLabelCustomer.parentRow?.no || selectedLabelCustomer.rawItem?.no || 'DEL');
      const labelKey = custKey + '_' + labelType;
      let updatedMap = { ...customerLabelsMap, [labelKey]: labelCode };

      const panelCode = updatedMap[custKey + '_Solar Panel'];
      const inverterCode = updatedMap[custKey + '_Inverter'];
      const bosCode = updatedMap[custKey + '_BOS Kit'];
      let masterCode = updatedMap[custKey + '_Full Order Master'];

      // If all component labels or master label are created, automatically add customer to Delivery Plan!
      if (labelType === 'Full Order Master' || (panelCode && inverterCode && bosCode) || masterCode) {
        if (!masterCode) {
          masterCode = `LBL-${selectedLabelCustomer.parentRow?.no || selectedLabelCustomer.rawItem?.no || 'ORD'}-MASTER`;
          updatedMap[custKey + '_Full Order Master'] = masterCode;
        }

        try {
          const existingOrders = JSON.parse(localStorage.getItem('deliveryPlanOrders') || '[]');
          const newItem = {
            id: selectedLabelCustomer.parentRow?.originalOrderNo || selectedLabelCustomer.rawItem?.originalOrderNo || 'ORD',
            no: selectedLabelCustomer.parentRow?.no || selectedLabelCustomer.rawItem?.no || 'DEL-ORD',
            vendorName: selectedLabelCustomer.name,
            partner: selectedLabelCustomer.partner || selectedLabelCustomer.rawItem?.partner || selectedLabelCustomer.parentRow?.partner || 'Tata Solar',
            address: selectedLabelCustomer.rawItem?.address || 'Gujarat',
            pincode: selectedLabelCustomer.rawItem?.pincode || '360001',
            panel: `${selectedLabelCustomer.panelQty || 15} Pcs (${selectedLabelCustomer.panelSpec || selectedLabelCustomer.panel || 'Tata'})`,
            bosKit: `${selectedLabelCustomer.bosQty || 1} Kit (Full Kit)`,
            inverter: `${selectedLabelCustomer.inverterQty || 1} Pc (5KW Hybrid)`,
            labelNumber: masterCode,
            inverterLabelNumber: inverterCode || `INV-${selectedLabelCustomer.parentRow?.no || 'ORD'}-UNIT`,
            bosLabelNumber: bosCode || `BOS-${selectedLabelCustomer.parentRow?.no || 'ORD'}-KIT`,
            location: selectedLabelCustomer.rawItem?.location || 'Rajkot',
            kw: selectedLabelCustomer.kw,
            driver: selectedLabelCustomer.rawItem?.driver || 'Assign Driver',
            vehicle: selectedLabelCustomer.rawItem?.vehicle || 'Truck 407',
            deliveryType: 'Regular',
            areaType: 'Urban'
          };
          const filtered = existingOrders.filter(e => !(e.vendorName === newItem.vendorName && e.no === newItem.no));
          const merged = [newItem, ...filtered];
          localStorage.setItem('deliveryPlanOrders', JSON.stringify(merged));
        } catch (e) {
          console.error('Error adding to delivery plan', e);
        }
      }

      setCustomerLabelsMap(updatedMap);
      try {
        localStorage.setItem('customerLabelsMap', JSON.stringify(updatedMap));
      } catch (e) {
        console.error(e);
      }
    }

    setSelectedLabelItem({
      ...item,
      labelType,
      sku: labelCode,
      specDetail: specDetail
    });
    setShowLabelModal(true);
  };

  const loadData = () => {
    try {
      const storedInward = JSON.parse(localStorage.getItem('inwardOrdersData') || '[]');
      // Filter only those where status is 'Inward Matched Successfully'
      const matchedInwards = storedInward.filter(item => item.status === 'Inward Matched Successfully');
      
      const mapped = matchedInwards.map((item) => {
        const qty = parseInt(item.totalUnits) || 0;
        return {
          no: `DEL-${item.orderNo}`,
          location: item.location || '',
          panel: { qty: qty, spec: `${item.wattPeak || ''} ${item.brand || ''}`.trim(), checked: true },
          inverter: { qty: item.inverterQty || 1, spec: item.inverterSpec || `${item.brand || ''} Inverter`.trim(), checked: true },
          bos: { qty: item.bosQty || 1, spec: item.bosSpec || 'Full Kit', checked: true },
          kw: item.totalKw || '-',
          vehicle: item.vehicle || '-',
          driver: item.driver || '-',
          status: item.deliveryStatus || 'Pending',
          originalOrderNo: item.orderNo,
          brand: item.brand || 'Other',
          wattPeak: item.wattPeak || '-',
          technology: item.technology || '-',
          projectType: item.projectType || '-',
          totalUnits: qty,
          totalKw: item.totalKw || '-',
          receivedDate: item.receivedDate || '-',
          vendorName: item.vendorName || '-',
          poNumber: item.poNumber || '-',
          poAmount: item.poAmount || '-',
          sku: item.sku || '-'
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

  const handleOpenInventoryCheck = (row, specificCust = null, isViewOnly = false) => {
    setSelectedInventoryRow(row);
    setIsViewOnlyModal(isViewOnly);
    let initialList = [];
    if (specificCust) {
      initialList = [{ ...specificCust, stockStatus: 'In Stock' }];
    } else {
      initialList = getSubCustomersForTargetRow(row).map(c => ({
        ...c,
        stockStatus: 'In Stock'
      }));
    }
    setInventoryCustomersList(initialList);
    setShowInventoryModal(true);
  };

  const handleToggleStockStatus = (customerName) => {
    setInventoryCustomersList(prev => prev.map(c => {
      if (c.name === customerName) {
        const nextStatus = c.stockStatus === 'Out of Stock' ? 'In Stock' : 'Out of Stock';
        return { ...c, stockStatus: nextStatus };
      }
      return c;
    }));
  };

  const handleRemoveCustomer = (customerName) => {
    if (window.confirm(`Are you sure you want to remove "${customerName}" from this delivery group?`)) {
      setInventoryCustomersList(prev => prev.filter(c => c.name !== customerName));
    }
  };

  const handleSendToProcurement = (customer) => {
    if (window.confirm(`Send customer "${customer.name}" back to Procurement?`)) {
      try {
        const orderId = customer.rawItem?.originalOrderNo || customer.rawItem?.no || '';

        // 1. Save returned customer to returnedSubCustomersMap
        const returnedSubMap = JSON.parse(localStorage.getItem('returnedSubCustomersMap') || '{}');
        if (!returnedSubMap[orderId]) returnedSubMap[orderId] = [];
        if (!returnedSubMap[orderId].includes(customer.name)) {
          returnedSubMap[orderId].push(customer.name);
        }
        localStorage.setItem('returnedSubCustomersMap', JSON.stringify(returnedSubMap));

        // 2. Remove customer from subCustomers list in generatedVendorPayments
        const generated = JSON.parse(localStorage.getItem('generatedVendorPayments') || '[]');
        const updatedGenerated = generated.map(o => {
          if (o.id === orderId && o.subCustomers) {
            const newSubs = o.subCustomers.filter(c => {
              const subName = typeof c === 'string' ? c : c.name;
              return subName !== customer.name;
            });
            return { ...o, subCustomers: newSubs };
          }
          return o;
        });
        localStorage.setItem('generatedVendorPayments', JSON.stringify(updatedGenerated));

        const remainingCustomers = inventoryCustomersList.filter(c => c.name !== customer.name);

        // 3. ONLY if 0 customers remain in this group, mark inward order as returned!
        if (remainingCustomers.length === 0) {
          const storedInward = JSON.parse(localStorage.getItem('inwardOrdersData') || '[]');
          const updatedInward = storedInward.map(item => {
            if (item.orderNo === orderId) {
              return { ...item, status: 'Returned to Procurement', deliveryStatus: 'Returned to Procurement' };
            }
            return item;
          });
          localStorage.setItem('inwardOrdersData', JSON.stringify(updatedInward));

          setDeliverySchedule(prev => prev.filter(row => row.originalOrderNo !== orderId));
        }

        // 4. Save detailed returned item to returnedToProcurementOrders for Account Manager / Procurement views
        const returnedList = JSON.parse(localStorage.getItem('returnedToProcurementOrders') || '[]');
        const newItem = {
          orderId: orderId || 'ORD-RET',
          procurementNo: customer.rawItem?.sku || `PROC-${orderId}`,
          vendorName: customer.name,
          partner: customer.partner || '-',
          brand: customer.panelSpec || customer.rawItem?.brand || 'Solar Brand',
          product: `${customer.name} (Returned Project)`,
          technology: customer.rawItem?.technology || 'Monoperc',
          projectType: customer.rawItem?.projectType || 'Commercial',
          wattPeak: customer.rawItem?.wattPeak || '540W',
          totalKW: customer.kw || '5 KW',
          totalPanels: (customer.panelQty || 15).toString(),
          totalPrice: customer.rawItem?.poAmount ? String(customer.rawItem.poAmount).replace('₹', '') : '50,000',
          status: 'Returned to Procurement',
          isReturned: true,
          returnedAt: new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
        };

        const filtered = returnedList.filter(r => !(r.vendorName === newItem.vendorName && r.orderId === newItem.orderId));
        filtered.unshift(newItem);
        localStorage.setItem('returnedToProcurementOrders', JSON.stringify(filtered));
      } catch (e) {
        console.error(e);
      }

      setInventoryCustomersList(prev => prev.filter(c => c.name !== customer.name));
      alert(`Customer "${customer.name}" has been sent back to Procurement successfully!`);
    }
  };

  const handleMoveToDeliveryPlan = () => {
    const subCustomers = getSubCustomersList();
    const existingOrders = JSON.parse(localStorage.getItem('deliveryPlanOrders') || '[]');
    
    // Map each customer to an individual order item
    const newItems = subCustomers.map(c => ({
      id: c.rawItem.originalOrderNo,
      no: c.rawItem.no,
      vendorName: c.name,
      partner: c.partner || c.rawItem?.partner || c.parentRow?.partner || 'Tata Solar',
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
    if (selectedGroup.row) {
      return [selectedGroup.row];
    }
    return [];
  };

  const getLabelExtraDetails = (location, inverter, bosKit) => {
    let address = location ? `${location}, Gujarat` : "Gujarat";
    let pincode = "";
    let inverterDetails = inverter || "Smart Inverter";
    let bosDetails = bosKit || "Full Installation BOS Accessories Kit";

    return { address, pincode, inverterDetails, bosDetails };
  };

  const getSubCustomersForTargetRow = (targetRow) => {
    if (!targetRow) return [];

    const returnedSubMap = JSON.parse(localStorage.getItem('returnedSubCustomersMap') || '{}');
    const returnedForThisOrder = returnedSubMap[targetRow.originalOrderNo] || [];

    // Check if generatedVendorPayments has order data
    const generated = JSON.parse(localStorage.getItem('generatedVendorPayments') || '[]');
    const orderData = generated.find(o => o.id === targetRow.originalOrderNo);
    
    if (orderData && orderData.subCustomers && orderData.subCustomers.length > 0) {
      const activeSubs = orderData.subCustomers.filter(c => {
        const name = typeof c === 'string' ? c : c.name;
        return !returnedForThisOrder.includes(name);
      });

      return activeSubs.map(c => {
        const name = typeof c === 'string' ? c : c.name;
        const partner = typeof c === 'string' ? '-' : (c.partner || '-');
        const kw = typeof c === 'string' ? '0' : (c.kw || '0');
        const panel = typeof c === 'string' ? '-' : (c.panel || '-');
        const bosKit = typeof c === 'string' ? '-' : (c.bosKit || '-');
        const inverter = typeof c === 'string' ? '-' : (c.inverter || '-');
        const labelNumber = typeof c === 'string' ? '-' : (c.labelNumber || '-');
        
        const originalOrderNo = targetRow.originalOrderNo || '';
        const cleanName = name.replace(/\s+/g, '');
        const inverterSku = `INV-${originalOrderNo}-${cleanName}`;
        const bosSku = `BOS-${originalOrderNo}-${cleanName}`;
        const mainSku = labelNumber !== '-' ? labelNumber : `LBL-${originalOrderNo}-${cleanName}`;

        const locationVal = targetRow.location || '';
        const { address, pincode, inverterDetails, bosDetails } = getLabelExtraDetails(locationVal, inverter, bosKit);

        const rawItem = {
          no: targetRow.no || '',
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
          totalUnits: targetRow.totalUnits || 0,
          brand: targetRow.brand || '-',
          projectType: targetRow.projectType || '-',
          driver: targetRow.driver || '-',
          vehicle: targetRow.vehicle || '-',
          receivedDate: targetRow.receivedDate || '-'
        };

        const isLabelCreated = createdLabelIds.includes(rawItem.sku);
        const isInverterLabelCreated = createdLabelIds.includes(inverterSku);
        const isBosLabelCreated = createdLabelIds.includes(bosSku);

        const panelQty = parseInt(panel) || targetRow.panel?.qty || 0;
        const panelSpec = targetRow.panel?.spec || targetRow.brand || '';

        return {
          name,
          partner,
          kw: `${kw} KW`,
          panel: panel !== '-' ? panel : `${panelQty} Pcs (${panelSpec})`,
          panelQty: panelQty,
          panelSpec: panelSpec,
          bosKit: bosKit !== '-' ? bosKit : '1 Kit',
          bosQty: 1,
          inverter: inverter !== '-' ? inverter : '1 Pc',
          inverterQty: 1,
          labelNumber: isLabelCreated ? rawItem.sku : '-',
          inverterSku,
          bosSku,
          inverterLabelNumber: isInverterLabelCreated ? inverterSku : '-',
          bosLabelNumber: isBosLabelCreated ? bosSku : '-',
          rawItem
        };
      });
    }

    // Dynamic fallback using targetRow itself (no mock data)
    const originalOrderNo = targetRow.originalOrderNo || '';
    const cleanName = (targetRow.vendorName || 'Customer').replace(/\s+/g, '');
    const inverterSku = `INV-${originalOrderNo}-${cleanName}`;
    const bosSku = `BOS-${originalOrderNo}-${cleanName}`;
    const mainSku = targetRow.sku || `LBL-${originalOrderNo}-${cleanName}`;

    const locationVal = targetRow.location || '';
    const { address, pincode, inverterDetails, bosDetails } = getLabelExtraDetails(locationVal, targetRow.inverter?.spec, targetRow.bos?.spec);

    const isLabelCreated = createdLabelIds.includes(mainSku);
    const isInverterLabelCreated = createdLabelIds.includes(inverterSku);
    const isBosLabelCreated = createdLabelIds.includes(bosSku);

    const panelUnits = targetRow.totalUnits || targetRow.panel?.qty || 0;
    const panelBrand = targetRow.brand || targetRow.panel?.spec || 'Solar Panel';

    return [{
      name: targetRow.vendorName || targetRow.no || 'Solar Project Client',
      partner: targetRow.poNumber || '-',
      kw: targetRow.totalKw || targetRow.kw || '-',
      panel: `${panelUnits} Pcs (${panelBrand})`,
      panelQty: panelUnits,
      panelSpec: panelBrand,
      bosKit: targetRow.bos?.spec || '1 Kit',
      bosQty: targetRow.bos?.qty || 1,
      inverter: targetRow.inverter?.spec || '1 Pc',
      inverterQty: targetRow.inverter?.qty || 1,
      labelNumber: isLabelCreated ? mainSku : '-',
      inverterSku,
      bosSku,
      inverterLabelNumber: isInverterLabelCreated ? inverterSku : '-',
      bosLabelNumber: isBosLabelCreated ? bosSku : '-',
      rawItem: { 
        ...targetRow, 
        sku: mainSku,
        address,
        pincode,
        inverterDetails,
        bosDetails
      }
    }];
  };

  const getSubCustomersList = () => {
    if (!selectedGroup || !selectedGroup.row) return [];
    return getSubCustomersForTargetRow(selectedGroup.row);
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

      {/* Cascading Location Filter Cards Section (Country -> State -> District) */}
      {(() => {
        const allSubCustomers = deliverySchedule.flatMap(row => {
          const subs = getSubCustomersForTargetRow(row);
          return subs.map(sub => ({
            ...sub,
            parentRow: row
          }));
        });

        const totalCustomerCount = allSubCustomers.length;

        // Dynamic helper for counts:
        const getCountForCountry = (cName) => {
          if (cName === 'All Countries' || cName === 'India') return totalCustomerCount;
          return 0;
        };

        const getCountForState = (sName) => {
          if (sName === 'All States' || sName === 'Gujarat') return getCountForCountry(selectedCountryCard);
          return 0;
        };

        const getCountForDistrict = (dName) => {
          if (dName === 'All Districts') return getCountForState(selectedStateCard);
          return allSubCustomers.filter(c => {
            const loc = (c.location || c.rawItem?.location || c.parentRow?.location || 'Rajkot').toLowerCase();
            return loc.includes(dName.toLowerCase());
          }).length;
        };

        const countriesList = [
          { name: 'All Countries', code: 'ALL', count: totalCustomerCount },
          { name: 'India', code: 'IN', count: totalCustomerCount },
          { name: 'Pakistan', code: 'PA', count: 0 }
        ];

        const statesMap = {
          'India': [
            { name: 'All States', code: 'ALL', count: totalCustomerCount },
            { name: 'Gujarat', code: 'GU', count: totalCustomerCount },
            { name: 'Maharashtra', code: 'MA', count: 0 },
            { name: 'Rajasthan', code: 'RA', count: 0 }
          ],
          'Pakistan': [
            { name: 'All States', code: 'ALL', count: 0 },
            { name: 'Punjab', code: 'PB', count: 0 },
            { name: 'Sindh', code: 'SD', count: 0 },
            { name: 'Khyber Pakhtunkhwa', code: 'KP', count: 0 }
          ]
        };

        const districtsMap = {
          'Gujarat': [
            { name: 'All Districts', code: 'ALL', count: getCountForDistrict('All Districts') },
            { name: 'Ahmedabad', code: 'GUJ', count: getCountForDistrict('Ahmedabad') },
            { name: 'Gandhinagar', code: 'GUJ', count: getCountForDistrict('Gandhinagar') },
            { name: 'Mehsana', code: 'GUJ', count: getCountForDistrict('Mehsana') },
            { name: 'Patan', code: 'GUJ', count: getCountForDistrict('Patan') },
            { name: 'Sabarkantha', code: 'GUJ', count: getCountForDistrict('Sabarkantha') },
            { name: 'Banaskantha', code: 'GUJ', count: getCountForDistrict('Banaskantha') },
            { name: 'Mahisagar', code: 'GUJ', count: getCountForDistrict('Mahisagar') },
            { name: 'Rajkot', code: 'GUJ', count: getCountForDistrict('Rajkot') },
            { name: 'Surat', code: 'GUJ', count: getCountForDistrict('Surat') },
            { name: 'Vadodara', code: 'GUJ', count: getCountForDistrict('Vadodara') }
          ],
          'Maharashtra': [
            { name: 'All Districts', code: 'ALL', count: 0 },
            { name: 'Mumbai', code: 'MAH', count: 0 },
            { name: 'Pune', code: 'MAH', count: 0 },
            { name: 'Nagpur', code: 'MAH', count: 0 },
            { name: 'Nashik', code: 'MAH', count: 0 }
          ],
          'Rajasthan': [
            { name: 'All Districts', code: 'ALL', count: 0 },
            { name: 'Jaipur', code: 'RAJ', count: 0 },
            { name: 'Udaipur', code: 'RAJ', count: 0 },
            { name: 'Jodhpur', code: 'RAJ', count: 0 }
          ]
        };

        const currentStates = selectedCountryCard !== 'All' ? (statesMap[selectedCountryCard] || []) : [];
        const currentDistricts = selectedStateCard !== 'All' ? (districtsMap[selectedStateCard] || []) : [];

        return (
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
            {/* 1. Select Country */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                  <span>Select Country</span>
                  {selectedCountryCard !== 'All' && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {selectedCountryCard}
                    </span>
                  )}
                </h3>
                {selectedCountryCard !== 'All' && (
                  <button
                    onClick={() => {
                      setSelectedCountryCard('All');
                      setSelectedStateCard('All');
                      setSelectedDistrictCard('All');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    Clear Country Selection
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {countriesList.map((item, idx) => {
                  const isSelected = selectedCountryCard === item.name;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedCountryCard(item.name);
                        setSelectedStateCard('All');
                        setSelectedDistrictCard('All');
                      }}
                      className={`cursor-pointer px-4 py-2.5 rounded-xl transition-all shadow-2xs flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50/90 border-2 border-blue-500'
                          : 'bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div>
                        <span className={`text-xs font-medium block leading-snug ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                          {item.name}
                        </span>
                        <span className={`text-[10px] uppercase tracking-wider block mt-0.5 ${isSelected ? 'text-blue-600 font-semibold' : 'text-slate-400 font-normal'}`}>
                          {item.code}
                        </span>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isSelected 
                          ? 'bg-blue-600 text-white' 
                          : item.count > 0 
                            ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-200/80' 
                            : 'bg-slate-100 text-slate-400 font-normal'
                      }`}>
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Select State - ONLY OPENS WHEN A COUNTRY IS SELECTED! */}
            {selectedCountryCard !== 'All' ? (
              <div className="animate-fade-in pt-3 border-t border-slate-200/70">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                    <span>Select State</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                      In {selectedCountryCard}
                    </span>
                  </h3>
                  {selectedStateCard !== 'All' && (
                    <button
                      onClick={() => {
                        setSelectedStateCard('All');
                        setSelectedDistrictCard('All');
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                    >
                      Clear State Selection
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {currentStates.map((item, idx) => {
                    const isSelected = selectedStateCard === item.name;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedStateCard(item.name);
                          setSelectedDistrictCard('All');
                        }}
                        className={`cursor-pointer px-4 py-2.5 rounded-xl transition-all shadow-2xs flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50/90 border-2 border-blue-500'
                            : 'bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div>
                          <span className={`text-xs font-medium block leading-snug ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                            {item.name}
                          </span>
                          <span className={`text-[10px] uppercase tracking-wider block mt-0.5 ${isSelected ? 'text-blue-600 font-semibold' : 'text-slate-400 font-normal'}`}>
                            {item.code}
                          </span>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          isSelected 
                            ? 'bg-blue-600 text-white' 
                            : item.count > 0 
                              ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-200/80' 
                              : 'bg-slate-100 text-slate-400 font-normal'
                        }`}>
                          {item.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* 3. Select District - ONLY OPENS WHEN A STATE IS SELECTED! */}
            {selectedCountryCard !== 'All' && selectedStateCard !== 'All' ? (
              <div className="animate-fade-in pt-3 border-t border-slate-200/70">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                    <span>Select District</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                      In {selectedStateCard}
                    </span>
                  </h3>
                  {selectedDistrictCard !== 'All' && (
                    <button
                      onClick={() => setSelectedDistrictCard('All')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                    >
                      Clear District Selection
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {currentDistricts.map((item, idx) => {
                    const isSelected = selectedDistrictCard === item.name;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDistrictCard(item.name)}
                        className={`cursor-pointer px-4 py-2.5 rounded-xl transition-all shadow-2xs flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50/90 border-2 border-blue-500'
                            : 'bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div>
                          <span className={`text-xs font-medium block leading-snug ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                            {item.name}
                          </span>
                          <span className={`text-[10px] uppercase tracking-wider block mt-0.5 ${isSelected ? 'text-blue-600 font-semibold' : 'text-slate-400 font-normal'}`}>
                            {item.code}
                          </span>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          isSelected 
                            ? 'bg-blue-600 text-white' 
                            : item.count > 0 
                              ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-200/80' 
                              : 'bg-slate-100 text-slate-400 font-normal'
                        }`}>
                          {item.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        );
      })()}

      {/* Interactive Metric Filter Cards */}
      {(() => {
        const allSubCustomers = deliverySchedule.flatMap(row => {
          const subs = getSubCustomersForTargetRow(row);
          return subs.map(sub => ({
            ...sub,
            parentRow: row
          }));
        });

        const totalProjectsCount = allSubCustomers.length;
        const commercialCount = allSubCustomers.filter(c => {
          const pType = (c.parentRow?.projectType || c.rawItem?.projectType || '').toLowerCase();
          return pType.includes('commercial') || pType.includes('industrial');
        }).length;

        const residentialCount = allSubCustomers.filter(c => {
          const pType = (c.parentRow?.projectType || c.rawItem?.projectType || '').toLowerCase();
          return pType.includes('residential');
        }).length;

        const highCapacityCount = allSubCustomers.filter(c => {
          const kwVal = parseFloat((c.kw || '0').replace(/[^0-9.]/g, '')) || 0;
          return kwVal >= 10;
        }).length;

        const standardCapacityCount = allSubCustomers.filter(c => {
          const kwVal = parseFloat((c.kw || '0').replace(/[^0-9.]/g, '')) || 0;
          return kwVal < 10;
        }).length;

        return (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 mt-2">
            {/* Card 1: All Projects */}
            <div
              onClick={() => setActiveCardFilter('All')}
              className={`cursor-pointer p-3.5 rounded-xl border transition-all shadow-2xs flex items-center justify-between ${
                activeCardFilter === 'All'
                  ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-400'
                  : 'bg-white text-slate-800 border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
              }`}
            >
              <div>
                <span className={`text-[10px] font-bold block uppercase tracking-wider ${activeCardFilter === 'All' ? 'text-blue-100' : 'text-slate-500'}`}>
                  All Customers
                </span>
                <span className="text-2xl font-bold block leading-tight mt-0.5">{totalProjectsCount}</span>
                <span className={`text-[10px] block mt-0.5 ${activeCardFilter === 'All' ? 'text-blue-200' : 'text-slate-400'}`}>Click to view all</span>
              </div>
              <div className={`p-2 rounded-lg ${activeCardFilter === 'All' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600'}`}>
                <Users size={18} />
              </div>
            </div>

            {/* Card 2: Commercial & Industrial */}
            <div
              onClick={() => setActiveCardFilter(activeCardFilter === 'Commercial' ? 'All' : 'Commercial')}
              className={`cursor-pointer p-3.5 rounded-xl border transition-all shadow-2xs flex items-center justify-between ${
                activeCardFilter === 'Commercial'
                  ? 'bg-slate-800 text-white border-slate-800 ring-2 ring-slate-400'
                  : 'bg-white text-slate-800 border-gray-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div>
                <span className={`text-[10px] font-bold block uppercase tracking-wider ${activeCardFilter === 'Commercial' ? 'text-slate-200' : 'text-slate-500'}`}>
                  Commercial
                </span>
                <span className="text-2xl font-bold block leading-tight mt-0.5">{commercialCount}</span>
                <span className={`text-[10px] block mt-0.5 ${activeCardFilter === 'Commercial' ? 'text-slate-300' : 'text-slate-400'}`}>Commercial & Ind.</span>
              </div>
              <div className={`p-2 rounded-lg ${activeCardFilter === 'Commercial' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <Building2 size={18} />
              </div>
            </div>

            {/* Card 3: Residential */}
            <div
              onClick={() => setActiveCardFilter(activeCardFilter === 'Residential' ? 'All' : 'Residential')}
              className={`cursor-pointer p-3.5 rounded-xl border transition-all shadow-2xs flex items-center justify-between ${
                activeCardFilter === 'Residential'
                  ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400'
                  : 'bg-white text-slate-800 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40'
              }`}
            >
              <div>
                <span className={`text-[10px] font-bold block uppercase tracking-wider ${activeCardFilter === 'Residential' ? 'text-emerald-100' : 'text-slate-500'}`}>
                  Residential
                </span>
                <span className="text-2xl font-bold block leading-tight mt-0.5">{residentialCount}</span>
                <span className={`text-[10px] block mt-0.5 ${activeCardFilter === 'Residential' ? 'text-emerald-200' : 'text-slate-400'}`}>Home Systems</span>
              </div>
              <div className={`p-2 rounded-lg ${activeCardFilter === 'Residential' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                <Home size={18} />
              </div>
            </div>

            {/* Card 4: High Capacity (>=10KW) */}
            <div
              onClick={() => setActiveCardFilter(activeCardFilter === 'HighCapacity' ? 'All' : 'HighCapacity')}
              className={`cursor-pointer p-3.5 rounded-xl border transition-all shadow-2xs flex items-center justify-between ${
                activeCardFilter === 'HighCapacity'
                  ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-400'
                  : 'bg-white text-slate-800 border-gray-200 hover:border-purple-300 hover:bg-purple-50/40'
              }`}
            >
              <div>
                <span className={`text-[10px] font-bold block uppercase tracking-wider ${activeCardFilter === 'HighCapacity' ? 'text-purple-100' : 'text-slate-500'}`}>
                  Large Systems
                </span>
                <span className="text-2xl font-bold block leading-tight mt-0.5">{highCapacityCount}</span>
                <span className={`text-[10px] block mt-0.5 ${activeCardFilter === 'HighCapacity' ? 'text-purple-200' : 'text-slate-400'}`}>10+ KW Systems</span>
              </div>
              <div className={`p-2 rounded-lg ${activeCardFilter === 'HighCapacity' ? 'bg-purple-500 text-white' : 'bg-purple-50 text-purple-600'}`}>
                <Zap size={18} />
              </div>
            </div>

            {/* Card 5: Standard Systems (<10KW) */}
            <div
              onClick={() => setActiveCardFilter(activeCardFilter === 'StandardCapacity' ? 'All' : 'StandardCapacity')}
              className={`cursor-pointer p-3.5 rounded-xl border transition-all shadow-2xs flex items-center justify-between ${
                activeCardFilter === 'StandardCapacity'
                  ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400'
                  : 'bg-white text-slate-800 border-gray-200 hover:border-amber-300 hover:bg-amber-50/40'
              }`}
            >
              <div>
                <span className={`text-[10px] font-bold block uppercase tracking-wider ${activeCardFilter === 'StandardCapacity' ? 'text-amber-100' : 'text-slate-500'}`}>
                  Standard
                </span>
                <span className="text-2xl font-bold block leading-tight mt-0.5">{standardCapacityCount}</span>
                <span className={`text-[10px] block mt-0.5 ${activeCardFilter === 'StandardCapacity' ? 'text-amber-200' : 'text-slate-400'}`}>&lt; 10 KW Systems</span>
              </div>
              <div className={`p-2 rounded-lg ${activeCardFilter === 'StandardCapacity' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600'}`}>
                <Layers size={18} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delivery Schedule Section */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-50/70 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-slate-800 font-bold text-base tracking-tight">Delivery Schedule</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Live
            </span>
          </div>

          {/* Interactive Customer Search Dropdown */}
          <div className="relative flex-1 max-w-sm" ref={searchContainerRef}>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search or select customer, order no., or partner..."
                value={searchTerm}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                className="w-full pl-8 pr-7 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setIsSearchDropdownOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Customer Dropdown Menu */}
            {isSearchDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-64 overflow-y-auto animate-fade-in">
                <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Select Customer</span>
                  <button 
                    onClick={() => setIsSearchDropdownOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>

                {(() => {
                  const allCusts = deliverySchedule.flatMap(row => {
                    const subs = getSubCustomersForTargetRow(row);
                    return subs.map(sub => ({
                      ...sub,
                      parentRow: row
                    }));
                  });

                  const matchingCusts = allCusts.filter(cust => {
                    if (!searchTerm.trim()) return true;
                    const term = searchTerm.toLowerCase();
                    const matchName = cust.name?.toLowerCase().includes(term);
                    const matchNo = (cust.parentRow?.no || cust.rawItem?.no || '').toLowerCase().includes(term);
                    const matchPartner = cust.partner?.toLowerCase().includes(term);
                    return matchName || matchNo || matchPartner;
                  });

                  if (matchingCusts.length === 0) {
                    return (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No matching customers found
                      </div>
                    );
                  }

                  return matchingCusts.map((cust, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setSearchTerm(cust.name);
                        setIsSearchDropdownOpen(false);
                      }}
                      className="p-3 border-b border-slate-100 last:border-0 hover:bg-blue-50/80 cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                            {cust.name}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {cust.parentRow?.no || cust.rawItem?.no || 'DEL-ORD'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Partner: {cust.partner} | Spec: {cust.panelSpec || cust.panel}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                        {cust.kw}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="px-6 py-3 bg-slate-100/60 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5">
              <Filter size={13} className="text-slate-500" />
              <span className="font-semibold text-slate-600">Brand:</span>
              <select
                value={selectedBrandFilter}
                onChange={(e) => setSelectedBrandFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-md px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              >
                <option value="All">All Brands</option>
                <option value="Tata">Tata</option>
                <option value="Vikram">Vikram</option>
                <option value="Adani">Adani</option>
                <option value="Waaree">Waaree</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-slate-600">Project Type:</span>
              <select
                value={selectedProjectTypeFilter}
                onChange={(e) => setSelectedProjectTypeFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-md px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              >
                <option value="All">All Project Types</option>
                <option value="Commercial">Commercial</option>
                <option value="Residential">Residential</option>
                <option value="Industrial">Industrial</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-slate-600">Capacity:</span>
              <select
                value={selectedCapacityFilter}
                onChange={(e) => setSelectedCapacityFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-md px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              >
                <option value="All">All Capacities</option>
                <option value="< 5 KW">&lt; 5 KW</option>
                <option value="5 KW - 10 KW">5 KW - 10 KW</option>
                <option value="> 10 KW">&gt; 10 KW</option>
              </select>
            </div>
          </div>

          {(searchTerm || selectedBrandFilter !== 'All' || selectedProjectTypeFilter !== 'All' || selectedCapacityFilter !== 'All' || activeCardFilter !== 'All' || selectedCountryCard !== 'All' || selectedStateCard !== 'All' || selectedDistrictCard !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedBrandFilter('All');
                setSelectedProjectTypeFilter('All');
                setSelectedCapacityFilter('All');
                setActiveCardFilter('All');
                setSelectedCountryCard('All');
                setSelectedStateCard('All');
                setSelectedDistrictCard('All');
              }}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-2.5 py-1 rounded-md text-xs transition-colors flex items-center space-x-1"
              title="Reset all filters"
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          {(() => {
            const flatCustomerSchedule = deliverySchedule.flatMap(row => {
              const subs = getSubCustomersForTargetRow(row);
              return subs.map(sub => ({
                ...sub,
                parentRow: row
              }));
            });

            const filteredCustomerSchedule = flatCustomerSchedule.filter(cust => {
              // 0. Active Card Filter
              if (activeCardFilter === 'Commercial') {
                const pType = (cust.parentRow?.projectType || cust.rawItem?.projectType || '').toLowerCase();
                if (!pType.includes('commercial') && !pType.includes('industrial')) return false;
              }
              if (activeCardFilter === 'Residential') {
                const pType = (cust.parentRow?.projectType || cust.rawItem?.projectType || '').toLowerCase();
                if (!pType.includes('residential')) return false;
              }
              if (activeCardFilter === 'HighCapacity') {
                const kwVal = parseFloat((cust.kw || '0').replace(/[^0-9.]/g, '')) || 0;
                if (kwVal < 10) return false;
              }
              if (activeCardFilter === 'StandardCapacity') {
                const kwVal = parseFloat((cust.kw || '0').replace(/[^0-9.]/g, '')) || 0;
                if (kwVal >= 10) return false;
              }

              // 1. Search term filter
              if (searchTerm.trim() !== '') {
                const term = searchTerm.toLowerCase();
                const matchName = cust.name?.toLowerCase().includes(term);
                const matchNo = (cust.parentRow?.no || cust.rawItem?.no || '').toLowerCase().includes(term);
                const matchPartner = cust.partner?.toLowerCase().includes(term);
                if (!matchName && !matchNo && !matchPartner) return false;
              }

              // 2. Brand filter
              if (selectedBrandFilter !== 'All') {
                const spec = (cust.panelSpec || cust.panel || cust.parentRow?.brand || '').toLowerCase();
                if (!spec.includes(selectedBrandFilter.toLowerCase())) return false;
              }

              // 3. Project type filter
              if (selectedProjectTypeFilter !== 'All') {
                const pType = (cust.parentRow?.projectType || cust.rawItem?.projectType || '').toLowerCase();
                if (!pType.includes(selectedProjectTypeFilter.toLowerCase())) return false;
              }

              // 4. Capacity filter
              if (selectedCapacityFilter !== 'All') {
                const kwVal = parseFloat((cust.kw || '0').replace(/[^0-9.]/g, '')) || 0;
                if (selectedCapacityFilter === '< 5 KW' && kwVal >= 5) return false;
                if (selectedCapacityFilter === '5 KW - 10 KW' && (kwVal < 5 || kwVal > 10)) return false;
                if (selectedCapacityFilter === '> 10 KW' && kwVal <= 10) return false;
              }

              return true;
            });

            if (filteredCustomerSchedule.length === 0) {
              return (
                <div className="p-8 text-center text-slate-400 font-medium text-sm">
                  {flatCustomerSchedule.length === 0 
                    ? "No delivery schedules active. Match inwards first to see items here."
                    : "No customers match your filter criteria. Try resetting filters."}
                </div>
              );
            }

            return (
              <table className="w-full text-[13px] text-center">
                <thead className="text-white bg-slate-800 font-semibold text-xs tracking-wider uppercase">
                  <tr>
                    <th className="px-5 py-3.5 border-r border-slate-700/60 text-left">Delivery No. & Customer</th>
                    <th className="px-4 py-3.5 border-r border-slate-700/60 text-center">Capacity</th>
                    <th className="px-4 py-3.5 border-r border-slate-700/60">Solar Panel</th>
                    <th className="px-4 py-3.5 border-r border-slate-700/60">Inverter</th>
                    <th className="px-4 py-3.5 border-r border-slate-700/60">BOS Kit</th>
                    <th className="px-4 py-3.5 border-r border-slate-700/60">Inventory Check</th>
                    <th className="px-5 py-3.5">Manage / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredCustomerSchedule.map((cust, idx) => {
                    const custKey = cust.name + '_' + (cust.parentRow?.no || cust.rawItem?.no || 'DEL');
                    const invStatus = customerInventoryStatusMap[custKey];

                    return (
                      <tr key={idx} className="border-b hover:bg-slate-50/80 text-gray-700 transition-colors">
                        <td className="px-5 py-4 border-r border-gray-100 text-left">
                          <span className="text-blue-700 font-mono font-bold text-[11px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80 inline-block mb-1">
                            {cust.parentRow?.no || cust.rawItem?.no || 'DEL-ORD'}
                          </span>
                          <span className="font-bold text-slate-900 text-sm block leading-tight">{cust.name}</span>
                          <span className="text-xs text-slate-500 font-medium">{cust.partner}</span>
                        </td>
                        <td className="px-4 py-4 border-r border-gray-100 text-center">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md text-xs border border-slate-200 inline-block">
                            {cust.kw}
                          </span>
                        </td>
                        <td className="px-4 py-4 border-r border-gray-100">
                          <span className="font-semibold text-slate-800 text-xs">{cust.panelQty || 15} Pcs</span>
                          <span className="text-slate-500 text-[11px] font-medium block mt-0.5">({cust.panelSpec || cust.panel})</span>
                        </td>
                        <td className="px-4 py-4 border-r border-gray-100">
                          <span className="font-semibold text-slate-800 text-xs">{cust.inverterQty || 1} Pc</span>
                          <span className="text-slate-500 text-[11px] font-medium block mt-0.5">(5KW Hybrid)</span>
                        </td>
                        <td className="px-4 py-4 border-r border-gray-100">
                          <span className="font-semibold text-slate-800 text-xs">{cust.bosQty || 1} Kit</span>
                          <span className="text-slate-500 text-[11px] font-medium block mt-0.5">(Full Kit)</span>
                        </td>
                        <td className="px-4 py-4 border-r border-gray-100 text-center">
                          {invStatus === 'CONFIRMED' ? (
                            <div className="flex flex-col items-center justify-center space-y-1">
                              <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                                <Check size={12} className="text-emerald-600" />
                                <span>Inventory Verified</span>
                              </span>
                              <button
                                onClick={() => handleOpenInventoryCheck(cust.parentRow, cust, true)}
                                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline flex items-center space-x-1"
                              >
                                <Eye size={11} />
                                <span>View Inventory</span>
                              </button>
                            </div>
                          ) : invStatus === 'REJECTED' ? (
                            <div className="flex flex-col items-center justify-center space-y-1">
                              <span className="inline-flex items-center space-x-1 bg-red-50 text-red-700 border border-red-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                                <X size={12} className="text-red-600" />
                                <span>Out of Stock</span>
                              </span>
                              <button
                                onClick={() => handleOpenInventoryCheck(cust.parentRow, cust, true)}
                                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline flex items-center space-x-1"
                              >
                                <Eye size={11} />
                                <span>View Inventory</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenInventoryCheck(cust.parentRow, cust)}
                              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-md font-semibold text-xs shadow-2xs transition-colors flex items-center justify-center space-x-1.5 mx-auto whitespace-nowrap"
                            >
                              <Box size={14} className="text-blue-600" />
                              <span>Inventory Check</span>
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {invStatus === 'CONFIRMED' ? (
                            (() => {
                              const custKey = cust.name + '_' + (cust.parentRow?.no || cust.rawItem?.no || 'DEL');
                              const panelCode = customerLabelsMap[custKey + '_Solar Panel'];
                              const inverterCode = customerLabelsMap[custKey + '_Inverter'];
                              const bosCode = customerLabelsMap[custKey + '_BOS Kit'];
                              const masterCode = customerLabelsMap[custKey + '_Full Order Master'];

                              const isAllLabelsCreated = masterCode || (panelCode && inverterCode && bosCode);

                              if (isAllLabelsCreated) {
                                return (
                                  <button
                                    onClick={() => handleOpenCustomerLabelSelection(cust)}
                                    title="All labels created! Order automatically moved to Delivery Plan. Click to view."
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-2xs transition-all flex items-center space-x-1.5 whitespace-nowrap mx-auto border border-emerald-500"
                                  >
                                    <Check size={14} className="text-white" />
                                    <span>Create Label Successful</span>
                                  </button>
                                );
                              }

                              return (
                                <button
                                  onClick={() => handleOpenCustomerLabelSelection(cust)}
                                  title="Create Dispatch Label for Customer"
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-md text-xs font-bold shadow-2xs transition-all flex items-center space-x-1.5 whitespace-nowrap mx-auto"
                                >
                                  <Eye size={13} />
                                  <span>Create Label</span>
                                </button>
                              );
                            })()
                          ) : invStatus === 'REJECTED' ? (
                            <button
                              onClick={() => handleSendToProcurement(cust)}
                              title="Send customer back to Procurement"
                              className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 rounded-md text-xs font-bold shadow-2xs transition-all flex items-center space-x-1.5 whitespace-nowrap mx-auto"
                            >
                              <RotateCcw size={13} />
                              <span>Send to Procurement</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium italic">Pending Check</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
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
                        <td className="px-3 py-4 border-r border-gray-100 font-medium">{row.inverter?.spec || `${row.brand} Inverter`}</td>
                        <td className="px-3 py-4 border-r border-gray-100">{row.technology || 'Hybrid'}</td>
                        <td className="px-3 py-4 border-r border-gray-100">{row.projectType}</td>
                        <td className="px-3 py-4 border-r border-gray-100">{row.inverter?.qty || 1}</td>
                        <td className="px-3 py-4">{row.totalKw || '-'}</td>
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
                        <td className="px-3 py-3 border-r border-gray-100 font-medium">{row.inverter?.spec || `${row.brand} Inverter`}</td>
                        <td className="px-3 py-3 border-r border-gray-100">{row.technology || 'On-grid'}</td>
                        <td className="px-3 py-3 border-r border-gray-100">{row.projectType}</td>
                        <td className="px-3 py-3 border-r border-gray-100">{row.inverter?.qty || 1}</td>
                        <td className="px-3 py-3">{row.totalKw || '-'}</td>
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
                        <td className="px-5 py-3.5">{row.receivedDate || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Check Modal (Customer-Wise with Remove & Return to Previous Step Options) */}
      {showInventoryModal && selectedInventoryRow && (() => {
        const totalPanelsCount = inventoryCustomersList.reduce((acc, c) => acc + (c.panelQty || 15), 0);
        const totalInvertersCount = inventoryCustomersList.reduce((acc, c) => acc + (c.inverterQty || 1), 0);
        const totalBosCount = inventoryCustomersList.reduce((acc, c) => acc + (c.bosQty || 1), 0);
        const hasOutOfStock = inventoryCustomersList.some(c => c.stockStatus === 'Out of Stock');

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
              {/* Header */}
              <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-[#1D74B7] rounded-lg text-white shadow-sm">
                    <Box size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#145a80] flex items-center space-x-2">
                      <span>Customer-Wise Warehouse Inventory Check</span>
                      <span className="bg-blue-200 text-blue-900 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                        {selectedInventoryRow.no}
                      </span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Location: <span className="font-semibold text-gray-800">{selectedInventoryRow.location}</span> | Group Capacity: <span className="font-semibold text-gray-800">{selectedInventoryRow.kw}</span> | Active Projects: <span className="font-semibold text-gray-800">{inventoryCustomersList.length} Customers</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInventoryModal(false)}
                  className="text-gray-500 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-white"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 text-sm overflow-y-auto flex-1 custom-scrollbar bg-gray-50">
                
                {/* Summary Totals Banner */}
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow ${hasOutOfStock ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                      {hasOutOfStock ? <AlertTriangle size={20} /> : <Check size={22} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">
                        {hasOutOfStock ? 'Some Items Out of Stock' : 'Warehouse Stock Verified'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {hasOutOfStock ? 'You can send out-of-stock customers back to Procurement.' : 'All pieces for remaining group customers are available in warehouse.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 text-xs">
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-bold">Total Panels</span>
                      <span className="font-bold text-blue-700 text-sm">{totalPanelsCount} Pcs</span>
                    </div>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-bold">Total Inverters</span>
                      <span className="font-bold text-blue-700 text-sm">{totalInvertersCount} Pcs</span>
                    </div>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-bold">Total BOS Kits</span>
                      <span className="font-bold text-blue-700 text-sm">{totalBosCount} Kits</span>
                    </div>
                  </div>
                </div>

                {/* Customer-Wise Inventory Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden space-y-0">
                  <div className="p-4 bg-gray-100/70 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="font-bold text-gray-800 text-sm flex items-center space-x-2">
                      <FileText size={16} className="text-[#1D74B7]" />
                      <span>Customer Stock Breakdown & Action Options</span>
                    </h4>
                    <span className="text-xs text-blue-800 bg-blue-100 font-bold px-2.5 py-1 rounded">
                      {inventoryCustomersList.length} Projects Loaded
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#74B8FA] text-white font-semibold">
                        <tr>
                          <th className="px-4 py-3 border-r border-blue-300/30">Customer Name</th>
                          <th className="px-4 py-3 border-r border-blue-300/30">PO / Partner</th>
                          <th className="px-4 py-3 text-center border-r border-blue-300/30">Capacity</th>
                          <th className="px-4 py-3 border-r border-blue-300/30">Solar Panels (Pcs)</th>
                          <th className="px-4 py-3 border-r border-blue-300/30">Inverter (Pcs)</th>
                          <th className="px-4 py-3 border-r border-blue-300/30">BOS Kit (Pcs)</th>
                          <th className="px-4 py-3 text-center border-r border-blue-300/30">Stock Availability</th>
                          <th className="px-4 py-3 text-center">Manage / Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white font-sans text-gray-700">
                        {inventoryCustomersList.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="px-4 py-8 text-center text-gray-400 italic">
                              All customers have been removed or sent back to Procurement.
                            </td>
                          </tr>
                        ) : (
                          inventoryCustomersList.map((cust, i) => {
                            const isOut = cust.stockStatus === 'Out of Stock';
                            return (
                              <tr key={i} className={`hover:bg-blue-50/40 transition-colors ${isOut ? 'bg-amber-50/40' : ''}`}>
                                <td className="px-4 py-3.5 font-bold text-gray-900 border-r border-gray-100">
                                  {cust.name}
                                </td>
                                <td className="px-4 py-3.5 text-gray-600 border-r border-gray-100">
                                  {cust.partner}
                                </td>
                                <td className="px-4 py-3.5 text-center font-semibold text-gray-800 bg-gray-50/60 border-r border-gray-100">
                                  {cust.kw}
                                </td>
                                <td className="px-4 py-3.5 border-r border-gray-100">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                      {cust.panelQty || 15} Pcs
                                    </span>
                                    <span className="text-gray-600 text-[11px]">({cust.panelSpec || cust.panel})</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 border-r border-gray-100">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      {cust.inverterQty || 1} Pc
                                    </span>
                                    <span className="text-gray-600 text-[11px]">(5KW Hybrid)</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 border-r border-gray-100">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                      {cust.bosQty || 1} Kit
                                    </span>
                                    <span className="text-gray-600 text-[11px]">(Full Kit)</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-center border-r border-gray-100">
                                  <button
                                    onClick={() => handleToggleStockStatus(cust.name)}
                                    title="Click to toggle Stock Status"
                                    className={`px-3 py-1 font-bold rounded-full text-[11px] inline-flex items-center space-x-1 transition shadow-xs cursor-pointer ${
                                      isOut 
                                        ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200' 
                                        : 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                                    }`}
                                  >
                                    {isOut ? <X size={12} className="text-red-600" /> : <Check size={12} className="text-green-700" />}
                                    <span>{cust.stockStatus || 'In Stock'}</span>
                                  </button>
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <button
                                      onClick={() => {
                                        const custKey = cust.name + '_' + (selectedInventoryRow?.no || cust.parentRow?.no || 'DEL');
                                        const newMap = { ...customerInventoryStatusMap, [custKey]: 'REJECTED' };
                                        setCustomerInventoryStatusMap(newMap);
                                        try {
                                          localStorage.setItem('customerInventoryStatusMap', JSON.stringify(newMap));
                                        } catch (e) {
                                          console.error(e);
                                        }
                                        handleSendToProcurement(cust);
                                        setShowInventoryModal(false);
                                      }}
                                      title="Send customer back to Procurement"
                                      className="bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded text-[11px] font-bold shadow-xs transition flex items-center space-x-1"
                                    >
                                      <RotateCcw size={12} />
                                      <span>Send to Procurement</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Inspection Checklist */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
                  <h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Quality & Warehouse Audit</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="flex items-center space-x-2 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <Check size={16} className="text-green-600 flex-shrink-0" />
                      <span>Physical Stock Verified (Pieces Match)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <Check size={16} className="text-green-600 flex-shrink-0" />
                      <span>Serial Numbers Barcode Verified</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <Check size={16} className="text-green-600 flex-shrink-0" />
                      <span>Quality & Packing Approved</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-600 font-medium">
                  Active Projects: <strong className="text-gray-900">{inventoryCustomersList.length}</strong> | Total Group KW: <strong className="text-gray-900">{selectedInventoryRow.kw}</strong>
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowInventoryModal(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                  {!isViewOnlyModal && (
                    <button
                      onClick={() => {
                        const newStatusMap = { ...customerInventoryStatusMap };
                        inventoryCustomersList.forEach(c => {
                          const custKey = c.name + '_' + (selectedInventoryRow?.no || c.parentRow?.no || 'DEL');
                          newStatusMap[custKey] = c.stockStatus === 'Out of Stock' ? 'REJECTED' : 'CONFIRMED';
                        });
                        setCustomerInventoryStatusMap(newStatusMap);
                        try {
                          localStorage.setItem('customerInventoryStatusMap', JSON.stringify(newStatusMap));
                        } catch (e) {
                          console.error(e);
                        }

                        const hasOut = inventoryCustomersList.some(c => c.stockStatus === 'Out of Stock');
                        if (hasOut) {
                          alert(`Inventory status recorded: Out of Stock. Action column updated to "Send to Procurement".`);
                        } else {
                          alert(`Inventory status verified! Action column updated to "Create Label".`);
                        }
                        setShowInventoryModal(false);
                      }}
                      className="px-5 py-2 text-xs font-bold text-white bg-[#2FA041] rounded-lg shadow-sm hover:bg-[#237d32] transition flex items-center space-x-1.5"
                    >
                      <Check size={14} />
                      <span>Confirm Customer Inventory</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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

      {/* Customer Specific Dispatch Label Options Modal */}
      {showCustomerLabelSelectionModal && selectedLabelCustomer && (() => {
        const custKey = selectedLabelCustomer.name + '_' + (selectedLabelCustomer.parentRow?.no || selectedLabelCustomer.rawItem?.no || 'DEL');
        const panelCode = customerLabelsMap[custKey + '_Solar Panel'];
        const inverterCode = customerLabelsMap[custKey + '_Inverter'];
        const bosCode = customerLabelsMap[custKey + '_BOS Kit'];
        const masterCode = customerLabelsMap[custKey + '_Full Order Master'];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-100">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-800 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold flex items-center space-x-2 text-white">
                    <span>Dispatch Label Options</span>
                    <span className="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded-full border border-blue-400/30 font-mono font-bold">
                      {selectedLabelCustomer.parentRow?.no || selectedLabelCustomer.rawItem?.no || 'DEL-ORD'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Customer: <strong className="text-white">{selectedLabelCustomer.name}</strong> | Capacity: <strong className="text-amber-300">{selectedLabelCustomer.kw}</strong> | Partner: {selectedLabelCustomer.partner}
                  </p>
                </div>
                <button
                  onClick={() => setShowCustomerLabelSelectionModal(false)}
                  className="text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 p-1.5 rounded-full transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 bg-slate-50/50 text-sm overflow-y-auto max-h-[75vh]">
                {(masterCode || (panelCode && inverterCode && bosCode)) && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-emerald-800 animate-fade-in">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1 bg-emerald-600 text-white rounded-full">
                        <Check size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-900">All Labels Created Successfully!</p>
                        <p className="text-[11px] text-emerald-700">This customer order is automatically moved to the Delivery Plan.</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-extrabold bg-emerald-600 text-white px-2.5 py-1 rounded-md shadow-2xs">
                      In Delivery Plan
                    </span>
                  </div>
                )}

                <div className="text-xs text-slate-600 font-semibold uppercase tracking-wider mb-1">
                  Component-Wise Dispatch Identification Labels
                </div>

                {/* 3 Component Option Cards */}
                <div className="space-y-3">
                  {/* 1. Solar Panel Label Option Card */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex items-center justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex-shrink-0">
                        <Sun size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                          <span>Solar Panels Label</span>
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {selectedLabelCustomer.panelQty || 15} Pcs
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Spec: {selectedLabelCustomer.panelSpec || selectedLabelCustomer.panel || '500W, 550W Mono PERC'}
                        </p>
                      </div>
                    </div>
                    {panelCode ? (
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center space-x-1">
                          <Check size={13} className="text-emerald-600" />
                          <span>{panelCode}</span>
                        </span>
                        <button
                          onClick={() => {
                            handleCreateLabel(selectedLabelCustomer.rawItem || selectedLabelCustomer, 'Solar Panel', panelCode, `${selectedLabelCustomer.panelQty || 15} Pcs (${selectedLabelCustomer.panelSpec || selectedLabelCustomer.panel})`);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg font-bold text-xs shadow-2xs transition-all flex items-center space-x-1 whitespace-nowrap"
                        >
                          <Eye size={12} />
                          <span>View Label</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          handleCreateLabel(selectedLabelCustomer.rawItem || selectedLabelCustomer, 'Solar Panel', `LBL-${selectedLabelCustomer.parentRow?.no || 'ORD'}-PANEL`, `${selectedLabelCustomer.panelQty || 15} Pcs (${selectedLabelCustomer.panelSpec || selectedLabelCustomer.panel})`);
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3.5 py-2 rounded-lg font-bold text-xs shadow-2xs transition-all flex items-center space-x-1.5 whitespace-nowrap"
                      >
                        <Eye size={13} />
                        <span>Create Panel Label</span>
                      </button>
                    )}
                  </div>

                  {/* 2. Inverter Label Option Card */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all flex items-center justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex-shrink-0">
                        <Zap size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                          <span>Inverter Unit Label</span>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {selectedLabelCustomer.inverterQty || 1} Pc
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Spec: 5KW Hybrid Grid-Tie Inverter Unit
                        </p>
                      </div>
                    </div>
                    {inverterCode ? (
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center space-x-1">
                          <Check size={13} className="text-emerald-600" />
                          <span>{inverterCode}</span>
                        </span>
                        <button
                          onClick={() => {
                            handleCreateLabel(selectedLabelCustomer.rawItem || selectedLabelCustomer, 'Inverter', inverterCode, '5KW Hybrid Inverter Unit');
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg font-bold text-xs shadow-2xs transition-all flex items-center space-x-1 whitespace-nowrap"
                        >
                          <Eye size={12} />
                          <span>View Label</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          handleCreateLabel(selectedLabelCustomer.rawItem || selectedLabelCustomer, 'Inverter', `INV-${selectedLabelCustomer.parentRow?.no || 'ORD'}-UNIT`, '5KW Hybrid Inverter Unit');
                        }}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-lg font-bold text-xs shadow-2xs transition-all flex items-center space-x-1.5 whitespace-nowrap"
                      >
                        <Eye size={13} />
                        <span>Create Inverter Label</span>
                      </button>
                    )}
                  </div>

                  {/* 3. BOS Kit Label Option Card */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-300 transition-all flex items-center justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 flex-shrink-0">
                        <Box size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                          <span>BOS Kit Label</span>
                          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {selectedLabelCustomer.bosQty || 1} Kit
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Spec: Full Balance of System Wiring & Accessories Kit
                        </p>
                      </div>
                    </div>
                    {bosCode ? (
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center space-x-1">
                          <Check size={13} className="text-emerald-600" />
                          <span>{bosCode}</span>
                        </span>
                        <button
                          onClick={() => {
                            handleCreateLabel(selectedLabelCustomer.rawItem || selectedLabelCustomer, 'BOS Kit', bosCode, 'Full BOS Wiring & Accessories Kit');
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg font-bold text-xs shadow-2xs transition-all flex items-center space-x-1 whitespace-nowrap"
                        >
                          <Eye size={12} />
                          <span>View Label</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          handleCreateLabel(selectedLabelCustomer.rawItem || selectedLabelCustomer, 'BOS Kit', `BOS-${selectedLabelCustomer.parentRow?.no || 'ORD'}-KIT`, 'Full BOS Wiring & Accessories Kit');
                        }}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3.5 py-2 rounded-lg font-bold text-xs shadow-2xs transition-all flex items-center space-x-1.5 whitespace-nowrap"
                      >
                        <Eye size={13} />
                        <span>Create BOS Kit Label</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Prominent Master Full Product Label Action */}
                <div className="pt-3 border-t border-slate-200">
                  <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full font-mono">
                        Master Package Label
                      </span>
                      <h3 className="font-bold text-base text-white mt-1">
                        Complete Order Master Dispatch Label
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Generates full product identification label and automatically moves order to Delivery Plan.
                      </p>
                    </div>
                    {masterCode ? (
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-700/80 flex items-center space-x-1">
                          <Check size={14} className="text-emerald-400" />
                          <span>Saved: {masterCode}</span>
                        </span>
                        <button
                          onClick={() => handleGenerateFullCustomerLabel(selectedLabelCustomer)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all flex items-center space-x-1.5 whitespace-nowrap"
                        >
                          <Eye size={14} />
                          <span>View Master Label</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateFullCustomerLabel(selectedLabelCustomer)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-all flex items-center space-x-2 whitespace-nowrap"
                      >
                        <Eye size={15} />
                        <span>Create Full Master Label</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setShowCustomerLabelSelectionModal(false)}
                  className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
