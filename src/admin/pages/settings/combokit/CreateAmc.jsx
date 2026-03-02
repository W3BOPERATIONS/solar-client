import React, { useState, useEffect } from 'react';
import {
  PlusCircle, Save, RefreshCw, Cog, List,
  Edit2, Trash2, CheckSquare, XSquare,
  Search, Filter, MoreVertical, ChevronRight,
  AlertCircle, Info, Settings, Eye, Package,
  Loader
} from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import {
  getAMCServices,
  createAMCPlan,
  updateAMCPlan,
  getAMCPlans,
  deleteAMCPlan,
  getSolarKits,
  createAMCService
} from '../../../../services/combokit/combokitApi';
import toast from 'react-hot-toast';

const CreateAmc = () => {
  const { countries, states, loading: locationLoading, fetchStates } = useLocations();

  // State management
  const [selectedState, setSelectedState] = useState('');
  const [selectedStateData, setSelectedStateData] = useState(null);
  const [amcPlans, setAmcPlans] = useState([]);
  const [solarKits, setSolarKits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [configureModalOpen, setConfigureModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(null);

  // Available services
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [customServices, setCustomServices] = useState([]);
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [servicesLoading, setServicesLoading] = useState(false);

  // Form states for configuration
  const [planForm, setPlanForm] = useState({
    planName: 'Basic Plan',
    category: 'Solar Rooftop',
    subCategory: 'Residential',
    projectType: '3-5 kW',
    subProjectType: 'On-Grid',
    monthlyCharge: 0,
    yearlyCharge: 0,
    annualVisits: 4,
    description: 'Standard residential AMC plan'
  });

  // Fetch initial data
  useEffect(() => {
    fetchStates('India');
    fetchServices();
    fetchSolarKits();
    fetchAllPlans();
  }, []);

  const fetchSolarKits = async () => {
    try {
      // Use any country to get unique configurations
      const data = await getSolarKits();

      // Extract unique configurations based on category, subCategory, projectType, subProjectType
      const uniqueConfigs = [];
      const seen = new Set();

      data.forEach(kit => {
        const key = `${kit.category}-${kit.subCategory}-${kit.projectType}-${kit.subProjectType}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueConfigs.push({
            category: kit.category || 'Solar Rooftop',
            subCategory: kit.subCategory || 'Residential',
            projectType: kit.projectType || '3-5 kW',
            subProjectType: kit.subProjectType || 'On-Grid'
          });
        }
      });

      setSolarKits(uniqueConfigs);
    } catch (error) {
      console.error('Error fetching SolarKits:', error);
    }
  };

  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      const data = await getAMCServices();
      setAvailableServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchAllPlans = async () => {
    try {
      setLoading(true);
      // Pass empty state to get all plans
      const data = await getAMCPlans('');
      setAmcPlans(data);
    } catch (error) {
      console.error('Error fetching AMC plans:', error);
      toast.error('Failed to load AMC plans');
    } finally {
      setLoading(false);
    }
  };

  // Handle state selection
  const handleStateSelect = (state) => {
    setSelectedState(state._id);
    setSelectedStateData(state);
  };

  // Filter plans based on selected state
  const getFilteredPlans = () => {
    if (!selectedState) return amcPlans;
    return amcPlans.filter(plan => plan.state && plan.state._id === selectedState);
  };

  // Derive unique options from solarKits for the dynamic dropdowns
  const uniqueCategories = [...new Set(solarKits.map(k => k.category))].filter(Boolean);
  const uniqueSubCategories = [...new Set(solarKits.map(k => k.subCategory))].filter(Boolean);
  const uniqueProjectTypes = [...new Set(solarKits.map(k => k.projectType))].filter(Boolean);
  const uniqueSubProjectTypes = [...new Set(solarKits.map(k => k.subProjectType))].filter(Boolean);

  // Open configuration modal
  const openConfigureModal = (config) => {
    if (!selectedState) {
      toast.error('Please select a state first');
      return;
    }

    setSelectedConfig(config);

    if (config) {
      const existingPlan = amcPlans.find(plan =>
        plan.state && plan.state._id === selectedState &&
        plan.category === config.category &&
        plan.projectType === config.projectType
      );

      if (existingPlan) {
        setCurrentPlan(existingPlan);
        setSelectedServices(existingPlan.services?.map(s => s._id) || []);
        setCustomServices([]);
        setCustomServiceInput('');
        setPlanForm({
          planName: existingPlan.planName || 'Basic Plan',
          category: existingPlan.category || config.category,
          subCategory: existingPlan.subCategory || config.subCategory,
          projectType: existingPlan.projectType || config.projectType,
          subProjectType: existingPlan.subProjectType || config.subProjectType,
          monthlyCharge: existingPlan.monthlyCharge || 0,
          yearlyCharge: existingPlan.yearlyCharge || 0,
          annualVisits: existingPlan.annualVisits || 4,
          description: existingPlan.description || ''
        });
      } else {
        setCurrentPlan(null);
        setSelectedServices([]);
        setCustomServices([]);
        setCustomServiceInput('');
        setPlanForm({
          planName: 'Basic Plan',
          category: config.category || 'Solar Rooftop',
          subCategory: config.subCategory || 'Residential',
          projectType: config.projectType || '3-5 kW',
          subProjectType: config.subProjectType || 'On-Grid',
          monthlyCharge: 0,
          yearlyCharge: 0,
          annualVisits: 4,
          description: 'Standard residential AMC plan'
        });
      }
    } else {
      // Creating a new AMC from scratch
      setCurrentPlan(null);
      setSelectedServices([]);
      setCustomServices([]);
      setCustomServiceInput('');
      setPlanForm({
        planName: 'Basic Plan',
        category: 'Solar Rooftop',
        subCategory: 'Residential',
        projectType: '3-5 kW',
        subProjectType: 'On-Grid',
        monthlyCharge: 0,
        yearlyCharge: 0,
        annualVisits: 4,
        description: 'Standard residential AMC plan'
      });
    }

    setConfigureModalOpen(true);
  };

  // Toggle service selection
  const toggleService = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  // Save configuration
  const saveConfiguration = async () => {
    if (selectedServices.length === 0 && customServices.length === 0) {
      toast.error('Please select or add at least one service');
      return;
    }

    try {
      setLoading(true);
      const newServiceIds = [];
      if (customServices.length > 0) {
        const promises = customServices.map(serviceName => 
          createAMCService({ serviceName, status: 'Active' })
        );
        const results = await Promise.allSettled(promises);
        results.forEach(res => {
          if (res.status === 'fulfilled' && res.value?._id) {
            newServiceIds.push(res.value._id);
          }
        });
      }

      const finalServiceIds = [...selectedServices, ...newServiceIds];

      const payload = {
        stateId: selectedState,
        serviceIds: finalServiceIds,
        ...(selectedConfig ? selectedConfig : {
          category: planForm.category,
          subCategory: planForm.subCategory,
          projectType: planForm.projectType,
          subProjectType: planForm.subProjectType,
        }),
        ...planForm
      };

      if (currentPlan) {
        await updateAMCPlan(currentPlan._id, payload);
        toast.success('AMC Plan updated successfully!');
      } else {
        await createAMCPlan(payload);
        toast.success('AMC Plan configuration saved successfully!');
      }

      setConfigureModalOpen(false);
      fetchAllPlans();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error(error.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  // Delete plan
  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this AMC plan?')) {
      try {
        await deleteAMCPlan(planId);
        toast.success('AMC Plan deleted successfully');
        fetchAllPlans();
      } catch (error) {
        console.error('Error deleting plan:', error);
        toast.error('Failed to delete plan');
      }
    }
  };

  // View details
  const openViewModal = (plan) => {
    if (!plan) {
      toast.error('No configuration found for this plan');
      return;
    }

    setCurrentPlan(plan);
    setViewModalOpen(true);
  };

  // Get state name from ID
  const getStateName = (stateId) => {
    // If state object is passed directly (from populated data)
    if (typeof stateId === 'object' && stateId !== null) {
      return stateId.name;
    }
    // If ID is passed, find in states list
    const state = states.find(s => s._id === stateId);
    return state ? state.name : 'Unknown State';
  };

  const filteredPlans = getFilteredPlans();

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50/50 rounded-lg flex items-center justify-center">
            <Cog className="text-blue-500" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">AMC Management</h1>
            <p className="text-sm text-gray-500 mt-1">Configure Annual Maintenance Contract plans for different states</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6">
        {/* State Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-800">Select State</h2>
          </div>
          <div className="p-6">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
              {locationLoading ? (
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-48 h-20 bg-slate-100 animate-pulse rounded-xl border border-slate-200"></div>
                  ))}
                </div>
              ) : (
                states.map((state) => (
                  <button
                    key={state._id}
                    onClick={() => handleStateSelect(state)}
                    className={`
                      flex-shrink-0 w-48 p-4 rounded-xl border-2 transition-all duration-300 text-center relative
                      ${selectedState === state._id
                        ? 'border-blue-500 bg-blue-50/10 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'}
                    `}
                  >
                    <div className="text-sm font-bold text-gray-800 mb-1">
                      {state.name}
                    </div>
                    <div className="text-xs font-semibold text-gray-500 uppercase">
                      {state.code || 'IN'}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Header when active */}
        {selectedState && selectedStateData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 border-l-4 border-l-blue-500 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800 tracking-tight flex items-center gap-2">
                AMC Plans for <span className="text-blue-600 font-bold">{selectedStateData.name}</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Configure and manage AMC plans for the selected state</p>
            </div>
            <button
              onClick={() => openConfigureModal(null)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm shadow-blue-200"
            >
              <PlusCircle size={16} />
              Create AMC
            </button>
          </div>
        )}

        {/* AMC Configuration Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-12">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">
              AMC Configuration
            </h3>
          </div>

          <div className="overflow-x-auto">
            {!selectedState ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <ChevronRight size={32} className="text-slate-300" />
                </div>
                <h4 className="text-slate-800 font-bold mb-1">No State Selected</h4>
                <p className="text-slate-500 text-xs">Please select a state from the cards above to view configurations</p>
              </div>
            ) : loading ? (
              <div className="py-20 text-center">
                <Loader className="animate-spin text-cyan-500 mx-auto mb-4" size={32} />
                <p className="text-slate-500 text-xs font-medium tracking-wide italic">Fetching AMC plans...</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Package size={32} className="text-slate-300" />
                </div>
                <h4 className="text-slate-800 font-bold mb-1">No AMC Plans Found</h4>
                <p className="text-slate-500 text-xs">Click the "Create AMC" button above to get started.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">Sub Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">Project Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">Sub Project Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPlans.map((plan, index) => {
                    return (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <span className="text-sm text-gray-600">{plan.category}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm text-gray-600">{plan.subCategory}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm text-gray-600">{plan.projectType}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm text-gray-600">{plan.subProjectType}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openViewModal(plan)}
                              className="px-4 py-2 bg-gray-600 text-white text-xs font-semibold rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1.5"
                            >
                              <Eye size={14} />
                              View
                            </button>
                            <button
                              onClick={() => openConfigureModal(plan)}
                              className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-semibold rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>
                            <button
                               onClick={() => handleDeletePlan(plan._id)}
                               className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                             >
                               <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Premium Configure Modal */}
      {configureModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto w-full max-w-4xl shadow-2xl rounded-2xl bg-white overflow-hidden border border-slate-200">
            <div className="bg-[#0c2340] text-white p-6 relative flex justify-between items-start">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-1">Configuration Wizard</div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Cog className="text-cyan-400" size={20} />
                  Configure AMC for {selectedStateData?.name}
                </h3>
              </div>
              <button
                onClick={() => setConfigureModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center hover:bg-slate-700 transition-all text-slate-300 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="p-0 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="p-8">
                <div className="space-y-10">
                  {/* Plan Details */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[11px] font-bold text-cyan-500 uppercase tracking-widest mb-6 flex items-center gap-2 border-l-[3px] border-cyan-500 pl-3 leading-none h-4">
                        PLAN IDENTITY
                      </h4>
                      <div className="space-y-5">
                        {!selectedConfig && (
                          <div className="grid grid-cols-2 gap-5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">CATEGORY</label>
                              <div className="relative">
                                <select
                                  value={planForm.category}
                                  onChange={(e) => setPlanForm({ ...planForm, category: e.target.value })}
                                  className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer hover:border-slate-200"
                                >
                                  <option value="">Select Category</option>
                                  {uniqueCategories.map((cat, i) => (
                                    <option key={i} value={cat}>{cat}</option>
                                  ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                  <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 6L0 0H10L5 6Z"/>
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">SUB CATEGORY</label>
                              <div className="relative">
                                <select
                                  value={planForm.subCategory}
                                  onChange={(e) => setPlanForm({ ...planForm, subCategory: e.target.value })}
                                  className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer hover:border-slate-200"
                                >
                                  <option value="">Select Sub Category</option>
                                  {uniqueSubCategories.map((sub, i) => (
                                    <option key={i} value={sub}>{sub}</option>
                                  ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                  <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 6L0 0H10L5 6Z"/>
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">PROJECT TYPE</label>
                              <div className="relative">
                                <select
                                  value={planForm.projectType}
                                  onChange={(e) => setPlanForm({ ...planForm, projectType: e.target.value })}
                                  className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer hover:border-slate-200"
                                >
                                  <option value="">Select Project Type</option>
                                  {uniqueProjectTypes.map((pt, i) => (
                                    <option key={i} value={pt}>{pt}</option>
                                  ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                  <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 6L0 0H10L5 6Z"/>
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">SUB PROJECT TYPE</label>
                              <div className="relative">
                                <select
                                  value={planForm.subProjectType}
                                  onChange={(e) => setPlanForm({ ...planForm, subProjectType: e.target.value })}
                                  className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer hover:border-slate-200"
                                >
                                  <option value="">Select Sub Project Type</option>
                                  {uniqueSubProjectTypes.map((spt, i) => (
                                    <option key={i} value={spt}>{spt}</option>
                                  ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                  <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 6L0 0H10L5 6Z"/>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">PLAN NAME</label>
                          <input
                            type="text"
                            value={planForm.planName}
                            onChange={(e) => setPlanForm({ ...planForm, planName: e.target.value })}
                            className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-cyan-500 transition-all hover:border-slate-200"
                            placeholder="Basic Plan"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">PLAN DESCRIPTION</label>
                          <textarea
                            value={planForm.description}
                            onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                            className="w-full bg-white border-2 border-cyan-400 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-cyan-50 transition-all min-h-[100px]"
                            placeholder="Standard residential AMC plan"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest mb-6 flex items-center gap-2 border-l-[3px] border-emerald-500 pl-3 leading-none h-4">
                        PRICING & SCHEDULE
                      </h4>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">MONTHLY (₹)</label>
                          <input
                            type="number"
                            value={planForm.monthlyCharge}
                            onChange={(e) => setPlanForm({ ...planForm, monthlyCharge: e.target.value })}
                            className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all hover:border-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">YEARLY (₹)</label>
                          <input
                            type="number"
                            value={planForm.yearlyCharge}
                            onChange={(e) => setPlanForm({ ...planForm, yearlyCharge: e.target.value })}
                            className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all hover:border-slate-200"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">ANNUAL VISITS</label>
                          <div className="flex items-center gap-5 bg-slate-50/50 p-4 rounded-xl border-2 border-slate-50 hover:border-slate-100 transition-all">
                            <input
                              type="range"
                              min="1"
                              max="12"
                              value={planForm.annualVisits}
                              onChange={(e) => setPlanForm({ ...planForm, annualVisits: e.target.value })}
                              className="flex-1 accent-emerald-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="w-10 h-10 bg-white border-2 border-slate-100 rounded-lg flex items-center justify-center text-sm font-black text-emerald-600 shadow-sm">{planForm.annualVisits}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 pb-4">
                      <h4 className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-6 flex items-center gap-2 border-l-[3px] border-blue-500 pl-3 leading-none h-4">
                        INCLUDED SERVICES
                      </h4>

                      <div className="space-y-4">
                        {/* Custom Service Input Box */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">WRITE CUSTOM SERVICES</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={customServiceInput}
                              onChange={(e) => setCustomServiceInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (customServiceInput.trim()) {
                                    if (!customServices.includes(customServiceInput.trim())) {
                                      setCustomServices([...customServices, customServiceInput.trim()]);
                                    }
                                    setCustomServiceInput('');
                                  }
                                }
                              }}
                              className="flex-1 bg-white border-2 border-slate-100 hover:border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                              placeholder="Type a service and press Enter to add..."
                            />
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (customServiceInput.trim()) {
                                  if (!customServices.includes(customServiceInput.trim())) {
                                    setCustomServices([...customServices, customServiceInput.trim()]);
                                  }
                                  setCustomServiceInput('');
                                }
                              }}
                              className="px-6 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {/* Combined Chips matching the UI standard */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {/* Selected Pre-existing Services */}
                          {availableServices.filter(s => selectedServices.includes(s._id)).map((service) => (
                            <div key={service._id} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-100 text-[11.5px] font-bold">
                              {service.serviceName}
                              <button onClick={() => toggleService(service._id)} className="text-blue-400 hover:text-blue-600">
                                &times;
                              </button>
                            </div>
                          ))}
                          {/* Newly custom added services */}
                          {customServices.map((service, idx) => (
                            <div key={`custom-${idx}`} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-100 text-[11.5px] font-bold">
                              {service}
                              <button onClick={() => setCustomServices(customServices.filter((_, i) => i !== idx))} className="text-blue-400 hover:text-blue-600">
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Expandable predefined choices when user hits "Add More" - or simply list them out. 
                            Let's keep a tight list above the button only if needed, or simple small chips.
                        */}
                        {availableServices.length > 0 && availableServices.filter(s => !selectedServices.includes(s._id)).length > 0 && (
                          <div className="pt-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">QUICK ADD FROM EXISTING</label>
                            <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto no-scrollbar pb-2">
                              {availableServices.filter(s => !selectedServices.includes(s._id)).map((service) => (
                                <button
                                  key={service._id}
                                  onClick={() => toggleService(service._id)}
                                  className="bg-white border-2 border-slate-100 hover:border-blue-100 hover:bg-blue-50/50 text-slate-500 hover:text-blue-600 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all"
                                >
                                  + {service.serviceName}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="border-t border-slate-100 bg-white p-6 mt-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-400">
                    <AlertCircle size={16} />
                    <span className="text-[10px] font-medium tracking-wide">Configuration for {selectedStateData?.name}</span>
                  </div>
                  <div className="flex gap-4">
                    <button
                      className="px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setConfigureModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-8 py-3 bg-[#8b919a] hover:bg-[#727882] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                      onClick={saveConfiguration}
                      disabled={loading || (selectedServices.length === 0 && customServices.length === 0)}
                    >
                      {loading ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium View Modal */}
      {viewModalOpen && currentPlan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto w-full max-w-3xl shadow-xl rounded-xl bg-white overflow-hidden border border-gray-100 p-8 pb-4">
            
            {/* Header Content */}
            <div className="mb-2">
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{currentPlan.planName}</h2>
              <p className="text-[#3b82f6] text-sm mt-0.5">{currentPlan.description || 'Standard residential AMC plan'}</p>
            </div>
            
            {/* Thin blue separator matching screenshot perfectly */}
            <div className="w-full h-[2px] bg-[#3b82f6] mt-4 mb-6"></div>

            <div className="space-y-6">
              {/* Plan Details */}
              <div>
                <h4 className="text-[14px] font-bold text-gray-900 mb-3">Plan Details</h4>
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Category</div>
                    <div className="text-[13px] font-bold text-gray-800">{currentPlan.category}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Sub Category</div>
                    <div className="text-[13px] font-bold text-gray-800">{currentPlan.subCategory}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Project Type</div>
                    <div className="text-[13px] font-bold text-gray-800">{currentPlan.projectType}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Sub Project Type</div>
                    <div className="text-[13px] font-bold text-gray-800">{currentPlan.subProjectType}</div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="text-[14px] font-bold text-gray-900 mb-3">Pricing</h4>
                <div className="grid grid-cols-4 gap-6">
                  <div className="col-span-2">
                    <div className="text-xs text-gray-400 mb-1">Charge Type</div>
                    <div className="text-[13px] font-bold text-gray-800">Fixed Monthly/Yearly Charges</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Monthly Charge</div>
                    <div className="text-[13px] font-bold text-gray-800">₹{currentPlan.monthlyCharge?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Yearly Charge</div>
                    <div className="text-[13px] font-bold text-gray-800">₹{currentPlan.yearlyCharge?.toLocaleString() || 0}</div>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <h4 className="text-[14px] font-bold text-gray-900 mb-3 flex items-center gap-2">Services include_onced</h4>
                <div className="flex flex-wrap gap-2">
                  {currentPlan.services && currentPlan.services.map((service, idx) => (
                    <span key={idx} className="bg-gray-100/80 text-gray-600 text-xs px-3 py-1 rounded-full whitespace-nowrap">
                      {service.serviceName}
                    </span>
                  ))}
                </div>
              </div>

              {/* Visits and State */}
              <div>
                <h4 className="text-[14px] font-bold text-gray-900 mb-3">Visits</h4>
                <div className="grid grid-cols-4 gap-6">
                  <div className="col-span-2">
                    <div className="text-xs text-gray-400 mb-1">Annual Visits</div>
                    <div className="text-[13px] font-bold text-gray-800">{currentPlan.annualVisits} visits per year</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-gray-400 mb-1">State</div>
                    <div className="text-[13px] font-bold text-gray-800">{currentPlan.state?.name || 'Local State'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Close Button */}
            <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-6 py-2 bg-[#6c757d] hover:bg-[#5a6268] text-white text-sm font-medium rounded-md transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateAmc;