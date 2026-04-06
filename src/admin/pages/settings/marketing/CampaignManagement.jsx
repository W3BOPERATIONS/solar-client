import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Layout, Globe, IndianRupee, BarChart2, Facebook, Instagram, Twitter, Linkedin, Search, MapPin, Target, Layers, Users, CheckSquare } from 'lucide-react';
import {
  getCampaignConfig,
  updateCampaignConfig,
  getAllCampaignConfigs,
  deleteCampaignConfig,
  getAllSocialPlatforms,
  createSocialPlatform,
  updateSocialPlatform,
  deleteSocialPlatform
} from '../../../../api/campaigns';
import { locationAPI } from '../../../../api/api';
import {
  getCountries,
  getStates,
  getClustersHierarchy,
  getDistrictsHierarchy
} from '../../../../services/core/locationApi';
import {
  getPartners,
  getPartnerPlans
} from '../../../../services/partner/partnerApi';
import toast from 'react-hot-toast';

const CampaignManagement = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    campaignTypes: [],
    conversions: {},
    cprmConversion: 0,
    companyConversion: 0,
    defaultCompanyBudget: 0,
    defaultCprmBudget: 0,
    country: '',
    state: '',
    cluster: '',
    district: '',
    partnerType: '',
    plans: []
  });

  const [socialPlatforms, setSocialPlatforms] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [partners, setPartners] = useState([]);
  const [plans, setPlans] = useState([]);
  const [campaignConfigs, setCampaignConfigs] = useState([]);
  const [newType, setNewType] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [configRes, socialRes, countriesData, partnersData, allConfigsRes] = await Promise.all([
        getCampaignConfig(),
        getAllSocialPlatforms(),
        getCountries(),
        getPartners(),
        getAllCampaignConfigs()
      ]);

      if (configRes.success && configRes.data) {
        const fetchedConfig = configRes.data;
        if (!fetchedConfig.campaignTypes) fetchedConfig.campaignTypes = [];
        if (!fetchedConfig.conversions) fetchedConfig.conversions = {};
        if (!fetchedConfig.plans) fetchedConfig.plans = [];
        // Reset all regional selections on refresh to ensure a clean start
        setConfig(prev => ({ 
          ...prev, 
          ...fetchedConfig, 
          country: '',
          state: '',
          cluster: '',
          district: '',
          partnerType: '' 
        }));
      }
      
      if (allConfigsRes.success) setCampaignConfigs(allConfigsRes.data);
      if (socialRes.success) setSocialPlatforms(socialRes.data);
      setCountries(countriesData || []);
      setPartners(partnersData || []);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async (countryId) => {
    try {
      const params = {};
      if (countryId && countryId !== 'all') params.countryId = countryId;
      const data = await getStates(params);
      setStates(data || []);
    } catch (error) {
      console.error('Failed to fetch states', error);
    }
  };

  const fetchClusters = async (stateId) => {
    try {
      const data = await getClustersHierarchy(stateId === 'all' ? undefined : stateId);
      setClusters(data || []);
    } catch (error) {
      console.error('Failed to fetch clusters', error);
    }
  };

  const fetchDistricts = async (clusterId) => {
    try {
      const data = await getDistrictsHierarchy(clusterId === 'all' ? undefined : clusterId);
      setDistricts(data || []);
    } catch (error) {
      console.error('Failed to fetch districts', error);
    }
  };

  const fetchPlans = async (partnerType, countryId, stateId, clusterId, districtId) => {
    try {
      const data = await getPartnerPlans(partnerType, stateId, countryId, clusterId, districtId);
      
      // Safety filter: Deduplicate by name as per other sections
      const uniqueData = [];
      const seenNames = new Set();
      data.forEach(plan => {
        if (!seenNames.has(plan.name)) {
          seenNames.add(plan.name);
          uniqueData.push(plan);
        }
      });
      setPlans(uniqueData || []);
      
      // Also try to load the config for this specific combination
      loadSpecificConfig(partnerType, countryId, stateId, clusterId, districtId);
    } catch (error) {
      console.error('Failed to fetch plans', error);
    }
  };

  const loadSpecificConfig = async (partnerType, country, state, cluster, district) => {
    try {
       // Only fetch if we have some criteria
       if (!partnerType && !country) return;
       
       const params = {};
       if (country) params.country = country;
       if (state) params.state = state;
       if (cluster) params.cluster = cluster;
       if (district) params.district = district;
       if (partnerType) params.partnerType = partnerType;
       
       const res = await getCampaignConfig(params);
       if (res.success && res.data && res.data._id) {
          const fetched = res.data;
          setConfig(prev => ({
            ...prev,
            campaignTypes: fetched.campaignTypes || prev.campaignTypes,
            conversions: fetched.conversions || prev.conversions,
            plans: fetched.plans?.map(p => p._id || p) || []
          }));
       }
    } catch (error) {
      console.error("Failed to load specific config", error);
    }
  };

  // Cascading update handlers
  const handleCountryChange = (countryId) => {
    setConfig({ ...config, country: countryId, state: '', cluster: '', district: '', plans: [] });
    setStates([]);
    setClusters([]);
    setDistricts([]);
    setPlans([]);
    if (countryId) fetchStates(countryId);
  };

  const handleStateChange = (stateId) => {
    setConfig({ ...config, state: stateId, cluster: '', district: '', plans: [] });
    setClusters([]);
    setDistricts([]);
    setPlans([]);
    if (stateId) {
      fetchClusters(stateId);
      if (config.partnerType) fetchPlans(config.partnerType, config.country, stateId === 'all' ? undefined : stateId, '', '');
    }
  };

  const handleClusterChange = (clusterId) => {
    setConfig({ ...config, cluster: clusterId, district: '', plans: [] });
    setDistricts([]);
    setPlans([]);
    if (clusterId) {
      fetchDistricts(clusterId);
      if (config.partnerType) fetchPlans(config.partnerType, config.country, config.state, clusterId === 'all' ? undefined : clusterId, '');
    }
  };

  const handleDistrictChange = (districtId) => {
    setConfig({ ...config, district: districtId, plans: [] });
    if (districtId && config.partnerType) {
      fetchPlans(config.partnerType, config.country, config.state, config.cluster, districtId);
    }
  };

  const handlePartnerTypeChange = (partnerType) => {
    setConfig({ ...config, partnerType, plans: [] });
    if (partnerType) {
      fetchPlans(partnerType, config.country, config.state, config.cluster, config.district);
    } else {
      setPlans([]);
    }
  };

  const handlePlanToggle = (planId) => {
    const currentPlans = [...(config.plans || [])];
    const index = currentPlans.indexOf(planId);
    if (index > -1) {
      currentPlans.splice(index, 1);
    } else {
      currentPlans.push(planId);
    }
    setConfig({ ...config, plans: currentPlans });
  };

  const handleConfigSave = async () => {
    try {
      setLoading(true);

      // Auto-add pending type if exists
      let finalConfig = { ...config };
      if (newType.trim() && !config.campaignTypes.includes(newType.trim())) {
        finalConfig.campaignTypes = [...config.campaignTypes, newType.trim()];
        finalConfig.conversions = { ...config.conversions, [newType.trim()]: 0 };
        setConfig(finalConfig);
        setNewType('');
      }

      const res = await updateCampaignConfig(finalConfig);
      if (res.success) {
        setConfig({
          ...res.data,
          plans: res.data.plans?.map(p => p._id || p) || []
        });
        
        // Refresh the list
        const listRes = await getAllCampaignConfigs();
        if (listRes.success) setCampaignConfigs(listRes.data);
        
        toast.success('Campaign settings saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (id) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;
    try {
      setLoading(true);
      const res = await deleteCampaignConfig(id);
      if (res.success) {
        setCampaignConfigs(campaignConfigs.filter(c => c._id !== id));
        toast.success('Configuration removed');
      }
    } catch (error) {
      toast.error('Failed to delete configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleAddType = () => {
    if (!newType.trim()) return;
    if (config.campaignTypes.includes(newType.trim())) {
      toast.error('Type already exists');
      return;
    }
    const updatedConversions = { ...config.conversions };
    if (updatedConversions[newType.trim()] === undefined) {
      updatedConversions[newType.trim()] = 0;
    }
    setConfig({ 
      ...config, 
      campaignTypes: [...config.campaignTypes, newType.trim()],
      conversions: updatedConversions
    });
    setNewType('');
  };

  const handleRemoveType = (typeToRemove) => {
    const updatedConversions = { ...config.conversions };
    delete updatedConversions[typeToRemove];
    setConfig({
      ...config,
      campaignTypes: config.campaignTypes.filter(t => t !== typeToRemove),
      conversions: updatedConversions
    });
  };

  const handleConversionChange = (type, value) => {
    setConfig({
      ...config,
      conversions: {
        ...config.conversions,
        [type]: Number(value)
      }
    });
  };

  const handleAddPlatform = async () => {
    const newPlatform = {
      platform: 'Facebook',
      state: states.length > 0 ? states[0]._id : '',
      cluster: clusters.length > 0 ? clusters[0]._id : '',
      status: 'Active',
      quarter: 'January-March',
      budget: 0
    };

    try {
      setLoading(true);
      const res = await createSocialPlatform(newPlatform);
      if (res.success) {
        setSocialPlatforms([...socialPlatforms, res.data]);
        toast.success('Platform added');
      }
    } catch (error) {
      toast.error('Failed to add platform');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlatform = async (id, updates) => {
    try {
      const res = await updateSocialPlatform(id, updates);
      if (res.success) {
        setSocialPlatforms(socialPlatforms.map(p => p._id === id ? res.data : p));
        toast.success('Platform updated');
      }
    } catch (error) {
      toast.error('Failed to update platform');
    }
  };

  const handleDeletePlatform = async (id) => {
    if (!window.confirm('Are you sure you want to delete this platform?')) return;
    try {
      const res = await deleteSocialPlatform(id);
      if (res.success) {
        setSocialPlatforms(socialPlatforms.filter(p => p._id !== id));
        toast.success('Platform deleted');
      }
    } catch (error) {
      toast.error('Failed to delete platform');
    }
  };

  const calculateBudgetSummary = () => {
    const platformNames = [...new Set(socialPlatforms.map(p => p.platform))].join(', ');
    const clusterNames = [...new Set(socialPlatforms.map(p => p.cluster?.name || p.cluster?.clusterName).filter(Boolean))].join(', ');
    const stateNames = [...new Set(socialPlatforms.map(p => p.state?.name).filter(Boolean))].join(', ');
    const totalBudget = socialPlatforms.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    const totalPlatforms = socialPlatforms.length;

    return { platformNames, clusterNames, stateNames, totalBudget, totalPlatforms };
  };

  const TABS = [
    { id: 'settings', label: 'Campaign Settings' },
    { id: 'social', label: 'Social Media' },
    { id: 'budget', label: 'Budget Controls' },
  ];

  if (loading && config.campaignTypes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { totalBudget, totalPlatforms } = calculateBudgetSummary();

  return (
    <div className="p-4 bg-[#e9ecef] min-h-screen font-sans">
      <h1 className="text-2xl font-bold text-[#00669c] mb-6 px-4">Admin Campaign Management</h1>

      {/* Region Selection: Card Style */}
      <div className="bg-white rounded-lg p-8 mb-6 shadow-sm border border-gray-100 flex flex-col gap-10">
        
        {/* Country Cards */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" /> Select Country
          </h2>
          <div className="flex flex-wrap gap-4">
            {countries.length > 0 && (
              <div
                onClick={() => handleCountryChange('all')}
                className={`cursor-pointer px-6 py-4 rounded-xl shadow-sm text-center min-w-[180px] transition-all bg-white border ${
                  config.country === 'all'
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50'
                    : 'border-gray-100 hover:border-blue-300'
                }`}
              >
                <div className={`font-bold text-lg ${config.country === 'all' ? 'text-blue-600' : 'text-gray-800'}`}>
                  Select All
                </div>
                <div className="text-gray-400 text-xs mt-1 uppercase tracking-wider font-semibold">
                  Global Region
                </div>
              </div>
            )}
            {countries.map((country) => (
              <div
                key={country._id}
                onClick={() => handleCountryChange(country._id)}
                className={`cursor-pointer px-6 py-4 rounded-xl shadow-sm text-center min-w-[180px] transition-all bg-white border ${
                  config.country === country._id
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50'
                    : 'border-gray-100 hover:border-blue-300'
                }`}
              >
                <div className={`font-bold text-lg ${config.country === country._id ? 'text-blue-600' : 'text-gray-800'}`}>
                  {country.name}
                </div>
                <div className="text-gray-400 text-xs mt-1 uppercase tracking-wider font-semibold">
                  {country.code || country.name.substring(0, 3).toUpperCase()} Region
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* State Cards */}
        {config.country && states.length > 0 && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" /> Select State
            </h2>
            <div className="flex flex-wrap gap-4">
              <div
                onClick={() => handleStateChange('all')}
                className={`cursor-pointer px-6 py-4 rounded-xl shadow-sm text-center min-w-[180px] transition-all bg-white border ${
                  config.state === 'all'
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50'
                    : 'border-gray-100 hover:border-blue-300'
                }`}
              >
                <div className={`font-bold text-lg ${config.state === 'all' ? 'text-blue-600' : 'text-gray-800'}`}>
                  Select All
                </div>
                <div className="text-gray-400 text-xs mt-1 uppercase font-semibold">
                  All States
                </div>
              </div>
              {states.map((s) => (
                <div
                  key={s._id}
                  onClick={() => handleStateChange(s._id)}
                  className={`cursor-pointer px-6 py-4 rounded-xl shadow-sm text-center min-w-[180px] transition-all bg-white border ${
                    config.state === s._id
                      ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50'
                      : 'border-gray-100 hover:border-blue-300'
                  }`}
                >
                  <div className={`font-bold text-lg ${config.state === s._id ? 'text-blue-600' : 'text-gray-800'}`}>
                    {s.name}
                  </div>
                  <div className="text-gray-400 text-xs mt-1 uppercase font-semibold">
                    State Office
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cluster Cards */}
        {config.state && clusters.length > 0 && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" /> Select Cluster
            </h2>
            <div className="flex flex-wrap gap-4">
              <div
                onClick={() => handleClusterChange('all')}
                className={`cursor-pointer px-6 py-4 rounded-xl shadow-sm text-center min-w-[160px] transition-all bg-white border ${
                  config.cluster === 'all'
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50'
                    : 'border-gray-100 hover:border-blue-300'
                }`}
              >
                <div className={`font-bold ${config.cluster === 'all' ? 'text-blue-600' : 'text-gray-800'}`}>
                  Select All
                </div>
              </div>
              {clusters.map((c) => (
                <div
                  key={c._id}
                  onClick={() => handleClusterChange(c._id)}
                  className={`cursor-pointer px-6 py-4 rounded-xl shadow-sm text-center min-w-[160px] transition-all bg-white border ${
                    config.cluster === c._id
                      ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50'
                      : 'border-gray-100 hover:border-blue-300'
                  }`}
                >
                  <div className={`font-bold ${config.cluster === c._id ? 'text-blue-600' : 'text-gray-800'}`}>
                    {c.name || c.clusterName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* District Cards */}
        {config.cluster && districts.length > 0 && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" /> Select District
            </h2>
            <div className="flex flex-wrap gap-4">
              <div
                onClick={() => handleDistrictChange('all')}
                className={`cursor-pointer px-6 py-4 rounded-xl shadow-sm text-center min-w-[160px] transition-all bg-white border ${
                  config.district === 'all'
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50'
                    : 'border-gray-100 hover:border-blue-300'
                }`}
              >
                 <div className={`font-bold ${config.district === 'all' ? 'text-blue-600' : 'text-gray-800'}`}>
                  Select All
                </div>
              </div>
              {districts.map((d) => (
                <div
                  key={d._id}
                  onClick={() => handleDistrictChange(d._id)}
                  className={`cursor-pointer px-6 py-4 rounded-xl shadow-sm text-center min-w-[160px] transition-all bg-white border ${
                    config.district === d._id
                      ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50'
                      : 'border-gray-100 hover:border-blue-300'
                  }`}
                >
                   <div className={`font-bold ${config.district === d._id ? 'text-blue-600' : 'text-gray-800'}`}>
                    {d.name || d.districtName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 min-h-[600px] flex flex-col">
        {/* Tabs - Boxed style */}
        <div className="flex space-x-0 mb-10 border border-gray-200 rounded-lg w-fit overflow-hidden shadow-sm">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-8 font-semibold text-sm transition-all border-r last:border-r-0 ${activeTab === tab.id
                ? 'bg-[#f0f7ff] text-[#00669c] border-b-2 border-b-[#00669c]'
                : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'settings' && (
            <div className="space-y-12 animate-fadeIn text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Format */}
                {/* Remove format field as per user request */}

                {/* Partner and Plans Selection */}
                <div className="col-span-full space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="text-base font-semibold text-gray-700 flex items-center gap-2">
                          <Users size={18} className="text-blue-500" /> Partner Type
                        </label>
                        <select 
                          value={config.partnerType}
                          onChange={(e) => handlePartnerTypeChange(e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 outline-none text-gray-700 bg-white shadow-sm"
                        >
                          <option value="">Select Partner Type</option>
                          {partners.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-4">
                        <label className="text-base font-semibold text-gray-700 flex items-center gap-2">
                          <CheckSquare size={18} className="text-blue-500" /> Available Plans (Multiple Selection)
                        </label>
                        <div className="border border-gray-300 rounded-md p-4 bg-gray-50 max-h-[180px] overflow-y-auto grid grid-cols-1 gap-2 shadow-inner">
                           {plans.length > 0 ? plans.map(plan => (
                             <div 
                                onClick={() => handlePlanToggle(plan._id)}
                                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                                  config.plans?.includes(plan._id) ? 'bg-blue-100 border-blue-200 border' : 'bg-white border-gray-200 border hover:bg-gray-50'
                                }`}
                             >
                                <input 
                                  type="checkbox" 
                                  checked={config.plans?.includes(plan._id)}
                                  onChange={() => {}} // Handled by div click
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-bold text-gray-700">{plan.name}</span>
                             </div>
                           )) : (
                             <div className="col-span-full py-6 text-center text-gray-400 italic text-sm">
                               {config.partnerType ? 'No plans found for this selection' : 'Select a partner type first'}
                             </div>
                           )}
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Types and Conversions Side-by-Side */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Layout size={20} className="text-[#00669c]" /> 
                    Campaign Types & Dynamic Conversion Ratio
                  </h2>
                </div>
                
                <div className="space-y-4">
                  {config.campaignTypes.map((type, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center animate-fadeInSlow">
                      <div className="md:col-span-6 flex items-center space-x-2">
                        <div className="flex-1 p-4 bg-white border border-gray-200 rounded-md text-gray-700 font-bold shadow-sm flex items-center justify-between">
                          <span>{type}</span>
                        </div>
                      </div>
                      
                      <div className="md:col-span-1 flex items-center justify-center">
                        <div className="w-8 h-[2px] bg-gray-300 hidden md:block"></div>
                      </div>

                      <div className="md:col-span-4 flex items-center space-x-4">
                         <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-blue-400 shadow-sm relative">
                            <div className="px-4 py-4 bg-gray-50 border-r border-gray-200 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">
                              {type} Conversion
                            </div>
                            <input
                              type="number"
                              value={config.conversions?.[type] || 0}
                              onChange={(e) => handleConversionChange(type, e.target.value)}
                              className="w-full p-4 outline-none text-right font-bold text-blue-600 pr-12"
                            />
                            <div className="absolute right-4 text-blue-400 font-bold text-lg pointer-events-none">%</div>
                         </div>
                      </div>

                      <div className="md:col-span-1 flex justify-end">
                        <button
                          onClick={() => handleRemoveType(type)}
                          className="p-3 text-gray-400 hover:text-red-500 transition-all bg-gray-50 rounded-full hover:bg-red-50 shadow-sm"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-4">
                    <div className="md:col-span-6 flex items-center space-x-2">
                      <input
                        type="text"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        className="flex-1 p-4 border border-dashed border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 outline-none text-gray-700 bg-gray-50/30"
                        placeholder="Add new campaign type..."
                      />
                    </div>
                    <div className="md:col-span-1"></div>
                    <div className="md:col-span-4">
                      <button
                        onClick={handleAddType}
                        className="w-full flex items-center justify-center space-x-2 p-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all shadow-md font-bold"
                      >
                        <Plus size={20} />
                        <span>Add New Type</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100 flex justify-start">
                <button
                  onClick={handleConfigSave}
                  disabled={loading}
                  className="flex items-center space-x-2 py-3 px-8 bg-[#28a745] text-white rounded font-bold text-sm hover:bg-green-700 transition-all shadow-md"
                >
                  <Save size={18} />
                  <span>Save All Settings</span>
                </button>
              </div>

              {/* Table showing all created plans/configs */}
              <div className="mt-16 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <BarChart2 size={20} className="text-[#00669c]" /> 
                    Configured Campaign Settings & Regional Plans
                  </h2>
                </div>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm overflow-x-auto">
                   <table className="w-full text-left min-w-[1000px]">
                      <thead className="bg-[#f8f9fa] text-xs font-bold text-gray-600 border-b border-gray-200 uppercase tracking-wider">
                         <tr>
                            <th className="px-6 py-4">Country/State</th>
                            <th className="px-6 py-4">Cluster/District</th>
                            <th className="px-6 py-4">Partner Type</th>
                            <th className="px-6 py-4">Selected Plans</th>
                            <th className="px-6 py-4">Conversions</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-sm font-medium">
                         {campaignConfigs.length > 0 ? campaignConfigs.map(c => (
                           <tr key={c._id} className="hover:bg-gray-50/50 transition-all">
                              <td className="px-6 py-4">
                                <div className="text-gray-900 font-bold">{c.country?.name || 'All'}</div>
                                <div className="text-gray-400 text-xs">{c.state?.name || 'All States'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-gray-700">{c.cluster?.name || c.cluster?.clusterName || 'All Clusters'}</div>
                                <div className="text-gray-400 text-xs lowercase italic">{c.district?.name || c.district?.districtName || 'all districts'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{c.partnerType || 'All Partners'}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1 max-w-[250px]">
                                  {c.plans && c.plans.length > 0 ? c.plans.map((p, i) => (
                                    <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-semibold">{p.name || p}</span>
                                  )) : <span className="text-gray-300 italic">No plans selected</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="space-y-1">
                                    {Object.entries(c.conversions || {}).map(([type, val]) => (
                                      <div key={type} className="flex items-center justify-between text-xs min-w-[100px]">
                                        <span className="text-gray-500">{type}:</span>
                                        <span className="font-bold text-blue-600">{val}%</span>
                                      </div>
                                    ))}
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <button 
                                  onClick={() => handleDeleteConfig(c._id)}
                                  className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-all"
                                 >
                                    <Trash2 size={18} />
                                 </button>
                              </td>
                           </tr>
                         )) : (
                           <tr>
                              <td colSpan="6" className="px-6 py-10 text-center text-gray-400 italic">
                                No configurations saved yet.
                              </td>
                           </tr>
                         )}
                      </tbody>
                   </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-8 animate-fadeIn text-left">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-[#f8f9fa] text-xs font-bold text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Platform</th>
                      <th className="px-6 py-4">State</th>
                      <th className="px-6 py-4">Cluster</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4">Quarter</th>
                      <th className="px-6 py-4">Budget</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-medium text-sm">
                    {socialPlatforms.map((p, idx) => (
                      <tr key={p._id} className="hover:bg-gray-50/50 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {p.platform === 'Facebook' && <Facebook size={16} className="text-blue-600" />}
                            {p.platform === 'Instagram' && <Instagram size={16} className="text-pink-600" />}
                            {p.platform === 'Twitter' && <Twitter size={16} className="text-blue-400" />}
                            {p.platform === 'LinkedIn' && <Linkedin size={16} className="text-blue-700" />}
                            <select
                              value={p.platform}
                              onChange={(e) => handleUpdatePlatform(p._id, { platform: e.target.value })}
                              className="bg-transparent outline-none focus:ring-0 cursor-pointer"
                            >
                              <option value="Facebook">Facebook</option>
                              <option value="Instagram">Instagram</option>
                              <option value="Twitter">Twitter</option>
                              <option value="LinkedIn">LinkedIn</option>
                              <option value="Google">Google</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={p.state?._id || p.state || ''}
                            onChange={(e) => handleUpdatePlatform(p._id, { state: e.target.value })}
                            className="bg-transparent outline-none border border-gray-300 rounded-md p-2 text-xs"
                          >
                            <option value="">Select State</option>
                            {states.map(s => (
                              <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={p.cluster?._id || p.cluster || ''}
                            onChange={(e) => handleUpdatePlatform(p._id, { cluster: e.target.value })}
                            className="bg-transparent outline-none border border-gray-300 rounded-md p-2 text-xs"
                          >
                            <option value="">Select Cluster</option>
                            {clusters
                              .filter(c => !p.state || (c.state?._id || c.state) === (p.state?._id || p.state))
                              .map(c => (
                                <option key={c._id} value={c._id}>{c.name || c.clusterName}</option>
                              ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleUpdatePlatform(p._id, { status: p.status === 'Active' ? 'Inactive' : 'Active' })}
                            className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition-all ${p.status === 'Active'
                              ? 'bg-[#28a745] text-white'
                              : 'bg-gray-200 text-gray-600'
                              }`}
                          >
                            {p.status}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={p.quarter}
                            onChange={(e) => handleUpdatePlatform(p._id, { quarter: e.target.value })}
                            className="bg-transparent outline-none border border-gray-300 rounded-md p-2 text-sm"
                          >
                            <option value="January-March">January-March</option>
                            <option value="April-June">April-June</option>
                            <option value="July-September">July-September</option>
                            <option value="October-December">October-December</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={p.budget}
                            onBlur={(e) => handleUpdatePlatform(p._id, { budget: Number(e.target.value) })}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setSocialPlatforms(socialPlatforms.map(item =>
                                item._id === p._id ? { ...item, budget: newVal } : item
                              ));
                            }}
                            className="w-24 border border-gray-300 rounded-md p-2 text-sm outline-none"
                            placeholder="Budget"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-4">
                            <button className="text-sm font-bold text-[#28a745] hover:opacity-80">Done</button>
                            <button
                              onClick={() => handleDeletePlatform(p._id)}
                              className="text-red-400 hover:text-red-600 transition-all border border-red-200 p-1 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-start">
                <button
                  onClick={handleAddPlatform}
                  className="flex items-center space-x-2 py-2.5 px-6 bg-[#28a745] text-white rounded font-bold text-sm hover:bg-green-700 transition-all shadow-sm"
                >
                  <Plus size={18} />
                  <span>Add New Platform</span>
                </button>
              </div>

              {/* Dynamic Platform Summary Cards */}
              <div className="mt-10 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                    <BarChart2 className="text-[#00669c]" size={20} />
                    <span>Platform Wise Budget Summary</span>
                  </h3>
                  <div className="bg-[#00669c] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                    Total Platforms: {socialPlatforms.length}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                  {socialPlatforms.map((p, idx) => (
                    <div key={p._id || idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                      <div className="bg-[#f8f9fa] p-4 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {p.platform === 'Facebook' && <Facebook size={18} className="text-blue-600" />}
                          {p.platform === 'Instagram' && <Instagram size={18} className="text-pink-600" />}
                          {p.platform === 'Twitter' && <Twitter size={18} className="text-blue-400" />}
                          {p.platform === 'LinkedIn' && <Linkedin size={18} className="text-blue-700" />}
                          <span className="font-bold text-gray-700">{p.platform}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase ${p.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}>
                          {p.status}
                        </span>
                      </div>

                      <div className="p-5 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 italic">State:</span>
                          <span className="font-semibold text-gray-800">{p.state?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 italic">Cluster:</span>
                          <span className="font-semibold text-gray-800">{p.cluster?.name || p.cluster?.clusterName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 italic">Quarter:</span>
                          <span className="font-semibold text-[#00669c]">{p.quarter}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Budget</span>
                          <div className="text-lg font-bold text-gray-900 flex items-center">
                            <span className="text-sm mr-1">₹</span>
                            {Number(p.budget).toLocaleString() || '0'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {socialPlatforms.length === 0 && (
                    <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
                      <p className="text-gray-400 italic">No platforms added yet. Add a platform above to see the summary.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="space-y-8 animate-fadeIn text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-4">
                  <label className="text-base font-semibold text-gray-700">Default Company Campaign Budget (₹)</label>
                  <input
                    type="number"
                    value={config.defaultCompanyBudget}
                    onChange={(e) => setConfig({ ...config, defaultCompanyBudget: Number(e.target.value) })}
                    className="w-full p-4 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 outline-none text-gray-700 bg-white font-medium shadow-sm"
                    placeholder="5000"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-base font-semibold text-gray-700">Default CPRM Campaign Budget (₹)</label>
                  <input
                    type="number"
                    value={config.defaultCprmBudget}
                    onChange={(e) => setConfig({ ...config, defaultCprmBudget: Number(e.target.value) })}
                    className="w-full p-4 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 outline-none text-gray-700 bg-white font-medium shadow-sm"
                    placeholder="2500"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <button
                  onClick={handleConfigSave}
                  disabled={loading}
                  className="flex items-center space-x-2 py-3 px-8 bg-[#28a745] text-white rounded font-bold text-sm hover:bg-green-700 transition-all shadow-md"
                >
                  <Save size={18} />
                  <span>Save Budget Settings</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Area */}
      <div className="mt-6 bg-white rounded-lg p-8 shadow-sm border border-gray-200 flex justify-center">
        <p className="text-base font-semibold text-gray-700 tracking-wide">
          Copyright © {new Date().getFullYear()} Solarkits. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default CampaignManagement;