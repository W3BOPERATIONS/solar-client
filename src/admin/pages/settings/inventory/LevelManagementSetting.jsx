// InventoryLevelManagementSetting.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Eye, EyeOff, Filter, RefreshCw, Settings, Search, X, Loader } from 'lucide-react';
import { locationAPI } from '../../../../api/api';
import inventoryApi from '../../../../services/inventory/inventoryApi';
import { productApi } from '../../../../api/productApi';
import toast from 'react-hot-toast';

const InventoryLevelManagementSetting = () => {
  // --- State Management ---
  const [selectedState, setSelectedState] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('');

  const [states, setStates] = useState([]);
  const [clusters, setClusters] = useState([]);

  // Dynamic Master API States
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [dynamicSubCategories, setDynamicSubCategories] = useState([]);
  const [dynamicProjectTypes, setDynamicProjectTypes] = useState([]);
  const [dynamicSubProjectTypes, setDynamicSubProjectTypes] = useState([]);

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
    loadFiltersData();
  }, []);

  const loadBrands = async () => {
    try {
      const res = await inventoryApi.getBrands();
      setBrands(res.data || []);
    } catch (error) {
      console.error("Failed to load brands", error);
    }
  };

  const loadFiltersData = async () => {
    try {
      const [catRes, subCatRes, pTypeRes, subPTypeRes] = await Promise.all([
        productApi.getCategories(),
        productApi.getSubCategories(),
        productApi.getProjectTypes(),
        productApi.getSubProjectTypes()
      ]);
      setDynamicCategories(catRes.data?.data || []);
      setDynamicSubCategories(subCatRes.data?.data || []);
      setDynamicProjectTypes(pTypeRes.data?.data || []);
      setDynamicSubProjectTypes(subPTypeRes.data?.data || []);
    } catch (error) {
      console.error("Failed to load master filter data:", error);
    }
  };

  // Fetch Inventory when filters changed
  useEffect(() => {
    if (selectedCluster) {
      fetchInventory();
    } else {
      setInventoryData([]);
    }
  }, [selectedCluster, activeFilters]);


  const loadStates = async () => {
    try {
      const response = await locationAPI.getAllStates({ isActive: true });
      setStates(response.data.data || []);
    } catch (error) {
      console.error("Failed to load states", error);
    }
  };

  const loadClusters = async (stateId) => {
    try {
      const response = await locationAPI.getAllClusters({ stateId: stateId, isActive: true });
      setClusters(response.data.data || []);
    } catch (error) {
      console.error("Failed to load clusters", error);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {
        state: selectedState,
        cluster: selectedCluster,
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
      setClusters([]);
    } else {
      setSelectedState(stateId);
      loadClusters(stateId);
    }
    setSelectedCluster('');
  };

  const handleClusterSelect = (clusterId) => {
    setSelectedCluster(prev => prev === clusterId ? '' : clusterId);
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
      cluster: product.cluster?._id || product.cluster || ''
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

  // --- Render Clusters ---
  const renderClusters = () => {
    if (!selectedState) return null;

    return (
      <div className="mt-8">
        <h5 className="text-lg font-bold text-gray-800 mb-4">Select Clusters</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {clusters.map(cluster => (
            <div
              key={cluster._id}
              className={`cursor-pointer border border-gray-300 rounded p-4 text-center transition-all ${selectedCluster === cluster._id
                ? 'bg-[#17a2b8] text-white border-[#17a2b8]'
                : 'bg-white text-gray-800 hover:border-gray-400'
                }`}
              onClick={() => handleClusterSelect(cluster._id)}
            >
              <div className="font-bold text-sm tracking-wide">{cluster.name}</div>
            </div>
          ))}
          {clusters.length === 0 && <div className="col-span-4 text-gray-500">No clusters found for this state.</div>}
        </div>
      </div>
    );
  };

  // --- Component ---
  return (
    <div className="container mx-auto px-4 py-6 bg-[#f4f6fa] min-h-screen">
      {/* Title with Toggle Button */}
      <div className="bg-white rounded border border-gray-200 mb-6 flex justify-between items-center pr-6 overflow-hidden">
        <h4 className="text-[#206bc4] text-xl font-bold py-4 px-6 border-l-4 border-l-blue-500">Inventory Level Management Setting</h4>
        <div className="flex items-center">
          <div className="flex overflow-hidden">
            <button
              onClick={() => setShowSelectionPanel(true)}
              className={`px-4 py-2 flex items-center text-sm font-semibold rounded-l border border-r-0 ${showSelectionPanel
                ? 'bg-[#206bc4] text-white border-[#206bc4]'
                : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                }`}
            >
              <Eye size={16} className="mr-2" />
              Show
            </button>
            <button
              onClick={() => setShowSelectionPanel(false)}
              className={`px-4 py-2 flex items-center text-sm font-semibold rounded-r border ${!showSelectionPanel
                ? 'bg-[#206bc4] text-white border-[#206bc4]'
                : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                }`}
            >
              <EyeOff size={16} className="mr-2" />
              Hide
            </button>
          </div>
        </div>
      </div>

      {/* Selection Panel */}
      {showSelectionPanel && (
        <div className="mb-6">
          {/* State Selection */}
          <div className="mb-6">
            <h5 className="text-lg font-bold text-gray-800 mb-4">Select States</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {states.map(state => (
                <div
                  key={state._id}
                  className={`cursor-pointer border border-gray-300 rounded p-4 text-center transition-all ${selectedState === state._id
                    ? 'bg-[#1d64b2] text-white border-[#1d64b2]'
                    : 'bg-white text-gray-800 hover:border-gray-400'
                    }`}
                  onClick={() => handleStateSelect(state._id)}
                >
                  <div className="font-bold text-sm tracking-wide">{state.name}</div>
                  {state.code && <div className={`text-xs mt-1 ${selectedState === state._id ? 'text-gray-200' : 'text-gray-500'}`}>{state.code}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Clusters Section */}
          {renderClusters()}
        </div>
      )}

      {/* Inventory Table */}
      {selectedCluster && (
        <div className="mt-8">
          {/* FILTER SECTION */}
          <div className="bg-white rounded border border-gray-200 mb-6 p-6">
            <h5 className="text-[#206bc4] text-lg font-bold mb-4">Filter Options</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Brand</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
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
                <label className="block text-sm text-gray-700 mb-1">Category</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  value={activeFilters.category}
                  onChange={(e) => setActiveFilters({ ...activeFilters, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {dynamicCategories.map(c => (
                    <option key={c._id} value={c._id}>{c.name || c.categoryName || c._id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Sub Category</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  value={activeFilters.subCategory}
                  onChange={(e) => setActiveFilters({ ...activeFilters, subCategory: e.target.value })}
                >
                  <option value="">Sub Category</option>
                  {dynamicSubCategories.map(sc => (
                    <option key={sc._id} value={sc._id}>{sc.name || sc.subCategoryName || sc._id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Project Type (kW)</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  value={activeFilters.projectType}
                  onChange={(e) => setActiveFilters({ ...activeFilters, projectType: e.target.value })}
                >
                  <option value="">Select Range</option>
                  {dynamicProjectTypes.map(pt => (
                    <option key={pt._id} value={pt._id}>{pt.name || pt.projectTypeName || pt._id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Sub Project Type</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  value={activeFilters.subProjectType}
                  onChange={(e) => setActiveFilters({ ...activeFilters, subProjectType: e.target.value })}
                >
                  <option value="">Sub Project Type</option>
                  {dynamicSubProjectTypes.map(spt => (
                    <option key={spt._id} value={spt._id}>{spt.name || spt.subProjectTypeName || spt._id}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2 mt-4 items-center">
              <button
                className="px-4 py-2 bg-[#206bc4] text-white rounded text-sm font-semibold flex items-center mr-4"
              >
                <Filter size={14} className="mr-2" />
                Apply Filters
              </button>
              <button
                onClick={handleResetFilters}
                className="text-gray-500 hover:text-gray-700 text-sm font-semibold flex items-center"
              >
                <RefreshCw size={14} className="mr-1" />
                Reset Filters
              </button>
            </div>
          </div>

          {/* Product Inventory Table */}
          <div className="bg-white rounded border border-gray-200">
            <div className="p-4 bg-gray-50 border-b">
              <h5 className="text-lg font-bold text-[#1a237e]">Product Inventory</h5>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#343a40] text-white text-sm">
                  <tr>
                    <th className="py-3 px-4 text-left whitespace-nowrap font-medium">#</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap font-medium">Serial No</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap font-medium">Brand</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap font-medium">Product</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap font-medium">Product Name</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap font-medium">Sub Category</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap font-medium">Project Category</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap font-medium">Project Type</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap font-medium">Sub Project Type</th>
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
                      <tr key={product._id} className="border-b hover:bg-gray-50 text-sm text-gray-800">
                        <td className="py-3 px-4 whitespace-nowrap font-medium">{index + 1}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{product.sku || 'N/A'}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{product.brand?.brandName || 'N/A'}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{product.category || 'N/A'}</td>
                        <td className="py-3 px-4 whitespace-nowrap font-semibold">{product.itemName || 'N/A'}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{product.subCategory || 'N/A'}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{product.projectCategory || 'N/A'}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{product.projectType || 'N/A'}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{product.subProjectType || 'N/A'}</td>
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