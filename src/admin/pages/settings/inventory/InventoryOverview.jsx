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

  const [selectedCpType, setSelectedCpType] = useState('');

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

  useEffect(() => {
    fetchInventory();
  }, [selectedState, selectedCluster, selectedDistrict, selectedCpType, activeFilters, searchQuery, showOnlyLowStock, currentSortField, currentSortOrder]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {
        state: selectedState,
        cluster: selectedCluster,
        district: selectedDistrict,
        cpType: selectedCpType,
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

  const handleCpTypeSelect = (typeId) => {
    setSelectedCpType(prev => prev === typeId ? '' : typeId);
  };


  // --- Render Functions ---
  const renderClusters = () => {
    if (!selectedState) return null;

    return (
      <div className="mt-6 mb-6">
        <h5 className="text-lg font-bold text-gray-700 mb-4">Select Clusters</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {clusters.map(cluster => (
            <div
              key={cluster._id}
              className={`cursor-pointer border rounded p-4 text-center transition-all duration-200 hover:scale-105 ${selectedCluster === cluster._id
                ? 'bg-[#17a2b8] text-white border-[#17a2b8]'
                : 'bg-white border-gray-300 text-gray-800 hover:border-blue-400'
                }`}
              onClick={() => handleClusterSelect(cluster._id)}
            >
              <div className="font-bold text-sm tracking-wide">{cluster.name}</div>
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
      <div className="mt-6 mb-6">
        <h5 className="text-lg font-bold text-gray-700 mb-4">Select Districts</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {districts.map(district => (
            <div
              key={district._id}
              className={`cursor-pointer border rounded p-4 text-center transition-all duration-200 hover:scale-105 ${selectedDistrict === district._id
                ? 'bg-[#28a745] text-white border-[#28a745]'
                : 'bg-white border-gray-300 text-gray-800 hover:border-green-400'
                }`}
              onClick={() => handleDistrictSelect(district._id)}
            >
              <div className="font-bold text-sm tracking-wide">{district.name}</div>
            </div>
          ))}
          {districts.length === 0 && <div className="col-span-4 text-center text-gray-500">No districts found for this cluster.</div>}
        </div>
      </div>
    );
  };

  const renderCpTypes = () => {
    if (!selectedDistrict) return null;

    const cpTypes = [
      { id: 'Startup', label: 'Startup' },
      { id: 'Basic', label: 'Basic' },
      { id: 'Enterprise', label: 'Enterprise' },
      { id: 'Solar Business', label: 'Solar Business' },
    ];

    return (
      <div className="mt-6 mb-6">
        <h5 className="text-lg font-bold text-gray-700 mb-4">Select CP Types</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cpTypes.map(cpType => (
            <div
              key={cpType.id}
              className={`cursor-pointer border rounded p-4 text-center transition-all duration-200 hover:scale-105 flex items-center justify-center ${selectedCpType === cpType.id
                ? 'bg-gray-800 text-white border-gray-800' // Assuming dark for 'Break Time' style or primary. Will use slate.
                : 'bg-white border-gray-300 text-gray-800 hover:border-gray-400'
                }`}
              onClick={() => handleCpTypeSelect(cpType.id)}
            >
              <div className="font-bold text-sm tracking-wide">{cpType.label}</div>
            </div>
          ))}
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
        <div className="bg-white rounded w-[700px] max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-lg">
          <div className="p-4 flex justify-between items-center border-b border-gray-200">
            <h3 className="text-[#206bc4] text-lg font-bold">Inventory Settings</h3>
            <button onClick={() => setSettingsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
              <X size={20} />
            </button>
          </div>

          <div className="flex border-b border-gray-200 text-sm">
            <button
              className={`px-6 py-3 text-center transition-colors font-medium -mb-[1px] ${activeTab === 'global' ? 'border-t-2 border-t-transparent border-l border-r border-b-white bg-white text-gray-800' : 'border-b text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('global')}
            >
              Global Settings
            </button>
            <button
              className={`px-6 py-3 text-center transition-colors font-medium -mb-[1px] ${activeTab === 'brand' ? 'border-t-2 border-t-[#206bc4] border-l border-r border-[#e0e6ed] border-b-white bg-white text-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('brand')}
            >
              Brand-wise Settings
            </button>
            <button
              className={`px-6 py-3 text-center transition-colors font-medium -mb-[1px] ${activeTab === 'product' ? 'border-t-2 border-t-[#206bc4] border-l border-r border-[#e0e6ed] border-b-white bg-white text-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('product')}
            >
              Product-wise Settings
            </button>
            <div className="flex-1 border-b border-gray-200"></div>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {activeTab === 'global' && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Default Low Stock Threshold</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 px-3 py-2"
                  value={localSettings.globalLowStockThreshold}
                  onChange={(e) => setLocalSettings({ ...localSettings, globalLowStockThreshold: Number(e.target.value) })}
                  min="0"
                />
                <p className="text-xs text-gray-400 mt-2">
                  This threshold will be used for brands and products without specific settings.
                </p>
              </div>
            )}

            {activeTab === 'brand' && (
              <div>
                <p className="text-sm text-gray-600 mb-6">Set low stock thresholds for specific brands</p>
                <div className="space-y-0">
                  {brands.map((brand, index) => (
                    <div key={brand._id} className={`flex justify-between items-start py-4 ${index !== brands.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <span className="font-semibold text-sm text-gray-800 w-1/3 pt-2">{brand.brandName || brand.name}</span>
                      <div className="w-2/3">
                        <input
                          type="number"
                          placeholder="Use default threshold"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
                          value={getBrandThreshold(brand._id)}
                          onChange={(e) => handleBrandChange(brand._id, e.target.value)}
                        />
                        <p className="text-[11px] text-gray-400 mt-1">Leave empty to use default threshold</p>
                      </div>
                    </div>
                  ))}
                  {brands.length === 0 && <span className="text-sm text-gray-500">No brands found.</span>}
                </div>
              </div>
            )}

            {activeTab === 'product' && (
              <div>
                <p className="text-sm text-gray-600 mb-6">Set low stock thresholds for specific products</p>
                <div className="space-y-0 max-h-[500px]">
                  {inventoryData.map((item, index) => (
                    <div key={item._id} className={`flex justify-between items-start py-4 ${index !== inventoryData.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <div className="flex flex-col w-1/3 pt-2">
                        <span className="font-semibold text-sm text-gray-800">{item.itemName}</span>
                        <span className="text-[11px] text-gray-500">{item.brand?.brandName || 'Unknown'}</span>
                      </div>
                      <div className="w-2/3">
                        <input
                          type="number"
                          placeholder="Use brand/default threshold"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
                          value={getProductThreshold(item._id)}
                          onChange={(e) => handleProductChange(item._id, e.target.value)}
                        />
                        <p className="text-[11px] text-gray-400 mt-1">Leave empty to use brand or default threshold</p>
                      </div>
                    </div>
                  ))}
                  {inventoryData.length === 0 && <span className="text-sm text-gray-500">No products in current view. Search or filter to find products.</span>}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[#e0e6ed] flex justify-end space-x-3 bg-white">
            <button onClick={() => setSettingsModalOpen(false)} className="px-4 py-2 text-sm font-medium bg-[#5b6e88] text-white rounded hover:bg-gray-600 transition-colors">
              Close
            </button>
            <button onClick={handleSaveSettings} disabled={saving} className="px-4 py-2 text-sm font-medium bg-[#206bc4] text-white rounded hover:bg-blue-700 transition-colors flex items-center">
              {saving ? <Loader className="animate-spin mr-2" size={14} /> : null}
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
      <div className="mb-6">
        <h4 className="text-[#206bc4] text-xl font-bold border border-gray-200 border-l-4 border-l-blue-500 bg-white p-4">Inventory Overview</h4>
      </div>

      {/* State Selection */}
      <div className="mb-6">
        <h5 className="text-lg font-bold text-gray-700 mb-4">Select States</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {states.map(state => (
            <div
              key={state._id}
              className={`cursor-pointer border rounded p-4 text-center transition-all duration-200 hover:scale-105 ${selectedState === state._id
                ? 'bg-[#1d64b2] text-white border-[#1d64b2]'
                : 'bg-white border-gray-300 text-gray-800 hover:border-blue-400'
                }`}
              onClick={() => handleStateSelect(state._id)}
            >
              <h6 className="font-bold text-sm tracking-wide">{state.name}</h6>
              <div className="font-bold text-xs mt-1">{state.code || 'N/A'}</div>
            </div>
          ))}
          {states.length === 0 && <div className="col-span-4 text-center text-gray-500">Loading states...</div>}
        </div>
      </div>

      {/* Cluster Section */}
      {renderClusters()}

      {/* District Section */}
      {renderDistricts()}

      {/* CP Types Section */}
      {renderCpTypes()}

      {/* Inventory Summary */}
      {(selectedDistrict || (selectedState && selectedCluster)) && (
        <>
          <div className="mt-6">
            <div className="bg-white border border-gray-200 p-6 mb-6 rounded-md">
              <h5 className="text-sm font-bold text-gray-800 mb-6 text-left">Inventory Summary</h5>
              {loading ? (
                <div className="flex justify-center p-4"><Loader className="animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <h6 className="text-sm font-bold text-gray-800 mb-2">Total Products</h6>
                    <h4 className="text-2xl font-bold text-black">{summary.totalProducts}</h4>
                  </div>
                  <div>
                    <h6 className="text-sm font-bold text-gray-800 mb-2">Total Quantity</h6>
                    <h4 className="text-2xl font-bold text-black">{summary.totalQuantity}</h4>
                  </div>
                  <div>
                    <h6 className="text-sm font-bold text-gray-800 mb-2">Total Value</h6>
                    <h4 className="text-2xl font-bold text-black">₹{summary.totalValue.toLocaleString()}</h4>
                  </div>
                  <div>
                    <h6 className="text-sm font-bold text-gray-800 mb-2">
                      {selectedCpType ? 'Selected CP Types' : selectedDistrict ? 'Selected Districts' : 'Selected Clusters'}
                    </h6>
                    <h4 className="text-2xl font-bold text-black">{selectedCpType ? 1 : selectedDistrict ? 1 : 1}</h4>
                  </div>
                </div>
              )}
            </div>

            {/* Filter Section */}
            <div className="bg-white border border-gray-200 mb-6 p-6 rounded-md">
              <h5 className="text-[#206bc4] text-lg font-bold mb-4">Filter Options</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Category</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700"
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
                  <label className="block text-sm text-gray-700 mb-2">Sub Category</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700"
                    value={activeFilters.subCategory}
                    onChange={(e) => setActiveFilters({ ...activeFilters, subCategory: e.target.value })}
                  >
                    <option value="">Sub Category</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Project Type (kW)</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700"
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
                  <label className="block text-sm text-gray-700 mb-2">Sub Project Type</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700"
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
                  <label className="block text-sm text-gray-700 mb-2">Kit Type</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700"
                    value={activeFilters.kitType}
                    onChange={(e) => setActiveFilters({ ...activeFilters, kitType: e.target.value })}
                  >
                    <option value="">Select Kit Type</option>
                    <option value="Combo Kit">Combo Kit</option>
                    <option value="Customize Kit">Customize Kit</option>
                  </select>
                </div>
                <div className="md:col-span-3 flex justify-end items-end space-x-4">
                  <button
                    className="px-4 py-2 bg-[#206bc4] text-white rounded text-sm font-medium flex items-center hover:bg-blue-700 transition"
                  >
                    <Filter size={14} className="mr-2" />
                    Apply Filters
                  </button>
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
                    className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-800 flex items-center transition"
                  >
                    <RefreshCw size={14} className="mr-2" />
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Low Stock Alert - Dynamic */}
            {summary.lowStockCount > 0 && (
              <div className="bg-[#f8d7da] border border-[#f5c6cb] rounded px-4 py-3 mb-6 flex justify-between items-center">
                <div>
                  <h5 className="font-bold text-[#721c24] mb-1 flex items-center">
                    <AlertTriangle className="mr-2" size={18} />
                    Low Stock Alert
                  </h5>
                  <p className="text-[#721c24] text-sm">
                    {summary.lowStockCount} product{summary.lowStockCount > 1 ? 's' : ''} {summary.lowStockCount > 1 ? 'are' : 'is'} running low on stock
                  </p>
                </div>
                <button className="bg-white border border-gray-300 text-gray-700 font-medium text-xs px-3 py-1.5 rounded hover:bg-gray-50 transition">
                  View Items
                </button>
              </div>
            )}
          </div>

          {/* Inventory Table */}
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-md">
              <h5 className="flex items-center text-lg font-bold text-gray-800">
                Product Inventory
                {summary.lowStockCount > 0 && (
                  <span className="ml-3 bg-[#dc3545] text-white text-xs font-bold px-2 py-1 rounded">
                    {summary.lowStockCount}
                  </span>
                )}
              </h5>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
                  className={`text-sm font-medium px-3 py-1.5 rounded flex items-center transition ${showOnlyLowStock
                    ? 'text-red-600 bg-red-100 hover:bg-red-200'
                    : 'text-red-500 hover:bg-red-50'
                    }`}
                >
                  <Filter size={14} className="mr-1" />
                  {showOnlyLowStock ? 'Show All Products' : 'Show Low Stock Only'}
                </button>
                <button
                  onClick={() => setSettingsModalOpen(true)}
                  className="bg-[#17a2b8] text-white text-sm font-medium px-3 py-1.5 rounded hover:bg-cyan-600 flex items-center transition"
                >
                  <Settings size={14} className="mr-1" />
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
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-[#343a40] text-white">
                  <tr>
                    <th className="p-3 border-b border-[#454d55] font-bold">#</th>
                    <th className="p-3 border-b border-[#454d55] font-bold">
                      <div className="flex items-center">Product Name <ChevronUp size={14} className="ml-1 opacity-50" /></div>
                    </th>
                    <th className="p-3 border-b border-[#454d55] font-bold">
                      <div className="flex items-center">Brand <ChevronUp size={14} className="ml-1 opacity-50" /></div>
                    </th>
                    <th className="p-3 border-b border-[#454d55] font-bold">
                      <div className="flex items-center">SKU <ChevronUp size={14} className="ml-1 opacity-50" /></div>
                    </th>
                    <th className="p-3 border-b border-[#454d55] font-bold">
                      <div className="flex items-center">Quantity <ChevronUp size={14} className="ml-1 opacity-50" /></div>
                    </th>
                    <th className="p-3 border-b border-[#454d55] font-bold">
                      <div className="flex items-center">Price (₹) <ChevronUp size={14} className="ml-1 opacity-50" /></div>
                    </th>
                    <th className="p-3 border-b border-[#454d55] font-bold">
                      <div className="flex items-center">Total Value (₹) <ChevronUp size={14} className="ml-1 opacity-50" /></div>
                    </th>
                    <th className="p-3 border-b border-[#454d55] font-bold">Status</th>
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
                        <tr key={item._id} className={`border-b border-gray-200 transition-colors ${isLowStock ? 'bg-[#f8d7da]' : 'bg-white hover:bg-gray-50'}`}>
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3 text-gray-800">{item.itemName}</td>
                          <td className="p-3 text-gray-700">{item.brand?.brandName || 'Unknown'}</td>
                          <td className="p-3 text-gray-600 font-mono text-xs">{item.sku}</td>
                          <td className="p-3 font-semibold text-gray-800">
                            <div className="flex items-center">
                              {item.quantity}
                              {isLowStock && (
                                <span className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-[#dc3545] text-white rounded-full text-[10px] font-bold">
                                  i
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-gray-800">₹{item.price.toLocaleString()}</td>
                          <td className="p-3 text-gray-800">₹{totalValue.toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold text-white ${isLowStock ? 'bg-[#dc3545]' : 'bg-[#28a745]'}`}>
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