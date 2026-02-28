// InventoryManagement.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, X, Filter, RefreshCw, Settings, AlertTriangle,
  ChevronUp, ChevronDown, Save, Plus, Minus,
  Factory, MapPin, Users, Package, Loader
} from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import inventoryApi from '../../../../services/inventory/inventoryApi';
import toast from 'react-hot-toast';

const InventoryManagement = () => {
  // --- Location Hook ---
  const {
    states,
    clusters,
    districts,
    selectedState,
    setSelectedState,
    selectedCluster,
    setSelectedCluster,
    selectedDistrict,
    setSelectedDistrict,
    loading: locationsLoading
  } = useLocations();

  // Inventory Data
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    totalValue: 0,
    lowStockCount: 0
  });

  // Settings / Thresholds
  const [settings, setSettings] = useState({
    globalLowStockThreshold: 10,
    brandThresholds: [],
    productThresholds: []
  });
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await inventoryApi.getSettings();
      if (res.data?.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const getThresholdForItem = useCallback((item) => {
    // 1. Product-wise
    const prodThresh = settings.productThresholds?.find(p => p.productId === item._id);
    if (prodThresh && prodThresh.threshold !== null && prodThresh.threshold !== undefined) return prodThresh.threshold;

    // 2. Brand-wise
    const brandId = item.brand?._id || item.brand;
    const brandThresh = settings.brandThresholds?.find(b => b.brandId === brandId);
    if (brandThresh && brandThresh.threshold !== null && brandThresh.threshold !== undefined) return brandThresh.threshold;

    // 3. Global
    return settings.globalLowStockThreshold || 10;
  }, [settings]);

  // Filtering & Sorting
  const [currentSortField, setCurrentSortField] = useState('createdAt');
  const [currentSortOrder, setCurrentSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const [activeFilters, setActiveFilters] = useState({
    category: '',
    subCategory: '',
    projectType: '',
    subProjectType: '',
    kitType: ''
  });

  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Fetch Inventory when filters change
  useEffect(() => {
    fetchInventory();
  }, [selectedState, selectedCluster, selectedDistrict, activeFilters, searchQuery, showOnlyLowStock, currentSortField, currentSortOrder]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {
        state: selectedState,
        cluster: selectedCluster,
        district: selectedDistrict,
        search: searchQuery,
        ...activeFilters,
        lowStock: showOnlyLowStock,
        sort: currentSortField,
        order: currentSortOrder
      };

      // Remove empty params
      Object.keys(params).forEach(key => !params[key] && delete params[key]);

      const [itemsResponse, summaryResponse] = await Promise.all([
        inventoryApi.getItems(params),
        inventoryApi.getSummary(params)
      ]);

      setInventoryData(itemsResponse.data.items || itemsResponse.data || []);
      setSummary(summaryResponse.data || summaryResponse);

    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Helper Functions ---
  const getUniqueBrands = () => {
    return [...new Set(inventoryData.map(product => product.brand?.brandName || 'Unknown'))];
  };

  // --- Selection Handlers ---
  const handleStateSelect = (stateId) => {
    setSelectedState(prev => prev === stateId ? '' : stateId);
  };

  const handleClusterSelect = (clusterId) => {
    setSelectedCluster(prev => prev === clusterId ? '' : clusterId);
  };

  const handleDistrictSelect = (districtId) => {
    setSelectedDistrict(prev => prev === districtId ? '' : districtId);
  };


  // --- Render Functions ---
  const renderClusters = () => {
    if (!selectedState) return null;

    return (
      <div className="mt-8">
        <h5 className="text-lg font-medium mb-4">Select Cluster</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {clusters.map(cluster => (
            <div
              key={cluster._id}
              className={`cursor-pointer border rounded-lg p-4 text-center transition-all duration-200 hover:scale-105 ${selectedCluster === cluster._id
                ? 'bg-blue-500 text-white border-blue-600'
                : 'border-blue-300 hover:border-blue-400'
                }`}
              onClick={() => handleClusterSelect(cluster._id)}
            >
              <div className="font-medium">{cluster.name}</div>
            </div>
          ))}
          {clusters.length === 0 && <div className="col-span-4 text-center text-gray-500">No clusters found for this state.</div>}
        </div>
      </div>
    );
  };

  const renderDistricts = () => {
    if (!selectedCluster) return null;

    return (
      <div className="mt-8">
        <h5 className="text-lg font-medium mb-4">Select Districts</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {districts.map(district => (
            <div
              key={district._id}
              className={`cursor-pointer border rounded-lg p-4 text-center transition-all duration-200 hover:scale-105 ${selectedDistrict === district._id
                ? 'bg-green-500 text-white border-green-600'
                : 'border-green-300 hover:border-green-400'
                }`}
              onClick={() => handleDistrictSelect(district._id)}
            >
              <div className="font-medium">{district.name}</div>
            </div>
          ))}
          {districts.length === 0 && <div className="col-span-4 text-center text-gray-500">No districts found for this cluster.</div>}
        </div>
      </div>
    );
  };

  // --- Settings Modal ---
  const SettingsModal = () => {
    const [localSettings, setLocalSettings] = useState(settings);
    const [activeTab, setActiveTab] = useState('global');
    const [brands, setBrands] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      // Fetch Brands for Brand-wise settings
      inventoryApi.getBrands().then(res => setBrands(res.data || [])).catch(console.error);
    }, []);

    const handleSaveSettings = async () => {
      try {
        setSaving(true);
        // Clean up empty thresholds
        const payload = {
          globalLowStockThreshold: localSettings.globalLowStockThreshold,
          brandThresholds: localSettings.brandThresholds.filter(b => b.threshold !== '' && b.threshold !== null && !isNaN(b.threshold)),
          productThresholds: localSettings.productThresholds.filter(p => p.threshold !== '' && p.threshold !== null && !isNaN(p.threshold))
        };
        const res = await inventoryApi.updateSettings(payload);
        setSettings(res.data.data);
        setSettingsModalOpen(false);
        toast.success("Settings saved successfully!");
      } catch (error) {
        toast.error("Failed to save settings");
        console.error(error);
      } finally {
        setSaving(false);
      }
    };

    const handleBrandChange = (brandId, value) => {
      const thresholds = [...(localSettings.brandThresholds || [])];
      const index = thresholds.findIndex(b => b.brandId === brandId);
      const valNum = value === '' ? '' : Number(value);
      if (index >= 0) {
        thresholds[index].threshold = valNum;
      } else {
        thresholds.push({ brandId, threshold: valNum });
      }
      setLocalSettings({ ...localSettings, brandThresholds: thresholds });
    };

    const handleProductChange = (productId, value) => {
      const thresholds = [...(localSettings.productThresholds || [])];
      const index = thresholds.findIndex(p => p.productId === productId);
      const valNum = value === '' ? '' : Number(value);
      if (index >= 0) {
        thresholds[index].threshold = valNum;
      } else {
        thresholds.push({ productId, threshold: valNum });
      }
      setLocalSettings({ ...localSettings, productThresholds: thresholds });
    };

    const getBrandThreshold = (brandId) => {
      const found = localSettings.brandThresholds?.find(b => b.brandId === brandId);
      return found ? found.threshold : '';
    };

    const getProductThreshold = (productId) => {
      const found = localSettings.productThresholds?.find(p => p.productId === productId);
      return found ? found.threshold : '';
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-[600px] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-bold">Inventory Settings</h3>
            <button onClick={() => setSettingsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>

          <div className="flex border-b text-sm font-medium text-gray-500">
            <button 
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeTab === 'global' ? 'border-blue-500 text-blue-600 font-semibold' : 'border-transparent hover:text-gray-700'}`}
              onClick={() => setActiveTab('global')}
            >
              Global Settings
            </button>
            <button 
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeTab === 'brand' ? 'border-blue-500 text-blue-600 font-semibold' : 'border-transparent hover:text-gray-700'}`}
              onClick={() => setActiveTab('brand')}
            >
              Brand-wise Settings
            </button>
            <button 
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeTab === 'product' ? 'border-blue-500 text-blue-600 font-semibold' : 'border-transparent hover:text-gray-700'}`}
              onClick={() => setActiveTab('product')}
            >
              Product-wise Settings
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {activeTab === 'global' && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Default Low Stock Threshold</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 px-3 py-2"
                  value={localSettings.globalLowStockThreshold}
                  onChange={(e) => setLocalSettings({...localSettings, globalLowStockThreshold: Number(e.target.value)})}
                  min="0"
                />
                <p className="text-xs text-gray-400 mt-2">
                  This threshold will be used for brands and products without specific settings.
                </p>
              </div>
            )}

            {activeTab === 'brand' && (
              <div>
                <p className="text-xs text-gray-500 mb-4">Set low stock thresholds specific to each brand. This overrides the global setting.</p>
                <div className="space-y-3">
                  {brands.map(brand => (
                    <div key={brand._id} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
                      <span className="font-medium text-sm text-gray-700">{brand.brandName || brand.name}</span>
                      <input 
                        type="number" 
                        placeholder="Global Default"
                        className="w-32 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                        value={getBrandThreshold(brand._id)}
                        onChange={(e) => handleBrandChange(brand._id, e.target.value)}
                      />
                    </div>
                  ))}
                  {brands.length === 0 && <span className="text-sm text-gray-500">No brands found.</span>}
                </div>
              </div>
            )}

            {activeTab === 'product' && (
              <div>
                <p className="text-xs text-gray-500 mb-4">Set low stock thresholds for specific products. This overrides both global and brand settings. Showing products from current view.</p>
                <div className="space-y-3 max-h-[400px]">
                  {inventoryData.map(item => (
                    <div key={item._id} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-gray-700">{item.itemName}</span>
                        <span className="text-xs text-gray-500">{item.sku} | {item.brand?.brandName || 'Unknown'}</span>
                      </div>
                      <input 
                        type="number" 
                        placeholder="Default"
                        className="w-32 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                        value={getProductThreshold(item._id)}
                        onChange={(e) => handleProductChange(item._id, e.target.value)}
                      />
                    </div>
                  ))}
                  {inventoryData.length === 0 && <span className="text-sm text-gray-500">No products in current view. Search or filter to find products.</span>}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t flex justify-end space-x-3 bg-gray-50">
            <button onClick={() => setSettingsModalOpen(false)} className="px-5 py-2 text-sm font-medium border border-gray-300 rounded shadow-sm hover:bg-white transition-colors">
              Close
            </button>
            <button onClick={handleSaveSettings} disabled={saving} className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center">
              {saving ? <Loader className="animate-spin mr-2" size={16}/> : null}
              Save Settings
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Title */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h4 className="text-blue-600 text-xl font-semibold">Inventory Overview</h4>
      </div>

      {/* State Selection */}
      <div className="mb-6">
        <h5 className="text-lg font-medium mb-4">Select States</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {states.map(state => (
            <div
              key={state._id}
              className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-all duration-200 hover:scale-105 ${selectedState === state._id
                ? 'bg-blue-500 text-white border-blue-600'
                : 'border-blue-300 hover:border-blue-400'
                }`}
              onClick={() => handleStateSelect(state._id)}
            >
              <h6 className="font-medium">{state.name}</h6>
              <div className="font-bold">{state.code || 'N/A'}</div>
            </div>
          ))}
          {states.length === 0 && <div className="col-span-4 text-center text-gray-500">Loading states...</div>}
        </div>
      </div>

      {/* Cluster Section */}
      {renderClusters()}

      {/* District Section */}
      {renderDistricts()}

      {/* Inventory Summary */}
      {(selectedDistrict || (selectedState && selectedCluster)) && (
        <>
          <div className="mt-8">
            <div className="bg-gray-50 rounded-lg shadow mb-6 p-6">
              <h5 className="text-lg font-semibold mb-4">Inventory Summary</h5>
              {loading ? (
                <div className="flex justify-center p-4"><Loader className="animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <h6 className="text-gray-600">Total Products</h6>
                    <h4 className="text-2xl font-bold">{summary.totalProducts}</h4>
                  </div>
                  <div>
                    <h6 className="text-gray-600">Total Quantity</h6>
                    <h4 className="text-2xl font-bold">{summary.totalQuantity}</h4>
                  </div>
                  <div>
                    <h6 className="text-gray-600">Total Value</h6>
                    <h4 className="text-2xl font-bold">₹{summary.totalValue.toLocaleString()}</h4>
                  </div>
                  <div>
                    <h6 className="text-gray-600">Selected</h6>
                    <h4 className="text-2xl font-bold">{selectedDistrict ? 'District' : 'Cluster'}</h4>
                  </div>
                </div>
              )}
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h5 className="text-blue-600 text-lg font-semibold mb-4">Filter Options</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={activeFilters.category}
                    onChange={(e) => setActiveFilters({ ...activeFilters, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    <option value="Rooftop">Rooftop Solar</option>
                    <option value="SolarPump">Solar Pump</option>
                    <option value="SolarLight">Solar Light</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sub Category</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={activeFilters.subCategory}
                    onChange={(e) => setActiveFilters({ ...activeFilters, subCategory: e.target.value })}
                  >
                    <option value="">Sub Category</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Project Type</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={activeFilters.projectType}
                    onChange={(e) => setActiveFilters({ ...activeFilters, projectType: e.target.value })}
                  >
                    <option value="">Select Range</option>
                    <option value="1-5">1 kW – 5 kW</option>
                    <option value="6-10">6 kW – 10 kW</option>
                    <option value="10+">Above 10 kW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sub Project Type</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={activeFilters.subProjectType}
                    onChange={(e) => setActiveFilters({ ...activeFilters, subProjectType: e.target.value })}
                  >
                    <option value="">Sub Project Type</option>
                    <option value="On Grid">On Grid</option>
                    <option value="Off Grid">Off Grid</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Kit Type</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={activeFilters.kitType}
                    onChange={(e) => setActiveFilters({ ...activeFilters, kitType: e.target.value })}
                  >
                    <option value="">Select Kit Type</option>
                    <option value="Combo Kit">Combo Kit</option>
                    <option value="Customize Kit">Customize Kit</option>
                  </select>
                </div>
                <div className="md:col-span-3 flex justify-end items-end space-x-3">
                  <button
                    onClick={() => {
                      setActiveFilters({
                        category: '',
                        subCategory: '',
                        projectType: '',
                        subProjectType: '',
                        kitType: ''
                      });
                      setSearchQuery('');
                      setShowOnlyLowStock(false);
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Low Stock Alert - Dynamic */}
            {summary.lowStockCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-semibold text-red-700 mb-1 flex items-center">
                      <AlertTriangle className="mr-2" size={20} />
                      Low Stock Alert
                    </h5>
                    <p className="text-red-600">
                      {summary.lowStockCount} product{summary.lowStockCount > 1 ? 's' : ''} {summary.lowStockCount > 1 ? 'are' : 'is'} running low on stock
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex justify-between items-center">
              <h5 className="text-lg font-semibold">Product Inventory</h5>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
                  className={`px-3 py-2 rounded-lg flex items-center ${showOnlyLowStock
                    ? 'bg-red-500 text-white'
                    : 'border border-red-500 text-red-500 hover:bg-red-50'
                    }`}
                >
                  <Filter size={16} className="mr-2" />
                  {showOnlyLowStock ? 'Show All Products' : 'Show Low Stock Only'}
                </button>
                <button
                  onClick={() => setSettingsModalOpen(true)}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <Settings size={16} className="mr-2" />
                  Settings
                </button>
              </div>
            </div>

            {/* Search & Sort */}
            <div className="p-6 border-b">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="text-gray-400" size={20} />
                    </div>
                    <input
                      type="text"
                      className="w-full border rounded-lg pl-10 pr-10 py-2"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="text-gray-400 hover:text-gray-600" size={20} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={currentSortField}
                    onChange={(e) => setCurrentSortField(e.target.value)}
                  >
                    <option value="name">Sort by Name</option>
                    <option value="quantity">Sort by Quantity</option>
                    <option value="price">Sort by Price</option>
                    <option value="createdAt">Sort by Date</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#2B303B] text-white">
                  <tr>
                    <th className="p-4 border-b font-medium">#</th>
                    <th className="p-4 border-b font-medium">Product Name</th>
                    <th className="p-4 border-b font-medium">Brand</th>
                    <th className="p-4 border-b font-medium">SKU</th>
                    <th className="p-4 border-b font-medium text-center">Quantity</th>
                    <th className="p-4 border-b font-medium text-right">Price (₹)</th>
                    <th className="p-4 border-b font-medium text-right">Total Value (₹)</th>
                    <th className="p-4 border-b font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" className="p-8 text-center"><Loader className="animate-spin mx-auto" /></td></tr>
                  ) : inventoryData.length === 0 ? (
                    <tr><td colSpan="8" className="p-8 text-center text-gray-500">No inventory found</td></tr>
                  ) : (
                    inventoryData.map((item, index) => {
                      const isLowStock = item.quantity <= getThresholdForItem(item);
                      const totalValue = item.price * item.quantity;
                      
                      return (
                        <tr key={item._id} className={isLowStock ? "bg-red-200 hover:bg-red-300 transition-colors" : "bg-[#F3F6F9] hover:bg-gray-200 transition-colors"}>
                          <td className="p-4 border-b font-medium border-white">{index + 1}</td>
                          <td className="p-4 border-b font-medium border-white">{item.itemName}</td>
                          <td className="p-4 border-b border-white">{item.brand?.brandName || 'Unknown'}</td>
                          <td className="p-4 border-b text-gray-600 font-mono text-sm border-white">{item.sku}</td>
                          <td className="p-4 border-b text-center font-semibold border-white">
                            <div className="flex items-center justify-center">
                              {item.quantity}
                              {isLowStock && <AlertTriangle className="text-red-600 ml-2" size={16} />}
                            </div>
                          </td>
                          <td className="p-4 border-b text-right border-white">₹{item.price.toLocaleString()}</td>
                          <td className="p-4 border-b text-right border-white">₹{totalValue.toLocaleString()}</td>
                          <td className="p-4 border-b text-center border-white">
                            <span className={`px-3 py-1 rounded text-xs font-semibold text-white ${isLowStock ? 'bg-[#DC3545]' : 'bg-[#28A745]'}`}>
                              {isLowStock ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t text-right text-gray-500 text-sm">
              Showing {inventoryData.length} items
            </div>
          </div>
        </>
      )}

      {settingsModalOpen && <SettingsModal />}
    </div>
  );
};

export default InventoryManagement;