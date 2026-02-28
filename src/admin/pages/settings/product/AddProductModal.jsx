import React, { useState, useEffect } from 'react';
import { X, Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { productApi } from '../../../../api/productApi';

const AddProductModal = ({ isOpen, onClose, selectedStates, selectedClusters, onSuccess, editingProduct }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingMasters, setFetchingMasters] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Master Data States
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [subProjectTypes, setSubProjectTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [skus, setSkus] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    subCategoryId: '',
    projectTypeId: '',
    subProjectTypeId: '',
    brandId: '',
    skuId: '',
    serialNo: '',
    subtype: 'On-Grid',
    technology: 'Mono-Perc',
    tolerance: '+/- 3%',
    dcr: 'DCR',
    datasheet: '',
    description: '',
    status: true
  });

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        setFormData({
          name: editingProduct.name || '',
          categoryId: editingProduct.categoryId?._id || editingProduct.categoryId || '',
          subCategoryId: editingProduct.subCategoryId?._id || editingProduct.subCategoryId || '',
          projectTypeId: editingProduct.projectTypeId?._id || editingProduct.projectTypeId || '',
          subProjectTypeId: editingProduct.subProjectTypeId?._id || editingProduct.subProjectTypeId || '',
          brandId: editingProduct.brandId?._id || editingProduct.brandId || '',
          serialNo: editingProduct.serialNo || '',
          subtype: editingProduct.subtype || 'On-Grid',
          technology: editingProduct.technology || 'Mono-Perc',
          tolerance: editingProduct.tolerance || '+/- 3%',
          dcr: editingProduct.dcr || 'DCR',
          datasheet: editingProduct.datasheet || '',
          description: editingProduct.description || '',
          skuId: editingProduct.skuId?._id || editingProduct.skuId || '',
          status: editingProduct.status ?? true
        });
      } else {
        setFormData({
          name: '',
          categoryId: '',
          subCategoryId: '',
          projectTypeId: '',
          subProjectTypeId: '',
          brandId: '',
          serialNo: '',
          subtype: 'On-Grid',
          technology: 'Mono-Perc',
          tolerance: '+/- 3%',
          dcr: 'DCR',
          datasheet: '',
          description: '',
          status: true
        });
      }
      fetchMasters();
    }
  }, [isOpen, editingProduct]);

  const fetchMasters = async () => {
    try {
      setFetchingMasters(true);
      const [catRes, subPTypeRes, pTypeRes, brandRes, subCatRes, skusRes] = await Promise.all([
        productApi.getCategories(),
        productApi.getSubProjectTypes(),
        productApi.getProjectTypes(),
        productApi.getBrands(),
        productApi.getSubCategories(),
        productApi.getSkus()
      ]);

      setCategories(catRes?.data?.data || []);
      setSubProjectTypes(subPTypeRes?.data?.data || []);
      setProjectTypes(pTypeRes?.data?.data || []);
      setBrands(Array.isArray(brandRes?.data) ? brandRes.data : brandRes?.data?.data || []);
      setSubCategories(subCatRes?.data?.data || []);
      setSkus(skusRes?.data?.data || []);

    } catch (error) {
      console.error("Error fetching masters for modal:", error);
      showToast("Failed to load master data", "error");
    } finally {
      setFetchingMasters(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId) {
      showToast("Product Name and Category are required", "error");
      return;
    }

    if (selectedStates.length === 0 || selectedClusters.length === 0) {
      showToast("Please select at least one State and Cluster first", "error");
      return;
    }

    try {
      setLoading(true);
      // Construct payload including selected geographic context
      const payload = {
        ...formData,
        stateId: selectedStates[0] || undefined,
        clusterId: selectedClusters[0] || undefined,
      };

      let res;
      if (editingProduct) {
        res = await productApi.update(editingProduct._id, payload);
      } else {
        res = await productApi.create(payload);
      }

      if (res.data.success) {
        showToast("Product created successfully");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to create product", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 font-sans p-4">
      {/* Toasts inside modal */}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`p-4 rounded shadow-lg flex items-center gap-2 text-white animate-fadeIn ${t.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {t.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {t.message}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h2 className="text-blue-600 font-bold text-xl">Add New Product</h2>
          <button onClick={onClose} className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-gray-700">
            Back to List
          </button>
        </div>

        {/* Selected Locations Summary */}
        <div className="p-4 bg-blue-50 border-b">
          <div className="flex flex-col gap-2">
            <div className="flex gap-4 text-sm">
                <span className="font-bold text-gray-700 min-w-[60px]">States:</span>
                <span className="text-gray-600 italic">
                    {selectedStates.length > 0 ? `${selectedStates.length} states selected` : 'No states selected'}
                </span>
            </div>
            <div className="flex gap-4 text-sm">
                <span className="font-bold text-gray-700 min-w-[60px]">Clusters:</span>
                <span className="text-gray-600 italic">
                    {selectedClusters.length > 0 ? `${selectedClusters.length} clusters selected` : 'No clusters selected'}
                </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Brand/Product Type */}
          <div>
            <label className="block text-gray-700 font-bold text-sm mb-1 uppercase tracking-tight">Brand</label>
            <select 
              className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-400 outline-none text-sm"
              value={formData.brandId}
              onChange={(e) => setFormData({...formData, brandId: e.target.value})}
            >
              <option value="">Select Brand</option>
              {Array.from(new Map(brands.map(b => [b.name || b.companyName, b])).values()).map(b => (
                <option key={b._id} value={b._id}>{b.name || b.companyName}</option>
              ))}
            </select>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-gray-700 font-bold text-sm mb-1 uppercase tracking-tight">Product Name</label>
            <input 
              type="text" 
              className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-400 outline-none text-sm"
              placeholder="Enter product name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          {/* Sub Category */}
          <div>
            <label className="block text-gray-700 font-bold text-sm mb-1 uppercase tracking-tight">Sub Category</label>
            <select 
              className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-400 outline-none text-sm"
              value={formData.subCategoryId}
              onChange={(e) => setFormData({...formData, subCategoryId: e.target.value})}
            >
              <option value="">Select Sub Category</option>
              {Array.from(new Map(subCategories.map(c => [c.name, c])).values()).map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Project Category (Project Types) */}
          <div>
            <label className="block text-gray-700 font-bold text-sm mb-1 uppercase tracking-tight">Project Category</label>
            <select 
              className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-400 outline-none text-sm"
              value={formData.categoryId}
              onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
            >
              <option value="">Select Project Category</option>
              {Array.from(new Map(categories.map(c => [c.name, c])).values()).map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Project Type */}
             <div>
                <label className="block text-gray-700 font-bold text-sm mb-1 uppercase tracking-tight">Project Type</label>
                <select 
                  className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-400 outline-none text-sm"
                  value={formData.projectTypeId}
                  onChange={(e) => setFormData({...formData, projectTypeId: e.target.value})}
                >
                  <option value="">Select Project Type</option>
                  {Array.from(new Map(projectTypes.map(p => [p.name, p])).values()).map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Sub Project Type */}
              <div>
                <label className="block text-gray-700 font-bold text-sm mb-1 uppercase tracking-tight">Sub Project Type</label>
                <select 
                  className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-400 outline-none text-sm"
                  value={formData.subProjectTypeId}
                  onChange={(e) => setFormData({...formData, subProjectTypeId: e.target.value})}
                >
                  <option value="">Select Sub Project Type</option>
                  {Array.from(new Map(subProjectTypes.map(p => [p.name, p])).values()).map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Serial No */}
              <div>
                <label className="block text-gray-700 font-bold text-sm mb-1 uppercase tracking-tight">Product Serial No</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-400 outline-none text-sm"
                  placeholder="Enter serial number"
                  value={formData.serialNo}
                  onChange={(e) => setFormData({...formData, serialNo: e.target.value})}
                />
              </div>

              {/* Product Subtype */}
              <div>
                <label className="block text-gray-700 font-bold text-sm mb-1 uppercase tracking-tight">Product Subtype</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-400 outline-none text-sm"
                  placeholder="e.g. On-Grid"
                  value={formData.subtype}
                  onChange={(e) => setFormData({...formData, subtype: e.target.value})}
                />
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Technology */}
              <div>
                <label className="block text-gray-700 font-bold text-sm mb-1 uppercase tracking-tight">Technology</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-400 outline-none text-sm"
                  placeholder="e.g. Mono-Perc"
                  value={formData.technology}
                  onChange={(e) => setFormData({...formData, technology: e.target.value})}
                />
              </div>

              {/* Tolerance */}
              <div>
                <label className="block text-gray-700 font-bold text-sm mb-1 uppercase tracking-tight">Tolerance</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-400 outline-none text-sm"
                  placeholder="e.g. +/- 3%"
                  value={formData.tolerance}
                  onChange={(e) => setFormData({...formData, tolerance: e.target.value})}
                />
              </div>

              {/* DCR */}
              <div>
                <label className="block text-gray-700 font-bold text-sm mb-1 uppercase tracking-tight">DCR</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-400 outline-none text-sm"
                  placeholder="e.g. DCR"
                  value={formData.dcr}
                  onChange={(e) => setFormData({...formData, dcr: e.target.value})}
                />
              </div>
          </div>

          {/* SKU Selection */}
          <div>
            <label className="block text-gray-700 font-bold text-sm mb-1 uppercase tracking-tight">Select SKU (Optional)</label>
            <select 
              className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-400 outline-none text-sm"
              value={formData.skuId}
              onChange={(e) => setFormData({...formData, skuId: e.target.value})}
            >
              <option value="">Select Created SKU</option>
              {skus.map(s => <option key={s._id} value={s._id}>{s.skuCode} {s.skuName ? `- ${s.skuName}` : ''}</option>)}
            </select>
          </div>

          {/* Datasheet Upload */}
          <div>
            <label className="block text-gray-700 font-bold text-sm mb-1 uppercase tracking-tight">Upload Datasheet</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors cursor-pointer group">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Choose File</span>
                    <input type="file" className="sr-only" />
                  </label>
                  <p className="pl-1">No file chosen</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t mt-6">
            <button 
              type="button"
              onClick={onClose} 
              className="px-6 py-2 bg-gray-600 text-white rounded font-bold text-sm hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded font-bold text-sm hover:bg-blue-700 transition flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : null}
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
