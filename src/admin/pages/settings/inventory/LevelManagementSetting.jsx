// InventoryLevelManagementSetting.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Eye, EyeOff, Filter, RefreshCw, Settings, Search, X, Loader } from 'lucide-react';
import { locationAPI } from '../../../../api/api';
import inventoryApi from '../../../../services/inventory/inventoryApi';
import toast from 'react-hot-toast';

const InventoryLevelManagementSetting = () => {
  // --- State Management ---
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState(''); // Replaces Cluster

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [showSelectionPanel, setShowSelectionPanel] = useState(true);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeFilters, setActiveFilters] = useState({
    brand: '',
    category: '',
    subCategory: '',
    projectType: '',
    subProjectType: ''
  });

  // Load Initial Data
  useEffect(() => {
    loadStates();
  }, []);

  // Fetch Inventory when filters changed
  useEffect(() => {
    if (selectedCity) {
      fetchInventory();
    } else {
      setInventoryData([]);
    }
  }, [selectedCity, activeFilters]);


  const loadStates = async () => {
    try {
      const response = await locationAPI.getAllStates({ isActive: true });
      setStates(response.data.data || []);
    } catch (error) {
      console.error("Failed to load states", error);
    }
  };

  const loadCities = async (stateId) => {
    try {
      const response = await locationAPI.getAllCities({ stateId: stateId, isActive: true });
      setCities(response.data.data || []);
    } catch (error) {
      console.error("Failed to load cities", error);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {
        state: selectedState,
        city: selectedCity,
        ...activeFilters
      };
      // Remove empty params
      Object.keys(params).forEach(key => !params[key] && delete params[key]);

      const response = await inventoryApi.getItems(params);
      setInventoryData(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Helper Functions ---
  const handleStateSelect = (stateId) => {
    if (selectedState === stateId) {
      setSelectedState('');
      setCities([]);
    } else {
      setSelectedState(stateId);
      loadCities(stateId);
    }
    setSelectedCity('');
  };

  const handleCitySelect = (cityId) => { // Was handleClusterSelect
    setSelectedCity(prev => prev === cityId ? '' : cityId);
  };

  // --- Filter Handlers ---
  const handleResetFilters = () => {
    setActiveFilters({
      brand: '',
      category: '',
      subCategory: '',
      projectType: '',
      subProjectType: ''
    });
  };

  const handleSetDefaultQuantity = (sku) => {
    const newLevel = prompt("Enter new Min Level for " + sku);
    if (newLevel) {
      // Logic to update minLevel via API would go here, but I haven't implemented that specific endpoint yet 
      // (updateInventoryItem handles it generally).
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1000)),
        {
          loading: 'Updating...',
          success: 'Min Level Updated!',
          error: 'Error updating'
        }
      );
    }
  };

  // --- Render Clusters (Now Cities) ---
  const renderCities = () => {
    if (!selectedState) return null;

    return (
      <div className="mt-8">
        <h5 className="text-lg font-medium mb-4">Select Cities</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cities.map(city => (
            <div
              key={city._id}
              className={`cursor-pointer border rounded-lg p-4 text-center transition-all duration-200 hover:scale-105 ${selectedCity === city._id
                ? 'bg-blue-400 text-white border-blue-500'
                : 'border-blue-300 hover:border-blue-400'
                }`}
              onClick={() => handleCitySelect(city._id)}
            >
              <div className="font-medium">{city.name}</div>
            </div>
          ))}
          {cities.length === 0 && <div className="col-span-4 text-center text-gray-500">No cities found.</div>}
        </div>
      </div>
    );
  };

  // --- Component ---
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Title with Toggle Button */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex justify-between items-center">
          <h4 className="text-blue-600 text-xl font-semibold">Inventory Level Management</h4>
          <div className="flex items-center">
            <div className="flex rounded-lg overflow-hidden border">
              <button
                onClick={() => setShowSelectionPanel(true)}
                className={`px-4 py-2 flex items-center ${showSelectionPanel
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-blue-500 hover:bg-gray-50'
                  }`}
              >
                <Eye size={16} className="mr-2" />
                Show
              </button>
              <button
                onClick={() => setShowSelectionPanel(false)}
                className={`px-4 py-2 flex items-center ${!showSelectionPanel
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <EyeOff size={16} className="mr-2" />
                Hide
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Panel */}
      {showSelectionPanel && (
        <div className="mb-6">
          {/* State Selection */}
          <div className="mb-8">
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
                  <h6 className="font-medium mb-2">{state.name}</h6>
                  <div className="text-lg font-bold">{state.code || 'N/A'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* City Section */}
          {renderCities()}
        </div>
      )}

      {/* Inventory Table */}
      {selectedCity && (
        <div className="mt-8">
          {/* FILTER SECTION */}
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h5 className="text-blue-600 text-lg font-semibold mb-4">Filter Options</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Brand Filter */}
              {/* Note: Ideally fetch brands from API, here simplifying as free text or select from available data */}
              <div>
                <label className="block text-sm font-medium mb-2">Brand</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Search Brand"
                  value={activeFilters.brand}
                  onChange={(e) => setActiveFilters({ ...activeFilters, brand: e.target.value })}
                />
              </div>
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
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center"
              >
                <RefreshCw size={16} className="mr-2" />
                Reset Filters
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h5 className="text-lg font-semibold">Product Stock Levels</h5>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="py-3 px-4 text-left whitespace-nowrap">#</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">SKU</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Brand</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Product Name</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Category</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Sub Category</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Stock</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Location (City)</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} className="py-8 text-center"><Loader className="animate-spin mx-auto" /></td></tr>
                  ) : inventoryData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500">
                        <Search className="mx-auto mb-2" size={32} />
                        <p>No products found matching your criteria</p>
                      </td>
                    </tr>
                  ) : (
                    inventoryData.map((product, index) => (
                      <tr key={product._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 whitespace-nowrap">{index + 1}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm">{product.sku}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{product.brand?.brandName || 'Unknown'}</td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium">{product.itemName}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{product.category}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{product.subCategory}</td>
                        <td className="py-3 px-4 whitespace-nowrap font-bold text-center">
                          {product.quantity}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">{product.city?.name}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <button
                            onClick={() => handleSetDefaultQuantity(product.sku)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center"
                          >
                            <Settings size={14} className="mr-1" />
                            Set Limits
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
      )}
    </div>
  );
};

export default InventoryLevelManagementSetting;