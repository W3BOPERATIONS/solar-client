import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Save,
  Loader2
} from 'lucide-react';
import { productApi } from '../../../../api/productApi';

const SkuManagement = () => {
  // States
  const [showForm, setShowForm] = useState(false);
  const [skus, setSkus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSku, setEditingSku] = useState(null);
  const [formData, setFormData] = useState({
    skuCode: '',
    description: '',
    status: true
  });
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const fetchSkus = async () => {
    try {
      setLoading(true);
      const res = await productApi.getSkus();
      if (res.data.success) {
        setSkus(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch SKUs", error);
      showToast("Failed to fetch SKUs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkus();
  }, []);

  const handleAddNew = () => {
    setEditingSku(null);
    setFormData({ skuCode: '', description: '', status: true });
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingSku(item);
    setFormData({
      skuCode: item.skuCode,
      description: item.description,
      status: item.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await productApi.deleteSku(id);
        showToast('SKU deleted');
        fetchSkus();
      } catch (error) {
        showToast('Failed to delete', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.skuCode) {
      showToast('SKU Code is required', 'error');
      return;
    }

    try {
      if (editingSku) {
        await productApi.updateSku(editingSku._id, formData);
        showToast('SKU updated');
      } else {
        await productApi.createSku(formData);
        showToast('SKU added');
      }
      setShowForm(false);
      fetchSkus();
    } catch (error) {
      showToast(error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const filteredList = skus.filter(item =>
    item.skuCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h2 className="text-2xl font-bold text-blue-600">SKU Management</h2>
        <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <PlusCircle size={20} /> Add New SKU
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6 animate-fadeIn border border-blue-100">
          <h5 className="font-semibold text-lg mb-4">{editingSku ? 'Edit SKU' : 'Add New SKU'}</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">SKU Code *</label>
              <input
                type="text"
                className="w-full border rounded p-2"
                value={formData.skuCode}
                onChange={e => setFormData({ ...formData, skuCode: e.target.value })}
                placeholder="e.g. PANEL-500W"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                className="w-full border rounded p-2"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2">
              <Save size={18} /> Save
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            className="w-full border rounded-lg pl-10 pr-4 py-2"
            placeholder="Search SKUs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No SKUs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3">SKU Code</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(item => (
                  <tr key={item._id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-blue-600">{item.skuCode}</td>
                    <td className="p-3 text-gray-600">{item.description}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${item.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleEdit(item)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item._id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkuManagement;