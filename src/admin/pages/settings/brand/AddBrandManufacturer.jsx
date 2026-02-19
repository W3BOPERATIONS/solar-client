import React, { useState, useEffect, useRef } from 'react';
import {
  Edit2,
  Trash2,
  Upload,
  MapPin,
  Building2,
  Globe,
  Package,
  Search // Added Search icon
} from 'lucide-react';
import axios from 'axios';
import {
  createManufacturer,
  getAllManufacturers,
  updateManufacturer,
  deleteManufacturer
} from '../../../../services/brandApi';

const AddBrandManufacturer = () => {
  // State management
  const [selectedCountry, setSelectedCountry] = useState('');
  const [manufacturers, setManufacturers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: null,
    company: '',
    product: ''
  });
  const [editMode, setEditMode] = useState({
    isEditing: false,
    isOtherEditing: false,
    editId: null,
    otherEditId: null
  });

  // Location Data
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);

  // India form state
  const [indiaForm, setIndiaForm] = useState({
    state: '',
    city: '',
    district: '',
    companyName: '',
    companyOriginCountry: 'India',
    brand: '',
    brandLogo: null,
    product: '',
    comboKit: false
  });

  // Other country form state
  const [otherForm, setOtherForm] = useState({
    companyName: '',
    companyOriginCountry: '',
    brand: '',
    brandLogo: null,
    product: '',
    comboKit: false
  });

  // File inputs refs
  const brandLogoRef = useRef(null);
  const otherBrandLogoRef = useRef(null);

  // Fetch Initial Data
  useEffect(() => {
    fetchManufacturers();
    fetchStates();
  }, []);

  // UseEffect to refresh list when filters change
  useEffect(() => {
    fetchManufacturers();
  }, [filters]);

  const fetchManufacturers = async () => {
    try {
      setIsLoading(true);
      const data = await getAllManufacturers(filters);
      setManufacturers(data);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/locations/states?isActive=true`);
      if (response.data.success) {
        setStates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchCities = async (stateId) => {
    if (!stateId) {
      setCities([]);
      return;
    }
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/locations/cities?stateId=${stateId}&isActive=true`);
      if (response.data.success) {
        setCities(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchDistricts = async (cityId) => {
    if (!cityId) {
      setDistricts([]);
      return;
    }
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/locations/districts?cityId=${cityId}&isActive=true`);
      if (response.data.success) {
        setDistricts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const total = manufacturers.length;
    const indiaCompanies = manufacturers.filter(m => m.companyOriginCountry === 'India').length;
    const foreignCompanies = manufacturers.filter(m => m.companyOriginCountry !== 'India').length;
    const comboKitCount = manufacturers.filter(m => m.comboKit).length;

    return { total, indiaCompanies, foreignCompanies, comboKitCount };
  };

  const summary = calculateSummary();

  // Handle country selection
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setEditMode({ ...editMode, isEditing: false, isOtherEditing: false });
    if (country.toLowerCase() !== 'india') {
      setOtherForm(prev => ({ ...prev, companyOriginCountry: country }));
    }
  };

  // Handle India form state change
  const handleIndiaStateChange = (e) => {
    const stateId = e.target.value;
    setIndiaForm({
      ...indiaForm,
      state: stateId,
      city: '',
      district: ''
    });
    setCities([]);
    setDistricts([]);
    fetchCities(stateId);
  };

  const handleIndiaCityChange = (e) => {
    const cityId = e.target.value;
    setIndiaForm({
      ...indiaForm,
      city: cityId,
      district: ''
    });
    setDistricts([]);
    fetchDistricts(cityId);
  };

  // Handle India form input change
  const handleIndiaInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setIndiaForm({
      ...indiaForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle other form input change
  const handleOtherInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOtherForm({
      ...otherForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle file upload
  const handleLogoUpload = (e, isIndia) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isIndia) {
          setIndiaForm({ ...indiaForm, brandLogo: reader.result });
        } else {
          setOtherForm({ ...otherForm, brandLogo: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add India manufacturer
  const addIndiaManufacturer = async () => {
    if (!indiaForm.state || !indiaForm.city || !indiaForm.district || !indiaForm.companyName ||
      !indiaForm.brand || !indiaForm.product) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await createManufacturer(indiaForm);
      alert('Manufacturer added successfully!');
      fetchManufacturers();
      resetIndiaForm();
    } catch (error) {
      alert('Error adding manufacturer: ' + (error.response?.data?.message || error.message));
    }
  };

  // Add other country manufacturer
  const addOtherManufacturer = async () => {
    if (!otherForm.companyName || !otherForm.companyOriginCountry ||
      !otherForm.brand || !otherForm.product) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await createManufacturer(otherForm);
      alert('Manufacturer added successfully!');
      fetchManufacturers();
      resetOtherForm();
    } catch (error) {
      alert('Error adding manufacturer: ' + (error.response?.data?.message || error.message));
    }
  };

  // Edit manufacturer
  const editManufacturer = (manufacturer) => {
    if (manufacturer.companyOriginCountry === 'India') {
      setSelectedCountry('india');
      setIndiaForm({
        state: manufacturer.state?._id || manufacturer.state, // Handle populated or raw ID
        city: manufacturer.city?._id || manufacturer.city,
        district: manufacturer.district?._id || manufacturer.district,
        companyName: manufacturer.companyName,
        companyOriginCountry: manufacturer.companyOriginCountry,
        brand: manufacturer.brand,
        brandLogo: manufacturer.brandLogo,
        product: manufacturer.product,
        comboKit: manufacturer.comboKit
      });

      // Pre-fetch dependent dropdowns
      // Use logical OR to safely access _id or fallback to ID string
      const stateId = manufacturer.state?._id || manufacturer.state;
      const cityId = manufacturer.city?._id || manufacturer.city;

      if (stateId) fetchCities(stateId);
      if (cityId) fetchDistricts(cityId);

      setEditMode({ ...editMode, isEditing: true, editId: manufacturer._id });
    } else {
      setSelectedCountry(manufacturer.companyOriginCountry.toLowerCase());
      setOtherForm({
        companyName: manufacturer.companyName,
        companyOriginCountry: manufacturer.companyOriginCountry,
        brand: manufacturer.brand,
        brandLogo: manufacturer.brandLogo,
        product: manufacturer.product,
        comboKit: manufacturer.comboKit
      });
      setEditMode({ ...editMode, isOtherEditing: true, otherEditId: manufacturer._id });
    }
  };

  // Update India manufacturer
  const updateIndiaManufacturerData = async () => {
    try {
      await updateManufacturer(editMode.editId, indiaForm);
      alert('Manufacturer updated successfully!');
      fetchManufacturers();
      setEditMode({ ...editMode, isEditing: false, editId: null });
      resetIndiaForm();
    } catch (error) {
      alert('Error updating manufacturer: ' + (error.response?.data?.message || error.message));
    }
  };

  // Update other manufacturer
  const updateOtherManufacturerData = async () => {
    try {
      await updateManufacturer(editMode.otherEditId, otherForm);
      alert('Manufacturer updated successfully!');
      fetchManufacturers();
      setEditMode({ ...editMode, isOtherEditing: false, otherEditId: null });
      resetOtherForm();
    } catch (error) {
      alert('Error updating manufacturer: ' + (error.response?.data?.message || error.message));
    }
  };

  // Delete manufacturer
  const handleDelete = async (id, companyName) => {
    if (window.confirm(`Are you sure you want to delete ${companyName}?`)) {
      try {
        await deleteManufacturer(id);
        alert(`${companyName} has been deleted`);
        fetchManufacturers();
      } catch (error) {
        alert('Error deleting manufacturer: ' + (error.response?.data?.message || 'Server error'));
      }
    }
  };

  // Reset forms
  const resetIndiaForm = () => {
    setIndiaForm({
      state: '',
      city: '',
      district: '',
      companyName: '',
      companyOriginCountry: 'India',
      brand: '',
      brandLogo: null,
      product: '',
      comboKit: false
    });
    setCities([]);
    setDistricts([]);
  };

  const resetOtherForm = () => {
    setOtherForm({
      companyName: '',
      companyOriginCountry: '',
      brand: '',
      brandLogo: null,
      product: '',
      comboKit: false
    });
  };

  const cancelEdit = () => {
    setEditMode({ ...editMode, isEditing: false, editId: null });
    resetIndiaForm();
  };

  const cancelOtherEdit = () => {
    setEditMode({ ...editMode, isOtherEditing: false, otherEditId: null });
    resetOtherForm();
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters({
      ...filters,
      [filterType]: value === filters[filterType] ? null : value
    });
  };

  return (
    <div className="container-fluid p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-blue-600">Add Brand Manufacture</h1>
      </div>

      {/* Country Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Country</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {['India', 'USA', 'UK', 'China'].map((country) => (
            <div
              key={country}
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${selectedCountry === country.toLowerCase()
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
              onClick={() => handleCountrySelect(country.toLowerCase())}
            >
              <div className="text-center">
                <h3 className="text-lg font-medium">{country}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* India Form */}
      {selectedCountry === 'india' && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-2 border-blue-500">
          <h2 className="text-xl font-semibold mb-4">India Manufacturer Details</h2>

          <div className="space-y-4">
            {/* Location Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* State Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select State:
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={indiaForm.state}
                  onChange={handleIndiaStateChange}
                >
                  <option value="">-- Select State --</option>
                  {states.map(state => (
                    <option key={state._id} value={state._id}>{state.name}</option>
                  ))}
                </select>
              </div>

              {/* City Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select City:
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={indiaForm.city}
                  onChange={handleIndiaCityChange}
                  disabled={!indiaForm.state}
                >
                  <option value="">-- Select City --</option>
                  {cities.map(city => (
                    <option key={city._id} value={city._id}>{city.name}</option>
                  ))}
                </select>
              </div>

              {/* District Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select District:
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={indiaForm.district}
                  onChange={(e) => setIndiaForm({ ...indiaForm, district: e.target.value })}
                  disabled={!indiaForm.city}
                >
                  <option value="">-- Select District --</option>
                  {districts.map(district => (
                    <option key={district._id} value={district._id}>{district.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name:
              </label>
              <input
                name="companyName"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter company name"
                value={indiaForm.companyName}
                onChange={handleIndiaInputChange}
              />
            </div>

            {/* Company Origin Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Origin Country:
              </label>
              <select
                name="companyOriginCountry"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={indiaForm.companyOriginCountry}
                disabled
              >
                <option value="India">India</option>
              </select>
            </div>

            {/* Brand with Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand:
              </label>
              <input
                name="brand"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                placeholder="Enter brand name"
                value={indiaForm.brand}
                onChange={handleIndiaInputChange}
              />
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => brandLogoRef.current?.click()}
                >
                  <Upload size={16} />
                  Upload Brand Logo
                </button>
                <input
                  type="file"
                  ref={brandLogoRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e, true)}
                />
                {indiaForm.brandLogo && (
                  <img
                    src={indiaForm.brandLogo}
                    alt="Brand logo preview"
                    className="w-10 h-10 object-contain"
                  />
                )}
              </div>
            </div>

            {/* Product */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product:
              </label>
              <select
                name="product"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={indiaForm.product}
                onChange={handleIndiaInputChange}
              >
                <option value="">-- Select Product --</option>
                <option value="inverter">Inverter</option>
                <option value="panel">Panel</option>
                <option value="battery">Battery</option>
                <option value="charge-controller">Charge Controller</option>
                <option value="mounting-structure">Mounting Structure</option>
              </select>
            </div>

            {/* Combo Kit Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Combo Kit:
              </label>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${!indiaForm.comboKit ? 'font-medium' : 'text-gray-500'}`}>
                  No
                </span>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${indiaForm.comboKit ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  onClick={() => setIndiaForm({ ...indiaForm, comboKit: !indiaForm.comboKit })}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${indiaForm.comboKit ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
                <span className={`text-sm ${indiaForm.comboKit ? 'font-medium' : 'text-gray-500'}`}>
                  Yes
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {!editMode.isEditing ? (
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={addIndiaManufacturer}
                >
                  Add Manufacturer
                </button>
              ) : (
                <>
                  <button
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    onClick={updateIndiaManufacturerData}
                  >
                    Update Manufacturer
                  </button>
                  <button
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Other Country Form */}
      {selectedCountry && selectedCountry !== 'india' && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-2 border-blue-500">
          <h2 className="text-xl font-semibold mb-4">
            {selectedCountry.charAt(0).toUpperCase() + selectedCountry.slice(1)} Manufacturer Details
          </h2>

          <div className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name:
              </label>
              <input
                name="companyName"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter company name"
                value={otherForm.companyName}
                onChange={handleOtherInputChange}
              />
            </div>

            {/* Company Origin Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Origin Country:
              </label>
              <select
                name="companyOriginCountry"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={otherForm.companyOriginCountry}
                onChange={handleOtherInputChange}
              >
                <option value="">-- Select Country --</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
                <option value="China">China</option>
                <option value="Germany">Germany</option>
                <option value="Japan">Japan</option>
                <option value="South Korea">South Korea</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Brand with Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand:
              </label>
              <input
                name="brand"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                placeholder="Enter brand name"
                value={otherForm.brand}
                onChange={handleOtherInputChange}
              />
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => otherBrandLogoRef.current?.click()}
                >
                  <Upload size={16} />
                  Upload Brand Logo
                </button>
                <input
                  type="file"
                  ref={otherBrandLogoRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e, false)}
                />
                {otherForm.brandLogo && (
                  <img
                    src={otherForm.brandLogo}
                    alt="Brand logo preview"
                    className="w-10 h-10 object-contain"
                  />
                )}
              </div>
            </div>

            {/* Product */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product:
              </label>
              <select
                name="product"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={otherForm.product}
                onChange={handleOtherInputChange}
              >
                <option value="">-- Select Product --</option>
                <option value="inverter">Inverter</option>
                <option value="panel">Panel</option>
                <option value="battery">Battery</option>
                <option value="charge-controller">Charge Controller</option>
                <option value="mounting-structure">Mounting Structure</option>
              </select>
            </div>

            {/* Combo Kit Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Combo Kit:
              </label>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${!otherForm.comboKit ? 'font-medium' : 'text-gray-500'}`}>
                  No
                </span>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${otherForm.comboKit ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  onClick={() => setOtherForm({ ...otherForm, comboKit: !otherForm.comboKit })}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${otherForm.comboKit ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
                <span className={`text-sm ${otherForm.comboKit ? 'font-medium' : 'text-gray-500'}`}>
                  Yes
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {!editMode.isOtherEditing ? (
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={addOtherManufacturer}
                >
                  Add Manufacturer
                </button>
              ) : (
                <>
                  <button
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    onClick={updateOtherManufacturerData}
                  >
                    Update Manufacturer
                  </button>
                  <button
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    onClick={cancelOtherEdit}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manufacturers List Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">Manufacturers List</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { key: null, label: 'Total Manufacturers', value: summary.total, icon: Building2 },
            { key: 'india', label: 'Indian Companies', value: summary.indiaCompanies, icon: MapPin },
            { key: 'foreign', label: 'Foreign Companies', value: summary.foreignCompanies, icon: Globe },
            { key: 'combo', label: 'Combo Kit Enabled', value: summary.comboKitCount, icon: Package }
          ].map((item) => (
            <div
              key={item.label}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${filters.type === item.key
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
                }`}
              onClick={() => handleFilterChange('type', item.key)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">{item.label}</h3>
                  <p className="text-2xl font-bold mt-1">{item.value}</p>
                </div>
                <item.icon className="text-gray-400" size={24} />
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search Company..."
              className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.company}
              onChange={(e) => setFilters({ ...filters, company: e.target.value })}
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search Product..."
              className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.product}
              onChange={(e) => setFilters({ ...filters, product: e.target.value })}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-3 border-b text-sm font-semibold text-gray-600">Logo</th>
                <th className="p-3 border-b text-sm font-semibold text-gray-600">Company</th>
                <th className="p-3 border-b text-sm font-semibold text-gray-600">Country</th>
                <th className="p-3 border-b text-sm font-semibold text-gray-600">State/City/District</th>
                <th className="p-3 border-b text-sm font-semibold text-gray-600">Brand</th>
                <th className="p-3 border-b text-sm font-semibold text-gray-600">Product</th>
                <th className="p-3 border-b text-sm font-semibold text-gray-600">Combo Kit</th>
                <th className="p-3 border-b text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {manufacturers.length > 0 ? (
                manufacturers.map((manufacturer) => (
                  <tr key={manufacturer._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      {manufacturer.brandLogo ? (
                        <img
                          src={manufacturer.brandLogo}
                          alt="Logo"
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500">
                          No Logo
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-medium text-gray-800">{manufacturer.companyName}</td>
                    <td className="p-3 text-gray-600">{manufacturer.companyOriginCountry}</td>
                    <td className="p-3 text-gray-600">
                      {manufacturer.companyOriginCountry === 'India'
                        ? (
                          <span className="text-xs">
                            {manufacturer.state?.name || '-'} / <br />
                            {manufacturer.city?.name || '-'} / <br />
                            {manufacturer.district?.name || '-'}
                          </span>
                        )
                        : 'N/A'
                      }
                    </td>
                    <td className="p-3 text-gray-600">{manufacturer.brand}</td>
                    <td className="p-3 uppercase text-gray-600 text-sm">{manufacturer.product}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${manufacturer.comboKit ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {manufacturer.comboKit ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          onClick={() => editManufacturer(manufacturer)}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          onClick={() => handleDelete(manufacturer._id, manufacturer.companyName)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    {isLoading ? (
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        Loading...
                      </div>
                    ) : 'No manufacturers found matching your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AddBrandManufacturer;