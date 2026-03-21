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
import Select from 'react-select';
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
    deliveryType: [],
    length: '',
    width: '',
    height: '',
    capacity: '',
    costPerKm: '', // Added as per user requirement
    kw: '',
    range: '',
    orderType: [],
    locationType: [],
    image: '',
    status: 'active'
  });

  const fileInputRef = useRef(null);

  // Options
  const vehicleTypeOptions = ['Open Truck', 'Container Truck', 'Pickup Van'];
  const deliveryTypeOptions = ['Prime', 'Regular', 'Express'];
  const orderTypeOptions = ['Combokit', 'CustomKit'];
  const locationTypeOptions = ['Rural', 'Urban'];

  // React Select Styles
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? '#0284c7' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #0284c7' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#0284c7' : '#cbd5e1'
      },
      minHeight: '38px',
      borderRadius: '0.375rem',
      backgroundColor: 'white',
      fontSize: '14px',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#e0f2fe',
      borderRadius: '4px',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#0369a1',
      fontSize: '13px',
      fontWeight: '500',
      padding: '2px 6px',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#0284c7',
      '&:hover': {
        backgroundColor: '#bae6fd',
        color: '#0369a1',
        borderRadius: '0 4px 4px 0',
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '0.375rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      zIndex: 100,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#f1f5f9' : 'transparent',
      color: state.isSelected ? '#0284c7' : '#475569',
      padding: '8px 12px',
      cursor: 'pointer',
      fontSize: '14px',
      '&:active': {
        backgroundColor: '#e2e8f0'
      }
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: '#94a3b8',
      '&:hover': {
        color: '#64748b'
      }
    })
  };

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

  const handleMultiSelectChange = (selectedOptions, name) => {
    setFormData(prev => ({
      ...prev,
      [name]: selectedOptions ? selectedOptions.map(option => option.value) : []
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
      orderType: [],
      locationType: [],
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

    if (!formData.deliveryType || formData.deliveryType.length === 0) {
      showNotification('Please select at least one delivery type', 'error');
      return;
    }

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
      deliveryType: Array.isArray(vehicle.deliveryType) ? vehicle.deliveryType : (vehicle.deliveryType ? [vehicle.deliveryType] : []),
      length: vehicle.dimensions?.length || '',
      width: vehicle.dimensions?.width || '',
      height: vehicle.dimensions?.height || '',
      capacity: vehicle.capacity,
      costPerKm: vehicle.costPerKm || '',
      kw: vehicle.kw,
      range: vehicle.range,
      orderType: Array.isArray(vehicle.orderType) ? vehicle.orderType : (vehicle.orderType ? [vehicle.orderType] : []),
      locationType: Array.isArray(vehicle.locationType) ? vehicle.locationType : (vehicle.locationType ? [vehicle.locationType] : []),
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
      <div className="mb-6 flex items-center">
        <Truck className="w-7 h-7 text-gray-700 mr-2" />
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Vehicle Management</h1>
      </div>

      {/* Enter Vehicle Type Row */}
      <div className="mb-4 flex items-center space-x-3">
        <input
          type="text"
          placeholder="Enter Vehicle Type Name"
          className="border border-gray-300 px-3 py-2 rounded text-sm w-64 focus:outline-none focus:border-blue-500"
        />
        <button className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-4 py-2 rounded text-sm font-semibold transition" onClick={(e) => e.preventDefault()}>
          ADD
        </button>
      </div>

      {/* Add/Edit Vehicle Form */}
      <div className="bg-white border text-[14px] border-gray-200 shadow-sm rounded-md mb-8">
        <div className="bg-[#0284c7] text-white p-3 flex justify-between items-center">
          <h2 className="text-base font-semibold flex items-center">
            <PlusCircle className="w-5 h-5 mr-2" />
            {editId ? 'Edit Vehicle' : 'Add/Edit Vehicle'}
          </h2>
          {editId && (
            <button onClick={resetForm} className="text-white hover:text-gray-200 text-sm">
              Cancel
            </button>
          )}
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Vehicle Image Upload */}
              <div className="lg:w-1/4">
                <div className="border border-gray-200 rounded p-4 text-center">
                  <div className="w-full h-32 bg-white flex items-center justify-center overflow-hidden mb-4">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center">
                        <Truck className="w-full h-full text-gray-200" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center border border-gray-300 rounded overflow-hidden text-xs bg-white">
                    <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 cursor-pointer border-r border-gray-300 whitespace-nowrap">
                      Choose File
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                    <span className="px-3 text-gray-500 truncate">
                      {fileInputRef.current?.files[0]?.name || 'No file chosen'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">Upload vehicle image (max 2MB)</p>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="lg:w-3/4 space-y-4">
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    {formData.name === '' && <span className="absolute left-3 top-2 text-gray-400 text-[13px] pointer-events-none">Vehicle Name</span>}
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" required />
                  </div>
                  <div>
                    <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-gray-700" required>
                      <option value="">Vehicle Type</option>
                      {vehicleTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <Select
                      isMulti
                      name="deliveryType"
                      value={deliveryTypeOptions.filter(opt => formData.deliveryType.includes(opt)).map(opt => ({ value: opt, label: opt }))}
                      onChange={(selected) => handleMultiSelectChange(selected, 'deliveryType')}
                      options={deliveryTypeOptions.map(opt => ({ value: opt, label: opt }))}
                      placeholder="Delivery Type"
                      className="text-sm"
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    {formData.length === '' && <span className="absolute left-3 top-2 text-gray-400 text-[13px] pointer-events-none">Length (ft)</span>}
                    <input type="number" name="length" value={formData.length} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="relative">
                    {formData.width === '' && <span className="absolute left-3 top-2 text-gray-400 text-[13px] pointer-events-none">Width (ft)</span>}
                    <input type="number" name="width" value={formData.width} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="relative">
                    {formData.height === '' && <span className="absolute left-3 top-2 text-gray-400 text-[13px] pointer-events-none">Height (ft)</span>}
                    <input type="number" name="height" value={formData.height} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="relative">
                    {formData.capacity === '' && <span className="absolute left-3 top-2 text-gray-400 text-[13px] pointer-events-none">Load Capacity (Tons)</span>}
                    <input type="text" name="capacity" value={formData.capacity} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" required />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      {formData.kw === '' && <span className="absolute left-3 top-2 text-gray-400 text-[13px] pointer-events-none">Solar Panel Capacity</span>}
                      <input type="number" name="kw" value={formData.kw} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
                    </div>
                    <span className="text-gray-600 font-medium ml-3 text-[13px]">KW</span>
                  </div>

                  <div className="flex items-center">
                    <div className="relative flex-1">
                      {formData.range === '' && <span className="absolute left-3 top-2 text-gray-400 text-[13px] pointer-events-none">Maximum Range</span>}
                      <input type="number" name="range" value={formData.range} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" />
                    </div>
                    <span className="text-gray-600 font-medium ml-3 text-[13px]">KM</span>
                  </div>

                  <div className="flex-1">
                    <Select
                      isMulti
                      name="orderType"
                      value={orderTypeOptions.filter(opt => formData.orderType.includes(opt)).map(opt => ({ value: opt, label: opt }))}
                      onChange={(selected) => handleMultiSelectChange(selected, 'orderType')}
                      options={orderTypeOptions.map(opt => ({ value: opt, label: opt }))}
                      placeholder="Order Type"
                      className="text-sm"
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                    />
                  </div>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="flex-1">
                    <Select
                      isMulti
                      name="locationType"
                      value={locationTypeOptions.filter(opt => formData.locationType.includes(opt)).map(opt => ({ value: opt, label: opt }))}
                      onChange={(selected) => handleMultiSelectChange(selected, 'locationType')}
                      options={locationTypeOptions.map(opt => ({ value: opt, label: opt }))}
                      placeholder="Location Type"
                      className="text-sm"
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                    />
                  </div>
                  <div>
                    <button type="submit" disabled={loading} className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-5 py-2 rounded font-medium flex items-center transition-colors">
                      <Save className="w-4 h-4 mr-2" />
                      {editId ? 'Update Vehicle' : 'Save Vehicle'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Vehicle List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 text-[#0284c7] animate-spin" />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm">
          No vehicles found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle._id} className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden relative">
              {/* Image Section */}
              <div className="h-56 bg-white flex items-center justify-center p-4">
                {vehicle.image ? (
                  <img src={vehicle.image} alt={vehicle.name} className="h-full object-contain" />
                ) : (
                  <Truck className="w-16 h-16 text-gray-300" />
                )}
              </div>

              {/* Content Section */}
              <div className="p-6 pt-2 text-[14.5px] text-[#0f172a]">

                {/* Title & Badge */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800">{vehicle.name}</h3>
                  <span className="bg-[#0284c7] text-white text-[12px] font-semibold px-3 py-1.5 rounded-md shadow-sm">
                    {vehicle.type || 'Vehicle'}
                  </span>
                </div>

                {/* Properties List */}
                <div className="space-y-3.5">
                  <div className="flex justify-between">
                    <span className="font-bold">Delivery</span>
                    <span className="text-gray-700">{Array.isArray(vehicle.deliveryType) ? vehicle.deliveryType.join(', ') : (vehicle.deliveryType || '-')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Dimensions</span>
                    <span className="text-gray-700">{vehicle.dimensions?.length || 0}×{vehicle.dimensions?.width || 0}×{vehicle.dimensions?.height || 0} ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Capacity</span>
                    <span className="text-gray-700">{vehicle.capacity || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Solar KW</span>
                    <span className="text-gray-700">{vehicle.kw || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Range</span>
                    <span className="text-gray-700">{vehicle.range || 0} KM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Order Type</span>
                    <span className="text-gray-700">{Array.isArray(vehicle.orderType) ? vehicle.orderType.join(', ') : (vehicle.orderType || '-')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Location</span>
                    <span className="text-gray-700">{Array.isArray(vehicle.locationType) ? vehicle.locationType.join(', ') : (vehicle.locationType || '-')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center mt-8 text-[13px] font-medium">
                  <button
                    onClick={() => editVehicle(vehicle)}
                    className="text-[#0284c7] hover:text-blue-800 flex items-center transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-1.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle._id)}
                    className="text-red-500 hover:text-red-700 flex items-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer text */}
      <div className="mt-8 text-center text-[13px] text-gray-500 font-medium">
        Copyright © 2025 Solarkits. All Rights Reserved.
      </div>
    </div>
  );
};

export default VehicleManagement;