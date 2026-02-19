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
  const [defaultLowStockThreshold, setDefaultLowStockThreshold] = useState(20);
  const [brandThresholds, setBrandThresholds] = useState({});
  const [productThresholds, setProductThresholds] = useState({});
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

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

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('global');

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
    // Kept simple for now - just UI as in original, but TODO: persist to backend
    const [localDefaultThreshold, setLocalDefaultThreshold] = useState(defaultLowStockThreshold);
    // ... other local states

    const handleSaveSettings = () => {
      setDefaultLowStockThreshold(localDefaultThreshold);
      // TODO: Save to backend preference?
      setSettingsModalOpen(false);
      toast.success("Settings saved locally (Backend integration pending)");
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Inventory Settings</h3>
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Default Low Stock Threshold</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2"
                value={localDefaultThreshold}
                onChange={(e) => setLocalDefaultThreshold(parseInt(e.target.value) || 0)}
                min="1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Visual threshold only.
              </p>
            </div>
          </div>

          <div className="p-6 border-t flex justify-end space-x-3">
            <button
              onClick={() => setSettingsModalOpen(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
            >
              <Save size={16} className="mr-2" />
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
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 border-b">Name</th>
                    <th className="p-4 border-b">Brand</th>
                    <th className="p-4 border-b">SKU</th>
                    <th className="p-4 border-b">Category</th>
                    <th className="p-4 border-b text-right">Price</th>
                    <th className="p-4 border-b text-center">Stock</th>
                    <th className="p-4 border-b">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="7" className="p-8 text-center"><Loader className="animate-spin mx-auto" /></td></tr>
                  ) : inventoryData.length === 0 ? (
                    <tr><td colSpan="7" className="p-8 text-center text-gray-500">No inventory found</td></tr>
                  ) : (
                    inventoryData.map(item => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="p-4 border-b font-medium">{item.itemName}</td>
                        <td className="p-4 border-b">{item.brand?.brandName || 'Unknown'}</td>
                        <td className="p-4 border-b text-gray-500 font-mono text-sm">{item.sku}</td>
                        <td className="p-4 border-b">{item.category}</td>
                        <td className="p-4 border-b text-right">₹{item.price.toLocaleString()}</td>
                        <td className="p-4 border-b text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.quantity <= (item.minLevel || defaultLowStockThreshold) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="p-4 border-b text-sm">{item.status}</td>
                      </tr>
                    ))
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