import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  PlusCircle,
  Save,
  Edit,
  Trash2,
  Upload,
  Ruler,
  Package,
  MapPin,
  Layers,
  Loader,
  XCircle,
  CheckCircle,
  Search
} from 'lucide-react';
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle
} from '../../../../services/delivery/deliveryApi';

const VehicleManagement = () => {
  // State management
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    deliveryType: '',
    length: '',
    width: '',
    height: '',
    capacity: '',
    costPerKm: '', // Added as per user requirement
    kw: '',
    range: '',
    orderType: '',
    locationType: '',
    image: '',
    status: 'active'
  });

  const fileInputRef = useRef(null);

  // Options
  const vehicleTypeOptions = ['Open Truck', 'Container Truck', 'Pickup Van'];
  const deliveryTypeOptions = ['Prime', 'Regular', 'Express'];
  const orderTypeOptions = ['Combokit', 'CustomKit'];
  const locationTypeOptions = ['Rural', 'Urban'];

  // Fetch Data
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await getVehicles();
      if (response.success) {
        setVehicles(response.data);
      }
    } catch (error) {
      showNotification('Failed to fetch vehicles', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image upload (Base64 for simplicity as no upload route specified)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showNotification('Image size should be less than 2MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      deliveryType: '',
      length: '',
      width: '',
      height: '',
      capacity: '',
      costPerKm: '',
      kw: '',
      range: '',
      orderType: '',
      locationType: '',
      image: '',
      status: 'active'
    });
    setEditId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mapping form data to API payload
    const payload = {
      name: formData.name,
      type: formData.type,
      deliveryType: formData.deliveryType,
      dimensions: {
        length: Number(formData.length),
        width: Number(formData.width),
        height: Number(formData.height)
      },
      capacity: formData.capacity,
      costPerKm: Number(formData.costPerKm),
      kw: Number(formData.kw),
      range: Number(formData.range),
      orderType: formData.orderType,
      locationType: formData.locationType,
      image: formData.image,
      status: formData.status
    };

    try {
      if (editId) {
        await updateVehicle(editId, payload);
        showNotification('Vehicle updated successfully!', 'success');
      } else {
        await createVehicle(payload);
        showNotification('Vehicle added successfully!', 'success');
      }
      fetchVehicles();
      resetForm();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  // Edit vehicle
  const editVehicle = (vehicle) => {
    setFormData({
      name: vehicle.name,
      type: vehicle.type,
      deliveryType: vehicle.deliveryType,
      length: vehicle.dimensions?.length || '',
      width: vehicle.dimensions?.width || '',
      height: vehicle.dimensions?.height || '',
      capacity: vehicle.capacity,
      costPerKm: vehicle.costPerKm || '',
      kw: vehicle.kw,
      range: vehicle.range,
      orderType: vehicle.orderType,
      locationType: vehicle.locationType,
      image: vehicle.image,
      status: vehicle.status
    });
    setEditId(vehicle._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete vehicle
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await deleteVehicle(id);
        showNotification('Vehicle deleted successfully!', 'success');
        fetchVehicles();
      } catch (error) {
        showNotification('Failed to delete vehicle', 'error');
      }
    }
  };

  // Toggle Status
  const handleStatusToggle = async (vehicle) => {
    try {
      const newStatus = vehicle.status === 'active' ? 'inactive' : 'active';
      await updateVehicle(vehicle._id, { status: newStatus });
      showNotification('Status updated', 'success');
      fetchVehicles();
    } catch (error) {
      showNotification('Status update failed', 'error');
    }
  };

  // Filter
  const filteredVehicles = vehicles.filter(v =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center">
            <Truck className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Vehicle Management</h1>
              <p className="text-gray-600">Manage delivery vehicles and their specifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Vehicle Form */}
      <div className="card bg-white rounded-xl shadow-md mb-8">
        <div className="bg-blue-600 text-white p-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <PlusCircle className="w-6 h-6 mr-2" />
            {editId ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>
          {editId && (
            <button
              onClick={resetForm}
              className="text-white hover:text-gray-200 text-sm underline"
            >
              Cancel Edit
            </button>
          )}
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Vehicle Image Upload */}
              <div className="lg:col-span-1">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                  <div className="w-full h-40 bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt="Vehicle Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Truck className="w-16 h-16 text-gray-300" />
                    )}
                  </div>
                  <label className="cursor-pointer block">
                    <div className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg flex items-center justify-center transition-colors">
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Image
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Max size 2MB</p>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="lg:col-span-3">
                <div className="space-y-4">
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Vehicle Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. TATA Ace"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Vehicle Type</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Type</option>
                        {vehicleTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Delivery Type</label>
                      <select
                        name="deliveryType"
                        value={formData.deliveryType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Delivery Type</option>
                        {deliveryTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Row 2 - Dimensions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Length (ft)</label>
                        <input
                          type="number"
                          name="length"
                          value={formData.length}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="L"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Width (ft)</label>
                        <input
                          type="number"
                          name="width"
                          value={formData.width}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="W"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Height (ft)</label>
                        <input
                          type="number"
                          name="height"
                          value={formData.height}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="H"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Capacity</label>
                      <input
                        type="text"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. 1.5 Tons"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Cost Per KM (₹)</label>
                      <input
                        type="number"
                        name="costPerKm"
                        value={formData.costPerKm}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Row 3 - Tech Specs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Solar KW</label>
                      <input
                        type="number"
                        name="kw"
                        value={formData.kw}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="KW"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Range (KM)</label>
                      <input
                        type="number"
                        name="range"
                        value={formData.range}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Max Range"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Order Type</label>
                      <select
                        name="orderType"
                        value={formData.orderType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Order Type</option>
                        {orderTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Row 4 - Location & Save */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Location Type</label>
                      <select
                        name="locationType"
                        value={formData.locationType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Location Type</option>
                        {locationTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center justify-center transition-colors"
                      >
                        <Save className="w-5 h-5 mr-2" />
                        {editId ? 'Update Vehicle' : 'Save Vehicle'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm">
          No vehicles found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle._id} className="card bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
              <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                {vehicle.image ? (
                  <img src={vehicle.image} alt={vehicle.name} className="w-full h-full object-cover" />
                ) : (
                  <Truck className="w-16 h-16 text-gray-300" />
                )}
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{vehicle.name}</h3>
                    <div className="flex space-x-2 mt-1">
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
                        {vehicle.type}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${vehicle.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {vehicle.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Delivery Type</p>
                    <p className="font-semibold">{vehicle.deliveryType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Capacity</p>
                    <p className="font-semibold">{vehicle.capacity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cost/KM</p>
                    <p className="font-semibold">₹{vehicle.costPerKm || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Dims</p>
                    <p className="font-semibold">
                      {vehicle.dimensions?.length || '-'}x{vehicle.dimensions?.width || '-'}x{vehicle.dimensions?.height || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editVehicle(vehicle)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleStatusToggle(vehicle)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${vehicle.status === 'active'
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                      }`}
                  >
                    {vehicle.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;