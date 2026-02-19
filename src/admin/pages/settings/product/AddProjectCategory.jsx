import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2, CheckCircle, AlertCircle, Save, Loader2, Search } from 'lucide-react';
import { productApi } from '../../../../api/productApi';

const AddProjectCategory = () => {
  // States
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    projectTypeId: '',
    description: '',
    status: true
  });
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await productApi.getCategories();
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch categories", error);
      showToast("Failed to fetch categories", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectTypes = async () => {
    try {
      const res = await productApi.getProjectTypes();
      if (res.data.success) {
        setProjectTypes(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch project types");
    }
  };

  useEffect(() => {
    fetchProjectTypes();
    fetchCategories();
  }, []);

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({ name: '', projectTypeId: '', description: '', status: true });
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      projectTypeId: item.projectTypeId?._id,
      description: item.description,
      status: item.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await productApi.deleteCategory(id);
        showToast('Category deleted');
        fetchCategories();
      } catch (error) {
        showToast('Failed to delete', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.projectTypeId) {
      showToast('Name and Project Type are required', 'error');
      return;
    }

    try {
      if (editingItem) {
        await productApi.updateCategory(editingItem._id, formData);
        showToast('Category updated');
      } else {
        await productApi.createCategory(formData);
        showToast('Category added');
      }
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      showToast(error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const filteredList = categories.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h2 className="text-2xl font-bold text-blue-600">Categories</h2>
        <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <PlusCircle size={20} /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6 animate-fadeIn border border-blue-100">
          <h5 className="font-semibold text-lg mb-4">{editingItem ? 'Edit Category' : 'Add New Category'}</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                className="w-full border rounded p-2"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Solar Panels"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Project Type *</label>
              <select
                className="w-full border rounded p-2"
                value={formData.projectTypeId}
                onChange={e => setFormData({ ...formData, projectTypeId: e.target.value })}
              >
                <option value="">Select Project Type</option>
                {projectTypes.map(pt => (
                  <option key={pt._id} value={pt._id}>{pt.name}</option>
                ))}
              </select>
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
            placeholder="Search categories..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No categories found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Project Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(item => (
                  <tr key={item._id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3 text-blue-600">{item.projectTypeId?.name}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddProjectCategory;