import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Edit, Trash2, Plus, AlertCircle, Loader, Search } from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import {
  getDeliveryTypes,
  getBenchmarkPrices,
  createBenchmarkPrice,
  updateBenchmarkPrice,
  deleteBenchmarkPrice
} from '../../../../services/delivery/deliveryApi';

const DeliveryBenchmarkPrice = () => {
  // State management
  const [locationCardsVisible, setLocationCardsVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Data
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [benchmarkPrices, setBenchmarkPrices] = useState([]);

  // Location Selection State
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const [showFormWrapper, setShowFormWrapper] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [editingId, setEditingId] = useState(null);

  // Dynamic Location Data
  const {
    states,
    cities,
    districts,
    fetchStates,
    fetchCities,
    fetchDistricts
  } = useLocations();

  // Form data
  const [formData, setFormData] = useState({
    deliveryType: '',
    benchmarkPrice: '',
    status: 'active'
    // Simplified model only has these fields + deliveryType ref
  });

  // Fetch initial data
  useEffect(() => {
    fetchStates();
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setDataLoading(true);
      const [typesRes, pricesRes] = await Promise.all([
        getDeliveryTypes(),
        getBenchmarkPrices()
      ]);

      if (typesRes.success) setDeliveryTypes(typesRes.data);
      if (pricesRes.success) setBenchmarkPrices(pricesRes.data);
    } catch (error) {
      showNotification('Failed to load data', 'error');
    } finally {
      setDataLoading(false);
    }
  };

  const refreshPrices = async () => {
    try {
      const response = await getBenchmarkPrices();
      if (response.success) setBenchmarkPrices(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Handle state selection
  const handleStateSelect = (stateId) => {
    const state = states.find(s => s._id === stateId);
    if (state) {
      setSelectedState(state);
      setSelectedCity('');
      setSelectedDistrict('');
      fetchCities({ stateId: state._id });
      setShowFormWrapper(false);
    }
  };

  // Handle city selection
  const handleCitySelect = (cityId) => {
    const city = cities.find(c => c._id === cityId);
    if (city) {
      setSelectedCity(city);
      setSelectedDistrict('');
      fetchDistricts({ cityId: city._id });
    }
  };

  // Handle district selection
  const handleDistrictSelect = (districtId) => {
    const district = districts.find(d => d._id === districtId);
    if (district) {
      setSelectedDistrict(district);
      setShowFormWrapper(true);
      showNotification(`Location set to ${district.name}`, 'success');
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      deliveryType: '',
      benchmarkPrice: '',
      status: 'active'
    });
    setEditingId(null);
  };

  // Handle create/update
  const handleSubmit = async () => {
    if (!formData.deliveryType || !formData.benchmarkPrice) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    /* 
       NOTE: The user requirement mentions linking with location.
       However, the database schema provided in the prompt for `DeliveryBenchmarkPrices` 
       ONLY has: `deliveryTypeId`, `benchmarkPrice`, `status`, `timestamps`.
       It DOES NOT satisfy the location-specific requirement in the schema definition.
       
       BUT, to make it "Fully Dynamic" and distinct per location as implied by the UI refactor,
       I will proceed with the schema I created which matched the user request exactly.
       The user request was:
       DeliveryBenchmarkPrices
       - deliveryTypeId (reference DeliveryTypes)
       - benchmarkPrice
       - status
       - timestamps

       This implies global benchmark price per delivery type?
       Or did the user miss fields?
       "DeliveryBenchmarkPrice.jsx - Link with Delivery Type - Prevent duplicate benchmark per location/type"
       
       If the schema doesn't have location fields, I can't save them.
       I will implement it as per the schema requested.
       However, the previous UI strongly suggests location dependency.
       If I strictly follow "EXPECTED OUTPUT" schema, I lose location specificity.
       
       I will assume for now that I should follow the Schema strictly.
       If so, location selection is just for context/viewing or maybe filtering, 
       but if the model doesn't store it, I can't persist it.
       
       Wait, let's re-read the schema request carefully.
       "DeliveryBenchmarkPrices - deliveryTypeId - benchmarkPrice - status"
       Nothing else.
       
       However, "Prevent duplicate benchmark per location/type" in features list implies location is needed.
       I will ADD location references to the Schema if I can, but I must follow instructions.
       The instructions explicitly listed the fields.
       
       Maybe "Location" is implicit or I missed it?
       No, I double checked.
       
       I will follow the Schema fields.
       If the User wants location specific pricing, they presumably would have asked for location fields.
       OR, maybe `DeliveryType` itself is location specific? No, `DeliveryType` has `name`, `description`.
       
       I will implement global benchmark price per delivery type for now, as per schema.
       But I will keep the location selector UI as a "Filter" or "Context" if applicable, 
       or maybe the user intends to add location later.
       Actually, I'll hide the location selection if it's not relevant to saving data, 
       BUT the user asked to "Link with Delivery Type" and "Prevent duplicate benchmark per location/type".
       This is a contradiction.
       
       I will stick to the schema fields. It's safer.
       The location selection might be for a future feature or I should just implement the schema.
       I'll update the UI to just manage Benchmark Prices per Delivery Type.
       
    */

    try {
      setLoading(true);
      if (editingId) {
        await updateBenchmarkPrice(editingId, formData);
        showNotification('Benchmark price updated', 'success');
      } else {
        await createBenchmarkPrice(formData);
        showNotification('Benchmark price created', 'success');
      }
      refreshPrices();
      resetForm();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (price) => {
    setEditingId(price._id);
    setFormData({
      deliveryType: price.deliveryType._id,
      benchmarkPrice: price.benchmarkPrice,
      status: price.status
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this benchmark price?')) {
      try {
        await deleteBenchmarkPrice(id);
        showNotification('Benchmark price deleted', 'success');
        refreshPrices();
      } catch (error) {
        showNotification('Delete failed', 'error');
      }
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-800">Delivery Benchmark Prices</h1>
        <p className="text-gray-600">Manage base prices for delivery types</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingId ? 'Edit Benchmark Price' : 'Add Benchmark Price'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="deliveryType"
                  value={formData.deliveryType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">Select Delivery Type</option>
                  {deliveryTypes.filter(t => t.status === 'active').map(type => (
                    <option key={type._id} value={type._id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Benchmark Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="benchmarkPrice"
                  value={formData.benchmarkPrice}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex space-x-3">
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex justify-center items-center"
                >
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : (editingId ? 'Update' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Existing Benchmark Prices</h3>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{benchmarkPrices.length} Records</span>
            </div>

            {dataLoading ? (
              <div className="p-8 text-center">
                <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              </div>
            ) : benchmarkPrices.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No benchmark prices found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-gray-600 text-sm">
                    <tr>
                      <th className="px-6 py-3 text-left">Delivery Type</th>
                      <th className="px-6 py-3 text-left">Price</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {benchmarkPrices.map((price) => (
                      <tr key={price._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {price.deliveryType?.name || 'Unknown Type'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          ₹{price.benchmarkPrice}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${price.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {price.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(price)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(price._id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryBenchmarkPrice;