import React, { useState, useEffect } from 'react';
import { Settings, Eye, Search, X, Plus, Trash, Edit, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getAllOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getAllSuppliers,
  getAllProducts,
  getStates,
  getCities,
  getDistricts
} from '../../../../services/procurement/procurementApi';

export default function OrderProcurement() {
  // Data State
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [states, setStates] = useState([]);

  // Form Location State
  const [formCities, setFormCities] = useState([]);
  const [formDistricts, setFormDistricts] = useState([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    supplier: '',
    status: '',
    state: '',
    orderNumber: ''
  });

  // Current Order Form Data
  const initialFormState = {
    orderNumber: '',
    supplierId: '',
    items: [{ product: '', quantity: 1, price: 0 }],
    status: 'Pending',
    state: '',
    city: '',
    district: '',
    totalAmount: 0
  };
  const [formData, setFormData] = useState(initialFormState);

  // Fetch Initial Data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [ordersData, suppliersData, productsData, statesData] = await Promise.all([
        getAllOrders(),
        getAllSuppliers(),
        getAllProducts(),
        getStates()
      ]);

      setOrders(ordersData?.data || []);
      setFilteredOrders(ordersData?.data || []);
      setSuppliers(suppliersData?.data || []);
      setProducts(productsData?.data || []);
      setStates(statesData?.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  useEffect(() => {
    let result = orders;

    if (filters.supplier) {
      result = result.filter(o => o.supplierId?._id === filters.supplier || o.supplierId === filters.supplier);
    }
    if (filters.status) {
      result = result.filter(o => o.status === filters.status);
    }
    if (filters.state) {
      result = result.filter(o => o.state?._id === filters.state || o.state === filters.state);
    }
    if (filters.orderNumber) {
      result = result.filter(o => o.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase()));
    }

    setFilteredOrders(result);
  }, [filters, orders]);

  // Dependent Dropdowns for Form
  const handleStateChange = async (e) => {
    const stateId = e.target.value;
    setFormData(prev => ({ ...prev, state: stateId, city: '', district: '' }));
    setFormCities([]);
    setFormDistricts([]);
    if (stateId) {
      try {
        const res = await getCities(stateId);
        setFormCities(res.data || []);
      } catch (err) {
        toast.error("Failed to load cities");
      }
    }
  };

  const handleCityChange = async (e) => {
    const cityId = e.target.value;
    setFormData(prev => ({ ...prev, city: cityId, district: '' }));
    setFormDistricts([]);
    if (cityId) {
      try {
        const res = await getDistricts(cityId);
        setFormDistricts(res.data || []);
      } catch (err) {
        toast.error("Failed to load districts");
      }
    }
  };

  // Order Items Logic
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // Auto update price if product selected
    if (field === 'product') {
      const prod = products.find(p => p._id === value);
      if (prod) {
        // Assuming product has a price field or we set default. 
        // If product doesn't have price, we might need another fetch or use 0.
        // For now using 0 or existing price logic if Product model had it. Product model didn't seem to have price.
        // So user enters price manually or we fetch from PriceMaster? 
        // Keeping it manual/default for now as per prompt "only replace static data".
        // Use a default or 0 if not found.
        newItems[index].price = 0;
      }
    }

    setFormData({ ...formData, items: newItems });
    calculateTotal(newItems);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 1, price: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    calculateTotal(newItems);
  };

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
    setFormData(prev => ({ ...prev, totalAmount: total }));
  };

  // CRUD Actions
  const handleEdit = async (order) => {
    setIsEdit(true);
    setFormData({
      orderNumber: order.orderNumber,
      supplierId: order.supplierId?._id || order.supplierId,
      items: order.items.map(i => ({
        product: i.product?._id || i.product,
        quantity: i.quantity,
        price: i.price
      })),
      status: order.status,
      state: order.state?._id || order.state,
      city: order.city?._id || order.city,
      district: order.district?._id || order.district,
      totalAmount: order.totalAmount,
      _id: order._id
    });

    // Pre-load dependent dropdowns
    if (order.state?._id || order.state) {
      const sId = order.state?._id || order.state;
      const cRes = await getCities(sId);
      setFormCities(cRes.data || []);

      if (order.city?._id || order.city) {
        const cId = order.city?._id || order.city;
        const dRes = await getDistricts(cId);
        setFormDistricts(dRes.data || []);
      }
    }

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteOrder(id);
        toast.success('Order deleted successfully');
        fetchInitialData();
      } catch (err) {
        toast.error(err.message || 'Failed to delete order');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateOrder(formData._id, formData);
        toast.success('Order updated successfully');
      } else {
        await createOrder(formData);
        toast.success('Order created successfully');
      }
      setShowModal(false);
      fetchInitialData();
      resetForm();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setFormCities([]);
    setFormDistricts([]);
    setIsEdit(false);
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      {/* Header */}
      <div className="p-4 mb-4 bg-white rounded-lg shadow-sm flex justify-between items-center">
        <h4 className="text-xl font-semibold text-blue-600 mb-0">Order Procurement</h4>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> Add Order
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 mb-4 bg-white rounded-lg shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            type="text"
            placeholder="Search Order #"
            className="p-2 border border-gray-300 rounded-lg"
            value={filters.orderNumber}
            onChange={(e) => setFilters({ ...filters, orderNumber: e.target.value })}
          />
          <select
            className="p-2 border border-gray-300 rounded-lg"
            value={filters.supplier}
            onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
          >
            <option value="">All Suppliers</option>
            {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <select
            className="p-2 border border-gray-300 rounded-lg"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            {['Pending', 'Approved', 'Completed', 'Cancelled'].map(s =>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
          <select
            className="p-2 border border-gray-300 rounded-lg"
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
          >
            <option value="">All Locations (State)</option>
            {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="p-4 bg-white rounded-lg shadow-sm overflow-x-auto">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Search size={48} className="mx-auto mb-4" />
            <p>No orders found</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-blue-50 text-gray-700 uppercase">
              <tr>
                <th className="p-3">Order #</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Location</th>
                <th className="p-3">Status</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{order.orderNumber}</td>
                  <td className="p-3">{order.supplierId?.name || 'N/A'}</td>
                  <td className="p-3">
                    {[order.state?.name, order.city?.name, order.district?.name].filter(Boolean).join(', ')}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold
                      ${order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3 font-semibold">₹{order.totalAmount}</td>
                  <td className="p-3 text-center flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(order)}
                      className="p-1.5 border border-blue-600 rounded hover:bg-blue-50 text-blue-600"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(order._id)}
                      className="p-1.5 border border-red-500 rounded hover:bg-red-50 text-red-500"
                      title="Delete"
                    >
                      <Trash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{isEdit ? 'Edit Order' : 'Create New Order'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Basic Info */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Order Number *</label>
                    <input
                      required
                      type="text"
                      className="w-full p-2 border rounded"
                      value={formData.orderNumber}
                      onChange={e => setFormData({ ...formData, orderNumber: e.target.value })}
                      disabled={isEdit} // Disable mostly for consistency, but logic allows change if needed
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Supplier *</label>
                    <select
                      required
                      className="w-full p-2 border rounded"
                      value={formData.supplierId}
                      onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>

                  {/* Location - Dependent Dropdowns */}
                  <div>
                    <label className="block text-sm font-medium mb-1">State *</label>
                    <select
                      required
                      className="w-full p-2 border rounded"
                      value={formData.state}
                      onChange={handleStateChange}
                    >
                      <option value="">Select State</option>
                      {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">City *</label>
                    <select
                      required
                      className="w-full p-2 border rounded"
                      value={formData.city}
                      onChange={handleCityChange}
                      disabled={!formData.state}
                    >
                      <option value="">Select City</option>
                      {formCities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">District *</label>
                    <select
                      required
                      className="w-full p-2 border rounded"
                      value={formData.district}
                      onChange={e => setFormData({ ...formData, district: e.target.value })}
                      disabled={!formData.city}
                    >
                      <option value="">Select District</option>
                      {formDistricts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      {['Pending', 'Approved', 'Completed', 'Cancelled'].map(s =>
                        <option key={s} value={s}>{s}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Items Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Order Items</h4>
                    <button type="button" onClick={addItem} className="text-blue-600 text-sm hover:underline">+ Add Item</button>
                  </div>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          required
                          className="flex-1 p-2 border rounded"
                          value={item.product}
                          onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                        >
                          <option value="">Select Product</option>
                          {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          className="w-24 p-2 border rounded"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Price"
                          className="w-32 p-2 border rounded"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-right font-bold text-lg">
                    Total: ₹{formData.totalAmount}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Save size={18} /> Save Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}