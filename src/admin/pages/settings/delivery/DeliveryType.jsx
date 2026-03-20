import React, { useState, useEffect } from 'react';
import {
  Truck, Plus, Search, Loader, EyeOff, Eye,
  Settings, Map, Tag, Clock, DollarSign, AlertCircle, Save, Check
} from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import Select from 'react-select';
import {
  getDeliveryTypes,
  createDeliveryType,
  updateDeliveryType,
  deleteDeliveryType
} from '../../../../services/delivery/deliveryApi';
import { getAllOrderProcurementSettings } from '../../../../services/settings/orderProcurementSettingApi';
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
  coverageRange: '',
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
    estimatedDelivery: '3-5 Days',
    procurementResults: []
  },
  coverageType: [],
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
  const [deliveryStats, setDeliveryStats] = useState({ country: {}, state: {}, cluster: {}, district: {} });

  // Hierarchical Location Selection
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCountryName, setSelectedCountryName] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedStateName, setSelectedStateName] = useState('');
  const [clusterOptions, setClusterOptions] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState('');
  const [selectedClusterName, setSelectedClusterName] = useState('');
  const [selectedAllClusters, setSelectedAllClusters] = useState(false);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedDistrictName, setSelectedDistrictName] = useState('');
  const [selectedAllDistricts, setSelectedAllDistricts] = useState(false);
  const [selectedAllStates, setSelectedAllStates] = useState(false);

  // Form State
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [procurementOptions, setProcurementOptions] = useState([]);

  // Initial Fetch
  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchDeliveryStats = async () => {
    try {
      const res = await getDeliveryTypes(); // Fetch all
      if (res.success && res.data) {
        const stats = { country: {}, state: {}, cluster: {}, district: {} };

        // We need state-to-country mapping because DeliveryType doesn't store country
        // but states list from useLocations has it.
        // If states isn't loaded yet, country counts will be updated later.

        res.data.forEach(type => {
          if (type.state?._id) stats.state[type.state._id] = (stats.state[type.state._id] || 0) + 1;
          if (type.cluster?._id) stats.cluster[type.cluster._id] = (stats.cluster[type.cluster._id] || 0) + 1;
          if (type.district?._id) stats.district[type.district._id] = (stats.district[type.district._id] || 0) + 1;
        });

        // Calculate Country counts by summing state counts
        states.forEach(state => {
          const cId = state.country?._id || state.country;
          if (cId && stats.state[state._id]) {
            stats.country[cId] = (stats.country[cId] || 0) + stats.state[state._id];
          }
        });

        setDeliveryStats(stats);
      }
    } catch (error) {
      console.error("Failed to fetch delivery stats", error);
    }
  };

  useEffect(() => {
    fetchDeliveryStats();
  }, [states]); // Re-calculate country stats when states are loaded

  useEffect(() => {
    const fetchProcurementSettings = async () => {
      try {
        const res = await getAllOrderProcurementSettings();
        if (res.success && res.data) {
          const options = res.data.map(item => ({
            value: item._id,
            label: `${item.category?.name || item.category} - ${item.subCategory?.name || item.subCategory} (${item.projectType?.name || item.projectType})`
          }));
          setProcurementOptions(options);
        }
      } catch (error) {
        console.error("Failed to fetch procurement settings", error);
      }
    };
    fetchProcurementSettings();
  }, []);

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
  const handleCountrySelect = (countryId, countryName) => {
    setSelectedCountry(countryId);
    setSelectedCountryName(countryName);

    // Fetch states for this country
    // Note: useLocations hook uses fetchStates({ countryId: ... })
    fetchStates({ countryId: countryId });

    // Reset subsequent selections
    setSelectedState('');
    setSelectedStateName('');
    setSelectedAllStates(false);
    setClusterOptions([]);
    setSelectedCluster('');
    setSelectedClusterName('');
    setSelectedAllClusters(false);
    setDistrictOptions([]);
    setSelectedDistrict('');
    setSelectedDistrictName('');
    setSelectedAllDistricts(false);
    setDeliveryTypes([]);
    setActiveTabId('new');
  };

  const handleStateSelect = async (stateId, stateName) => {
    if (stateId === 'all') {
      setSelectedState('all');
      setSelectedStateName('All States');
      setSelectedAllStates(true);
      setSelectedCluster('');
      setSelectedClusterName('');
      setSelectedAllClusters(false);
      setClusterOptions([]);
      setSelectedDistrict('');
      setSelectedDistrictName('');
      setSelectedAllDistricts(false);
      setDistrictOptions([]);
      setDeliveryTypes([]);
      setActiveTabId('new');

      try {
        // Fetch ALL clusters across all states in the selected country
        const res = await locationAPI.getAllClusters({ countryId: selectedCountry, isActive: 'true' });
        if (res.data && res.data.data) {
          setClusterOptions(res.data.data);
        }
      } catch (e) {
        console.error("Error fetching all clusters", e);
      }
    } else {
      setSelectedState(stateId);
      setSelectedStateName(stateName);
      setSelectedAllStates(false);
      setSelectedCluster('');
      setSelectedClusterName('');
      setSelectedAllClusters(false);
      setClusterOptions([]);
      setSelectedDistrict('');
      setSelectedDistrictName('');
      setSelectedAllDistricts(false);
      setDistrictOptions([]);
      setDeliveryTypes([]);
      setActiveTabId('new');

      try {
        const res = await locationAPI.getAllClusters({ stateId: stateId, isActive: 'true' });
        if (res.data && res.data.data) {
          setClusterOptions(res.data.data);
        }
      } catch (e) {
        console.error("Error fetching clusters", e);
      }
    }
  };

  const handleClusterSelect = async (clusterId, clusterName) => {
    if (clusterId === 'all') {
      setSelectedCluster('all');
      setSelectedClusterName('All Clusters');
      setSelectedAllClusters(true);
      setSelectedDistrict('');
      setSelectedDistrictName('');
      setSelectedAllDistricts(false);
      setDistrictOptions([]);
      setDeliveryTypes([]);
      setActiveTabId('new');

      try {
        // If selectedState is 'all', fetch ALL districts.
        // Otherwise, fetch districts for the given selectedState.
        const queryParams = selectedState === 'all' ? { countryId: selectedCountry, isActive: 'true' } : { stateId: selectedState, isActive: 'true' };
        const res = await locationAPI.getAllDistricts(queryParams);
        if (res.data && res.data.data) {
          setDistrictOptions(res.data.data);
        }
      } catch (e) {
        console.error("Error fetching districts", e);
      }
    } else {
      setSelectedCluster(clusterId);
      setSelectedClusterName(clusterName);
      setSelectedAllClusters(false);
      setSelectedDistrict('');
      setSelectedDistrictName('');
      setSelectedAllDistricts(false);
      setDistrictOptions([]);
      setDeliveryTypes([]);
      setActiveTabId('new');

      try {
        const res = await locationAPI.getAllDistricts({ clusterId: clusterId, isActive: 'true' });
        if (res.data && res.data.data) {
          setDistrictOptions(res.data.data);
        }
      } catch (e) {
        console.error("Error fetching districts", e);
      }
    }
  };

  const handleDistrictSelect = (districtId, districtName) => {
    if (districtId === 'all') {
      setSelectedDistrict('all');
      setSelectedDistrictName('All Districts');
      setSelectedAllDistricts(true);
      setDeliveryTypes([]);
      setActiveTabId('new');
    } else {
      setSelectedDistrict(districtId);
      setSelectedDistrictName(districtName);
      setSelectedAllDistricts(false);
      loadDeliveryTypes(districtId);
    }
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
        coverageRange: type.coverageRange || '',
        applicableCategories: type.applicableCategories?.length ? type.applicableCategories : INITIAL_FORM_STATE.applicableCategories,
        deliveryTiming: type.deliveryTiming || INITIAL_FORM_STATE.deliveryTiming,
        coverageType: type.coverageType || [],
        status: type.status || 'active'
      });
    }
    setActiveSection('setup');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleProcurementChange = (selectedOptions) => {
    setFormData(prev => ({
      ...prev,
      deliveryTiming: {
        ...prev.deliveryTiming,
        procurementResults: selectedOptions ? selectedOptions.map(opt => opt.value) : []
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

      if (selectedAllStates) {
        // If state is "all", it still requires cluster and district to be chosen
        if (!selectedCluster) {
          showNotification('Please select a cluster first', 'error');
          setLoading(false);
          return;
        }
        if (!selectedDistrict) {
          showNotification('Please select a district first', 'error');
          setLoading(false);
          return;
        }
      }

      if (selectedAllStates && selectedAllClusters && selectedAllDistricts) {
        // recursive save all... fallback if needed
      }

      if (selectedAllDistricts) {
        // Save for all districts in the chosen list sequentially
        for (const district of districtOptions) {
          const payload = {
            ...formData,
            state: district.state?._id || district.state || selectedState, // grab exact state from populated district if available
            cluster: district.cluster?._id || district.cluster || selectedCluster,
            district: district._id
          };
          if (payload.state === 'all' || payload.cluster === 'all') continue; // Sanity check
          await createDeliveryType(payload);
        }
        showNotification('Delivery types created for all selected districts', 'success');
        setSelectedDistrict('');
        setSelectedAllDistricts(false);
      } else {
        const payload = {
          ...formData,
          state: selectedState,
          cluster: selectedCluster,
          district: selectedDistrict
        };

        if (activeTabId === 'new') {
          await createDeliveryType(payload);
          showNotification('Delivery type created successfully', 'success');
          loadDeliveryTypes(selectedDistrict);
        } else {
          await updateDeliveryType(activeTabId, payload);
          showNotification('Delivery type updated successfully', 'success');
          loadDeliveryTypes(selectedDistrict);
        }
        fetchDeliveryStats(); // Refresh badges
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
          {/* Country Selection */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3">Select Country</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {countries.map(country => (
                <div
                  key={country._id}
                  className={`relative border rounded-md p-4 text-center cursor-pointer transition-colors shadow-sm ${selectedCountry === country._id
                    ? 'bg-blue-50 border-blue-400 text-blue-800 ring-1 ring-blue-400'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                  onClick={() => handleCountrySelect(country._id, country.name)}
                >
                  <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-blue-200 shadow-sm">
                    {deliveryStats.country[country._id] || 0}
                  </div>
                  <div className="font-semibold text-sm">{country.name}</div>
                  <div className="text-xs text-gray-400 mt-1 uppercase">{country.name.substring(0, 2)}</div>
                </div>
              ))}
            </div>
          </div>

          {selectedCountry && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="text-lg font-bold text-slate-800 mb-3">Select State</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {states.length > 0 && (
                  <div
                    className={`border rounded-md p-4 text-center cursor-pointer transition-colors shadow-sm ${selectedState === 'all'
                      ? 'bg-blue-50 border-blue-400 text-blue-800 ring-1 ring-blue-400'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => handleStateSelect('all', 'All States')}
                  >
                    <div className="font-semibold text-sm">Select All</div>
                    <div className="text-xs text-gray-400 mt-1 uppercase">ALL IN</div>
                  </div>
                )}
                {states.map(state => (
                  <div
                    key={state._id}
                    className={`relative border rounded-md p-4 text-center cursor-pointer transition-colors shadow-sm ${selectedState === state._id
                      ? 'bg-blue-50 border-blue-400 text-blue-800 ring-1 ring-blue-400'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => handleStateSelect(state._id, state.name)}
                  >
                    <div className="absolute top-2 right-2 bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-green-200 shadow-sm">
                      {deliveryStats.state[state._id] || 0}
                    </div>
                    <div className="font-semibold text-sm">{state.name}</div>
                    <div className="text-xs text-gray-400 mt-1 uppercase">{state.name.substring(0, 2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedState && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="text-lg font-bold text-slate-800 mb-3">Select Cluster</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {clusterOptions.length > 0 && (
                  <div
                    className={`border rounded-md p-4 text-center cursor-pointer transition-colors shadow-sm ${selectedCluster === 'all'
                      ? 'bg-blue-50 border-blue-400 text-blue-800 ring-1 ring-blue-400'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => handleClusterSelect('all', 'All Clusters')}
                  >
                    <div className="font-semibold text-sm">Select All</div>
                    <div className="text-xs text-gray-400 mt-1">{selectedStateName}</div>
                  </div>
                )}
                {clusterOptions.map(cluster => (
                  <div
                    key={cluster._id}
                    className={`relative border rounded-md p-4 text-center cursor-pointer transition-colors shadow-sm ${selectedCluster === cluster._id
                      ? 'bg-blue-50 border-blue-400 text-blue-800 ring-1 ring-blue-400'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => handleClusterSelect(cluster._id, cluster.name)}
                  >
                    <div className="absolute top-2 right-2 bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-purple-200 shadow-sm">
                      {deliveryStats.cluster[cluster._id] || 0}
                    </div>
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
                {districtOptions.length > 0 && (
                  <div
                    className={`border rounded-md p-4 text-center cursor-pointer transition-colors shadow-sm ${selectedDistrict === 'all'
                      ? 'bg-blue-50 border-blue-400 text-blue-800 ring-1 ring-blue-400'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => handleDistrictSelect('all', 'All Districts')}
                  >
                    <div className="font-semibold text-sm">Select All</div>
                    <div className="text-xs text-gray-400 mt-1">Apply to all districts</div>
                  </div>
                )}
                {districtOptions.map(district => (
                  <div
                    key={district._id}
                    className={`relative border rounded-md p-4 text-center cursor-pointer transition-colors shadow-sm ${selectedDistrict === district._id
                      ? 'bg-blue-50 border-blue-400 text-blue-800 ring-1 ring-blue-400'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => handleDistrictSelect(district._id, district.name)}
                  >
                    <div className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-orange-200 shadow-sm">
                      {deliveryStats.district[district._id] || 0}
                    </div>
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
            {selectedAllDistricts ? (
              <div className="text-slate-600 font-medium italic">
                Creating delivery configuration for all selected districts at once.
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* Left Sidebar - Navigation */}
            <div className="xl:col-span-3">
              <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden sticky top-6">
                <div className="bg-[#0284c7] text-white p-4 font-bold rounded-t-lg flex items-center">
                  <Truck size={18} className="mr-2" /> Delivery Sections
                </div>
                <div className="p-2 space-y-1 bg-white pt-2 rounded-b-lg">
                  {SECTION_OPTIONS.map(opt => {
                    const isActive = activeSection === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setActiveSection(opt.id);
                          document.getElementById(opt.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
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

            {/* Middle Content - Form */}
            <div className="xl:col-span-6">
              <div className="mb-6 flex justify-between items-center border-b pb-2">
                <div>
                  <h2 className="text-2xl font-bold text-[#0284c7] flex items-center">
                    <Truck size={24} className="mr-2" />
                    {activeTabId === 'new' ? 'Standard Delivery' : formData.name}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">Configure settings for {formData.name || 'Standard Delivery'}</p>
                </div>
              </div>

              {/* Dynamic Form Sections Based on activeSection */}
              <div className="space-y-6">

                {/* Setup */}
                <div id="setup" className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden block scroll-mt-6">
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
                <div id="coverage" className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden block scroll-mt-6">
                  <div className="bg-[#22c55e] text-white p-3 font-bold text-sm">
                    Coverage Area
                  </div>
                  <div className="p-4 bg-white">
                    <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-8">
                      <div className="flex-1 max-w-xs">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Coverage Type
                        </label>
                        <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg text-gray-500 text-sm italic">
                          <span>Auto-calculated by Kms</span>
                        </div>
                      </div>
                      <div className="flex-1 max-w-xs">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Coverage Range (Kms)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name="coverageRange"
                            value={formData.coverageRange}
                            onChange={handleInputChange}
                            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                            placeholder="e.g. 50"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-400 text-sm">Kms</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Categories & Costs */}
                <div id="categories" className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden block scroll-mt-6">
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
                                className="rounded text-[#22c55e] focus:ring-[#22c55e] w-4 h-4 accent-[#22c55e]"
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
                <div id="timing" className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden block scroll-mt-6">
                  <div className="bg-[#eab308] text-white p-3 font-bold text-sm">
                    Delivery Timing
                  </div>
                  <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Procurement Results</label>
                      <Select
                        isMulti
                        name="procurementResults"
                        options={procurementOptions}
                        value={procurementOptions.filter(opt => formData.deliveryTiming.procurementResults?.includes(opt.value))}
                        onChange={handleProcurementChange}
                        className="text-sm"
                        placeholder="Select Results..."
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: '38px',
                            borderColor: '#d1d5db',
                            '&:hover': { borderColor: '#eab308' },
                            boxShadow: 'none'
                          }),
                          multiValue: (base) => ({
                            ...base,
                            backgroundColor: '#fef9c3',
                            borderRadius: '4px',
                          }),
                          multiValueLabel: (base) => ({
                            ...base,
                            color: '#854d0e',
                          }),
                          multiValueRemove: (base) => ({
                            ...base,
                            color: '#854d0e',
                            '&:hover': { backgroundColor: '#fde047', color: '#854d0e' },
                          })
                        }}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Save Layout Action */}
              <div className="mt-8 pt-4 border-t border-gray-200 flex justify-start">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-[#0284c7] text-white px-3 py-1.5 rounded text-xs font-semibold shadow-sm hover:bg-[#0369a1] transition-all flex items-center"
                >
                  {loading ? <Loader size={12} className="animate-spin mr-1" /> : null}
                  Save Delivery Settings
                </button>
              </div>

            </div>

            {/* Right Sidebar - Live Preview Card */}
            <div className="xl:col-span-3 hidden xl:block">
              <div className="bg-white border border-gray-200 shadow-sm rounded-lg w-full text-sm overflow-hidden pb-4 sticky top-6">
                <div className="p-4 flex justify-between items-start bg-[#0284c7] text-white">
                  <div className="font-bold uppercase tracking-wider text-sm leading-tight max-w-[140px]">
                    {formData.name || 'STANDARD DELIVERY'}
                  </div>
                  <span className="text-[10px] bg-white text-[#0284c7] px-2 py-1 rounded-sm shadow-sm font-bold whitespace-nowrap">Standard Access</span>
                </div>
                <div className="p-5">
                  <div className="text-xs text-gray-500 mb-6 italic">{formData.description || 'Reliable delivery for standard orders'}</div>
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 leading-none mb-1">₹{formData.applicableCategories[0]?.cost || '500'}</div>
                      <div className="text-[10px] text-gray-500">base charge</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-800 text-sm mb-1">{formData.deliveryTiming.estimatedDelivery || '3-5 Days'}</div>
                      <div className="text-[10px] text-gray-500">Delivery Time</div>
                    </div>
                  </div>
                  <div className="text-xs space-y-2 text-gray-700">
                    <p>Coverage: <span className="font-medium text-gray-900">{formData.coverageType?.length > 0 ? formData.coverageType.join(', ') : '50km Radius'}</span></p>
                    <p className="flex items-center text-[#0284c7] font-medium"><Truck size={14} className="mr-1" />Access: <span className="text-gray-900 font-medium ml-1">Standard Access</span></p>
                    <p className="font-bold mt-4 mb-2 text-gray-900 text-[13px]">Features:</p>
                    <div className="flex items-center mb-2">
                      <div className="bg-[#e0f2fe] rounded-full p-0.5 mr-2 shadow-sm"><Check size={12} className="text-[#0ea5e9]" strokeWidth={3} /></div>
                      <span>{formData.deliveryTiming.estimatedDelivery || '3-5 Day'} Delivery</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <div className="bg-[#e0f2fe] rounded-full p-0.5 mr-2 shadow-sm"><Check size={12} className="text-[#0ea5e9]" strokeWidth={3} /></div>
                      <span>50km Coverage</span>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-[#e0f2fe] rounded-full p-0.5 mr-2 shadow-sm"><Check size={12} className="text-[#0ea5e9]" strokeWidth={3} /></div>
                      <span>Standard Support</span>
                    </div>
                  </div>
                  <div className="mt-6 px-2">
                    <button className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white py-2.5 rounded-full text-xs font-bold shadow-sm transition-colors flex justify-center items-center">
                      <Check size={14} className="mr-1 hover:animate-pulse" /> @Apply {formData.name ? formData.name.toUpperCase() : 'STANDARD DELIVERY'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-dashed border-gray-300 text-gray-400">
          <Truck size={48} className="text-gray-200 mb-4" />
          <p className="text-lg">Please select a Location Scope.</p>
          <p className="text-sm font-medium mt-1 text-gray-300">Delivery configurations need a district or "all districts" scope to apply.</p>
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