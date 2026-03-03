import React, { useState, useEffect } from 'react';
import { X, Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { productApi } from '../../../../api/productApi';

const AddProductModal = ({ isOpen, onClose, selectedStates, selectedClusters, states, clusters, onSuccess, editingProduct }) => {
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

  const selectedStatesNames = selectedStates.map(id => states?.find(s => s._id === id)?.name).filter(Boolean).join(', ') || 'None';
  const selectedClustersNames = selectedClusters.map(id => clusters?.find(c => c._id === id)?.name).filter(Boolean).join(', ') || 'None';

  if (!isOpen) return null;

  return (
    <div className="w-full bg-white rounded shadow-sm border border-gray-200 mt-2 font-sans mb-6">
      {/* Toasts inside inline component */}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`p-4 rounded shadow-lg flex items-center gap-2 text-white animate-fadeIn ${t.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {t.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {t.message}
          </div>
        ))}
      </div>

      <div className="w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-blue-600 font-bold text-lg">Add New Product</h2>
          <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-gray-600 transition shadow-sm">
            Back to List
          </button>
        </div>

        {/* Selected Locations Summary */}
        <div className="p-4 bg-[#ebf3fc] rounded mb-6 text-sm">
          <div className="font-bold text-[#003366] mb-1">Selected Locations</div>
          <div className="flex flex-col xl:flex-row xl:gap-24">
            <div className="truncate"><span className="font-bold text-gray-800">States:</span> <span className="text-gray-600">{selectedStatesNames}</span></div>
            <div className="truncate"><span className="font-bold text-gray-800">Clusters:</span> <span className="text-gray-600">{selectedClustersNames}</span></div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Brand/Product Type */}
          <div>
            <label className="block text-gray-500 text-xs mb-1">Product Type</label>
            <select
              className="w-full border border-gray-200 rounded p-2.5 outline-none text-sm text-gray-700 bg-white"
              value={formData.brandId}
              onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
            >
              <option value="" className="text-gray-400">Select Product</option>
              {Array.from(new Map(brands.map(b => [b.name || b.companyName, b])).values()).map(b => (
                <option key={b._id} value={b._id}>{b.name || b.companyName}</option>
              ))}
            </select>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-gray-500 text-xs mb-1">Product Name</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded p-2.5 outline-none text-sm text-gray-700 bg-white"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Sub Category */}
          <div>
            <label className="block text-gray-500 text-xs mb-1">Sub Category</label>
            <select
              className="w-full border border-gray-200 rounded p-2.5 outline-none text-sm text-gray-700 bg-white"
              value={formData.subCategoryId}
              onChange={(e) => setFormData({ ...formData, subCategoryId: e.target.value })}
            >
              <option value="" className="text-gray-400">Select Sub Category</option>
              {Array.from(new Map(subCategories.map(c => [c.name, c])).values()).map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Project Category */}
          <div>
            <label className="block text-gray-500 text-xs mb-1">Project Category</label>
            <select
              className="w-full border border-gray-200 rounded p-2.5 outline-none text-sm text-gray-700 bg-white"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              <option value="" className="text-gray-400">Select Project Category</option>
              {Array.from(new Map(categories.map(c => [c.name, c])).values()).map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Project Type */}
          <div>
            <label className="block text-gray-500 text-xs mb-1">Project Type</label>
            <select
              className="w-full border border-gray-200 rounded p-2.5 outline-none text-sm text-gray-700 bg-white"
              value={formData.projectTypeId}
              onChange={(e) => setFormData({ ...formData, projectTypeId: e.target.value })}
            >
              <option value="" className="text-gray-400">Select Project Type</option>
              {Array.from(new Map(projectTypes.map(p => [p.name, p])).values()).map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Sub Project Type */}
          <div>
            <label className="block text-gray-500 text-xs mb-1">Sub Project Type</label>
            <select
              className="w-full border border-gray-200 rounded p-2.5 outline-none text-sm text-gray-700 bg-white"
              value={formData.subProjectTypeId}
              onChange={(e) => setFormData({ ...formData, subProjectTypeId: e.target.value })}
            >
              <option value="" className="text-gray-400">Select Sub Project Type</option>
              {Array.from(new Map(subProjectTypes.map(p => [p.name, p])).values()).map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Product Serial No */}
          <div>
            <label className="block text-gray-500 text-xs mb-1">Product Serial No</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded p-2.5 outline-none text-sm text-gray-700 bg-white"
              value={formData.serialNo}
              onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
            />
          </div>

          {/* Product Subtype */}
          <div>
            <label className="block text-gray-500 text-xs mb-1">Product Subtype</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded p-2.5 outline-none text-sm text-gray-700 bg-white"
              value={formData.subtype}
              onChange={(e) => setFormData({ ...formData, subtype: e.target.value })}
            />
          </div>

          {/* Upload Datasheet */}
          <div>
            <label className="block text-gray-500 text-xs mb-1">Upload Datasheet</label>
            <div className="flex items-center w-full border border-gray-200 rounded p-1 bg-white">
              <label className="cursor-pointer bg-gray-50 border border-gray-300 rounded px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition mr-3">
                Choose File
                <input type="file" className="sr-only" />
              </label>
              <span className="text-xs text-gray-500">No file chosen</span>
            </div>
          </div>

          {/* Hidden Fields for backwards compatibility */}
          <div className="hidden">
            {/* Technology */}
            <input
              type="text"
              value={formData.technology}
              onChange={(e) => setFormData({ ...formData, technology: e.target.value })}
            />
            {/* Tolerance */}
            <input
              type="text"
              value={formData.tolerance}
              onChange={(e) => setFormData({ ...formData, tolerance: e.target.value })}
            />
            {/* DCR */}
            <input
              type="text"
              value={formData.dcr}
              onChange={(e) => setFormData({ ...formData, dcr: e.target.value })}
            />
            {/* SKU */}
            <select
              value={formData.skuId}
              onChange={(e) => setFormData({ ...formData, skuId: e.target.value })}
            >
              <option value=""></option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-6 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded text-sm font-bold hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#0066cc] text-white rounded text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2"
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
