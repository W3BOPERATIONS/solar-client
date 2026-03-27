import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ChevronDown, Trash2, X, Eye, EyeOff } from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { locationAPI } from '../../../../api/api';
import {
  getInstallerVendorPlans,
  saveInstallerVendorPlan,
  deleteInstallerVendorPlan
} from '../../../../services/vendor/vendorApi';
import { getSubCategories } from '../../../../services/core/masterApi';

const LocationCard = ({ title, subtitle, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`p-6 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center h-28 shadow-sm hover:shadow-md ${isSelected
      ? 'border-[#007bff] bg-blue-50 shadow-blue-100 shadow-lg -translate-y-1'
      : 'border-transparent bg-white hover:border-blue-200'
      }`}
  >
    <div className="font-bold text-base text-[#333] mb-1">{title}</div>
    <div className="text-xs text-gray-500 font-medium uppercase tracking-tight">{subtitle}</div>
  </div>
);

export default function InstallerVendors() {
  const [activePlan, setActivePlan] = useState('Starter Plan');
  const [showLocationCards, setShowLocationCards] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [plans, setPlans] = useState(["Starter Plan", "Silver Plan", "Gold Plan", "Platinum Plan"]);
  const [allFetchedPlans, setAllFetchedPlans] = useState([]); // Array of all saved plan objects
  const [globalPlanNames, setGlobalPlanNames] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  // Location Hierarchy State
  const [locationData, setLocationData] = useState({
    countries: [],
    states: [],
    clusters: [],
    districts: []
  });

  const [selectedLocation, setSelectedLocation] = useState({
    country: '',
    state: '',
    cluster: '',
    district: ''
  });

  // Initialize state for a plan
  const getDefaultPlanState = () => ({
    requirements: [],
    coverage: "1 District",
    projectTypes: [],
    subscription: "0",
    paymentMethods: [],
    teams: {},
    rates: {
      resOnGrid: "0", resOffGrid: "0",
      comOnGrid: "0", comOffGrid: "0"
    },
    weeklyKWAssign: {}
  });

  const [planSettings, setPlanSettings] = useState({});

  useEffect(() => {
    fetchGlobalNames();
    fetchSubCategories();
  }, []);

  const fetchSubCategories = async () => {
    try {
      const res = await getSubCategories({ silent: true });
      if (res.data) setSubCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch sub-categories', err);
    }
  };

  const fetchGlobalNames = async () => {
    try {
      const response = await getInstallerVendorPlans({ fetchAllNames: true });
      if (response.success && response.data) {
        setGlobalPlanNames(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch global names', err);
    }
  };

  // Location Fetching Logic
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await locationAPI.getAllCountries({ isActive: true });
        if (res.data && res.data.data) setLocationData(prev => ({ ...prev, countries: res.data.data }));
      } catch (error) {
        console.error('Failed to fetch countries', error);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchStates = async () => {
      if (selectedLocation.country) {
        try {
          const params = { isActive: true };
          if (selectedLocation.country !== 'all') params.countryId = selectedLocation.country;
          const res = await locationAPI.getAllStates(params);
          if (res.data && res.data.data) setLocationData(prev => ({ ...prev, states: res.data.data }));
        } catch (error) {
          console.error('Failed to fetch states', error);
          setLocationData(prev => ({ ...prev, states: [] }));
        }
      } else {
        setLocationData(prev => ({ ...prev, states: [] }));
      }
    };
    fetchStates();
  }, [selectedLocation.country]);

  useEffect(() => {
    const fetchClusters = async () => {
      if (selectedLocation.state) {
        try {
          const params = { isActive: true };
          if (selectedLocation.state !== 'all') params.stateId = selectedLocation.state;
          const res = await locationAPI.getAllClusters(params);
          setLocationData(prev => ({ ...prev, clusters: res.data?.data || [] }));
        } catch (error) {
          setLocationData(prev => ({ ...prev, clusters: [] }));
        }
      } else setLocationData(prev => ({ ...prev, clusters: [] }));
    };
    fetchClusters();
  }, [selectedLocation.state]);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (selectedLocation.cluster) {
        try {
          if (selectedLocation.cluster !== 'all') {
            const res = await locationAPI.getClusterById(selectedLocation.cluster);
            if (res.data?.data?.districts) {
              setLocationData(prev => ({ ...prev, districts: res.data.data.districts }));
            } else setLocationData(prev => ({ ...prev, districts: [] }));
          } else {
            const params = { isActive: true };
            if (selectedLocation.state && selectedLocation.state !== 'all') params.stateId = selectedLocation.state;
            const res = await locationAPI.getAllDistricts(params);
            setLocationData(prev => ({ ...prev, districts: res.data?.data || [] }));
          }
        } catch (error) {
          setLocationData(prev => ({ ...prev, districts: [] }));
        }
      } else setLocationData(prev => ({ ...prev, districts: [] }));
    };
    fetchDistricts();
  }, [selectedLocation.cluster, selectedLocation.state]);

  // Fetch plans from DB
  useEffect(() => {
    if (selectedLocation.district) {
      fetchPlans();
    } else {
      const baseOrder = ["Starter Plan", "Silver Plan", "Gold Plan", "Platinum Plan"];
      const fetchedNames = globalPlanNames.length > 0 ? globalPlanNames : baseOrder;
      const sortedNames = Array.from(new Set([...baseOrder, ...fetchedNames]));
      setPlans(sortedNames);
      setPlanSettings(sortedNames.reduce((acc, name) => ({ ...acc, [name]: getDefaultPlanState() }), {}));
      setActivePlan(sortedNames[0] || 'Starter Plan');
      setAllFetchedPlans([]);
    }
  }, [selectedLocation.district, selectedLocation.cluster, selectedLocation.state, selectedLocation.country, globalPlanNames]);

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const params = {};
      if (selectedLocation.district && selectedLocation.district !== 'all') {
        params.districtId = selectedLocation.district;
      } else if (selectedLocation.cluster && selectedLocation.cluster !== 'all') {
        params.clusterId = selectedLocation.cluster;
      } else if (selectedLocation.state && selectedLocation.state !== 'all') {
        params.stateId = selectedLocation.state;
      } else if (selectedLocation.country && selectedLocation.country !== 'all') {
        params.countryId = selectedLocation.country;
      }

      const response = await getInstallerVendorPlans(params);
      if (response.success && response.data.length > 0) {
        const dbPlans = response.data;
        setAllFetchedPlans(dbPlans);
        
        // If specific district is selected, populate form. If "all", just list them (or populate if they want to mass-edit one).
        // Standardizing on always populating form with the FIRST available plan match or defaults.
        const districtPlans = selectedLocation.district !== 'all' 
          ? dbPlans.filter(p => p.districtId?._id === selectedLocation.district || p.districtId === selectedLocation.district)
          : dbPlans; // Just take any to populate form

        // Ensure defaults are always shown in tabs
        const baseOrder = ["Starter Plan", "Silver Plan", "Gold Plan", "Platinum Plan"];
        const fetchedNames = globalPlanNames.length > 0 ? globalPlanNames : baseOrder;
        const planNames = Array.from(new Set([...baseOrder, ...fetchedNames, ...districtPlans.map(p => p.name)]));
        setPlans(planNames);
        if(!activePlan || !planNames.includes(activePlan)) setActivePlan(planNames[0]);

        const settings = {};
        planNames.forEach(name => {
          const dbPlan = districtPlans.find(p => p.name === name);
          settings[name] = dbPlan ? { ...dbPlan } : getDefaultPlanState();
        });
        setPlanSettings(settings);
      } else {
        const baseOrder = ["Starter Plan", "Silver Plan", "Gold Plan", "Platinum Plan"];
        const fetchedNames = globalPlanNames.length > 0 ? globalPlanNames : baseOrder;
        const sortedNames = Array.from(new Set([...baseOrder, ...fetchedNames]));

        setPlans(sortedNames);
        setPlanSettings(sortedNames.reduce((acc, name) => ({ ...acc, [name]: getDefaultPlanState() }), {}));
        setAllFetchedPlans([]);
        setActivePlan(sortedNames[0] || 'Starter Plan');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleInputChange = (field, value, subfield = null) => {
    setPlanSettings(prev => ({
      ...prev,
      [activePlan]: {
        ...prev[activePlan],
        [field]: subfield ? { ...prev[activePlan][field], [subfield]: value } : value
      }
    }));
  };

  const handleCheckboxToggle = (field, value) => {
    const current = planSettings[activePlan][field] || [];
    const updated = current.includes(value)
      ? current.filter(i => i !== value)
      : [...current, value];
    handleInputChange(field, updated);
  };

  const handleSaveSettings = async () => {
    try {
      const currentPlanData = planSettings[activePlan];
      
      const payload = {
        ...currentPlanData,
        name: activePlan,
        countryId: selectedLocation.country === 'all' ? null : selectedLocation.country,
        stateId: selectedLocation.state === 'all' ? null : selectedLocation.state,
        clusterId: selectedLocation.cluster === 'all' ? null : selectedLocation.cluster,
      };

      if (selectedLocation.district === 'all') {
         payload.districtId = null;
      } else {
         payload.districtId = selectedLocation.district;
      }

      const response = await saveInstallerVendorPlan(payload);
      if (response.success) {
        toast.success(`${activePlan} settings saved!`);
        fetchPlans();
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleAddPlan = async () => {
    if (!newPlanName.trim()) {
      toast.error('Plan name is required');
      return;
    }
    if (plans.includes(newPlanName.trim())) {
      toast.error('Plan already exists');
      return;
    }

    const name = newPlanName.trim();
    
    try {
      // Save globally so it persists
      const payload = {
        ...getDefaultPlanState(),
        name,
        stateId: null,
        clusterId: null,
        districtId: null
      };
      await saveInstallerVendorPlan(payload);

      setPlans(prev => [...prev, name]);
      setPlanSettings(prev => ({ ...prev, [name]: getDefaultPlanState() }));
      setActivePlan(name);
      setNewPlanName('');
      setIsAddPlanModalOpen(false);
      toast.success(`Plan "${name}" added.`);
      fetchGlobalNames();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add plan globally');
    }
  };

  const handleDeletePlan = async (planName, providedPlanId) => {
    try {
      if (providedPlanId) {
        await deleteInstallerVendorPlan(providedPlanId);
        toast.success(`Configuration for ${planName} deleted`);
      } else {
        if (!window.confirm(`Are you sure you want to completely delete "${planName}" and all its configurations?`)) return;
        
        await deleteInstallerVendorPlan('by-name', { name: planName });
        toast.success(`Plan "${planName}" entirely deleted`);
        
        // Remove from local states
        setPlans(prev => prev.filter(p => p !== planName));
        if (activePlan === planName) {
          const remainingPlans = plans.filter(p => p !== planName);
          setActivePlan(remainingPlans.length > 0 ? remainingPlans[0] : null);
        }
      }
      
      await fetchGlobalNames();
      fetchPlans(); // Refresh the table immediately
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete plan');
    }
  };

  return (
    <div className="bg-[#f4f7fa] min-h-screen font-sans">
      {/* Header Block */}
      <div className="bg-white p-6 border-b border-gray-200 mb-8 px-12">
        <h1 className="text-xl font-bold text-[#14233c]">Installer Vendor Management</h1>
        <button
          onClick={() => setShowLocationCards(!showLocationCards)}
          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-[#0076a8] text-white rounded text-[10px] font-bold shadow-sm hover:bg-blue-800 transition-all uppercase tracking-wider"
        >
          {showLocationCards ? <EyeOff size={14} /> : <Eye size={14} />} {showLocationCards ? 'Hide Location Cards' : 'Show Location Cards'}
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto px-12 pb-20">

        {/* Location Selection Section */}
        {showLocationCards && (
          <div className="space-y-10 mb-16">
            {/* Countries */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#333]">Select Country</h2>
                <button
                  onClick={() => setSelectedLocation({ country: 'all', state: '', cluster: '', district: '' })}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <LocationCard
                  title="All Countries"
                  subtitle="ALL"
                  isSelected={selectedLocation.country === 'all'}
                  onClick={() => setSelectedLocation({ country: 'all', state: '', cluster: '', district: '' })}
                />
                {locationData.countries.map(c => (
                  <LocationCard
                    key={c._id}
                    title={c.name}
                    subtitle={c.code || c.name.substring(0, 2).toUpperCase()}
                    isSelected={selectedLocation.country === c._id}
                    onClick={() => setSelectedLocation({ country: c._id, state: '', cluster: '', district: '' })}
                  />
                ))}
              </div>
            </div>

            {/* States */}
            {selectedLocation.country && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[#333]">Select State</h2>
                  <button
                    onClick={() => setSelectedLocation(prev => ({ ...prev, state: 'all', cluster: '', district: '' }))}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <LocationCard
                    title="All States"
                    subtitle="ALL"
                    isSelected={selectedLocation.state === 'all'}
                    onClick={() => setSelectedLocation(prev => ({ ...prev, state: 'all', cluster: '', district: '' }))}
                  />
                  {locationData.states.map(s => (
                    <LocationCard
                      key={s._id}
                      title={s.name}
                      subtitle={s.code || s.name.substring(0, 2).toUpperCase()}
                      isSelected={selectedLocation.state === s._id}
                      onClick={() => setSelectedLocation(prev => ({ ...prev, state: s._id, cluster: '', district: '' }))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Clusters */}
            {selectedLocation.state && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[#333]">Select Cluster</h2>
                  <button
                    onClick={() => setSelectedLocation(prev => ({ ...prev, cluster: 'all', district: '' }))}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <LocationCard
                    title="All Clusters"
                    subtitle="ALL"
                    isSelected={selectedLocation.cluster === 'all'}
                    onClick={() => setSelectedLocation(prev => ({ ...prev, cluster: 'all', district: '' }))}
                  />
                  {locationData.clusters.map(c => {
                    const parentState = locationData.states.find(s => s._id === c.state) || locationData.states.find(s => s._id === selectedLocation.state);
                    return (
                      <LocationCard
                        key={c._id}
                        title={c.name}
                        subtitle={parentState ? (parentState.code || parentState.name.substring(0, 2).toUpperCase()) : 'CL'}
                        isSelected={selectedLocation.cluster === c._id}
                        onClick={() => setSelectedLocation(prev => ({ ...prev, cluster: c._id, district: '' }))}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Districts */}
            {selectedLocation.cluster && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[#333]">Select District</h2>
                  <button
                    onClick={() => setSelectedLocation(prev => ({ ...prev, district: 'all' }))}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <LocationCard
                    title="All Districts"
                    subtitle="ALL"
                    isSelected={selectedLocation.district === 'all'}
                    onClick={() => setSelectedLocation(prev => ({ ...prev, district: 'all' }))}
                  />
                  {locationData.districts.map(d => {
                    const parentCluster = locationData.clusters.find(c => c._id === selectedLocation.cluster);
                    return (
                      <LocationCard
                        key={d._id}
                        title={d.name}
                        subtitle={parentCluster ? parentCluster.name : 'DT'}
                        isSelected={selectedLocation.district === d._id}
                        onClick={() => setSelectedLocation(prev => ({ ...prev, district: d._id }))}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

          {/* Plan Configuration Area */}
          {(selectedLocation.district && plans.length > 0) && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              {/* Plan Tabs */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
              {plans.map(plan => {
                const isActive = activePlan === plan;
                let textStyle = "text-gray-600";
                if (!isActive) {
                  if (plan === "Starter Plan") textStyle = "text-[#3b8bc6]";
                  else if (plan === "Silver Plan") textStyle = "text-gray-500";
                  else if (plan === "Gold Plan") textStyle = "text-[#fbbf24]";
                  else if (plan === "Platinum Plan") textStyle = "text-[#10b981]";
                }

                return (
                  <div key={plan} className="relative group">
                    <button
                      onClick={() => setActivePlan(plan)}
                      className={`px-6 py-2 rounded-md text-[15px] font-bold transition-all tracking-wide ${isActive
                        ? 'bg-[#4096d2] text-white ring-2 ring-blue-200 shadow-sm'
                        : `bg-transparent ${textStyle} hover:bg-gray-100`
                        }`}
                    >
                      {plan}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                );
              })}
              <button
                onClick={() => setIsAddPlanModalOpen(true)}
                className="px-6 py-2 rounded-md text-[15px] font-bold bg-[#343a40] text-white hover:bg-gray-800 transition-all shadow-md ml-2"
              >
                Add More Plan
              </button>
            </div>

            {loadingPlans ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : planSettings[activePlan] ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 max-w-6xl mx-auto overflow-hidden mb-16 px-8 py-10">
                {/* Plan Title Header to replicate PHP layout */}
                <div className="mb-8 border-b-2 border-blue-500 pb-4">
                  <h2 className="text-3xl font-bold text-gray-500">{activePlan}</h2>
                </div>

                <div className="grid grid-cols-3 gap-x-12 gap-y-10">
                  {/* Row 1 */}
                  <div>
                    <h5 className="font-bold text-gray-800 mb-4 text-base">App Signup Requirements</h5>
                    <div className="space-y-3">
                      {["Aadhar Card", "PAN Card", "GST Number", "Electronic Licence"].map(item => (
                        <label key={item} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={planSettings[activePlan].requirements.includes(item)}
                            onChange={() => handleCheckboxToggle('requirements', item)}
                            className="w-4 h-4 accent-green-600 rounded"
                          />
                          <span className="text-gray-700 text-sm">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-bold text-gray-800 mb-4 text-base">Coverage</h5>
                    <div className="space-y-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                      {/* Selection Type Radio Buttons */}
                      <div className="flex items-center gap-8 mb-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name={`coverageType-${activePlan}`}
                            value="single"
                            checked={!planSettings[activePlan].coverage?.includes(',')}
                            onChange={() => {
                              const currentVal = planSettings[activePlan].coverage || '';
                              const newVal = currentVal.includes(',') ? currentVal.split(',')[0].trim() : currentVal;
                              handleInputChange('coverage', newVal);
                            }}
                            className="w-4 h-4 accent-blue-600 cursor-pointer shadow-sm transition-transform group-hover:scale-110"
                          />
                          <span className="text-sm font-semibold text-gray-700 tracking-tight">Single District</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name={`coverageType-${activePlan}`}
                            value="multiple"
                            checked={planSettings[activePlan].coverage?.includes(',')}
                            onChange={() => {
                              if (!planSettings[activePlan].coverage?.includes(',')) {
                                handleInputChange('coverage', (planSettings[activePlan].coverage || '') + ', ');
                              }
                            }}
                            className="w-4 h-4 accent-blue-600 cursor-pointer shadow-sm transition-transform group-hover:scale-110"
                          />
                          <span className="text-sm font-semibold text-gray-700 tracking-tight">Multiple District</span>
                        </label>
                      </div>

                      {/* Input based on selection */}
                      {!planSettings[activePlan].coverage?.includes(',') ? (
                        <div className="relative">
                          <select
                            value={planSettings[activePlan].coverage}
                            onChange={(e) => handleInputChange('coverage', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                          >
                            <option value="">Select District</option>
                            {locationData.districts.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>
                      ) : (
                        <div className="react-select-container">
                          <Select
                            isMulti
                            options={locationData.districts.map(d => ({ value: d.name, label: d.name }))}
                            value={(planSettings[activePlan].coverage || '').split(',').filter(x => x.trim()).map(x => ({ value: x.trim(), label: x.trim() }))}
                            onChange={(selected) => {
                              const newVal = (selected || []).map(s => s.value).join(', ');
                              // Always ensure at least a comma to maintain "multiple" mode if selected
                              const persistedVal = newVal.includes(',') ? newVal : (newVal + ', ');
                              handleInputChange('coverage', persistedVal);
                            }}
                            className="text-sm"
                            styles={{
                              control: (base) => ({
                                ...base,
                                borderRadius: '0.5rem',
                                borderColor: '#d1d5db',
                                minHeight: '40px',
                                boxShadow: 'none',
                                '&:hover': { borderColor: '#d1d5db' }
                              })
                            }}
                            placeholder="Select Districts..."
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-bold text-gray-800 mb-4 text-base flex justify-between items-center">
                      Project Types
                      {subCategories.length > 0 && (
                        <label className="flex items-center gap-2 cursor-pointer font-normal text-xs text-blue-600 hover:text-blue-800">
                          <input
                            type="checkbox"
                            checked={subCategories.length > 0 && subCategories.every(item => planSettings[activePlan].projectTypes.includes(item.name))}
                            onChange={(e) => {
                              const allNames = e.target.checked ? subCategories.map(s => s.name) : [];
                              handleInputChange('projectTypes', allNames);
                            }}
                            className="w-3 h-3 accent-blue-600 rounded"
                          />
                          Select All
                        </label>
                      )}
                    </h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                      {subCategories.length > 0 ? (
                        subCategories.map(item => (
                          <label key={item._id} className="flex items-center gap-3 cursor-pointer group py-1.5 hover:bg-white/50 px-2 rounded transition-colors">
                            <input
                              type="checkbox"
                              checked={planSettings[activePlan].projectTypes.includes(item.name)}
                              onChange={() => handleCheckboxToggle('projectTypes', item.name)}
                              className="w-4 h-4 accent-green-600 rounded cursor-pointer shadow-sm"
                            />
                            <span className="text-gray-700 text-sm font-medium group-hover:text-gray-900 transition-colors">{item.name}</span>
                          </label>
                        ))
                      ) : (
                        <p className="text-gray-400 text-xs italic p-4 text-center">No project types found</p>
                      )}
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div>
                    <h5 className="font-bold text-gray-800 mb-4 text-base">Monthly Subscription (₹)</h5>
                    <input
                      type="number"
                      value={planSettings[activePlan].subscription}
                      onChange={(e) => handleInputChange('subscription', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <h5 className="font-bold text-gray-800 mb-4 text-base">Payment Methods</h5>
                    <div className="flex gap-6">
                      {["Cash", "UPI"].map(method => (
                        <label key={method} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={planSettings[activePlan].paymentMethods.includes(method)}
                            onChange={() => handleCheckboxToggle('paymentMethods', method)}
                            className="w-4 h-4 accent-green-600 rounded"
                          />
                          <span className="text-gray-700 text-sm">{method}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-1">
                    <h5 className="font-bold text-gray-800 mb-4 text-base">Team Allocation</h5>
                    <div className="space-y-3 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                      {(planSettings[activePlan]?.projectTypes || []).length > 0 ? (
                        planSettings[activePlan].projectTypes.map((type) => (
                          <div key={type} className="flex items-center justify-between gap-4 py-1.5 border-b border-blue-50 last:border-0 hover:bg-blue-50/50 px-2 rounded transition-all">
                            <span className="text-gray-700 text-sm font-semibold truncate title-capitalize">{type}</span>
                            <div className="flex items-center bg-white rounded-lg border border-blue-200 shadow-sm px-1">
                              <input
                                type="number"
                                value={planSettings[activePlan].teams?.[type] || 0}
                                onChange={(e) => handleInputChange('teams', parseInt(e.target.value) || 0, type)}
                                className="w-16 py-1.5 bg-transparent text-center text-sm font-bold text-blue-700 outline-none"
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-xs italic p-4 text-center">Select Project Types first</p>
                      )}
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="col-span-1">
                    <h5 className="font-bold text-gray-800 mb-3 text-base">Installer Rate Setting</h5>
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-700 font-medium text-sm mb-3">Residential (Per KW)</p>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4 pl-4">
                            <span className="w-20 text-gray-600 text-xs">On-Grid</span>
                            <input
                              type="text"
                              value={planSettings[activePlan].rates.resOnGrid}
                              onChange={(e) => handleInputChange('rates', e.target.value, 'resOnGrid')}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex items-center gap-4 pl-4">
                            <span className="w-20 text-gray-600 text-xs">Off-Grid</span>
                            <input
                              type="text"
                              value={planSettings[activePlan].rates.resOffGrid}
                              onChange={(e) => handleInputChange('rates', e.target.value, 'resOffGrid')}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-700 font-medium text-sm mb-3">Commercial (Per KW)</p>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4 pl-4">
                            <span className="w-20 text-gray-600 text-xs">On-Grid</span>
                            <input
                              type="text"
                              value={planSettings[activePlan].rates.comOnGrid}
                              onChange={(e) => handleInputChange('rates', e.target.value, 'comOnGrid')}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex items-center gap-4 pl-4">
                            <span className="w-20 text-gray-600 text-xs">Off-Grid</span>
                            <input
                              type="text"
                              value={planSettings[activePlan].rates.comOffGrid}
                              onChange={(e) => handleInputChange('rates', e.target.value, 'comOffGrid')}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <h5 className="font-bold text-gray-800 mb-4 text-base">Weekly KW Assign</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-gray-50/30 p-5 rounded-xl border border-gray-100">
                      {(planSettings[activePlan]?.projectTypes || []).length > 0 ? (
                        planSettings[activePlan].projectTypes.map((type) => (
                          <div key={`kw-${type}`} className="flex items-center justify-between gap-4 group p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200 hover:shadow-sm">
                            <span className="text-gray-700 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-1 pr-2">{type} Capacity</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={planSettings[activePlan].weeklyKWAssign?.[type] || "0"}
                                onChange={(e) => handleInputChange('weeklyKWAssign', e.target.value, type)}
                                className="w-24 px-4 py-2 border border-gray-300 rounded-lg text-center text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
                              />
                              <span className="text-[10px] font-bold text-gray-400 uppercase">KW</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full border-2 border-dashed border-gray-100 p-8 rounded-xl text-center">
                           <p className="text-gray-400 text-xs italic">Select Project Types in the top section to enable capacity settings</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex justify-start">
                  <button
                    onClick={handleSaveSettings}
                    className="bg-[#0076a8] hover:bg-blue-800 text-white font-bold py-2.5 px-8 rounded-md shadow-sm transition-all text-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : null}

            {/* Display Saved Plans (Summary) */}
            {!loadingPlans && allFetchedPlans.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 max-w-[100%] mx-auto overflow-hidden mt-10 p-6">
                <h3 className="font-bold text-lg text-[#0b386a] mb-4 border-b pb-2">Saved Configuration Overview</h3>
                <div className="overflow-x-auto pb-4">
                    <table className="w-full text-left border-collapse text-sm min-w-[1200px]">
                        <thead className="bg-[#82c5fa] text-white">
                            <tr>
                                <th className="p-3 border-r border-white/20 whitespace-nowrap">Plan Name</th>
                                    <th className="p-3 border-r border-white/20">State</th>
                                <th className="p-3 border-r border-white/20">Cluster</th>
                                <th className="p-3 border-r border-white/20">District</th>
                                <th className="p-3 border-r border-white/20 text-center">Sub. (₹)</th>
                                <th className="p-3 border-r border-white/20 text-center">Coverage</th>
                                <th className="p-3 border-r border-white/20 text-center">Payment</th>
                                <th className="p-3 border-r border-white/20 text-center">Teams (R/C)</th>
                                <th className="p-3 border-r border-white/20 text-center">WK Assign (R/C)</th>
                                <th className="p-3 border-r border-white/20 text-center">Res Rates</th>
                                <th className="p-3 border-r border-white/20 text-center">Com Rates</th>
                                <th className="p-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allFetchedPlans.map((plan, idx) => (
                                <tr key={plan._id || idx} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-3 border-r border-gray-100 font-bold text-gray-800 whitespace-nowrap">{plan.name}</td>
                                    <td className="p-3 border-r border-gray-100 text-gray-600">
                                        {plan.stateId?.name || 'All States'}
                                    </td>
                                    <td className="p-3 border-r border-gray-100 text-gray-600">
                                        {plan.clusterId?.name || 'All Clusters'}
                                    </td>
                                    <td className="p-3 border-r border-gray-100 text-gray-600">
                                        {plan.districtId?.name || 'All Districts'}
                                    </td>
                                    <td className="p-3 border-r border-gray-100 text-center text-gray-600 font-semibold">{plan.subscription}</td>
                                    <td className="p-3 border-r border-gray-100 text-center text-gray-600 whitespace-nowrap">{plan.coverage}</td>
                                    <td className="p-3 border-r border-gray-100 text-center text-gray-600 text-xs">
                                      {Array.isArray(plan.paymentMethods) 
                                          ? plan.paymentMethods.join(' / ') || '-' 
                                          : Object.entries(plan.paymentMethods || {})
                                          .filter(([_, v]) => v)
                                          .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
                                          .join(' / ') || '-'}
                                    </td>
                                  <td className="p-3 border-r border-gray-100 text-center text-gray-600">
                                      {Object.entries(plan.teams || {}).map(([key, val]) => (
                                          <div key={key} className="text-xs whitespace-nowrap">
                                              <span className="font-medium text-gray-500">{key}:</span> {val}
                                          </div>
                                      ))}
                                  </td>
                                  <td className="p-3 border-r border-gray-100 text-center text-gray-600">
                                      {Object.entries(plan.weeklyKWAssign || {}).map(([key, val]) => (
                                          <div key={key} className="text-xs whitespace-nowrap">
                                              <span className="font-medium text-gray-500">{key}:</span> {val}KW
                                          </div>
                                      ))}
                                  </td>
                                    <td className="p-3 border-r border-gray-100 text-center text-gray-600 text-xs whitespace-nowrap">
                                        On-Grid: <span className="font-medium text-gray-800">{plan.rates.resOnGrid}</span><br/>
                                        Off-Grid: <span className="font-medium text-gray-800">{plan.rates.resOffGrid}</span>
                                    </td>
                                    <td className="p-3 border-r border-gray-100 text-center text-gray-600 text-xs whitespace-nowrap">
                                        On-Grid: <span className="font-medium text-gray-800">{plan.rates.comOnGrid}</span><br/>
                                        Off-Grid: <span className="font-medium text-gray-800">{plan.rates.comOffGrid}</span>
                                    </td>
                                    <td className="p-3 text-center">
                                       <button 
                                          onClick={() => handleDeletePlan(plan.name, plan._id)}
                                          className="text-red-500 hover:text-red-700 mx-auto"
                                        >
                                          <Trash2 size={16} />
                                       </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Plan Modal */}
        {isAddPlanModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-[#0b386a]">Add New Plan</h3>
                <button onClick={() => setIsAddPlanModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Plan Name</label>
                  <input
                    type="text"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="e.g. Platinum Plan"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setIsAddPlanModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPlan}
                    className="flex-1 px-4 py-3 bg-[#0d6efd] text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-600 transition-all font-sans"
                  >
                    Create Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="py-10 border-t border-gray-200 text-center">
          <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Copyright © 2025, Solarkits. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
}
