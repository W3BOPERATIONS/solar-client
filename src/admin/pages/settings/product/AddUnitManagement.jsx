import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Save,
  Package,
  Ruler,
  Scale,
  Thermometer,
  Zap,
  Battery,
  Loader2
} from 'lucide-react';
import { productApi } from '../../../../api/productApi';

const AddUnitManagement = () => {
  // States
  const [showForm, setShowForm] = useState(false);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState({
    unitName: '',
    symbol: '',
    status: true
  });
  const [toasts, setToasts] = useState([]);

  // Fetch Units
  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await productApi.getUnits();
      if (res.data.success) {
        setUnits(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch units", error);
      showToast("Failed to fetch units", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const handleAddNewUnit = () => {
    setEditingUnit(null);
    setFormData({ unitName: '', symbol: '', status: true });
    setShowForm(true);
  };

  const handleEditUnit = (unit) => {
    setEditingUnit(unit);
    setFormData({
      unitName: unit.unitName,
      symbol: unit.symbol,
      status: unit.status
    });
    setShowForm(true);
  };

  const handleDeleteUnit = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await productApi.deleteUnit(id);
        showToast('Unit deleted');
        fetchUnits();
      } catch (error) {
        showToast('Failed to delete', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.unitName || !formData.symbol) {
      showToast('Fill required fields', 'error');
      return;
    }

    try {
      if (editingUnit) {
        await productApi.updateUnit(editingUnit._id, formData);
        showToast('Unit updated');
      } else {
        await productApi.createUnit(formData);
        showToast('Unit added');
      }
      setShowForm(false);
      fetchUnits();
    } catch (error) {
      showToast(error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const filteredUnits = units.filter(u =>
    u.unitName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h2 className="text-2xl font-bold text-blue-600">Unit Management</h2>
        <button onClick={handleAddNewUnit} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <PlusCircle size={20} /> Add New Unit
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6 animate-fadeIn border border-blue-100">
          <h5 className="font-semibold text-lg mb-4">{editingUnit ? 'Edit Unit' : 'Add New Unit'}</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Unit Name *</label>
              <input
                type="text"
                className="w-full border rounded p-2"
                value={formData.unitName}
                onChange={e => setFormData({ ...formData, unitName: e.target.value })}
                placeholder="e.g. Kilogram"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Symbol *</label>
              <input
                type="text"
                className="w-full border rounded p-2"
                value={formData.symbol}
                onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                placeholder="e.g. kg"
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
            placeholder="Search units..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
        ) : filteredUnits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No units found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3">Unit Name</th>
                  <th className="p-3">Symbol</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.map(unit => (
                  <tr key={unit._id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{unit.unitName}</td>
                    <td className="p-3 font-mono bg-gray-100 rounded px-2 w-fit">{unit.symbol}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${unit.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {unit.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleEditUnit(unit)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteUnit(unit._id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
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

export default AddUnitManagement;