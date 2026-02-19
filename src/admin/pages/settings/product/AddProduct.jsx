import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Save,
  Pencil,
  X,
  Loader2,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { productApi } from '../../../../api/productApi';
import { masterApi } from '../../../../api/masterApi';
import axiosInstance from '../../../../api/axios';

const AddProduct = () => {
  const [view, setView] = useState('list'); // list, create, edit
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);

  // Master Data
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [skus, setSkus] = useState([]);

  // Location Data
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    unitId: '',
    skuId: '',
    stateId: '',
    cityId: '',
    districtId: '',
    description: '',
    status: true
  });
  const [editingId, setEditingId] = useState(null);

  // Initial Fetch
  useEffect(() => {
    fetchProducts();
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    try {
      const [catRes, unitRes, skuRes, stateRes] = await Promise.all([
        productApi.getCategories(),
        productApi.getUnits(),
        productApi.getSkus(),
        axiosInstance.get('/locations/states')
      ]);
      if (catRes.data.success) setCategories(catRes.data.data);
      if (unitRes.data.success) setUnits(unitRes.data.data);
      if (skuRes.data.success) setSkus(skuRes.data.data);
      if (stateRes.data.success) setStates(stateRes.data.data);
    } catch (error) {
      console.error("Error fetching masters", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productApi.getAll();
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async (stateId) => {
    try {
      const res = await axiosInstance.get(`/locations/cities?stateId=${stateId}`);
      if (res.data.success) setCities(res.data.data);
    } catch (error) { console.error(error); }
  };

  const fetchDistricts = async (cityId) => {
    try {
      const res = await axiosInstance.get(`/locations/districts?cityId=${cityId}`);
      if (res.data.success) setDistricts(res.data.data);
    } catch (error) { console.error(error); }
  };

  // Handlers
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const handleStateChange = (e) => {
    const stateId = e.target.value;
    setFormData({ ...formData, stateId, cityId: '', districtId: '' });
    setCities([]);
    setDistricts([]);
    if (stateId) fetchCities(stateId);
  };

  const handleCityChange = (e) => {
    const cityId = e.target.value;
    setFormData({ ...formData, cityId, districtId: '' });
    setDistricts([]);
    if (cityId) fetchDistricts(cityId);
  };

  const handleCreateNew = () => {
    setFormData({
      name: '', categoryId: '', unitId: '', skuId: '',
      stateId: '', cityId: '', districtId: '', description: '', status: true
    });
    setEditingId(null);
    setView('create');
  };

  const handleEdit = async (product) => {
    setEditingId(product._id);

    // Build initial form data
    const initialData = {
      name: product.name,
      categoryId: product.categoryId?._id,
      unitId: product.unitId?._id,
      skuId: product.skuId?._id,
      stateId: product.stateId?._id,
      cityId: product.cityId?._id,
      districtId: product.districtId?._id,
      description: product.description,
      status: product.status
    };

    setFormData(initialData);
    setView('edit'); // Switch view first

    // Fetch dependent locations
    if (initialData.stateId) {
      await fetchCities(initialData.stateId);
    }
    if (initialData.cityId) {
      await fetchDistricts(initialData.cityId);
    }
  };

  const handleSubmit = async () => {
    // Validate
    const required = ['name', 'categoryId', 'unitId', 'skuId', 'stateId', 'cityId', 'districtId'];
    const missing = required.filter(k => !formData[k]);
    if (missing.length > 0) {
      showToast(`Missing fields: ${missing.join(', ')}`, 'error');
      return;
    }

    try {
      if (editingId) {
        await productApi.update(editingId, formData);
        showToast('Product Updated');
      } else {
        await productApi.create(formData);
        showToast('Product Created');
      }
      setView('list');
      fetchProducts();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete product?')) {
      try {
        await productApi.delete(id);
        showToast('Deleted');
        fetchProducts();
      } catch (error) {
        showToast('Failed to delete', 'error');
      }
    }
  };


  const filteredList = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- Create/Edit View ---
  if (view === 'create' || view === 'edit') {
    return (
      <div className="container mx-auto p-4 bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-xl font-bold text-gray-800">{view === 'create' ? 'Create Product' : 'Edit Product'}</h3>
          <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700"><X /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Basic Info */}
          <div className="col-span-full">
            <h5 className="font-semibold text-blue-600 mb-3 block border-b pb-1">Basic Details</h5>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Product Name *</label>
            <input type="text" className="w-full border rounded p-2"
              value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">SKU (Stock Keeping Unit) *</label>
            <select className="w-full border rounded p-2"
              value={formData.skuId} onChange={e => setFormData({ ...formData, skuId: e.target.value })}>
              <option value="">Select SKU</option>
              {skus.map(s => <option key={s._id} value={s._id}>{s.skuCode} - {s.description}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select className="w-full border rounded p-2"
              value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Unit *</label>
            <select className="w-full border rounded p-2"
              value={formData.unitId} onChange={e => setFormData({ ...formData, unitId: e.target.value })}>
              <option value="">Select Unit</option>
              {units.map(u => <option key={u._id} value={u._id}>{u.unitName} ({u.symbol})</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="col-span-full">
            <h5 className="font-semibold text-green-600 mb-3 block border-b pb-1">Location Details (Mandatory)</h5>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">State *</label>
            <select className="w-full border rounded p-2"
              value={formData.stateId} onChange={handleStateChange}>
              <option value="">Select State</option>
              {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">City *</label>
            <select className="w-full border rounded p-2"
              value={formData.cityId} onChange={handleCityChange} disabled={!formData.stateId}>
              <option value="">Select City</option>
              {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">District *</label>
            <select className="w-full border rounded p-2"
              value={formData.districtId} onChange={e => setFormData({ ...formData, districtId: e.target.value })} disabled={!formData.cityId}>
              <option value="">Select District</option>
              {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea className="w-full border rounded p-2" rows="3"
            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={() => setView('list')} className="px-5 py-2 border rounded hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">Save Product</button>
        </div>
      </div>
    );
  }

  // --- List View ---
  return (
    <div className="container mx-auto p-4">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`p-4 rounded-lg shadow-lg flex items-center gap-2 text-white ${t.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {t.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {t.message}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm mb-6 p-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Product List</h2>
        <button onClick={handleCreateNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={20} /> Create Product
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            className="w-full border rounded-lg pl-10 pr-4 py-2"
            placeholder="Search products..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(p => (
                  <tr key={p._id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 font-mono text-sm">{p.skuId?.skuCode || '-'}</td>
                    <td className="p-3">{p.categoryId?.name || '-'}</td>
                    <td className="p-3">{p.unitId?.symbol || '-'}</td>
                    <td className="p-3 text-sm text-gray-600">
                      {p.cityId?.name}, {p.stateId?.name}
                    </td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleEdit(p)} className="text-blue-500 p-1"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(p._id)} className="text-red-500 p-1"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddProduct;