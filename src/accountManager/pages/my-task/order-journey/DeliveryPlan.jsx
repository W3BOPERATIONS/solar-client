import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  Truck, 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  MapPin, 
  Calendar, 
  User, 
  Layers, 
  DollarSign, 
  ArrowRight, 
  Package, 
  Box, 
  Sparkles, 
  ShieldCheck, 
  Check,
  Search,
  SlidersHorizontal,
  Compass,
  Eye,
  X,
  Tag
} from 'lucide-react';
import api from '../../../../api/axios';
import { getDeliveryTypes, getVehicles, getBenchmarkPrices } from '../../../../services/delivery/deliveryApi';

export default function DeliveryPlan({ onNext }) {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({});
  const [orders, setOrders] = useState([]);
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState('All');
  const [areaTypeFilter, setAreaTypeFilter] = useState('All');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [selectedLabelModalRow, setSelectedLabelModalRow] = useState(null);

  // Form states for creating delivery plan
  const [selectedDeliveryType, setSelectedDeliveryType] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [estimatedDate, setEstimatedDate] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [deliveryWeek, setDeliveryWeek] = useState('');

  // Location Card Filter States (Country, State, District)
  const [selectedCountryCard, setSelectedCountryCard] = useState('All');
  const [selectedStateCard, setSelectedStateCard] = useState('All');
  const [selectedDistrictCard, setSelectedDistrictCard] = useState('All');

  // Admin dynamic settings states
  const [adminDeliveryTypes, setAdminDeliveryTypes] = useState([]);
  const [adminVehicles, setAdminVehicles] = useState([]);
  const [adminBenchmarkPrice, setAdminBenchmarkPrice] = useState(500);
  const [adminBenchmarkPricesList, setAdminBenchmarkPricesList] = useState([]);

  const loadLocalOrders = () => {
    const localOrders = JSON.parse(localStorage.getItem('deliveryPlanOrders') || '[]');
    setOrders(localOrders);
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

    const fetchAdminDeliverySettings = async () => {
      try {
        const [typesRes, vehiclesRes, benchmarkRes] = await Promise.all([
          getDeliveryTypes().catch(() => null),
          getVehicles().catch(() => null),
          getBenchmarkPrices().catch(() => null)
        ]);

        if (typesRes) {
          const list = Array.isArray(typesRes) ? typesRes : (typesRes.data || []);
          if (list.length > 0) setAdminDeliveryTypes(list);
        }

        if (vehiclesRes) {
          const list = Array.isArray(vehiclesRes) ? vehiclesRes : (vehiclesRes.data || []);
          if (list.length > 0) setAdminVehicles(list);
        }

        if (benchmarkRes) {
          const list = Array.isArray(benchmarkRes) ? benchmarkRes : (benchmarkRes.data || []);
          if (list.length > 0) {
            setAdminBenchmarkPricesList(list);
            setAdminBenchmarkPrice(list[0].benchmarkPrice || list[0].ratePerKw || list[0].price || 500);
          }
        }
      } catch (err) {
        console.warn("Failed to load admin delivery settings", err);
      }
    };

    fetchDashboardData();
    fetchAdminDeliverySettings();
    loadLocalOrders();

    const handleStorageChange = () => loadLocalOrders();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  // Dynamic Location Card calculation helpers
  const totalCustomerCount = orders.length;

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
    return orders.filter(o => {
      const loc = (o.location || o.address || 'Rajkot').toLowerCase();
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

  // Compute dynamic counts per Zone filtered by Location Cards
  const locationFilteredOrders = orders.filter(o => {
    if (selectedCountryCard !== 'All' && selectedCountryCard !== 'India') return false;
    if (selectedStateCard !== 'All' && selectedStateCard !== 'Gujarat') return false;
    if (selectedDistrictCard !== 'All' && selectedDistrictCard !== 'All Districts') {
      const loc = (o.location || o.address || 'Rajkot').toLowerCase();
      if (!loc.includes(selectedDistrictCard.toLowerCase())) return false;
    }
    return true;
  });

  const northZoneOrders = locationFilteredOrders.filter(o => {
    const loc = (o.zone || o.location || '').toLowerCase();
    return loc.includes('north');
  });

  const southZoneOrders = locationFilteredOrders.filter(o => {
    const loc = (o.zone || o.location || '').toLowerCase();
    return loc.includes('south');
  });

  const eastZoneOrders = locationFilteredOrders.filter(o => {
    const loc = (o.zone || o.location || '').toLowerCase();
    return loc.includes('east');
  });

  const westZoneOrders = locationFilteredOrders.filter(o => {
    const loc = (o.zone || o.location || '').toLowerCase();
    return loc.includes('west') || loc.includes('rajkot') || loc.includes('vadodara') || (!loc.includes('north') && !loc.includes('south') && !loc.includes('east'));
  });

  // Filter orders by active Delivery Type, Area Type tabs, and Location Cards
  const filteredOrders = locationFilteredOrders.filter(o => {
    if (deliveryTypeFilter !== 'All' && (o.deliveryType || 'Regular') !== deliveryTypeFilter) return false;
    if (areaTypeFilter !== 'All' && (o.areaType || 'Urban') !== areaTypeFilter) return false;
    return true;
  });

  // Dynamic calculations for totals
  const totalKw = orders.reduce((sum, o) => sum + (parseFloat((o.kw || '0').replace(/[^0-9.]/g, '')) || 0), 0);
  const totalKm = orders.length > 0 ? orders.reduce((sum, o) => sum + (parseFloat(o.km) || 35), 0) : 0;
  // Dynamic calculation for perKwRs based on selectedDeliveryType
  const getDynamicPerKwPrice = () => {
    if (orders.length === 0) return 0;

    // 1. Check exact match in Admin Benchmark Prices List
    if (selectedDeliveryType && adminBenchmarkPricesList.length > 0) {
      const match = adminBenchmarkPricesList.find(bp => {
        const typeName = typeof bp.deliveryType === 'object' ? bp.deliveryType?.name : bp.deliveryType;
        return typeName && typeName.toString().toLowerCase() === selectedDeliveryType.toString().toLowerCase();
      });
      if (match && (match.benchmarkPrice || match.ratePerKw)) {
        return parseFloat(match.benchmarkPrice || match.ratePerKw);
      }
    }

    // 2. Check Admin Delivery Types array if price is stored on type object (e.g. deliveryTiming.deliveryCharges)
    if (selectedDeliveryType && adminDeliveryTypes.length > 0) {
      const matchType = adminDeliveryTypes.find(dt => {
        const typeName = typeof dt === 'string' ? dt : dt.name || dt.deliveryType;
        return typeName && typeName.toString().trim().toLowerCase() === selectedDeliveryType.toString().trim().toLowerCase();
      });
      if (matchType && typeof matchType === 'object') {
        const charge = matchType.deliveryTiming?.deliveryCharges ?? 
                       matchType.deliveryCharges ?? 
                       matchType.pricePerKw ?? 
                       matchType.ratePerKw ?? 
                       matchType.benchmarkPrice ?? 
                       matchType.price;
        if (charge !== undefined && charge !== null && charge !== '') {
          return parseFloat(charge);
        }
      }
    }

    // 3. Fallback dynamic tier rates by Delivery Type name
    if (selectedDeliveryType) {
      const typeLower = selectedDeliveryType.toLowerCase();
      if (typeLower.includes('premium') || typeLower.includes('prime')) {
        return 1000;
      }
      if (typeLower.includes('express') || typeLower.includes('fast')) {
        return 750;
      }
      if (typeLower.includes('standard') || typeLower.includes('regular')) {
        return 500;
      }
      if (typeLower.includes('overnight') || typeLower.includes('urgent')) {
        return 1200;
      }
    }

    return adminBenchmarkPrice || 500;
  };

  const perKwRs = getDynamicPerKwPrice();
  const benchmarkPrice = orders.length > 0 ? (perKwRs + 100) : 0;

  const getItemKey = (item, idx) => item._uniqueId || `${item.vendorName || ''}_${item.no || item.id || ''}_${idx}`;

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map((o, idx) => getItemKey(o, idx)));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const toggleSelectOrder = (key) => {
    setSelectedOrderIds(prev => 
      prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]
    );
  };

  const selectedCustomerItems = filteredOrders.filter((o, idx) => selectedOrderIds.includes(getItemKey(o, idx)));

  const handleConfirmPlan = () => {
    if (selectedCustomerItems.length === 0) {
      alert("⚠️ Please select at least one customer order from the table first!");
      return;
    }

    if (!selectedDeliveryType || !selectedVehicleType) {
      alert("⚠️ Please select both Delivery Type and Vehicle Type!");
      return;
    }

    // Save newly confirmed plans to localStorage for Delivery Management
    const existingPlans = JSON.parse(localStorage.getItem('confirmedDeliveryPlans') || '[]');
    const newPlans = selectedCustomerItems.map(cust => ({
      no: cust.no || cust.id || 'DEL-2023-1003',
      location: cust.location || 'Rajkot',
      kit: cust.bosKit || '1 Kit',
      kw: cust.kw || '9 KW',
      deliveryType: selectedDeliveryType || cust.deliveryType || 'Regular',
      vehicleType: selectedVehicleType || cust.vehicle || 'Bolero Pickup',
      driver: selectedDriver || cust.driver || 'Ramesh Kumar',
      vendorName: cust.vendorName || cust.name || 'SolarTech Commercial',
      partner: cust.partner || cust.partnerName || 'Tata Solar',
      address: cust.address || 'Industrial Area, Rajkot',
      pincode: cust.pincode || '360001',
      estimatedDate,
      specialInstructions,
      status: 'Out for Delivery'
    }));

    const mergedPlans = [...newPlans, ...existingPlans.filter(p => !newPlans.some(n => n.no === p.no && n.vendorName === p.vendorName))];
    localStorage.setItem('confirmedDeliveryPlans', JSON.stringify(mergedPlans));

    // Remove selected items from pending deliveryPlanOrders
    const remainingOrders = orders.filter(o => !selectedCustomerItems.some(s => (s.no || s.id) === (o.no || o.id) && (s.vendorName || s.name) === (o.vendorName || o.name)));
    setOrders(remainingOrders);
    localStorage.setItem('deliveryPlanOrders', JSON.stringify(remainingOrders));
    setSelectedOrderIds([]);

    alert("🎉 Delivery Plan Confirmed Successfully! Redirecting to Delivery Management...");

    try {
      navigate('/delivery-manager/delivery-management');
    } catch (err) {
      if (onNext) onNext();
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6 text-slate-800 font-sans">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-2xs border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="relative z-10 flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-2xs">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
              <span>Delivery Plan Management</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                Live System
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize, dispatch, and track solar equipment logistics across regions.
            </p>
          </div>
        </div>

        {/* Task Counter Badges */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center space-x-2 shadow-2xs">
            <Clock size={14} className="text-slate-500" />
            <span className="text-xs text-slate-700 font-semibold">Today's Task</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl flex items-center space-x-2 shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs font-bold text-amber-800">
              Pending Task ({orders.length})
            </span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl flex items-center space-x-2 shadow-2xs">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span className="text-xs text-emerald-800 font-semibold">Overdue Task (0)</span>
          </div>
        </div>
      </div>

      {/* Cascading Location Filter Cards Section (Country -> State -> District) */}
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

      {/* Dynamic Filter Dropdowns Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
          <SlidersHorizontal size={14} className="text-blue-600" />
          <span>Category & Project Filters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Category', options: dashboardData.dynamicDropdowns?.categories || [] },
            { label: 'Sub Category', options: dashboardData.dynamicDropdowns?.subCategories || [] },
            { label: 'Project Type', options: dashboardData.dynamicDropdowns?.projectTypes ? [...dashboardData.dynamicDropdowns.projectTypes, 'Customize', 'ComboKit'] : ['Customize', 'ComboKit'] },
            { label: 'Sub Type', options: dashboardData.dynamicDropdowns?.subProjectTypes || [] },
            { label: 'Cluster', options: dashboardData.dynamicDropdowns?.clusters || [] },
            { label: 'Delivery Zone', options: dashboardData.dynamicDropdowns?.deliveryZones || [] },
            { label: 'Area Type', options: dashboardData.dynamicDropdowns?.areaTypes || ['Urban', 'Rural'] },
          ].map((filter, idx) => (
            <div key={idx} className="relative">
              <select className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-700 py-2 px-3 pr-7 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                <option value="">{filter.label}</option>
                {filter.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <ChevronDown size={13} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'North Zone', count: northZoneOrders.length, color: 'rose', gradient: 'from-rose-50 to-rose-100/30', border: 'border-l-rose-500', text: 'text-rose-600', bgIcon: 'bg-rose-500/10' },
          { name: 'South Zone', count: southZoneOrders.length, color: 'teal', gradient: 'from-teal-50 to-teal-100/30', border: 'border-l-teal-500', text: 'text-teal-600', bgIcon: 'bg-teal-500/10' },
          { name: 'East Zone', count: eastZoneOrders.length, color: 'emerald', gradient: 'from-emerald-50 to-emerald-100/30', border: 'border-l-emerald-500', text: 'text-emerald-600', bgIcon: 'bg-emerald-500/10' },
          { name: 'West Zone', count: westZoneOrders.length, color: 'amber', gradient: 'from-amber-50 to-amber-100/30', border: 'border-l-amber-500', text: 'text-amber-600', bgIcon: 'bg-amber-500/10' },
        ].map((zone, idx) => (
          <div 
            key={idx} 
            className={`bg-white rounded-2xl border border-slate-200 shadow-2xs ${zone.border} border-l-4 p-5 flex items-center justify-between hover:shadow-md transition-all group`}
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{zone.name}</p>
              <div className="flex items-baseline space-x-2 mt-1">
                <h3 className="text-2xl font-black text-slate-900">{zone.count}</h3>
                <span className="text-[11px] font-medium text-slate-400">Active Orders</span>
              </div>
            </div>
            <div className={`p-3.5 rounded-2xl ${zone.bgIcon} ${zone.text} group-hover:scale-110 transition-transform`}>
              <Compass size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Side: Pending Delivery Orders Table */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Package size={18} className="text-blue-600" />
                  <span>Pending Delivery Orders</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select orders to assign vehicle, driver, and generate delivery route.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                {/* Delivery Type Tabs */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200/60">
                  {['All', 'Regular', 'Express', 'Prime'].map(type => (
                    <button
                      key={type}
                      onClick={() => setDeliveryTypeFilter(type)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        deliveryTypeFilter === type
                          ? type === 'Regular' ? 'bg-emerald-600 text-white shadow-2xs'
                            : type === 'Express' ? 'bg-amber-500 text-white shadow-2xs'
                            : type === 'Prime' ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Area Type Tabs */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200/60">
                  {['All', 'Rural', 'Urban'].map(area => (
                    <button
                      key={area}
                      onClick={() => setAreaTypeFilter(area)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        areaTypeFilter === area
                          ? 'bg-slate-800 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left min-w-[700px]">
                <thead className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-3.5 text-center w-10 border-r border-slate-200">
                      <input 
                        type="checkbox" 
                        onChange={toggleSelectAll}
                        checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" 
                      />
                    </th>
                    <th className="px-4 py-3.5 border-r border-slate-200">Delivery No.</th>
                    <th className="px-4 py-3.5 text-center border-r border-slate-200">Group No.</th>
                    <th className="px-4 py-3.5 border-r border-slate-200">Customer & Label Details</th>
                    <th className="px-4 py-3.5 border-r border-slate-200">Partner</th>
                    <th className="px-4 py-3.5 border-r border-slate-200">Location</th>
                    <th className="px-4 py-3.5 text-center border-r border-slate-200">Area Type</th>
                    <th className="px-4 py-3.5 text-center">Delivery Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-12 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Box size={32} className="mx-auto text-slate-300" />
                          <p className="font-semibold text-sm text-slate-700">
                            {orders.length === 0 
                              ? "No pending delivery orders" 
                              : "No matching orders found"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {orders.length === 0 
                              ? "Create dispatch labels in 'At Warehouse' page to move orders here automatically." 
                              : "Try clearing your filters to view pending orders."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((row, idx) => {
                      const itemKey = getItemKey(row, idx);
                      const isSelected = selectedOrderIds.includes(itemKey);
                      return (
                        <tr 
                          key={itemKey} 
                          className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                        >
                          <td className="px-3.5 py-4 text-center border-r border-slate-100">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleSelectOrder(itemKey)}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" 
                            />
                          </td>
                          <td className="px-4 py-4 border-r border-slate-100 font-mono font-bold text-slate-800">
                            {row.no || row.id}
                          </td>
                          <td className="px-4 py-4 border-r border-slate-100 font-bold text-center text-slate-700">
                            <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-mono text-xs border border-slate-200">
                              {row.groupNo || '1'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 border-r border-slate-100 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedLabelModalRow(row)}
                              className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                            >
                              <Eye size={14} />
                              <span>View Details</span>
                            </button>
                          </td>
                          <td className="px-4 py-4 border-r border-slate-100 font-semibold text-xs">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {row.partner || row.partnerName || 'Tata Solar'}
                            </span>
                          </td>
                          <td className="px-4 py-4 border-r border-slate-100 text-slate-700 font-medium">
                            <div className="flex items-center space-x-1">
                              <MapPin size={13} className="text-slate-400" />
                              <span>{row.location || 'Rajkot'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 border-r border-slate-100 text-center">
                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md text-white shadow-2xs ${(row.areaType || 'Urban') === 'Urban' ? 'bg-blue-600' : 'bg-amber-500 text-slate-950'}`}>
                              {row.areaType || 'Urban'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md text-white shadow-2xs ${
                              (row.deliveryType || 'Regular') === 'Regular' ? 'bg-emerald-600' :
                              (row.deliveryType || 'Regular') === 'Express' ? 'bg-amber-500 text-slate-950' : 'bg-rose-600'
                            }`}>
                              {row.deliveryType || 'Regular'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Create Delivery Plan Form */}
        <div className="xl:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Create Delivery Plan</h3>
                  <p className="text-[11px] text-slate-400">Schedule vehicle & driver dispatch</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                Step 2
              </span>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Selected Customer Details Box at top of form */}
              {selectedCustomerItems.length > 0 ? (
                <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-900 flex items-center space-x-1.5">
                      <User size={13} className="text-blue-600" />
                      <span>Selected Customer Details</span>
                    </span>
                    <span className="text-[10px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-md shadow-2xs">
                      {selectedCustomerItems.length} Selected
                    </span>
                  </div>

                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {selectedCustomerItems.map((cust, i) => (
                      <div key={i} className="bg-white p-2.5 rounded-lg border border-blue-100/90 flex items-center justify-between text-xs shadow-2xs">
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-slate-900 text-xs flex items-center space-x-2">
                            <span>{cust.vendorName || cust.name || 'Customer'}</span>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              {cust.kw}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-blue-700">
                            Partner: {cust.partner || cust.partnerName || 'Tata Solar'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[10px] font-bold text-slate-500 block">
                            {cust.no || cust.id}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {cust.location || 'Rajkot'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3 text-center text-[11px] text-slate-400 font-medium">
                  Select customer checkbox(es) in table to view details here.
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Delivery Type</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <select 
                  value={selectedDeliveryType}
                  onChange={(e) => setSelectedDeliveryType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition"
                >
                  <option value="">Select Delivery Type</option>
                  {(adminDeliveryTypes.length > 0 
                    ? adminDeliveryTypes.map(dt => (typeof dt === 'string' ? dt : dt.name || dt.deliveryType))
                    : (dashboardData.dynamicDropdowns?.deliveryTypes || ['Regular', 'Express', 'Prime'])
                  ).map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Vehicle Type</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <select 
                  value={selectedVehicleType}
                  onChange={(e) => setSelectedVehicleType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition"
                >
                  <option value="">Select Vehicle</option>
                  {(adminVehicles.length > 0 
                    ? adminVehicles.map(v => (typeof v === 'string' ? v : v.name || v.vehicleName || v.type))
                    : (dashboardData.dynamicDropdowns?.vehicleTypes || ['Truck 407', 'Bolero Pickup', 'Eicher 14 Foot', 'Tata Ace'])
                  ).map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Driver Assignment</label>
                <select 
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition"
                >
                  <option value="">Select Driver</option>
                  <option value="Ramesh Kumar">Ramesh Kumar (Rajkot Route)</option>
                  <option value="Suresh Patel">Suresh Patel (Vadodara Route)</option>
                  <option value="Vikram Singh">Vikram Singh (Ahmedabad Route)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Charges</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">₹</span>
                  <input 
                    type="text" 
                    value={perKwRs} 
                    readOnly 
                    className="w-full bg-slate-100 border border-slate-200 text-slate-800 py-2.5 pl-8 pr-3 rounded-xl font-bold focus:outline-none cursor-not-allowed" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Delivery Date</label>
                <input 
                  type="date" 
                  value={estimatedDate}
                  onChange={(e) => setEstimatedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Special Delivery Instructions</label>
                <textarea 
                  rows="3" 
                  placeholder="E.g. Call customer before arrival, handle solar panel box with care..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition placeholder:text-slate-400"
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleConfirmPlan}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 text-xs"
                >
                  <ShieldCheck size={16} />
                  <span>Confirm Delivery Plan & Next</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Full Order & Label Details Modal */}
      {selectedLabelModalRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Full Order & Label Details</h3>
                  <p className="text-[11px] text-slate-300">
                    Order No: {selectedLabelModalRow.no || selectedLabelModalRow.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLabelModalRow(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable 2-Column Layout) */}
            <div className="p-6 text-xs overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Column: Customer Overview & Logistics */}
                <div className="space-y-4">
                  {/* Section 1: Customer & Partner Overview */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Customer Name</p>
                        <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                          {selectedLabelModalRow.vendorName || selectedLabelModalRow.name || 'N/A'}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                          {selectedLabelModalRow.kw}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">
                          Group: #{selectedLabelModalRow.groupNo || '1'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-500 font-semibold block">Associated Partner</span>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mt-0.5">
                          {selectedLabelModalRow.partner || selectedLabelModalRow.partnerName || 'Tata Solar'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 font-semibold block">Order Reference No.</span>
                        <span className="text-xs font-mono font-bold text-slate-800 block mt-0.5">
                          {selectedLabelModalRow.no || selectedLabelModalRow.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Logistics & Location Details */}
                  <div className="space-y-2.5">
                    <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                      <MapPin size={13} className="text-blue-600" />
                      <span>Logistics & Location Details</span>
                    </p>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
                      <div className="grid grid-cols-2 gap-3 border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-slate-400 font-medium text-[11px] block">Location / City</span>
                          <span className="font-bold text-slate-800 text-xs block">{selectedLabelModalRow.location || 'Rajkot'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium text-[11px] block">Pincode</span>
                          <span className="font-bold text-slate-800 text-xs block">{selectedLabelModalRow.pincode || '360001'}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium text-[11px] block">Delivery Address</span>
                        <span className="font-semibold text-slate-700 text-xs block mt-0.5">
                          {selectedLabelModalRow.address || 'Plot No. 42, Industrial Area, Rajkot, Gujarat'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 font-medium text-[11px] block">Area Type</span>
                          <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded text-white mt-0.5 ${
                            (selectedLabelModalRow.areaType || 'Urban') === 'Urban' ? 'bg-blue-600' : 'bg-amber-500 text-slate-950'
                          }`}>
                            {selectedLabelModalRow.areaType || 'Urban'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium text-[11px] block">Delivery Priority</span>
                          <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded text-white mt-0.5 ${
                            (selectedLabelModalRow.deliveryType || 'Regular') === 'Regular' ? 'bg-emerald-600' :
                            (selectedLabelModalRow.deliveryType || 'Regular') === 'Express' ? 'bg-amber-500 text-slate-950' : 'bg-rose-600'
                          }`}>
                            {selectedLabelModalRow.deliveryType || 'Regular'}
                          </span>
                        </div>
                      </div>

                      {(selectedLabelModalRow.vehicle || selectedLabelModalRow.driver) && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400 font-medium text-[11px] block">Assigned Vehicle</span>
                            <span className="font-bold text-slate-800 text-xs block">{selectedLabelModalRow.vehicle || 'Truck 407'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium text-[11px] block">Assigned Driver</span>
                            <span className="font-bold text-slate-800 text-xs block">{selectedLabelModalRow.driver || 'Assign Driver'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Equipment Specs & Dispatch Labels */}
                <div className="space-y-4">
                  {/* Section 3: Equipment Specifications */}
                  <div className="space-y-2.5">
                    <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                      <Layers size={13} className="text-blue-600" />
                      <span>Equipment & Product Specifications</span>
                    </p>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">Solar Panels:</span>
                        <span className="font-semibold text-slate-900">{selectedLabelModalRow.panel || '15 Pcs (500W, 550W Tata)'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200/60">
                        <span className="font-bold text-slate-700">Inverter Unit:</span>
                        <span className="font-semibold text-slate-900">{selectedLabelModalRow.inverter || '1 Pc (5KW Hybrid)'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200/60">
                        <span className="font-bold text-slate-700">BOS Kit:</span>
                        <span className="font-semibold text-slate-900">{selectedLabelModalRow.bosKit || '1 Kit (Full Standard Kit)'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Generated Dispatch Labels */}
                  <div className="space-y-2.5">
                    <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                      <Tag size={13} className="text-blue-600" />
                      <span>Generated Dispatch Labels</span>
                    </p>

                    {/* Main Label */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="font-bold text-slate-700">Main Order Label</span>
                      </div>
                      <code className="bg-slate-100 text-slate-800 px-2 py-1 rounded font-mono font-bold text-xs border border-slate-200">
                        {selectedLabelModalRow.labelNumber && selectedLabelModalRow.labelNumber !== '-' 
                          ? selectedLabelModalRow.labelNumber 
                          : 'LBL-DEL-ORD-MASTER'}
                      </code>
                    </div>

                    {/* Inverter Label */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-bold text-slate-700">Inverter Label</span>
                      </div>
                      <code className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded font-mono font-bold text-xs border border-emerald-200">
                        {selectedLabelModalRow.inverterLabelNumber && selectedLabelModalRow.inverterLabelNumber !== '-' 
                          ? selectedLabelModalRow.inverterLabelNumber 
                          : 'INV-DEL-ORD-UNIT'}
                      </code>
                    </div>

                    {/* BOS Kit Label */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        <span className="font-bold text-slate-700">BOS Kit Label</span>
                      </div>
                      <code className="bg-purple-50 text-purple-800 px-2 py-1 rounded font-mono font-bold text-xs border border-purple-200">
                        {selectedLabelModalRow.bosLabelNumber && selectedLabelModalRow.bosLabelNumber !== '-' 
                          ? selectedLabelModalRow.bosLabelNumber 
                          : 'BOS-DEL-ORD-KIT'}
                      </code>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedLabelModalRow(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
