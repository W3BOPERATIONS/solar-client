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

const PriceMaster = () => {
  const [view, setView] = useState('list');
  const [priceToEdit, setPriceToEdit] = useState(null);
  const [prices, setPrices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);

  const [formData, setFormData] = useState({
    productId: '',
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

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const res = await productApi.getPriceMasters();
      if (res.data.success) {
        setPrices(res.data.data);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch prices", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await productApi.getAll(); // Assuming this returns all products
      if (res.data.success) setProducts(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPrices();
    fetchProducts();
  }, []);

  // Calculation Logic
  useEffect(() => {
    const base = parseFloat(formData.basePrice) || 0;
    const tax = parseFloat(formData.tax) || 0;
    const discount = parseFloat(formData.discount) || 0;

    const priceWithTax = base + (base * (tax / 100));
    const final = priceWithTax - discount;

    setFormData(prev => ({ ...prev, finalPrice: final.toFixed(2) }));
  }, [formData.basePrice, formData.tax, formData.discount]);


  const handleAddNew = () => {
    setFormData({ productId: '', basePrice: '', tax: '', discount: '', finalPrice: '', status: true });
    setPriceToEdit(null);
    setView('create');
  };

  const handleEdit = (price) => {
    setPriceToEdit(price);
    setFormData({
      productId: price.productId?._id,
      basePrice: price.basePrice,
      tax: price.tax,
      discount: price.discount,
      finalPrice: price.finalPrice,
      status: price.status
    });
    setView('edit');
  };

  const handleSubmit = async () => {
    if (!formData.productId || !formData.basePrice) {
      showToast("Product and Base Price are required", "error");
      return;
    }

    try {
      if (priceToEdit) {
        await productApi.updatePriceMaster(priceToEdit._id, formData);
        showToast("Price Updated");
      } else {
        await productApi.createPriceMaster(formData);
        showToast("Price Set");
      }
      setView('list');
      fetchPrices();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete price?')) {
      try {
        await productApi.deletePriceMaster(id);
        showToast("Deleted");
        fetchPrices();
      } catch (error) {
        showToast("Failed to delete", "error");
      }
    }
  };

  const filteredList = prices.filter(p => p.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (view === 'create' || view === 'edit') {
    return (
      <div className="container mx-auto p-4 bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-xl font-bold text-gray-800">{view === 'create' ? 'Set Price' : 'Edit Price'}</h3>
          <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700"><X /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Product *</label>
            <select className="w-full border rounded p-2"
              value={formData.productId}
              onChange={e => setFormData({ ...formData, productId: e.target.value })}
              disabled={view === 'edit'} // Lock product on edit maybe? Or allow change.
            >
              <option value="">Select Product</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.skuId?.skuCode})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Base Price *</label>
            <input type="number" className="w-full border rounded p-2"
              value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tax (%)</label>
            <input type="number" className="w-full border rounded p-2"
              value={formData.tax} onChange={e => setFormData({ ...formData, tax: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Discount (Amount)</label>
            <input type="number" className="w-full border rounded p-2"
              value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Final Price (Calculated)</label>
            <input type="number" className="w-full border rounded p-2 bg-gray-100"
              value={formData.finalPrice} readOnly />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={() => setView('list')} className="px-5 py-2 border rounded hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">Save Price</button>
        </div>
      </div>
    )
  }

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
        <h2 className="text-2xl font-bold text-gray-800">Price Master</h2>
        <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={20} /> Set New Price
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            className="w-full border rounded-lg pl-10 pr-4 py-2"
            placeholder="Search by product..."
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
                  <th className="p-3">Base Price</th>
                  <th className="p-3">Tax (%)</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Final Price</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(p => (
                  <tr key={p._id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{p.productId?.name}</td>
                    <td className="p-3">₹{p.basePrice}</td>
                    <td className="p-3">{p.tax}%</td>
                    <td className="p-3">₹{p.discount}</td>
                    <td className="p-3 font-bold text-green-600">₹{p.finalPrice}</td>
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

export default PriceMaster;