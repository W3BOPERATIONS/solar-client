import React, { useState, useEffect } from 'react';
import { Search, Save, Edit2, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { productApi } from '../../../../api/productApi';
import { masterApi } from '../../../../api/masterApi';
import { getSubCategories, getSubProjectTypes } from '../../../../services/settings/orderProcurementSettingApi';

const AddProjectCategory = () => {
  // Tabs & Geofencing
  const [states, setStates] = useState([]);
  const [activeStateId, setActiveStateId] = useState(null);
  const [clusters, setClusters] = useState([]);

  // Masters for Dropdowns
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subProjectTypes, setSubProjectTypes] = useState([]);
  
  // Data Mappings
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);

  // Form
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    subCategoryId: '',
    projectTypeFrom: '',
    projectTypeTo: '',
    subProjectTypeId: '',
    clusterId: '',
  });

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [stateRes, catRes, subCatRes, subPTypeRes] = await Promise.all([
        masterApi.getStates(),
        productApi.getCategories(),
        getSubCategories(),
        getSubProjectTypes()
      ]);

      const fetchedStates = stateRes?.data || stateRes || [];
      setStates(fetchedStates);
      
      if (fetchedStates.length > 0) {
        setActiveStateId(fetchedStates[0]._id);
      }

      setCategories(catRes?.data?.data || catRes?.data || []);
      
      // Deduplicate sub categories by name
      const subCatData = subCatRes?.data || [];
      const uniqueSubCategories = subCatData.reduce((acc, current) => {
        const x = acc.find(item => item.name === current.name);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);
      setSubCategories(uniqueSubCategories);
      
      // Deduplicate sub project types by name
      const subPData = subPTypeRes?.data || [];
      const uniqueSubProjectTypes = subPData.reduce((acc, current) => {
        const x = acc.find(item => item.name === current.name);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);
      setSubProjectTypes(uniqueSubProjectTypes);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch initial data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeStateId) {
      fetchClusters(activeStateId);
      fetchMappings(activeStateId);
    }
  }, [activeStateId]);

  const fetchClusters = async (stateId) => {
    try {
      const res = await masterApi.getClusters({ stateId });
      setClusters(res?.data || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMappings = async (stateId) => {
    try {
      setLoading(true);
      const res = await productApi.getProjectCategoryMappings({ stateId });
      if (res.data.success) {
        setMappings(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      categoryId: item.categoryId?._id || '',
      subCategoryId: item.subCategoryId?._id || '',
      projectTypeFrom: item.projectTypeFrom || '',
      projectTypeTo: item.projectTypeTo || '',
      subProjectTypeId: item.subProjectTypeId?._id || '',
      clusterId: item.clusterId?._id || ''
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this mapping?")) {
      try {
        await productApi.deleteProjectCategoryMapping(id);
        showToast("Mapping deleted");
        fetchMappings(activeStateId);
      } catch (err) {
        showToast("Failed to delete", "error");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeStateId) {
      showToast("Please select a state first", "error");
      return;
    }

    const { categoryId, subCategoryId, projectTypeFrom, projectTypeTo, clusterId } = formData;
    if (!categoryId || !subCategoryId || projectTypeFrom === '' || projectTypeTo === '' || !clusterId) {
      showToast("Category, Sub Category, Ranges, and Cluster are required fields.", "error");
      return;
    }

    const payload = {
      ...formData,
      stateId: activeStateId
    };

    try {
      if (editingId) {
        await productApi.updateProjectCategoryMapping(editingId, payload);
        showToast("Mapping Updated");
      } else {
        await productApi.createProjectCategoryMapping(payload);
        showToast("Mapping Created");
      }
      // Reset form
      setEditingId(null);
      setFormData({ categoryId: '', subCategoryId: '', projectTypeFrom: '', projectTypeTo: '', subProjectTypeId: '', clusterId: '' });
      fetchMappings(activeStateId);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save mapping", "error");
    }
  };

  const activeStateName = states.find(s => s._id === activeStateId)?.name || 'UNKNOWN';
  
  const filteredList = mappings.filter(m => 
    m.categoryId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subCategoryId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <h2 className="text-2xl font-bold text-blue-600 mb-6 uppercase">
        Add Project Category - {activeStateName}
      </h2>

      {/* State Tabs */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        {states.map((state) => (
          <button
            key={state._id}
            onClick={() => setActiveStateId(state._id)}
            className={`min-w-[200px] h-24 flex flex-col justify-center items-center border rounded-lg transition-all duration-200 ${
              activeStateId === state._id
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-white border-blue-400 text-gray-700 hover:border-blue-600'
            }`}
          >
            <span className="font-bold uppercase tracking-wider">{state.name}</span>
            <span className="text-sm mt-1">{state.shortName || state.name.substring(0,2).toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* Constraints Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
            <select className="w-full border rounded p-2 focus:border-blue-500"
              value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Sub Category</label>
            <select className="w-full border rounded p-2 focus:border-blue-500"
              value={formData.subCategoryId} onChange={e => setFormData({ ...formData, subCategoryId: e.target.value })}>
              <option value="">Sub Category</option>
              {subCategories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Project Type From (kW)</label>
            <input type="number" className="w-full border rounded p-2 focus:border-blue-500" placeholder="e.g. 1.0"
              value={formData.projectTypeFrom} onChange={e => setFormData({ ...formData, projectTypeFrom: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Project Type To (kW)</label>
            <input type="number" className="w-full border rounded p-2 focus:border-blue-500" placeholder="e.g. 10.0"
              value={formData.projectTypeTo} onChange={e => setFormData({ ...formData, projectTypeTo: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Sub Project Type</label>
            <select className="w-full border rounded p-2 focus:border-blue-500"
              value={formData.subProjectTypeId} onChange={e => setFormData({ ...formData, subProjectTypeId: e.target.value })}>
              <option value="">Sub Project Type</option>
              {subProjectTypes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cluster</label>
            <select className="w-full border rounded p-2 focus:border-blue-500"
              value={formData.clusterId} onChange={e => setFormData({ ...formData, clusterId: e.target.value })}>
              <option value="">Please Select</option>
              {clusters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex justify-start">
          <button 
            onClick={handleSubmit} 
            className="bg-blue-600 text-white font-semibold py-2 px-6 rounded hover:bg-blue-700 transition"
          >
            {editingId ? 'Update Project Category' : 'Add Project Category'}
          </button>
          {editingId && (
            <button 
              onClick={() => { setEditingId(null); setFormData({ categoryId: '', subCategoryId: '', projectTypeFrom: '', projectTypeTo: '', subProjectTypeId: '', clusterId: '' }); }} 
              className="ml-4 bg-gray-400 text-white font-semibold py-2 px-6 rounded hover:bg-gray-500 transition"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">Project Type List</h3>
        </div>

        <div className="p-4 flex gap-4 bg-gray-50 border-b">
          <div className="w-full relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              className="w-full border rounded p-2 pl-10 focus:border-blue-500"
              placeholder="Search table..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 min-w-[40px] flex items-center justify-center">
            <Search size={20} />
          </button>
        </div>

        <div className="overflow-x-auto p-4">
          {loading ? (
             <div className="flex justify-center p-8"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-300 text-white">
                  <th className="p-3 border text-sm font-semibold rounded-tl-lg">State</th>
                  <th className="p-3 border text-sm font-semibold">Category</th>
                  <th className="p-3 border text-sm font-semibold">Sub Category</th>
                  <th className="p-3 border text-sm font-semibold">Project Type</th>
                  <th className="p-3 border text-sm font-semibold">Sub Project Type</th>
                  <th className="p-3 border text-sm font-semibold">Cluster</th>
                  <th className="p-3 border text-sm font-semibold">Status</th>
                  <th className="p-3 border text-sm font-semibold rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500 border">No Data Found</td>
                  </tr>
                ) : (
                  filteredList.map((m, i) => (
                    <tr key={m._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3 border text-xs">{m.stateId?.name}</td>
                      <td className="p-3 border font-medium text-xs">{m.categoryId?.name}</td>
                      <td className="p-3 border text-xs text-blue-600">{m.subCategoryId?.name}</td>
                      <td className="p-3 border text-xs font-semibold text-green-700 whitespace-nowrap">
                        {m.projectTypeFrom} to {m.projectTypeTo} kW
                      </td>
                      <td className="p-3 border text-xs">{m.subProjectTypeId?.name || '-'}</td>
                      <td className="p-3 border text-xs">{m.clusterId?.name}</td>
                      <td className="p-3 border text-xs">
                         <span className={`px-2 py-1 rounded-full ${m.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {m.status ? 'Active' : 'Inactive'}
                         </span>
                      </td>
                      <td className="p-3 border text-center flex justify-center gap-2">
                         <button onClick={() => handleEdit(m)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16}/></button>
                         <button onClick={() => handleDelete(m._id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddProjectCategory;