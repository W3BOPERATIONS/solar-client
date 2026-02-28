import React, { useState, useEffect } from 'react';
import {
  Truck, Plus, Search, Loader, EyeOff, Eye,
  Settings, Map, Tag, Clock, DollarSign, AlertCircle, Save, Check
} from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import {
  getDeliveryTypes,
  createDeliveryType,
  updateDeliveryType,
  deleteDeliveryType
} from '../../../../services/delivery/deliveryApi';
import { locationAPI } from '../../../../api/api';

const SECTION_OPTIONS = [
  { id: 'setup', label: 'Delivery Type Setup' },
  { id: 'coverage', label: 'Coverage Area' },
  { id: 'categories', label: 'Category Types' },
  { id: 'timing', label: 'Delivery Timing' },
  { id: 'cost', label: 'Cost & Charges' },
  { id: 'restrictions', label: 'Restrictions' },
];

const INITIAL_FORM_STATE = {
  name: '',
  description: '',
  coverageType: [],
  applicableCategories: [
    { category: 'Solar Rooftop', subCategory: 'Residential', projectType: '3kw - 5kw', subProjectType: 'On-Grid', cost: 500, isActive: true },
    { category: 'Solar Rooftop', subCategory: 'Commercial', projectType: '30kw - 50kw', subProjectType: 'Hybrid', cost: 500, isActive: true },
    { category: 'Solar Rooftop', subCategory: 'Residential', projectType: '5kw - 10kw', subProjectType: 'On-Grid', cost: 500, isActive: true },
    { category: 'Solar Rooftop', subCategory: 'Commercial', projectType: '10kw - 25kw', subProjectType: 'On-Grid', cost: 500, isActive: true },
    { category: 'Solar Rooftop', subCategory: 'Residential', projectType: '3kw - 5kw', subProjectType: 'On-Grid', cost: 500, isActive: true },
  ],
  deliveryTiming: {
    minDays: 3,
    maxDays: 5,
    estimatedDelivery: '3-5 Days'
  },
  status: 'active'
};

const DeliveryType = () => {
  // Common Location State
  const { countries, states, fetchCountries, fetchStates } = useLocations();

  const [locationCardsVisible, setLocationCardsVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Data
  const [deliveryTypes, setDeliveryTypes] = useState([]);

  // Tab State
  const [activeTabId, setActiveTabId] = useState('new'); // 'new' or valid mapped delivery type ID
  const [activeSection, setActiveSection] = useState('setup');

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
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // Initial Fetch
  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (countries.length > 0) {
      const india = countries.find(c => c.name === 'India');
      if (india) fetchStates({ country: india._id });
      else fetchStates({ country: countries[0]._id });
    }
  }, [countries]);

  const loadDeliveryTypes = async (districtId) => {
    if (!districtId) return;
    try {
      setDataLoading(true);
      const res = await getDeliveryTypes({ district: districtId });
      if (res.success) {
        setDeliveryTypes(res.data);
        if (res.data.length > 0) {
          handleTabSwitch(res.data[0]);
        } else {
          setActiveTabId('new');
        }
      }
    } catch (error) {
      showNotification('Failed to load delivery types for district', 'error');
    } finally {
      setDataLoading(false);
    }
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
    setSelectedCluster('');
    setSelectedClusterName('');
    setClusterOptions([]);
    setSelectedDistrict('');
    setSelectedDistrictName('');
    setDistrictOptions([]);
    setDeliveryTypes([]);
    setActiveTabId('new');

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
    setSelectedDistrict('');
    setSelectedDistrictName('');
    setDistrictOptions([]);
    setDeliveryTypes([]);
    setActiveTabId('new');

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
    loadDeliveryTypes(districtId);
  };

  // Form Handlers
  const handleTabSwitch = (type) => {
    if (type === 'new') {
      setActiveTabId('new');
      setFormData(INITIAL_FORM_STATE);
    } else {
      setActiveTabId(type._id);
      setFormData({
        name: type.name || '',
        description: type.description || '',
        coverageType: type.coverageType || [],
        applicableCategories: type.applicableCategories?.length ? type.applicableCategories : INITIAL_FORM_STATE.applicableCategories,
        deliveryTiming: type.deliveryTiming || INITIAL_FORM_STATE.deliveryTiming,
        status: type.status || 'active'
      });
    }
    setActiveSection('setup');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCoverageToggle = (type) => {
    setFormData(prev => {
      const current = prev.coverageType || [];
      if (current.includes(type)) {
        return { ...prev, coverageType: current.filter(t => t !== type) };
      } else {
        return { ...prev, coverageType: [...current, type] };
      }
    });
  };

  const handleCategoryCostChange = (index, newCost) => {
    const newCategories = [...formData.applicableCategories];
    newCategories[index].cost = Number(newCost);
    setFormData(prev => ({ ...prev, applicableCategories: newCategories }));
  };

  const handleCategoryToggle = (index) => {
    const newCategories = [...formData.applicableCategories];
    newCategories[index].isActive = !newCategories[index].isActive;
    setFormData(prev => ({ ...prev, applicableCategories: newCategories }));
  };

  const handleTimingChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      deliveryTiming: {
        ...prev.deliveryTiming,
        [name]: name === 'estimatedDelivery' ? value : Number(value)
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedDistrict) {
      showNotification('Please select a district first', 'error');
      return;
    }
    if (!formData.name) {
      showNotification('Delivery Type Name is required', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        state: selectedState,
        cluster: selectedCluster,
        district: selectedDistrict
      };

      if (activeTabId === 'new') {
        const res = await createDeliveryType(payload);
        showNotification('Delivery type created successfully', 'success');
        loadDeliveryTypes(selectedDistrict);
      } else {
        await updateDeliveryType(activeTabId, payload);
        showNotification('Delivery type updated successfully', 'success');
        loadDeliveryTypes(selectedDistrict);
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white font-medium ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[#1e293b] flex items-center">
            <Truck className="w-6 h-6 text-blue-600 mr-2" />
            Delivery Management
          </h1>
        </div>
        <button
          className="bg-[#0ea5e9] text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 hover:bg-[#0284c7] transition"
          onClick={() => setLocationCardsVisible(!locationCardsVisible)}
        >
          {locationCardsVisible ? <EyeOff size={14} /> : <Eye size={14} />}
          {locationCardsVisible ? 'Hide Location Cards' : 'Show Location Cards'}
        </button>
      </div>

      {/* Hierarchy Selection Cards */}
      {locationCardsVisible && (
        <div className="space-y-6 mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3">Select State</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {states.map(state => (
                <div
                  key={state._id}
                  className={`border rounded-md p-4 text-center cursor-pointer transition-colors shadow-sm ${selectedState === state._id
                    ? 'bg-blue-50 border-blue-400 text-blue-800 ring-1 ring-blue-400'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                  onClick={() => handleStateSelect(state._id, state.name)}
                >
                  <div className="font-semibold text-sm">{state.name}</div>
                  <div className="text-xs text-gray-400 mt-1 uppercase">{state.name.substring(0, 2)}</div>
                </div>
              ))}
            </div>
          </div>

          {selectedState && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="text-lg font-bold text-slate-800 mb-3">Select Cluster</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {clusterOptions.map(cluster => (
                  <div
                    key={cluster._id}
                    className={`border rounded-md p-4 text-center cursor-pointer transition-colors shadow-sm ${selectedCluster === cluster._id
                      ? 'bg-blue-50 border-blue-400 text-blue-800 ring-1 ring-blue-400'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => handleClusterSelect(cluster._id, cluster.name)}
                  >
                    <div className="font-semibold text-sm">{cluster.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{selectedStateName}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedCluster && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="text-lg font-bold text-slate-800 mb-3">Select District</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {districtOptions.map(district => (
                  <div
                    key={district._id}
                    className={`border rounded-md p-4 text-center cursor-pointer transition-colors shadow-sm ${selectedDistrict === district._id
                      ? 'bg-blue-50 border-blue-400 text-blue-800 ring-1 ring-blue-400'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => handleDistrictSelect(district._id, district.name)}
                  >
                    <div className="font-semibold text-sm">{district.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{selectedClusterName}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Configuration Content (Shown when district selected) */}
      {selectedDistrict ? (
        <div className="mt-8 animate-in fade-in duration-500">
          {/* Dynamic Tabs */}
          <div className="flex items-center space-x-4 mb-6 pb-2 overflow-x-auto justify-center">
            {deliveryTypes.map((type, index) => {
              const isActive = activeTabId === type._id;
              // Cycle through some colors if inactive to match screenshot (blue, green)
              let inactiveColor = 'text-[#0ea5e9]';
              if (index % 2 !== 0) inactiveColor = 'text-[#22c55e]';

              return (
                <button
                  key={type._id}
                  onClick={() => handleTabSwitch(type)}
                  className={`px-4 py-2 rounded-md font-bold text-sm transition-colors whitespace-nowrap flex items-center ${isActive
                      ? 'bg-[#64748b] text-white shadow-sm'
                      : `bg-transparent ${inactiveColor} hover:bg-gray-50`
                    }`}
                >
                  <Truck size={16} className="mr-2" />
                  {type.name}
                </button>
              )
            })}
            <button
              onClick={() => handleTabSwitch('new')}
              className={`px-4 py-2 rounded-md font-bold text-sm transition-colors whitespace-nowrap flex items-center bg-[#1e293b] text-white hover:bg-slate-800 shadow-sm ${activeTabId === 'new' ? 'ring-2 ring-offset-2 ring-[#1e293b]' : ''
                }`}
            >
              <Plus size={16} className="mr-1" /> Add Delivery Type
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Left Sidebar - Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                <div className="bg-[#0284c7] text-white p-4 font-bold rounded-t-lg flex items-center">
                  <Truck size={18} className="mr-2" /> Delivery Sections
                </div>
                <div className="p-2 space-y-1 bg-white pt-2 rounded-b-lg">
                  {SECTION_OPTIONS.map(opt => {
                    const isActive = activeSection === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setActiveSection(opt.id)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium transition-colors ${isActive
                            ? 'bg-[#007bff] text-white rounded-md'
                            : 'text-slate-600 hover:bg-gray-50'
                          }`}
                      >
                        <Check size={16} strokeWidth={3} className={`mr-3 ${isActive ? 'text-white' : 'text-green-500'}`} />
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right Content - Form */}
            <div className="lg:col-span-3">
              <div className="mb-6 flex justify-between items-center border-b pb-2">
                <div>
                  <h2 className="text-2xl font-bold text-[#0284c7] flex items-center">
                    <Truck size={24} className="mr-2" />
                    {activeTabId === 'new' ? 'New Delivery Configuration' : formData.name}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">Configure settings for {formData.name || 'this delivery type'}</p>
                </div>

                {/* Live Output/Preview Card matching the right side of the screenshot */}
                <div className="bg-white border shadow-sm rounded-lg w-72 text-sm hidden md:block overflow-hidden pb-4">
                  <div className={`p-5 flex justify-between items-start ${activeTabId === 'new' ? 'bg-[#1e293b]' : 'bg-[#64748b]'} text-white`}>
                    <div className="font-bold uppercase tracking-wider text-xl leading-tight w-28">
                      {formData.name || 'PREMIUM DELIVERY'}
                    </div>
                    <span className="text-[10px] bg-white text-gray-800 px-2.5 py-1 rounded shadow-sm font-bold">Premium Access</span>
                  </div>
                  <div className="p-5">
                    <div className="text-xs text-gray-500 mb-6">{formData.description || 'Premium service with white-glove delivery'}</div>
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <div className="text-3xl font-bold text-gray-900 leading-none mb-1">₹{formData.applicableCategories[0]?.cost || '2,000'}</div>
                        <div className="text-[10px] text-gray-500">base charge</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-800 text-sm mb-1">{formData.deliveryTiming.estimatedDelivery || 'Same Day'}</div>
                        <div className="text-[10px] text-gray-500">Delivery Time</div>
                      </div>
                    </div>
                    <div className="text-xs space-y-2 text-gray-700">
                      <p>Coverage: <span className="font-medium">{formData.coverageType.join(', ') || 'Full State'}</span></p>
                      <p>Access: <span className="font-medium">Premium Access</span></p>
                      <p className="font-bold mt-4 mb-2 text-gray-900 text-[13px]">Features:</p>
                      <div className="flex items-center">
                        <div className="bg-[#e0f2fe] rounded-full p-0.5 mr-2 shadow-sm"><Check size={12} className="text-[#0ea5e9]" strokeWidth={3} /></div>
                        <span>{formData.deliveryTiming.estimatedDelivery || 'Same Day'} Delivery</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Form Sections Based on activeSection */}
              <div className="space-y-6">

                {/* Setup */}
                <div className={`bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden ${activeSection === 'setup' || activeSection === 'all' ? 'block' : 'hidden'}`}>
                  <div className="bg-[#0284c7] text-white p-3 font-bold text-sm flex justify-between">
                    <span>Delivery Type Setup</span>
                    <span className="bg-white text-blue-700 text-xs px-2 py-0.5 rounded font-bold">Required</span>
                  </div>
                  <div className="p-4 bg-white">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Delivery Type Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      placeholder="e.g. Standard Delivery"
                    />
                  </div>
                </div>

                {/* Coverage */}
                <div className={`bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden ${activeSection === 'coverage' || activeSection === 'all' ? 'block' : 'hidden'}`}>
                  <div className="bg-[#22c55e] text-white p-3 font-bold text-sm">
                    Coverage Area
                  </div>
                  <div className="p-4 bg-white">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Coverage Type</p>
                    <div className="flex space-x-8">
                      {['Cluster', 'District', 'State'].map(type => (
                        <label key={type} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.coverageType.includes(type)}
                            onChange={() => handleCoverageToggle(type)}
                            className="rounded text-green-500 focus:ring-green-500 w-4 h-4 cursor-pointer accent-green-600"
                          />
                          <span className="text-sm text-gray-700 font-medium">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Categories & Costs */}
                <div className={`bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden ${activeSection === 'categories' || activeSection === 'all' ? 'block' : 'hidden'}`}>
                  <div className="bg-[#0ea5e9] text-white p-3 font-bold text-sm">
                    Applicable Categories
                  </div>
                  <div className="p-0 bg-white overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-[#7dd3fc] text-white font-semibold">
                        <tr>
                          <th className="px-4 py-2 border-r border-[#38bdf8]">Applicable</th>
                          <th className="px-4 py-2 border-r border-[#38bdf8]">Category</th>
                          <th className="px-4 py-2 border-r border-[#38bdf8]">Sub Category</th>
                          <th className="px-4 py-2 border-r border-[#38bdf8]">Project Type</th>
                          <th className="px-4 py-2 border-r border-[#38bdf8]">Sub Project Type</th>
                          <th className="px-4 py-2">Cost (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {formData.applicableCategories.map((cat, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-center border-r border-gray-100">
                              <input
                                type="checkbox"
                                checked={cat.isActive}
                                onChange={() => handleCategoryToggle(i)}
                                className="rounded text-[#0ea5e9] focus:ring-[#0ea5e9] w-4 h-4 accent-[#0ea5e9]"
                              />
                            </td>
                            <td className="px-4 py-3 border-r border-gray-100 text-gray-700">{cat.category}</td>
                            <td className="px-4 py-3 border-r border-gray-100 text-gray-700">{cat.subCategory}</td>
                            <td className="px-4 py-3 border-r border-gray-100 text-gray-700">{cat.projectType}</td>
                            <td className="px-4 py-3 border-r border-gray-100 text-gray-700">{cat.subProjectType}</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={cat.cost}
                                onChange={(e) => handleCategoryCostChange(i, e.target.value)}
                                min="0"
                                disabled={!cat.isActive}
                                className={`w-32 px-3 py-1 border rounded focus:ring-2 focus:ring-[#0ea5e9] outline-none text-sm ${!cat.isActive && 'bg-gray-100 text-gray-400'}`}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Delivery Timing */}
                <div className={`bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden ${activeSection === 'timing' || activeSection === 'all' ? 'block' : 'hidden'}`}>
                  <div className="bg-[#eab308] text-white p-3 font-bold text-sm">
                    Delivery Timing
                  </div>
                  <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Minimum Days</label>
                      <input
                        type="number"
                        name="minDays"
                        value={formData.deliveryTiming.minDays}
                        onChange={handleTimingChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#eab308] outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Maximum Days</label>
                      <input
                        type="number"
                        name="maxDays"
                        value={formData.deliveryTiming.maxDays}
                        onChange={handleTimingChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#eab308] outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Estimated Delivery (Text)</label>
                      <input
                        type="text"
                        name="estimatedDelivery"
                        value={formData.deliveryTiming.estimatedDelivery}
                        onChange={handleTimingChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#eab308] outline-none text-sm"
                        placeholder="e.g. 3-5 Days"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Save Layout Action */}
              <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-[#1e293b] text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 hover:shadow-lg transition-all flex items-center"
                >
                  {loading ? <Loader size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  Save Delivery Settings
                </button>
              </div>

            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-dashed border-gray-300 text-gray-400">
          <Truck size={48} className="text-gray-200 mb-4" />
          <p className="text-lg">Please select a District.</p>
          <p className="text-sm font-medium mt-1 text-gray-300">Delivery configurations are managed on a per-district basis.</p>
        </div>
      )}

      {/* Footer text matching screenshot */}
      <div className="mt-8 text-center text-xs text-gray-400 font-medium pb-4">
        Copyright © 2025 Solarkits. All Rights Reserved.
      </div>
    </div>
  );
};

export default DeliveryType;