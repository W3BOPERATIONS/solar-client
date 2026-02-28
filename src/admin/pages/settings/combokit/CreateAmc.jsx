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
  getSolarKits
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
  const [servicesLoading, setServicesLoading] = useState(false);

  // Form states for configuration
  const [planForm, setPlanForm] = useState({
    planName: 'Basic Plan',
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

  // Open configuration modal
  const openConfigureModal = (config) => {
    if (!selectedState) {
      toast.error('Please select a state first');
      return;
    }

    setSelectedConfig(config);

    // Check if plan already exists for this state and configuration
    const existingPlan = amcPlans.find(plan =>
      plan.state && plan.state._id === selectedState &&
      plan.category === config.category &&
      plan.projectType === config.projectType
    );

    if (existingPlan) {
      setCurrentPlan(existingPlan);
      setSelectedServices(existingPlan.services.map(s => s._id));
      setPlanForm({
        planName: existingPlan.planName || 'Basic Plan',
        monthlyCharge: existingPlan.monthlyCharge || 0,
        yearlyCharge: existingPlan.yearlyCharge || 0,
        annualVisits: existingPlan.annualVisits || 4,
        description: existingPlan.description || ''
      });
    } else {
      setCurrentPlan(null);
      setSelectedServices([]);
      setPlanForm({
        planName: 'Basic Plan',
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
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    try {
      const payload = {
        stateId: selectedState,
        serviceIds: selectedServices,
        ...selectedConfig,
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
  const openViewModal = (config) => {
    const plan = amcPlans.find(p =>
      p.state && p.state._id === selectedState &&
      p.category === config.category &&
      p.projectType === config.projectType
    );

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
      {/* Premium Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 mb-6">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center border border-cyan-100 shadow-sm">
                <Cog className="text-cyan-600" size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">Create AMC Plan</h1>
                <p className="text-[11px] text-slate-500 font-medium">Configure and manage state-wise maintenance service plans</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchAllPlans}
                className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"
                title="Refresh Data"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
              <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">System Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6">
        {/* State Selection Cards - Horizontal Scrollable like PHP */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-cyan-500 rounded-full"></div>
              Select Operational State
            </h2>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
              {states.length} States Available
            </span>
          </div>

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
                    flex-shrink-0 w-52 p-4 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden group
                    ${selectedState === state._id
                      ? 'border-cyan-500 bg-white shadow-md shadow-cyan-100'
                      : 'border-white bg-white hover:border-slate-200 shadow-sm hover:shadow-md'}
                  `}
                >
                  {/* Decorative element like PHP */}
                  <div className={`
                    absolute top-0 left-0 w-1 h-full
                    ${selectedState === state._id ? 'bg-cyan-500' : 'bg-slate-100 group-hover:bg-slate-200'}
                  `}></div>

                  <div className="pl-2">
                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 transition-colors
                      ${selectedState === state._id ? 'text-cyan-600' : 'text-slate-400'}`}>
                      State Code: {state.code || 'IN'}
                    </div>
                    <div className="text-sm font-bold text-slate-800 flex items-center justify-between">
                      {state.name}
                      {selectedState === state._id && (
                        <div className="bg-cyan-500 text-white p-0.5 rounded-full">
                          <CheckSquare size={12} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subtle background state code as decorative icon */}
                  <div className="absolute -right-2 -bottom-2 opacity-[0.03] text-6xl font-black pointer-events-none select-none">
                    {state.code || 'IN'}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* AMC Configuration Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Package size={18} className="text-cyan-500" />
              AMC Configuration {selectedStateData && `for ${selectedStateData.name}`}
            </h3>
            {selectedState && (
              <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">
                {solarKits.length} Configurations Found
              </span>
            )}
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
            ) : solarKits.length === 0 ? (
              <div className="py-20 text-center">
                <Loader className="animate-spin text-cyan-500 mx-auto mb-4" size={32} />
                <p className="text-slate-500 text-xs font-medium tracking-wide italic">Fetching system configurations...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Category</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Sub Category</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Project Type</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Sub Project</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">AMC Status</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {solarKits.map((config, index) => {
                    const plan = amcPlans.find(p =>
                      p.state && p.state._id === selectedState &&
                      p.category === config.category &&
                      p.projectType === config.projectType
                    );

                    return (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-700">{config.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-500">{config.subCategory}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{config.projectType}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-500">{config.subProjectType}</span>
                        </td>
                        <td className="px-6 py-4">
                          {plan ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                              <span className="text-[11px] font-bold text-emerald-600">Active Map</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                              <span className="text-[11px] font-bold text-slate-400 italic">Not Configured</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {plan ? (
                              <>
                                <button
                                  onClick={() => openViewModal(config)}
                                  className="p-1.5 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"
                                  title="View Details"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => openConfigureModal(config)}
                                  className="p-1.5 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"
                                  title="Edit Configuration"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeletePlan(plan._id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  title="Remove Plan"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => openConfigureModal(config)}
                                className="px-3 py-1.5 bg-cyan-600 text-white text-[11px] font-bold rounded-lg hover:bg-cyan-700 transition-all flex items-center gap-1 shadow-sm shadow-cyan-100"
                              >
                                <PlusCircle size={14} />
                                Configure AMC
                              </button>
                            )}
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto w-full max-w-4xl shadow-2xl rounded-2xl bg-white overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-1">Configuration Wizard</div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Cog className="text-cyan-400" size={20} />
                  Configure AMC for {selectedStateData?.name}
                </h3>
                {selectedConfig && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-slate-400">
                    <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{selectedConfig.category}</span>
                    <ChevronRight size={12} />
                    <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{selectedConfig.projectType}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setConfigureModalOpen(false)}
                className="relative z-10 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-all text-slate-400 hover:text-white"
              >
                &times;
              </button>

              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            </div>

            <div className="p-0 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Left Column: Plan Details */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-1 h-3 bg-cyan-500 rounded-full"></div>
                        Plan Identity
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 ml-1">Plan Name</label>
                          <input
                            type="text"
                            value={planForm.planName}
                            onChange={(e) => setPlanForm({ ...planForm, planName: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                            placeholder="e.g. Platinum Residential Plan"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 ml-1">Plan Description</label>
                          <textarea
                            value={planForm.description}
                            onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all min-h-[100px]"
                            placeholder="Describe what this plan includes..."
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                        Pricing & Schedule
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 ml-1">Monthly (₹)</label>
                          <input
                            type="number"
                            value={planForm.monthlyCharge}
                            onChange={(e) => setPlanForm({ ...planForm, monthlyCharge: e.target.value })}
                            className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-2.5 text-sm font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 ml-1">Yearly (₹)</label>
                          <input
                            type="number"
                            value={planForm.yearlyCharge}
                            onChange={(e) => setPlanForm({ ...planForm, yearlyCharge: e.target.value })}
                            className="w-full bg-emerald-500 text-white border border-emerald-600 rounded-xl px-4 py-2.5 text-sm font-black focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 ml-1">Annual Visits</label>
                          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <input
                              type="range"
                              min="1"
                              max="12"
                              value={planForm.annualVisits}
                              onChange={(e) => setPlanForm({ ...planForm, annualVisits: e.target.value })}
                              className="flex-1 accent-cyan-600"
                            />
                            <span className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-sm font-black text-cyan-600 shadow-sm">{planForm.annualVisits}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Service Selection */}
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                      Included Services
                    </h4>

                    {servicesLoading ? (
                      <div className="flex justify-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
                        <Loader className="animate-spin text-cyan-500" size={32} />
                      </div>
                    ) : (
                      <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-[400px] overflow-y-auto no-scrollbar">
                        {availableServices.map((service) => (
                          <div
                            key={service._id}
                            onClick={() => toggleService(service._id)}
                            className={`
                              group p-3 rounded-xl border-2 cursor-pointer transition-all duration-300
                              ${selectedServices.includes(service._id)
                                ? 'bg-white border-cyan-500 shadow-sm'
                                : 'bg-white/50 border-white hover:border-slate-200'}
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`
                                w-5 h-5 rounded-md border flex items-center justify-center transition-all
                                ${selectedServices.includes(service._id)
                                  ? 'bg-cyan-500 border-cyan-500 text-white'
                                  : 'bg-white border-slate-300 group-hover:border-slate-400'}
                              `}>
                                {selectedServices.includes(service._id) && <CheckSquare size={14} />}
                              </div>
                              <div className="flex-1">
                                <div className="text-[11px] font-bold text-slate-800">{service.serviceName}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{service.serviceType}</span>
                                  <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                  <span className="text-[9px] font-bold text-cyan-600">₹{service.basePrice}/{service.priceType}</span>
                                </div>
                              </div>
                              {service.hasPowerGuarantee && (
                                <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-tighter">Power Guard</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400">
                    <AlertCircle size={16} />
                    <span className="text-[10px] font-medium tracking-wide">Configuration will be applied to {selectedStateData?.name} exclusively.</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="px-6 py-2.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
                      onClick={() => setConfigureModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-8 py-2.5 bg-slate-900 text-white text-[11px] font-black rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center gap-2 disabled:opacity-50"
                      onClick={saveConfiguration}
                      disabled={selectedServices.length === 0}
                    >
                      <Save size={16} />
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto w-full max-w-4xl shadow-2xl rounded-2xl bg-white overflow-hidden border border-slate-200">
            <div className="bg-white p-8 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-inner">
                  <CheckSquare className="text-emerald-600" size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Mapped Configuration</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{currentPlan.state?.name || 'Local State'}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                    {currentPlan.planName}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <div className="p-0">
              <div className="grid grid-cols-3 bg-slate-50/50 border-b border-slate-100">
                <div className="p-6 border-r border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Cost</div>
                  <div className="text-lg font-black text-slate-800">₹{currentPlan.monthlyCharge?.toLocaleString()}</div>
                </div>
                <div className="p-6 border-r border-slate-100 bg-emerald-50/30">
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Annual Premium</div>
                  <div className="text-lg font-black text-emerald-700">₹{currentPlan.yearlyCharge?.toLocaleString()}</div>
                </div>
                <div className="p-6">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scheduled Visits</div>
                  <div className="text-lg font-black text-slate-800">{currentPlan.annualVisits} Per Year</div>
                </div>
              </div>

              <div className="p-8">
                <div className="mb-8">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <List className="text-cyan-500" size={16} />
                    Service Breakdown
                  </h4>
                  <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Item</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequency</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Power Guard</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unit Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {currentPlan.services.map((service, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-5 py-3 text-xs font-bold text-slate-700">{service.serviceName}</td>
                            <td className="px-5 py-3">
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">{service.serviceType}</span>
                            </td>
                            <td className="px-5 py-3 text-[11px] font-medium text-slate-600">{service.visitsPerYear} visits</td>
                            <td className="px-5 py-3">
                              {service.hasPowerGuarantee ? (
                                <div className="flex items-center gap-1.5 text-emerald-600">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                  <span className="text-[10px] font-black uppercase">Secured</span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-300 italic uppercase">Not Included</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <span className="text-xs font-black text-slate-900">₹{service.basePrice.toLocaleString()}</span>
                              <span className="text-[10px] font-medium text-slate-400 ml-1">/{service.priceType}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex items-start gap-4">
                  <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center flex-shrink-0">
                    <Info className="text-cyan-500" size={20} />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1">Plan Description & Policy</h5>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {currentPlan.description || "No specific policy description provided for this maintenance plan."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  className="px-6 py-2.5 bg-slate-800 text-white text-[11px] font-black rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-200"
                  onClick={() => setViewModalOpen(false)}
                >
                  Got it, Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateAmc;