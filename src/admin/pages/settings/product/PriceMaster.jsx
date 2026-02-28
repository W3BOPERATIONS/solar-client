import React, { useState, useEffect } from 'react';
import { Search, X, CheckCircle, AlertCircle, Loader2, Save, Pencil, Trash2 } from 'lucide-react';
import { productApi } from '../../../../api/productApi';
import { masterApi } from '../../../../api/masterApi';
import {
  getCategories,
  getSubCategories,
  getProjectTypes,
  getSubProjectTypes,
  getBrands
} from '../../../../services/settings/orderProcurementSettingApi';

const PriceMaster = () => {
  // UI Data State
  const [states, setStates] = useState([]);
  const [activeStateId, setActiveStateId] = useState(null);
  
  const [clusters, setClusters] = useState([]);
  const [activeClusterId, setActiveClusterId] = useState(null);

  // Dropdown Master Data
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]); // Sub Types depend on Project Types or mapped directly?
  const [subProjectTypes, setSubProjectTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [technologies, setTechnologies] = useState([]);

  // Filter State
  const [filters, setFilters] = useState({
    category: '',
    subCategory: '',
    subProjectType: '',
    product: '',
    brand: ''
  });
  
  const [appliedFilters, setAppliedFilters] = useState({
    category: '',
    subCategory: '',
    subProjectType: '',
    product: '',
    brand: ''
  });

  // Price Data
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [priceToEdit, setPriceToEdit] = useState(null);
  const [formData, setFormData] = useState({
    productId: '',
    technology: '',
    basePrice: '',
    tax: '',
    discount: '',
    finalPrice: '',
    status: true
  });

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // Initial Boot
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [
        stateRes, catRes, subCatRes, subPTypeRes, brandRes, prodRes, skuRes
      ] = await Promise.all([
        masterApi.getStates(),
        getCategories(),
        getSubCategories(), // all sub categories
        getSubProjectTypes(), // all sub project types
        getBrands(),
        productApi.getAll(),
        productApi.getSkus()
      ]);

      const fetchedStates = stateRes?.data || stateRes || [];
      setStates(fetchedStates);
      
      if (fetchedStates.length > 0) {
        const firstStateId = fetchedStates[0]._id;
        setActiveStateId(firstStateId);
        fetchClusters(firstStateId); // Auto load clusters for first state
      }

      setCategories(catRes?.data || []);
      
      const uniqueSubCats = Array.from(new Map((subCatRes?.data || []).map(item => [item.name, item])).values());
      const uniqueSubPTypes = Array.from(new Map((subPTypeRes?.data || []).map(item => [item.name, item])).values());
      
      setSubCategories(uniqueSubCats);
      setSubProjectTypes(uniqueSubPTypes);
      setBrands(Array.isArray(brandRes) ? brandRes : brandRes?.data || []);
      setAllProducts(prodRes?.data?.data || prodRes?.data || []);
      
      const skus = skuRes?.data?.data || skuRes?.data || [];
      const uniqueTechs = [...new Set(skus.map(s => s.technology).filter(Boolean))];
      setTechnologies(uniqueTechs);
      
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch initial masters", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchClusters = async (stateId) => {
    try {
      if(!stateId) return;
      const res = await masterApi.getClusters({ stateId });
      const fetchedClusters = res?.data || res || [];
      setClusters(fetchedClusters);
      if (fetchedClusters.length > 0) {
        setActiveClusterId(fetchedClusters[0]._id);
      } else {
        setActiveClusterId(null);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch clusters", "error");
    }
  };

  // When State Changes, fetch new clusters
  useEffect(() => {
    if (activeStateId) fetchClusters(activeStateId);
  }, [activeStateId]);

  // When Active State & Cluster is ready, fetch prices for this geofence
  useEffect(() => {
    if (activeStateId && activeClusterId) {
      fetchPrices(activeStateId, activeClusterId);
    } else {
      setPrices([]);
    }
  }, [activeStateId, activeClusterId]);

  const fetchPrices = async (stateId, clusterId) => {
    try {
      setLoading(true);
      const res = await productApi.getPriceMasters({ stateId, clusterId });
      if (res.data.success) {
        setPrices(res.data.data);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch prices for this region", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter computation
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  // Determine the display list of products based on applied filters
  const filteredProducts = allProducts.filter(p => {
    let match = true;
    if (appliedFilters.category && p.categoryId?._id !== appliedFilters.category && p.categoryId !== appliedFilters.category) match = false;
    if (appliedFilters.subCategory && p.subCategoryId?._id !== appliedFilters.subCategory && p.subCategoryId !== appliedFilters.subCategory) match = false;
    if (appliedFilters.subProjectType && p.subProjectTypeId?._id !== appliedFilters.subProjectType && p.subProjectTypeId !== appliedFilters.subProjectType) match = false;
    if (appliedFilters.brand && p.brandId?._id !== appliedFilters.brand && p.brandId !== appliedFilters.brand) match = false;
    if (appliedFilters.product && p._id !== appliedFilters.product) match = false;
    
    return match;
  });

  // Summary Metrics
  const totalSkus = filteredProducts.length;
  const skusWithPriceCount = filteredProducts.filter(p => prices.some(price => price.productId?._id === p._id || price.productId === p._id)).length;
  const skusWithoutPriceCount = totalSkus - skusWithPriceCount;

  // Calculation Logic for Modal
  useEffect(() => {
    const base = parseFloat(formData.basePrice) || 0;
    const tax = parseFloat(formData.tax) || 0;
    const discount = parseFloat(formData.discount) || 0;

    const priceWithTax = base + (base * (tax / 100));
    const final = priceWithTax - discount;

    setFormData(prev => ({ ...prev, finalPrice: final.toFixed(2) }));
  }, [formData.basePrice, formData.tax, formData.discount]);

  const handleOpenSetPrice = (product) => {
    // Check if price already exists for this state/cluster
    const existingPrice = prices.find(p => p.productId?._id === product._id || p.productId === product._id);
    
    if (existingPrice) {
      setPriceToEdit(existingPrice);
      setFormData({
        productId: product._id,
        technology: existingPrice.technology || '',
        basePrice: existingPrice.basePrice,
        tax: existingPrice.tax,
        discount: existingPrice.discount,
        finalPrice: existingPrice.finalPrice,
        status: existingPrice.status
      });
    } else {
      setPriceToEdit(null);
      setFormData({ productId: product._id, technology: '', basePrice: '', tax: '', discount: '', finalPrice: '', status: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmitPrice = async () => {
    if (!formData.productId || !formData.basePrice || !activeStateId || !activeClusterId) {
      showToast("Product, Base Price, State, and Cluster are required", "error");
      return;
    }

    const payload = {
      ...formData,
      stateId: activeStateId,
      clusterId: activeClusterId
    };

    try {
      if (priceToEdit) {
        await productApi.updatePriceMaster(priceToEdit._id, payload);
        showToast("Price Updated Successfully");
      } else {
        await productApi.createPriceMaster(payload);
        showToast("Price Set Successfully");
      }
      setIsModalOpen(false);
      fetchPrices(activeStateId, activeClusterId);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save price', 'error');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`p-4 rounded-lg shadow-lg flex items-center gap-2 text-white ${t.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {t.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {t.message}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-600">Price Master</h2>
      </div>

      {/* States Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {states.map(state => (
          <button
            key={state._id}
            onClick={() => setActiveStateId(state._id)}
            className={`p-4 border border-[#42A5F5] text-center rounded shadow-sm hover:shadow-md transition-all ${
              activeStateId === state._id ? 'bg-[#1976D2] text-white' : 'bg-white text-gray-700'
            }`}
          >
            <div className="text-sm font-semibold">{state.name.toUpperCase()}</div>
            <div className={`text-xs mt-1 ${activeStateId === state._id ? 'text-blue-100' : 'text-gray-500'}`}>
              {state.code || state.name.substring(0, 2).toUpperCase()}
            </div>
          </button>
        ))}
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-4">Select Cluster</h3>
      
      {/* Clusters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {clusters.length === 0 ? (
          <div className="col-span-full text-gray-400 p-4 border rounded bg-white text-center">No clusters available for this state</div>
        ) : (
          clusters.map(cluster => (
            <button
              key={cluster._id}
              onClick={() => setActiveClusterId(cluster._id)}
              className={`p-3 text-center rounded shadow-sm hover:shadow-md transition-all ${
                activeClusterId === cluster._id ? 'bg-[#7E57C2] text-white' : 'bg-gray-100 text-gray-700 border'
              }`}
            >
              <div className="text-sm">{cluster.name}</div>
            </button>
          ))
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            <select className="w-full border rounded p-2 text-sm" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sub Category</label>
            <select className="w-full border rounded p-2 text-sm" value={filters.subCategory} onChange={e => setFilters({...filters, subCategory: e.target.value})}>
              <option value="">All Sub Categories</option>
              {subCategories.map(sc => <option key={sc._id} value={sc.name}>{sc.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sub Project Type</label>
            <select className="w-full border rounded p-2 text-sm" value={filters.subProjectType} onChange={e => setFilters({...filters, subProjectType: e.target.value})}>
              <option value="">All Sub Types</option>
              {subProjectTypes.map(spt => <option key={spt._id} value={spt.name}>{spt.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Product</label>
            <select className="w-full border rounded p-2 text-sm" value={filters.product} onChange={e => setFilters({...filters, product: e.target.value})}>
              <option value="">All Products</option>
              {allProducts.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Brand</label>
            <div className="flex gap-2">
              <select className="w-full border rounded p-2 text-sm" value={filters.brand} onChange={e => setFilters({...filters, brand: e.target.value})}>
                <option value="">All Brands</option>
                {brands.map(b => <option key={b._id} value={b.name}>{b.name || b.companyName}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleApplyFilters} className="bg-[#1976D2] hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-medium flex items-center gap-2">
            <Search size={16} /> Apply Filters
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-blue-500">
          <h4 className="text-gray-800 font-semibold mb-2">Total SKUs</h4>
          <div className="text-2xl font-bold text-blue-600">{totalSkus}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-indigo-500">
          <h4 className="text-gray-800 font-semibold mb-2">SKUs With Price</h4>
          <div className="text-2xl font-bold text-indigo-600">{skusWithPriceCount}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-red-500">
          <h4 className="text-gray-800 font-semibold mb-2">SKUs Without Price</h4>
          <div className="text-2xl font-bold text-red-600">{skusWithoutPriceCount}</div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8 border">
        <div className="bg-[#1976D2] p-4 text-white font-bold flex justify-between items-center">
          <span>Products</span>
        </div>
        
        {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#90CAF9] text-gray-800 border-b">
                <tr>
                  <th className="p-3 font-semibold">Brand</th>
                  <th className="p-3 font-semibold">Product Name</th>
                  <th className="p-3 font-semibold">Sub Category</th>
                  <th className="p-3 font-semibold">Project Category</th>
                  <th className="p-3 font-semibold">Sub Project Type</th>
                  <th className="p-3 font-semibold">Technology</th>
                  <th className="p-3 font-semibold">Final Price</th>
                  <th className="p-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-500">No products found matching filters</td></tr>
                ) : (
                  filteredProducts.map(p => {
                    // Check if price exists
                    const existingPrice = prices.find(price => price.productId?._id === p._id || price.productId === p._id);
                    
                    return (
                      <tr key={p._id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{p.brandId?.name || p.brandId?.companyName || '-'}</td>
                        <td className="p-3 font-medium text-blue-800">{p.name}</td>
                        <td className="p-3">{p.subCategoryId?.name || '-'}</td>
                        <td className="p-3">{p.categoryId?.name || '-'}</td>
                        <td className="p-3">{p.subProjectTypeId?.name || '-'}</td>
                        <td className="p-3">{existingPrice?.technology || p.technology || '-'}</td>
                        <td className="p-3 font-bold text-green-600">
                          {existingPrice ? `₹${existingPrice.finalPrice}` : '-'}
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => handleOpenSetPrice(p)} 
                            className={`px-3 py-1 rounded text-xs font-bold ${existingPrice ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300' : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'}`}
                          >
                            {existingPrice ? 'Edit Price' : 'Set Price'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Set Price Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h3 className="text-xl font-bold text-gray-800">Set Price</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Product *</label>
                  <select className="w-full border rounded p-2.5 bg-gray-50"
                    value={formData.productId}
                    disabled // Locked to the selected product from table row
                  >
                    <option value={formData.productId}>
                      {allProducts.find(p => p._id === formData.productId)?.name || 'Unknown Product'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Technology</label>
                  <select className="w-full border rounded p-2.5"
                    value={formData.technology}
                    onChange={e => setFormData({ ...formData, technology: e.target.value })}
                  >
                    <option value="">Select Technology</option>
                    {technologies.map((tech, i) => (
                      <option key={i} value={tech}>{tech}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Base Price *</label>
                  <input type="number" className="w-full border rounded p-2.5" placeholder="0.00"
                    value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tax (%)</label>
                  <input type="number" className="w-full border rounded p-2.5" placeholder="0"
                    value={formData.tax} onChange={e => setFormData({ ...formData, tax: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Discount (Amount)</label>
                  <input type="number" className="w-full border rounded p-2.5" placeholder="0.00"
                    value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Final Price (Calculated)</label>
                  <input type="number" className="w-full border border-gray-200 rounded p-2.5 bg-gray-100 font-bold text-lg text-blue-700"
                    value={formData.finalPrice} readOnly />
                </div>
              </div>
            </div>

            <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 border rounded hover:bg-gray-100 font-medium">Cancel</button>
              <button onClick={handleSubmitPrice} className="px-6 py-2 bg-[#2E5BFF] text-white rounded hover:bg-blue-700 font-bold">Save Price</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PriceMaster;