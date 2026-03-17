import React, { useEffect, useState, useRef } from 'react';
import { useLocations } from '../../../hooks/useLocations';
import inventoryApi from '../../../services/inventory/inventoryApi';
import * as procurementApi from '../../../services/procurement/procurementApi';
import { getCategories, getProjectTypes, getSubCategories, getSubProjectTypes } from '../../../services/core/masterApi';
import {
  MapPin,
  Filter,
  BarChart3,
  RefreshCw,
  CheckCircle,
  Package,
  Truck,
  Home,
  Settings,
  ChevronRight,
  PlusCircle,
  Download,
  Printer,
  MoreVertical
} from 'lucide-react';
import Chart from 'chart.js/auto';
import { useNavigate } from 'react-router-dom';

export default function InventoryManagement() {
  const navigate = useNavigate();
  // Location Hook
  const {
    states,
    clusters,
    selectedState,
    setSelectedState,
    selectedCluster,
    setSelectedCluster,
  } = useLocations();

  // State
  const [inventoryItems, setInventoryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [recentOrder, setRecentOrder] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    warehouse: '',
    timeFilter: 'month',
    sku: '',
    technology: '',
    watt: '',
    brand: '',
    quarter: '',
    category: '',
    subCategory: '',
    projectType: '',
    subProjectType: '',
    dateFrom: '',
    dateTo: ''
  });
  const [customRangeVisible, setCustomRangeVisible] = useState(false);

  // Refs
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Derived Options for Filters
  const [techOptions, setTechOptions] = useState([]);
  const [wattOptions, setWattOptions] = useState([]);
  const [skuOptions, setSkuOptions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subProjectTypes, setSubProjectTypes] = useState([]);
  const [addMoreValues, setAddMoreValues] = useState({});
  const [projections, setProjections] = useState({}); // itemId -> projectedKw

  // Fetch Data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [invRes, brandRes, catRes, projRes, orderRes, warehouseRes] = await Promise.all([
        inventoryApi.getItems({ limit: 1000 }),
        inventoryApi.getBrands(),
        getCategories(),
        getProjectTypes(),
        procurementApi.getAllOrders(),
        inventoryApi.getAllWarehouses()
      ]);

      const items = invRes.data?.items || invRes.data || [];
      setInventoryItems(Array.isArray(items) ? items : []);
      
      // Strict extraction for master data to avoid "map is not a function" crashes
      setBrands(Array.isArray(brandRes.data?.data) ? brandRes.data.data : (Array.isArray(brandRes.data) ? brandRes.data : []));
      setCategories(Array.isArray(catRes.data) ? catRes.data : (Array.isArray(catRes) ? catRes : []));
      setProjectTypes(Array.isArray(projRes.data) ? projRes.data : (Array.isArray(projRes) ? projRes : []));
      setWarehouses(Array.isArray(warehouseRes.data?.data) ? warehouseRes.data.data : (Array.isArray(warehouseRes.data) ? warehouseRes.data : []));

      const ordersData = orderRes.data?.data || orderRes.data || orderRes || [];
      const orders = Array.isArray(ordersData) ? ordersData : [];
      const activeOrder = orders.length > 0 ? (orders.find(o => o.status !== 'Delivered') || orders[0]) : null;
      setRecentOrder(activeOrder);

    } catch (err) {
      console.error("Error loading inventory data", err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Filter Items & Derive Options
  useEffect(() => {
    let result = inventoryItems;

    // Apply Client-Side Filters (Since we fetched all)
    // Note: In a real app with pagination, we would pass params to API. 
    // Given the previous static nature, dataset might be small enough.

    if (selectedState) result = result.filter(i => i.state?._id === selectedState || i.state === selectedState);
    if (selectedCluster) result = result.filter(i => i.cluster?._id === selectedCluster || i.cluster === selectedCluster);
    // Add Warehouse filter if selectedWarehouse logic is added (omitted for brevity as it wasn't in main scope but good to have)

    if (filters.brand) result = result.filter(i => i.brand?._id === filters.brand || i.brand === filters.brand);
    if (filters.sku) result = result.filter(i => i.sku === filters.sku);
    if (filters.technology) result = result.filter(i => i.technology === filters.technology);
    if (filters.watt) result = result.filter(i => i.watt == filters.watt); // loose compare
    if (filters.category) result = result.filter(i => i.category === filters.category); // Name or ID?
    if (filters.projectType) result = result.filter(i => i.projectType === filters.projectType);

    setFilteredItems(result);

    // Derive Options from Result (or full items?) -> usually full items to allow broader selection
    // Let's derive from full items to show all available options
    const techs = [...new Set(inventoryItems.map(i => i.technology).filter(Boolean))];
    const watts = [...new Set(inventoryItems.map(i => i.wattage || i.watt).filter(Boolean))]; // Check field name
    const skus = [...new Set(inventoryItems.map(i => i.sku).filter(Boolean))];

    setTechOptions(techs);
    setWattOptions(watts);
    setSkuOptions(skus);

  }, [inventoryItems, filters, selectedState, selectedCluster]);

  useEffect(() => {
    if (filters.category || filters.projectType) {
      getSubCategories(filters.projectType, filters.category).then(res => {
        setSubCategories(res.data || res || []);
      });
    } else {
      setSubCategories([]);
    }
  }, [filters.category, filters.projectType]);

  useEffect(() => {
    if (filters.projectType) {
      getSubProjectTypes(filters.projectType).then(res => {
        setSubProjectTypes(res.data || res || []);
      });
    } else {
      setSubProjectTypes([]);
    }
  }, [filters.projectType]);

  // Fetch projections whenever quarter or key filters change
  useEffect(() => {
    if (filters.quarter) {
      fetchProjections();
    } else {
      setProjections({});
    }
  }, [filters.quarter, filters.brand, filters.technology, filters.watt, selectedState]);

  const fetchProjections = async () => {
    try {
      const params = { quarter: filters.quarter };
      if (filters.brand) params.brand = filters.brand;
      if (filters.technology) params.technology = filters.technology;
      if (filters.watt) params.watt = filters.watt;
      if (selectedState) params.state = selectedState;
      if (selectedCluster) params.cluster = selectedCluster;

      const res = await inventoryApi.getProjection(params, { silent: true });
      const data = res.data?.data || [];

      // Build a lookup map: itemId → projectedKw
      const map = {};
      data.forEach(p => { map[p.itemId] = p.projectedKw; });
      setProjections(map);
    } catch (err) {
      console.warn('Projection fetch failed (non-critical):', err.message);
    }
  };

  // Chart Logic
  useEffect(() => {
    if (chartRef.current && filteredItems.length > 0) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Group by Brand
      // We want to compare Projected (Max Level) vs Existing (Quantity)
      const brandMap = {};

      filteredItems.forEach(item => {
        const brandName = item.brand?.brand || item.brand?.companyName || 'Unknown';
        if (!brandMap[brandName]) {
          brandMap[brandName] = { projected: 0, added: 0 };
        }
        brandMap[brandName].projected += (item.maxLevel || 0);
        brandMap[brandName].added += (item.quantity || 0);
      });

      const labels = Object.keys(brandMap);
      const projectedData = labels.map(l => brandMap[l].projected); // This might be raw count if maxLevel is count
      const addedData = labels.map(l => brandMap[l].added);

      const ctx = chartRef.current.getContext('2d');

      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Target Stock (Count)',
              data: projectedData,
              backgroundColor: 'rgba(54, 162, 235, 0.8)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
              borderRadius: 4,
              barPercentage: 0.7,
            },
            {
              label: 'Current Stock (Count)',
              data: addedData,
              backgroundColor: 'rgba(75, 192, 192, 0.8)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
              borderRadius: 4,
              barPercentage: 0.7,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          scales: {
            x: { beginAtZero: true, title: { display: true, text: 'Units' } }
          }
        }
      });
    }
  }, [filteredItems]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'timeFilter') setCustomRangeVisible(value === 'custom');
  };

  const clearAllFilters = () => {
    setSelectedState('');
    setSelectedCluster('');
    setFilters({
      warehouse: '',
      timeFilter: 'month',
      sku: '',
      technology: '',
      watt: '',
      brand: '',
      quarter: '',
      category: '',
      subCategory: '',
      projectType: '',
      subProjectType: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Order Steps Logic
  const getOrderSteps = (order) => {
    if (!order) return [];
    // Example mapping
    return [
      { id: 1, title: 'Order Raised', status: 'completed', date: new Date(order.createdAt).toLocaleDateString(), icon: <Package className="w-5 h-5" /> },
      { id: 2, title: 'Processing', status: order.status === 'Pending' ? 'current' : 'completed', date: '', icon: <Settings className="w-5 h-5" /> },
      { id: 3, title: 'In Transit', status: order.status === 'In Transit' ? 'current' : (order.status === 'Delivered' ? 'completed' : 'pending'), date: '', icon: <Truck className="w-5 h-5" /> },
      { id: 4, title: 'Delivered', status: order.status === 'Delivered' ? 'completed' : 'pending', date: '', icon: <Home className="w-5 h-5" /> },
    ];
  };

  const handleExportData = () => {
    alert('Exporting inventory data...');
    // In real implementation, this would generate CSV/Excel
  };

  const handleAddMoreChange = (itemId, value) => {
    setAddMoreValues(prev => ({ ...prev, [itemId]: value }));
  };

  const handleInventoryUpdate = async (item) => {
    const addQuantity = Number(addMoreValues[item._id] || 0);
    if (!addQuantity || addQuantity <= 0) {
      alert("Please enter a valid quantity to add.");
      return;
    }

    try {
      const newQuantity = (item.quantity || 0) + addQuantity;
      await inventoryApi.updateItem(item._id, { quantity: newQuantity });
      
      // Refresh local state or re-fetch
      setInventoryItems(prev => prev.map(i => i._id === item._id ? { ...i, quantity: newQuantity } : i));
      setAddMoreValues(prev => ({ ...prev, [item._id]: '' })); // Clear input
      alert(`Updated stock for ${item.brand?.brand || item.brand?.companyName || 'Item'}`);
    } catch (err) {
      console.error("Error updating inventory", err);
      alert("Failed to update inventory.");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 space-y-6">
      {/* Header & Title */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
      </div>

      {/* Top Selectors Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select State</label>
          <select
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
          >
            <option value="">-- Select State --</option>
            {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Cluster</label>
          <select
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={selectedCluster}
            onChange={(e) => setSelectedCluster(e.target.value)}
          >
            <option value="">-- Select Cluster --</option>
            {clusters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Warehouse</label>
          <select
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={filters.warehouse}
            onChange={(e) => handleFilterChange('warehouse', e.target.value)}
          >
            <option value="">-- Select Warehouse --</option>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </div>
      </div>

      {/* Map and Filters Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Map */}
        <div className="lg:col-span-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h5 className="font-bold text-gray-800 mb-4 px-1">Gujarat Map</h5>
          <div className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-100">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3777314.4013896515!2d68.68610173519345!3d22.399514157136505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3959051f5f0ef795%3A0x861bd887ed54522e!2sGujarat!5e0!3m2!1sen!2sin!4v1746007377622!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Gujarat Map"
            />
          </div>
        </div>

        {/* Right: Detailed Filters Grid */}
        <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-blue-600 uppercase mb-1">Time Period</label>
              <select className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" value={filters.timeFilter} onChange={e => handleFilterChange('timeFilter', e.target.value)}>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-blue-600 uppercase mb-1">SKU</label>
              <select className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" value={filters.sku} onChange={e => handleFilterChange('sku', e.target.value)}>
                <option value="">-- Select SKU --</option>
                {skuOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-blue-600 uppercase mb-1">Technology</label>
              <select className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" value={filters.technology} onChange={e => handleFilterChange('technology', e.target.value)}>
                <option value="">All Technologies</option>
                {techOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-blue-600 uppercase mb-1">Watt</label>
              <select className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" value={filters.watt} onChange={e => handleFilterChange('watt', e.target.value)}>
                <option value="">All Watts</option>
                {wattOptions.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-blue-600 uppercase mb-1">Brand</label>
              <select className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" value={filters.brand} onChange={e => handleFilterChange('brand', e.target.value)}>
                <option value="">All Brands</option>
                {brands.map(b => <option key={b._id} value={b._id}>{b.brandName || b.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-blue-600 uppercase mb-1">Select Quarter</label>
              <select className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" value={filters.quarter} onChange={e => handleFilterChange('quarter', e.target.value)}>
                <option value="">Select Quarter</option>
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-blue-600 uppercase mb-1">Category Type</label>
              <select className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" value={filters.category} onChange={e => handleFilterChange('category', e.target.value)}>
                <option value="">Category Type</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-blue-600 uppercase mb-1">Sub Category Type</label>
              <select className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" value={filters.subCategory} onChange={e => handleFilterChange('subCategory', e.target.value)}>
                <option value="">Sub Category Type</option>
                {subCategories.map(sc => <option key={sc._id} value={sc.name}>{sc.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-blue-600 uppercase mb-1">Project Type</label>
              <select className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" value={filters.projectType} onChange={e => handleFilterChange('projectType', e.target.value)}>
                <option value="">Project Type</option>
                {projectTypes.map(pt => <option key={pt._id} value={pt._id}>{pt.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-blue-600 uppercase mb-1">Sub Project Type</label>
              <select className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" value={filters.subProjectType} onChange={e => handleFilterChange('subProjectType', e.target.value)}>
                <option value="">Sub Project Type</option>
                {subProjectTypes.map(sp => <option key={sp._id} value={sp.name}>{sp.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={clearAllFilters} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">Clear All Filters</button>
          </div>
        </div>
      </div>

      {/* Blue Header Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#56B2D1] text-white font-medium">
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider border-r border-white/20">Brand</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider border-r border-white/20">Technology</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider border-r border-white/20">Watt</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider border-r border-white/20">Projected Inventory (Kw)</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider border-r border-white/20">Existing Inventory (Kw)</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider border-r border-white/20">Existing inventory (Rs)</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider border-r border-white/20">Add More (Kw)</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors text-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.brand?.brand || item.brand?.companyName || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.technology || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.wattage || item.watt || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-blue-600">
                    {projections[item._id] !== undefined ? (
                      <span className="flex items-center justify-center gap-1">
                        {projections[item._id]}
                        <span className="text-[9px] font-normal bg-blue-100 text-blue-500 px-1 py-0.5 rounded">auto</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">{item.maxLevel || 0}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-800">{item.quantity || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">₹{(item.price * item.quantity).toLocaleString() || '0'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input 
                      type="number" 
                      className="w-16 px-2 py-1 border border-gray-200 rounded text-center text-sm outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      placeholder="0" 
                      value={addMoreValues[item._id] || ''}
                      onChange={(e) => handleAddMoreChange(item._id, e.target.value)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                      onClick={() => handleInventoryUpdate(item)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded text-xs font-bold shadow-sm transition-all uppercase tracking-wider"
                    >
                      Add
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr><td colSpan="8" className="text-center py-12 text-gray-400 italic">No matching inventory records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>



      {/* Stock Order Status Stepper */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 pt-6">
        <h4 className="text-lg font-bold text-blue-700 mb-8 border-b pb-2 flex items-center justify-between">
          Stock Order Status
          {recentOrder && <span className="text-xs font-normal text-gray-400 ml-4">Order #{recentOrder.orderId || recentOrder._id}</span>}
        </h4>
        
        {(() => {
          const defaultSteps = [
            { id: 1, title: 'Order Raised',    key: 'orderRaised' },
            { id: 2, title: 'Vendor Selected', key: 'vendorSelected' },
            { id: 3, title: 'Payment Done',    key: 'paymentDone' },
            { id: 4, title: 'In Transit',      key: 'inTransit' },
            { id: 5, title: 'Delivered',       key: 'delivered' },
          ];

          let currentStepIndex = -1;
          let stepDetails = {};

          if (recentOrder) {
            const status = recentOrder.status;
            if (status === 'Delivered') currentStepIndex = 4;
            else if (status === 'In Transit') currentStepIndex = 3;
            else if (status === 'Payment Done') currentStepIndex = 2;
            else if (status === 'Vendor Selected') currentStepIndex = 1;
            else currentStepIndex = 0;

            stepDetails = {
              orderRaised:    { sub: `Brand: ${recentOrder.brand || '—'}\nWatt: ${recentOrder.watt || '—'}\nTech: ${recentOrder.technology || '—'}`, date: recentOrder.createdAt ? new Date(recentOrder.createdAt).toLocaleString() : '' },
              vendorSelected: { sub: recentOrder.vendorName ? `Vendor: ${recentOrder.vendorName}\nType: Manufacturer` : '', date: '' },
              paymentDone:    { sub: '', date: '' },
              inTransit:      { sub: recentOrder.expectedDate ? `Expected: ${new Date(recentOrder.expectedDate).toLocaleDateString()}` : '', date: '' },
              delivered:      { sub: '', date: '' },
            };
          }

          return (
            <div className="relative px-4 py-6">
              {/* Full grey background track */}
              <div className="absolute top-[35px] left-12 right-12 h-1 bg-gray-200 rounded-full z-0"></div>
              {/* Blue fill track for completed steps */}
              {currentStepIndex >= 0 && (
                <div
                  className="absolute top-[35px] left-12 h-1 bg-blue-500 rounded-full z-0 transition-all duration-700"
                  style={{ width: `calc(${(currentStepIndex / (defaultSteps.length - 1)) * 100}% - 1.5rem)` }}
                ></div>
              )}
              {/* Steps */}
              <div className="relative z-10 flex justify-between items-start">
                {defaultSteps.map((step, index) => {
                  const isCompleted = currentStepIndex >= index && currentStepIndex > -1;
                  const isCurrent   = currentStepIndex === index;
                  const detail      = stepDetails[step.key] || {};
                  return (
                    <div key={step.id} className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-all duration-500
                        ${isCurrent         ? 'bg-blue-500 text-white ring-4 ring-blue-100' : ''}
                        ${isCompleted && !isCurrent ? 'bg-blue-600 text-white' : ''}
                        ${!isCompleted && !isCurrent ? 'bg-white border-2 border-gray-300 text-gray-400' : ''}
                      `}>
                        {isCompleted && !isCurrent ? '✓' : index + 1}
                      </div>
                      <div className="mt-3 text-center max-w-[90px]">
                        <p className={`text-[11px] font-bold uppercase tracking-wide leading-tight ${isCompleted || isCurrent ? 'text-blue-700' : 'text-gray-400'}`}>
                          {step.title}
                        </p>
                        {detail.date && <p className="text-[9px] text-gray-400 mt-0.5">{detail.date}</p>}
                        {detail.sub  && <p className="text-[9px] text-gray-500 mt-1 whitespace-pre-line leading-tight">{detail.sub}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Footer Copyright */}
      <div className="py-4 text-center">
        <p className="text-xs text-gray-400 font-medium tracking-tight">Copyright © 2025 Solarkits. All Rights Reserved.</p>
      </div>
    </div>
  );
}