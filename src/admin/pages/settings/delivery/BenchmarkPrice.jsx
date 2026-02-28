import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Edit, Trash2, Loader, X } from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import {
  getDeliveryTypes,
  getBenchmarkPrices,
  createBenchmarkPrice,
  updateBenchmarkPrice,
  deleteBenchmarkPrice
} from '../../../../services/delivery/deliveryApi';
import { locationAPI } from '../../../../api/api';

const DeliveryBenchmarkPrice = () => {
  // Common Location State
  const { countries, states, fetchCountries, fetchStates } = useLocations();

  const [locationCardsVisible, setLocationCardsVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Data
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [benchmarkPrices, setBenchmarkPrices] = useState([]);

  // Hierarchical Location Selection
  const [selectedState, setSelectedState] = useState('');
  const [selectedStateName, setSelectedStateName] = useState('');
  const [clusterOptions, setClusterOptions] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState('');
  const [selectedClusterName, setSelectedClusterName] = useState('');
  const [districtOptions, setDistrictOptions] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedDistrictName, setSelectedDistrictName] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    deliveryType: '',
    benchmarkPrice: '',
    category: '',
    subCategory: '',
    projectType: '',
    subProjectType: '',
    combokit: ''
  });

  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Initial Fetch
  useEffect(() => {
    fetchCountries();
    loadDeliveryTypes();
  }, []);

  useEffect(() => {
    if (countries.length > 0) {
      const india = countries.find(c => c.name === 'India');
      if (india) fetchStates({ country: india._id });
      else fetchStates({ country: countries[0]._id });
    }
  }, [countries]);

  const loadDeliveryTypes = async () => {
    try {
      const typesRes = await getDeliveryTypes();
      if (typesRes.success) setDeliveryTypes(typesRes.data);
    } catch (error) {
      console.error("Failed to load delivery types");
    }
  };

  const loadBenchmarkPrices = async (districtId) => {
    if (!districtId) return;
    try {
      setDataLoading(true);
      const res = await getBenchmarkPrices({ district: districtId });
      if (res.success) setBenchmarkPrices(res.data);
    } catch (error) {
      showNotification('Failed to load prices for district', 'error');
    } finally {
      setDataLoading(false);
    }
  };

  const refreshPrices = () => {
    if (selectedDistrict) loadBenchmarkPrices(selectedDistrict);
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Location Handlers
  const handleStateSelect = async (stateId, stateName) => {
    setSelectedState(stateId);
    setSelectedStateName(stateName);

    // Reset downward
    setSelectedCluster('');
    setSelectedClusterName('');
    setClusterOptions([]);
    setSelectedDistrict('');
    setSelectedDistrictName('');
    setDistrictOptions([]);
    setBenchmarkPrices([]);

    try {
      const res = await locationAPI.getAllClusters({ state: stateId, isActive: 'true' });
      if (res.data && res.data.data) {
        setClusterOptions(res.data.data);
      }
    } catch (e) {
      console.error("Error fetching clusters", e);
    }
  };

  const handleClusterSelect = async (clusterId, clusterName) => {
    setSelectedCluster(clusterId);
    setSelectedClusterName(clusterName);

    // Reset downward
    setSelectedDistrict('');
    setSelectedDistrictName('');
    setDistrictOptions([]);
    setBenchmarkPrices([]);

    try {
      const res = await locationAPI.getAllDistricts({ cluster: clusterId, isActive: 'true' });
      if (res.data && res.data.data) {
        setDistrictOptions(res.data.data);
      }
    } catch (e) {
      console.error("Error fetching districts", e);
    }
  };

  const handleDistrictSelect = (districtId, districtName) => {
    setSelectedDistrict(districtId);
    setSelectedDistrictName(districtName);
    loadBenchmarkPrices(districtId);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      deliveryType: '',
      benchmarkPrice: '',
      category: '',
      subCategory: '',
      projectType: '',
      subProjectType: '',
      combokit: ''
    });
  };

  const handleSubmit = async () => {
    if (!selectedDistrict) {
      showNotification('Please select a district first', 'error');
      return;
    }
    if (!formData.deliveryType || !formData.benchmarkPrice) {
      showNotification('Delivery Type and Benchmark Price are required', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        state: selectedState,
        cluster: selectedCluster,
        district: selectedDistrict,
        status: 'active'
      };

      await createBenchmarkPrice(payload);
      showNotification('Benchmark price created successfully', 'success');
      refreshPrices();
      resetForm();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white font-medium ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[#1e293b]">Delivery Benchmark Price</h1>
          <button
            className="mt-2 bg-[#0ea5e9] text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 hover:bg-[#0284c7] transition"
            onClick={() => setLocationCardsVisible(!locationCardsVisible)}
          >
            {locationCardsVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            {locationCardsVisible ? 'Hide Location Cards' : 'Show Location Cards'}
          </button>
        </div>
      </div>

      {/* Hierarchy Selection Cards */}
      {locationCardsVisible && (
        <div className="space-y-6 mb-8">
          {/* State Section */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3">Select State</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {states.map(state => (
                <div
                  key={state._id}
                  className={`border rounded-md p-4 text-center cursor-pointer transition-colors flex justify-center items-center h-20 shadow-sm ${selectedState === state._id
                      ? 'bg-[#7dd3fc] border-[#38bdf8] text-slate-800'
                      : 'bg-white border-gray-200 hover:border-[#38bdf8]'
                    }`}
                  onClick={() => handleStateSelect(state._id, state.name)}
                >
                  <div>
                    <div className="font-semibold text-sm">{state.name}</div>
                    <div className="text-xs text-gray-500 mt-1 uppercase">{state.name.substring(0, 2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cluster Section */}
          {selectedState && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="text-lg font-bold text-slate-800 mb-3">Select Cluster</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {clusterOptions.length === 0 ? <p className="text-sm text-gray-500">No clusters found.</p> :
                  clusterOptions.map(cluster => (
                    <div
                      key={cluster._id}
                      className={`border rounded-md p-4 text-center cursor-pointer transition-colors flex justify-center items-center h-20 shadow-sm ${selectedCluster === cluster._id
                          ? 'bg-[#e0f2fe] border-[#7dd3fc] text-slate-800'
                          : 'bg-white border-gray-200 hover:border-[#7dd3fc]'
                        }`}
                      onClick={() => handleClusterSelect(cluster._id, cluster.name)}
                    >
                      <div>
                        <div className="font-semibold text-sm">{cluster.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{selectedStateName}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* District Section */}
          {selectedCluster && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="text-lg font-bold text-slate-800 mb-3">Select District</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {districtOptions.length === 0 ? <p className="text-sm text-gray-500">No districts found.</p> :
                  districtOptions.map(district => (
                    <div
                      key={district._id}
                      className={`border rounded-md p-4 text-center cursor-pointer transition-colors flex justify-center items-center h-20 shadow-sm ${selectedDistrict === district._id
                          ? 'bg-[#f0f9ff] border-[#bae6fd] text-slate-800'
                          : 'bg-white border-gray-200 hover:border-[#bae6fd]'
                        }`}
                      onClick={() => handleDistrictSelect(district._id, district.name)}
                    >
                      <div>
                        <div className="font-semibold text-sm">{district.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{selectedClusterName}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Matrix & Data Table (Only visible when District is selected) */}
      {selectedDistrict ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-6 animate-in fade-in duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#1e293b] text-white text-xs font-semibold tracking-wide">
                <tr>
                  <th className="px-4 py-3">Delivery Type</th>
                  <th className="px-4 py-3">Cluster</th>
                  <th className="px-4 py-3">Benchmark Price</th>
                  <th className="px-4 py-3">Category Type</th>
                  <th className="px-4 py-3">Sub Category</th>
                  <th className="px-4 py-3">Project Type</th>
                  <th className="px-4 py-3">Sub Project Type</th>
                  <th className="px-4 py-3">Combokit Selection</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {/* Creation Form Row */}
                <tr className="bg-slate-50">
                  <td className="px-2 py-2">
                    <select
                      name="deliveryType"
                      value={formData.deliveryType}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                    >
                      <option value="">Select Type</option>
                      {deliveryTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      disabled
                      value={selectedClusterName}
                      className="w-full text-xs p-2 border border-slate-300 rounded bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      name="benchmarkPrice"
                      value={formData.benchmarkPrice}
                      onChange={handleInputChange}
                      placeholder="e.g. 5000"
                      className="w-full text-xs p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                    >
                      <option value="">Category</option>
                      <option value="Solar Panel">Solar Panel</option>
                      <option value="Water Heater">Water Heater</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                    >
                      <option value="">Sub Category</option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                    >
                      <option value="">Project Type</option>
                      <option value="1kw-10kw">1kw-10kw</option>
                      <option value="11kw-50kw">11kw-50kw</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      name="subProjectType"
                      value={formData.subProjectType}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                    >
                      <option value="">Sub P. Type</option>
                      <option value="On Grid">On Grid</option>
                      <option value="Off Grid">Off Grid</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      name="combokit"
                      value={formData.combokit}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                    >
                      <option value="">Select Combokit</option>
                      <option value="Standard Kit">Standard Kit</option>
                      <option value="Premium Kit">Premium Kit</option>
                      <option value="Custom Kit">Custom Kit</option>
                    </select>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="bg-[#0ea5e9] text-white px-4 py-2 rounded text-xs font-bold hover:bg-[#0284c7] transition flex items-center justify-center w-full"
                    >
                      {loading ? <Loader size={12} className="animate-spin" /> : 'Create'}
                    </button>
                  </td>
                </tr>

                {/* Data Rows */}
                {dataLoading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8">
                      <Loader className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Loading prices for {selectedDistrictName}...</p>
                    </td>
                  </tr>
                ) : benchmarkPrices.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-gray-500 text-sm">
                      No benchmark prices set for {selectedDistrictName}. Create one above!
                    </td>
                  </tr>
                ) : (
                  benchmarkPrices.map((price) => (
                    <tr key={price._id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-800">{price.deliveryType?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-600">{price.cluster?.name || selectedClusterName}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">₹{price.benchmarkPrice}</td>
                      <td className="px-4 py-3 text-slate-600">{price.category || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{price.subCategory || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{price.projectType || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{price.subProjectType || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{price.combokit || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(price._id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-lg border border-dashed border-gray-300 text-gray-400">
          <p>Please navigate the locations and select a District to view/set Benchmark Prices.</p>
        </div>
      )}

      {/* Footer text matching screenshot */}
      <div className="mt-8 text-center text-xs text-gray-400 font-medium">
        Copyright © 2025 Solarkits. All Rights Reserved.
      </div>
    </div>
  );
};

export default DeliveryBenchmarkPrice;