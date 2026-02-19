import React, { useEffect, useState, useRef } from 'react';
import { useLocations } from '../../../hooks/useLocations';
import inventoryApi from '../../../services/inventory/inventoryApi';
import * as procurementApi from '../../../services/procurement/procurementApi';
import { getCategories, getProjectTypes } from '../../../services/masterApi';
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

  // Fetch Data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [invRes, brandRes, catRes, projRes, orderRes] = await Promise.all([
        inventoryApi.getItems({ limit: 1000 }), // Fetch all for clientside filtering/charting for now
        inventoryApi.getBrands(),
        getCategories(),
        getProjectTypes(),
        procurementApi.getAllOrders()
      ]);

      const items = invRes.data?.items || [];
      console.log("Inventory Data Loaded:", items); // Log for verification
      setInventoryItems(items);
      setBrands(brandRes.data || []);
      setCategories(catRes || []);
      setProjectTypes(projRes || []);

      // Set recent order (find first non-delivered or just most recent)
      const orders = orderRes.data || orderRes || [];
      const activeOrder = orders.find(o => o.status !== 'Delivered') || orders[0];
      setRecentOrder(activeOrder);
      if (activeOrder) console.log("Active Order Loaded:", activeOrder);

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
        const brandName = item.brand?.brandName || item.brand?.name || 'Unknown';
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

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="mb-4">
        <nav className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          {/* Breadcrumb ... */}
          <ol className="flex items-center space-x-2 text-sm">
            <li className="flex items-center">
              <span className="text-gray-500">Dashboard</span>
            </li>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <li className="flex items-center">
              <span className="font-semibold text-gray-900">Inventory Management</span>
            </li>
          </ol>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-2xl font-bold text-gray-900">Inventory Management</h3>
            <div className="flex items-center space-x-3">
              <button onClick={handleExportData} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button onClick={() => window.print()} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Location Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Location Filters</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select State</label>
            <select
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              <option value="">-- Select State --</option>
              {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Cluster</label>
            <select
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={selectedCluster}
              onChange={(e) => setSelectedCluster(e.target.value)}
            >
              <option value="">-- Select Cluster --</option>
              {clusters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          {/* Warehouse Filter */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Map */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 h-full">
            <h5 className="text-lg font-semibold text-gray-900 mb-4">Map Location</h5>
            <div className="w-full h-[550px] rounded-lg overflow-hidden border border-gray-200">
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
        </div>

        {/* Right Column - Filters and Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inventory Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex justify-between mb-4">
              <h5 className="font-semibold">Inventory Filters</h5>
              <button onClick={clearAllFilters} className="text-sm text-blue-600">Clear All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* SKU Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">SKU</label>
                <select className="form-select border rounded p-2" value={filters.sku} onChange={e => handleFilterChange('sku', e.target.value)}>
                  <option value="">All SKUs</option>
                  {skuOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {/* Brand Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select className="form-select border rounded p-2" value={filters.brand} onChange={e => handleFilterChange('brand', e.target.value)}>
                  <option value="">All Brands</option>
                  {brands.map(b => <option key={b._id} value={b._id}>{b.brandName || b.name}</option>)}
                </select>
              </div>
              {/* Category Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="form-select border rounded p-2" value={filters.category} onChange={e => handleFilterChange('category', e.target.value)}>
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              {/* Tech Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Technology</label>
                <select className="form-select border rounded p-2" value={filters.technology} onChange={e => handleFilterChange('technology', e.target.value)}>
                  <option value="">All Tech</option>
                  {techOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between">
              <h5 className="font-semibold">Inventory List ({filteredItems.length})</h5>
              <button onClick={() => navigate('/admin/operations/add-inventory')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Add Item</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tech</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Target (Max)</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Current</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.brand?.brandName || item.brand?.name || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.technology}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-semibold">{item.maxLevel || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-bold text-green-600">{item.quantity}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-center text-sm">₹{item.price || 0}</td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr><td colSpan="6" className="text-center py-4 text-gray-500">No Inventory Found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6 p-6">
        <h5 className="font-bold text-lg mb-4">Inventory Overview</h5>
        <div className="h-80">
          <canvas ref={chartRef} />
        </div>
      </div>

      {/* Order Status */}
      {recentOrder ? (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-blue-600">Stock Order Status</h4>
            <span className="text-sm text-gray-500">Order #{recentOrder.orderId || recentOrder._id}</span>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex justify-between">
              {getOrderSteps(recentOrder).map(step => (
                <div key={step.id} className="text-center flex-1">
                  <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step.status === 'completed' ? 'bg-green-100 text-green-600' : (step.status === 'current' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400')}`}>
                    {step.icon}
                  </div>
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 bg-gray-50 p-6 rounded text-center text-gray-500">No Recent Stock Orders</div>
      )}

    </div>
  );
}