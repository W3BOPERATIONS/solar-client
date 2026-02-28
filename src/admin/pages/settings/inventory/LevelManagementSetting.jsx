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

  const [brands, setBrands] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [activeFilters, setActiveFilters] = useState({
    brand: '',
    category: '',
    subCategory: '',
    projectType: '',
    subProjectType: '',
    productName: '',
    sku: ''
  });

  // Load Initial Data
  useEffect(() => {
    loadStates();
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const res = await inventoryApi.getBrands();
      setBrands(res.data || []);
    } catch (error) {
      console.error("Failed to load brands", error);
    }
  };

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
      subProjectType: '',
      productName: '',
      sku: ''
    });
  };

  // Extract unique products and SKUs for filter dropdowns from current view data
  const uniqueProducts = useMemo(() => {
    const products = new Set(inventoryData.map(item => item.itemName));
    return Array.from(products).filter(Boolean).sort();
  }, [inventoryData]);

  const uniqueSkus = useMemo(() => {
    const skus = new Set(inventoryData.map(item => item.sku));
    return Array.from(skus).filter(Boolean).sort();
  }, [inventoryData]);

  const handleEditClick = (product) => {
    setEditingId(product._id);
    setEditForm({
      sku: product.sku || '',
      brand: product.brand?._id || '',
      itemName: product.itemName || '',
      category: product.category || '',
      subCategory: product.subCategory || '',
      quantity: product.quantity || 0,
      city: product.city?._id || product.city || ''
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (id) => {
    try {
      setLoading(true);
      await inventoryApi.updateItem(id, editForm);
      toast.success('Item updated successfully');
      setEditingId(null);
      fetchInventory();
    } catch (error) {
      console.error('Failed to update item:', error);
      toast.error('Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
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
              {/* Added Filter: Product Name Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Product</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activeFilters.productName}
                  onChange={(e) => setActiveFilters({ ...activeFilters, productName: e.target.value })}
                >
                  <option value="">Select Product...</option>
                  {uniqueProducts.map((name, idx) => (
                    <option key={idx} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Added Filter: SKU Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">SKU</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activeFilters.sku}
                  onChange={(e) => setActiveFilters({ ...activeFilters, sku: e.target.value })}
                >
                  <option value="">Select SKU...</option>
                  {uniqueSkus.map((skuStr, idx) => (
                    <option key={idx} value={skuStr}>{skuStr}</option>
                  ))}
                </select>
              </div>

              {/* Updated Filter: Brand Dropdown (Replaces text input) */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Brand</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activeFilters.brand}
                  onChange={(e) => setActiveFilters({ ...activeFilters, brand: e.target.value })}
                >
                  <option value="">Select Brand</option>
                  {brands.map(b => (
                    <option key={b._id} value={b._id}>{b.brandName}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Category</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activeFilters.category}
                  onChange={(e) => setActiveFilters({ ...activeFilters, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  <option value="Rooftop">Rooftop Solar</option>
                  <option value="SolarPump">Solar Pump</option>
                  <option value="SolarLight">Solar Light</option>
                  <option value="Inverter">Inverter</option>
                  <option value="Solar Panel">Solar Panel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Sub Category</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activeFilters.subCategory}
                  onChange={(e) => setActiveFilters({ ...activeFilters, subCategory: e.target.value })}
                >
                  <option value="">Sub Category</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Project Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activeFilters.projectType}
                  onChange={(e) => setActiveFilters({ ...activeFilters, projectType: e.target.value })}
                >
                  <option value="">Select Range</option>
                  <option value="1-5">1 kW – 5 kW</option>
                  <option value="6-10">6 kW – 10 kW</option>
                  <option value="10+">Above 10 kW</option>
                </select>
              </div>

              {/* Added Missing Filter: Project Sub Type Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Project Sub Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activeFilters.subProjectType}
                  onChange={(e) => setActiveFilters({ ...activeFilters, subProjectType: e.target.value })}
                >
                  <option value="">Select Sub Type</option>
                  <option value="On Grid">On Grid</option>
                  <option value="Off Grid">Off Grid</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end border-t pt-4">
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
                        {editingId === product._id ? (
                          <>
                            <td className="py-3 px-4"><input type="text" name="sku" value={editForm.sku} onChange={handleEditChange} className="border rounded px-2 py-1 w-full text-sm" /></td>
                            <td className="py-3 px-4">
                              <select name="brand" value={editForm.brand} onChange={handleEditChange} className="border rounded px-2 py-1 w-full text-sm">
                                <option value="">Select Brand</option>
                                {brands.map(b => (
                                  <option key={b._id} value={b._id}>{b.brandName}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4"><input type="text" name="itemName" value={editForm.itemName} onChange={handleEditChange} className="border rounded px-2 py-1 w-full text-sm" /></td>
                            <td className="py-3 px-4">
                              <select name="category" value={editForm.category} onChange={handleEditChange} className="border rounded px-2 py-1 w-full text-sm">
                                <option value="">Category</option>
                                <option value="Rooftop">Rooftop Solar</option>
                                <option value="SolarPump">Solar Pump</option>
                                <option value="SolarLight">Solar Light</option>
                                <option value="Inverter">Inverter</option>
                                <option value="Solar Panel">Solar Panel</option>
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <select name="subCategory" value={editForm.subCategory} onChange={handleEditChange} className="border rounded px-2 py-1 w-full text-sm">
                                <option value="">Sub Category</option>
                                <option value="Residential">Residential</option>
                                <option value="Commercial">Commercial</option>
                              </select>
                            </td>
                            <td className="py-3 px-4"><input type="number" name="quantity" value={editForm.quantity} onChange={handleEditChange} className="border rounded px-2 py-1 w-20 text-center text-sm" /></td>
                            <td className="py-3 px-4">
                              <select name="city" value={editForm.city} onChange={handleEditChange} className="border rounded px-2 py-1 w-full text-sm">
                                <option value="">Select City</option>
                                {cities.map(c => (
                                  <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button onClick={() => handleSave(product._id)} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">Save</button>
                                <button onClick={handleCancelEdit} className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">Cancel</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-4 whitespace-nowrap text-sm">{product.sku}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{product.brand?.brandName || 'Unknown'}</td>
                            <td className="py-3 px-4 whitespace-nowrap font-medium">{product.itemName}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{product.category}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{product.subCategory}</td>
                            <td className="py-3 px-4 whitespace-nowrap font-bold text-center">{product.quantity}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{product.city?.name}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <button
                                onClick={() => handleEditClick(product)}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center"
                              >
                                <Settings size={14} className="mr-1" />
                                Edit
                              </button>
                            </td>
                          </>
                        )}
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