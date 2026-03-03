import React, { useState, useEffect, useRef } from 'react';
import {
  Settings, Check, Rocket, Edit, LayoutGrid, CircleUserRound, Building2, House,
  MapPin, Eye, CheckCircle2, ChevronUp, Plus, Trash2, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getInstallerAgencyPlans,
  createInstallerAgencyPlan,
  updateInstallerAgencyPlan,
  deleteInstallerAgencyPlan
} from '../../../../services/installer/installerApi';
import { getStates } from '../../../../services/core/locationApi';

const DEFAULT_PLAN = {
  name: 'New Plan',
  description: 'Description for the new plan',
  minimumRating: 0,
  planColor: '#0070cc',
  state: null,
  eligibility: { kyc: false, agreement: false },
  coverage: 'District',
  userLimits: 10,
  subUser: { supervisor: false },
  assignedProjectTypes: [
    { category: 'Solar Rooftop', subCategory: 'Residential', projectType: '3kw - 5kw', subProjectType: 'On-Grid', capacity: '', daysRequiredUnit: 'Weeks', daysRequiredVal: '', active: false },
    { category: 'Solar Rooftop', subCategory: 'Residential', projectType: '5kw - 15kw', subProjectType: 'Off-Grid', capacity: '', daysRequiredUnit: 'Weeks', daysRequiredVal: '', active: false },
    { category: 'Solar Rooftop', subCategory: 'Commercial', projectType: '10kw - 25kw', subProjectType: 'On-Grid', capacity: '', daysRequiredUnit: 'Weeks', daysRequiredVal: '', active: false }
  ],
  solarInstallationPoints: [
    { typeLabel: 'Residential', points: 0, periodInMonth: 0, claimInMonth: 0 },
    { typeLabel: 'Commercial up to 100 Kw', points: 0, periodInMonth: 0, claimInMonth: 0 },
    { typeLabel: 'Commercial above 100 Kw', points: 0, periodInMonth: 0, claimInMonth: 0 }
  ],
  solarInstallationCharges: [
    { typeLabel: 'Residential', charges: 0 },
    { typeLabel: 'Commercial up to 100 Kw', charges: 0 },
    { typeLabel: 'Commercial above 100 Kw', charges: 0 }
  ],
  signupFees: 0,
  yearlyTargetKw: 0,
  incentive: 0,
  depositFees: 0,
  isActive: true
};

const SolarInstaller = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState([]);

  // Refs for scrolling
  const sectionRefs = {
    eligibility: useRef(null),
    subUser: useRef(null),
    capacity: useRef(null),
    points: useRef(null),
    charges: useRef(null)
  };

  const scrollToSection = (sectionKey) => {
    sectionRefs[sectionKey].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Form State
  const [formData, setFormData] = useState({ ...DEFAULT_PLAN });
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [plansData, statesData] = await Promise.all([
        getInstallerAgencyPlans(),
        getStates()
      ]);
      setStates(statesData || []);

      const pData = plansData.data || plansData || [];
      setPlans(pData);

      if (pData.length > 0) {
        handleSelectPlan(pData[0]);
      } else {
        setFormData({ ...DEFAULT_PLAN });
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load installer plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlanId(plan._id);
    setFormData({
      ...DEFAULT_PLAN,
      ...plan,
      state: plan.state ? plan.state._id || plan.state : null
    });
    setIsEditingName(false);
    setIsEditingDesc(false);
  };

  const handleAddNewPlan = () => {
    setSelectedPlanId('new');
    setFormData({ ...DEFAULT_PLAN });
    setIsEditingName(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    setFormData(prev => {
      const newArray = [...prev[arrayName]];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  const handleSave = async () => {
    try {
      if (selectedPlanId === 'new') {
        const result = await createInstallerAgencyPlan(formData);
        toast.success('Plan created successfully');
        const newPlan = result.data || result;
        setPlans([...plans, newPlan]);
        handleSelectPlan(newPlan);
      } else {
        const result = await updateInstallerAgencyPlan(selectedPlanId, formData);
        toast.success('Plan updated successfully');
        const updatedPlan = result.data || result;
        setPlans(plans.map(p => p._id === updatedPlan._id ? updatedPlan : p));
        handleSelectPlan(updatedPlan);
      }
    } catch (error) {
      console.error('Error saving plan', error);
      toast.error('Failed to save plan');
    }
  };

  const handleDelete = async () => {
    if (!selectedPlanId || selectedPlanId === 'new') return;
    if (!window.confirm('Are you sure you want to delete this plan?')) return;

    try {
      await deleteInstallerAgencyPlan(selectedPlanId);
      toast.success('Plan deleted successfully');

      const newPlans = plans.filter(p => p._id !== selectedPlanId);
      setPlans(newPlans);

      if (newPlans.length > 0) {
        handleSelectPlan(newPlans[0]);
      } else {
        handleAddNewPlan();
      }
    } catch (error) {
      console.error('Error deleting plan', error);
      toast.error('Failed to delete plan');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Configuration...</div>;
  }

  const isNew = selectedPlanId === 'new';

  return (
    <div className="min-h-screen bg-[#f8f9fc] p-4 font-sans text-gray-800 pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-2 shadow-sm mb-6">
        <Settings className="w-6 h-6 text-gray-700" />
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">Solar Installer Settings</h1>
      </div>

      {/* Blue Banner */}
      <div
        className="rounded-xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center shadow-md transition-colors bg-[#0070cc]"
      >
        <div className="flex-1">
          {isEditingName ? (
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="text-2xl font-bold mb-1 bg-white/20 border border-white/40 rounded px-2 py-1 outline-none focus:bg-white/30 text-white w-full max-w-sm"
              onBlur={() => setIsEditingName(false)}
              autoFocus
            />
          ) : (
            <h2 className="text-2xl font-bold mb-1">{formData.name || 'Unnamed Plan'}</h2>
          )}

          {isEditingDesc ? (
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="text-sm bg-white/20 border border-white/40 rounded px-2 py-1 outline-none focus:bg-white/30 text-white w-full max-w-lg mt-1"
              onBlur={() => setIsEditingDesc(false)}
              autoFocus
            />
          ) : (
            <p className="text-blue-100 text-sm opacity-90">{formData.description || 'No description provided'}</p>
          )}
        </div>

        <div className="flex gap-3 mt-4 md:mt-0 shadow-sm shrink-0">
          <button
            onClick={() => setIsEditingName(true)}
            className="bg-white text-blue-700 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Plan Name
          </button>
          <button
            onClick={() => setIsEditingDesc(true)}
            className="bg-black/20 hover:bg-black/30 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 transition-colors backdrop-blur-sm"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Description
          </button>
          {!isNew && (
            <button
              onClick={handleDelete}
              className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full flex items-center justify-center transition-colors"
              title="Delete Plan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Plan Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mt-6 mb-8 text-sm font-semibold">
        {plans.map((p) => (
          <button
            key={p._id}
            onClick={() => handleSelectPlan(p)}
            className={`px-6 py-2.5 rounded-full flex items-center gap-2 shadow-sm transition ${selectedPlanId === p._id
              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
              : 'bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
          >
            {selectedPlanId === p._id && <Rocket className="w-4 h-4" />}
            {p.name}
          </button>
        ))}
        {isNew && (
          <button className="bg-blue-600 text-white px-6 py-2.5 rounded-full flex items-center gap-2 shadow-md hover:bg-blue-700 transition">
            <Rocket className="w-4 h-4" /> New Plan
          </button>
        )}
        <button
          onClick={handleAddNewPlan}
          className="bg-[#3b4351] text-white px-5 py-2.5 rounded-full flex items-center gap-1 shadow-sm hover:bg-gray-800 transition ml-2"
        >
          <Plus className="w-4 h-4" /> Add More Plan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">

        {/* Left Sidebar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.3)] overflow-hidden border border-blue-100 sticky top-4">
            <div className="bg-[#2e68f3] text-white p-4 font-bold text-sm flex items-center gap-2">
              <LayoutGrid className="w-5 h-5" /> Plan Sections
            </div>
            <div className="flex flex-col text-[13px] text-gray-700 font-medium">
              <div onClick={() => scrollToSection('eligibility')} className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition">
                <Check className="w-4 h-4 text-green-500" /> <span>Eligibility Requirements</span>
              </div>
              <div onClick={() => scrollToSection('subUser')} className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition">
                <Check className="w-4 h-4 text-green-500" /> <span>Sub User</span>
              </div>
              <div onClick={() => scrollToSection('capacity')} className="flex items-start gap-3 p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition">
                <Check className="w-4 h-4 text-green-500 mt-0.5" /> <span className="leading-tight">Project Types vise Installation Capacity</span>
              </div>
              <div onClick={() => scrollToSection('points')} className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition">
                <Check className="w-4 h-4 text-green-500" /> <span>Installation Points</span>
              </div>
              <div onClick={() => scrollToSection('charges')} className="flex items-center gap-3 p-4 hover:bg-blue-50 cursor-pointer transition">
                <Check className="w-4 h-4 text-green-500" /> <span>Installation Charges</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Main Content */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-200 pb-8">

          <div className="p-6 md:p-8">
            {/* Header Form Top */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4 border-b border-gray-100 pb-6">
              <div className="flex gap-2 w-full md:w-auto">
                <Rocket className="w-8 h-8 text-blue-600 shrink-0" />
                <div className="w-full">
                  <input
                    className="text-2xl font-bold text-blue-700 w-full outline-none border-b border-transparent focus:border-blue-300"
                    value={formData.name}
                    name="name"
                    onChange={handleInputChange}
                    placeholder="Plan Name"
                  />
                  <input
                    className="text-sm text-gray-500 font-medium mt-1 w-full outline-none border-b border-transparent focus:border-gray-300"
                    value={formData.description}
                    name="description"
                    onChange={handleInputChange}
                    placeholder="Plan Description"
                  />
                </div>
              </div>
              <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-100 shrink-0">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Minimum Rating :</label>
                  <input
                    type="number"
                    name="minimumRating"
                    value={formData.minimumRating}
                    onChange={handleInputChange}
                    placeholder="e.g. 4.5"
                    className="border border-gray-300 rounded px-2 py-1 text-xs w-28 focus:outline-blue-500 bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Banner Color :</label>
                  <input
                    type="color"
                    name="planColor"
                    value={formData.planColor}
                    onChange={handleInputChange}
                    className="h-6 w-full cursor-pointer rounded border-0 p-0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-10">

              {/* Eligibility Requirements */}
              <section ref={sectionRefs.eligibility} className="scroll-mt-6">
                <h4 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Eligibility Requirements</h4>
                <div className="flex items-start gap-12">
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        name="eligibility.kyc"
                        checked={formData.eligibility.kyc}
                        onChange={handleInputChange}
                        className="w-3.5 h-3.5 accent-green-600"
                      /> KYC
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        name="eligibility.agreement"
                        checked={formData.eligibility.agreement}
                        onChange={handleInputChange}
                        className="w-3.5 h-3.5 accent-green-600"
                      /> Agreement
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Coverage</label>
                    <select
                      name="coverage"
                      value={formData.coverage}
                      onChange={handleInputChange}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-40 focus:outline-blue-500 bg-white"
                    >
                      <option value="District">District</option>
                      <option value="State">State</option>
                      <option value="Cluster">Cluster</option>
                    </select>
                  </div>
                  {formData.coverage === 'State' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Specific State (Optional)</label>
                      <select
                        name="state"
                        value={formData.state || ''}
                        onChange={handleInputChange}
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-40 focus:outline-blue-500 bg-white"
                      >
                        <option value="">All States</option>
                        {states.map(s => <option key={s._id} value={s._id}>{s.name || s.stateName}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </section>

              {/* Sub User */}
              <section ref={sectionRefs.subUser} className="scroll-mt-6">
                <h4 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Sub User</h4>
                <div className="flex items-start gap-12">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer mt-5">
                    <input
                      type="checkbox"
                      name="subUser.supervisor"
                      checked={formData.subUser.supervisor}
                      onChange={handleInputChange}
                      className="w-3.5 h-3.5 accent-green-600"
                    /> Supervisor
                  </label>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">User Limits</label>
                    <input
                      type="number"
                      name="userLimits"
                      value={formData.userLimits}
                      onChange={handleInputChange}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-24 focus:outline-blue-500 bg-white"
                    />
                  </div>
                </div>
              </section>

              {/* Project Type Vise Installation Capacity */}
              <section ref={sectionRefs.capacity} className="scroll-mt-6">
                <h4 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex justify-between items-center">
                  Project Type Vise Installation Capacity
                  <button
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        assignedProjectTypes: [
                          ...prev.assignedProjectTypes,
                          { category: 'Solar Rooftop', subCategory: 'Residential', projectType: '', subProjectType: 'On-Grid', capacity: '', daysRequiredUnit: 'Weeks', daysRequiredVal: '', active: false }
                        ]
                      }))
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Row
                  </button>
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-[#6b7280] text-white flex items-center gap-2 px-4 py-2 text-sm font-medium">
                    <MapPin className="w-4 h-4" /> Project Type Vise Installation Capacity
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#f3f4f6] text-[#4b5563] border-b border-gray-200 text-xs font-semibold">
                        <tr>
                          <th className="px-3 py-4 text-center w-12 border-l border-gray-200">Action</th>
                          <th className="px-3 py-4 border-l border-gray-200">Category</th>
                          <th className="px-3 py-4 border-l border-gray-200">Sub-Category</th>
                          <th className="px-3 py-4 border-l border-gray-200">Project Type</th>
                          <th className="px-3 py-4 border-l border-gray-200 whitespace-nowrap">Sub ProjectType</th>
                          <th className="px-3 py-4 border-l border-gray-200">Capacity (kW)</th>
                          <th className="px-3 py-4 border-l border-gray-200">Days Required</th>
                          <th className="px-3 py-4 border-l border-gray-200 text-center w-12">Edit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {formData.assignedProjectTypes.map((row, idx) => (
                          <tr key={idx} className={`hover:bg-gray-50 text-[13px] font-medium transition-colors ${row.active ? 'bg-white' : 'text-gray-500'}`}>
                            <td className="px-3 py-3 text-center border-l border-gray-200">
                              <input
                                type="checkbox"
                                checked={row.active}
                                onChange={(e) => handleArrayChange('assignedProjectTypes', idx, 'active', e.target.checked)}
                                className="w-3.5 h-3.5 accent-blue-600"
                              />
                            </td>
                            <td className="px-2 py-3 border-l border-gray-200">
                              <input
                                type="text"
                                value={row.category || ''}
                                onChange={(e) => handleArrayChange('assignedProjectTypes', idx, 'category', e.target.value)}
                                className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
                              />
                            </td>
                            <td className="px-2 py-3 border-l border-gray-200">
                              <input
                                type="text"
                                value={row.subCategory || ''}
                                onChange={(e) => handleArrayChange('assignedProjectTypes', idx, 'subCategory', e.target.value)}
                                className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
                              />
                            </td>
                            <td className="px-2 py-3 border-l border-gray-200">
                              <input
                                type="text"
                                value={row.projectType || ''}
                                onChange={(e) => handleArrayChange('assignedProjectTypes', idx, 'projectType', e.target.value)}
                                className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 min-w-[70px]"
                              />
                            </td>
                            <td className="px-2 py-3 border-l border-gray-200">
                              <select
                                value={row.subProjectType || 'On-Grid'}
                                onChange={(e) => handleArrayChange('assignedProjectTypes', idx, 'subProjectType', e.target.value)}
                                className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 cursor-pointer"
                              >
                                <option value="On-Grid">On-Grid</option>
                                <option value="Off-Grid">Off-Grid</option>
                                <option value="Hybrid">Hybrid</option>
                              </select>
                            </td>
                            <td className="px-2 py-3 border-l border-gray-200">
                              <input
                                type="number"
                                value={row.capacity || ''}
                                onChange={(e) => handleArrayChange('assignedProjectTypes', idx, 'capacity', e.target.value)}
                                className="w-16 border border-gray-300 rounded-md px-2 py-1 outline-none focus:border-blue-500 bg-white"
                              />
                            </td>
                            <td className="px-2 py-3 border-l border-gray-200">
                              <div className="flex items-center gap-2">
                                <select
                                  value={row.daysRequiredUnit || 'Weeks'}
                                  onChange={(e) => handleArrayChange('assignedProjectTypes', idx, 'daysRequiredUnit', e.target.value)}
                                  className="w-24 border border-gray-300 rounded-md px-2 py-1 outline-none focus:border-blue-500 bg-white text-xs cursor-pointer"
                                >
                                  <option value="Days">Days</option>
                                  <option value="Weeks">Weeks</option>
                                  <option value="Months">Months</option>
                                </select>
                                <input
                                  type="number"
                                  value={row.daysRequiredVal || ''}
                                  onChange={(e) => handleArrayChange('assignedProjectTypes', idx, 'daysRequiredVal', e.target.value)}
                                  className="w-16 border border-gray-300 rounded-md px-2 py-1 outline-none focus:border-blue-500 bg-white"
                                />
                              </div>
                            </td>
                            <td className="px-2 py-3 border-l border-gray-200 text-center">
                              <button
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    assignedProjectTypes: prev.assignedProjectTypes.filter((_, i) => i !== idx)
                                  }))
                                }}
                                className="text-blue-500 hover:text-blue-700 p-1"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {formData.assignedProjectTypes.length === 0 && (
                          <tr><td colSpan="8" className="text-center py-4 text-xs text-gray-400">No project configurations</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Solar Installation Points */}
              <section ref={sectionRefs.points} className="scroll-mt-6">
                <h4 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex justify-between items-center">
                  Solar Installation Points
                  <button
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        solarInstallationPoints: [
                          ...prev.solarInstallationPoints,
                          { typeLabel: 'New Type', points: 0, periodInMonth: 0, claimInMonth: 0 }
                        ]
                      }))
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </h4>
                <div className="space-y-3 relative">
                  {formData.solarInstallationPoints.map((pt, idx) => (
                    <div key={idx} className="bg-gray-50/80 rounded-lg p-4 border border-gray-100 flex flex-col md:flex-row md:items-center gap-4 relative group">
                      <div className="w-full md:w-1/3">
                        <input
                          type="text"
                          value={pt.typeLabel}
                          onChange={(e) => handleArrayChange('solarInstallationPoints', idx, 'typeLabel', e.target.value)}
                          className="block text-sm font-bold text-gray-800 mb-1 w-full bg-transparent border-none outline-none border-b border-transparent focus:border-blue-300 px-0 focus:ring-0"
                        />
                        <div className="flex items-center text-xs text-gray-500 mb-1">₹ Point</div>
                        <input
                          type="number"
                          value={pt.points}
                          onChange={(e) => handleArrayChange('solarInstallationPoints', idx, 'points', Number(e.target.value))}
                          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full focus:outline-blue-500 bg-white"
                        />
                      </div>
                      <div className="w-full md:w-1/3">
                        <div className="flex items-center text-xs text-gray-500 mb-1 mt-5 md:mt-0">Period (in Month)</div>
                        <input
                          type="number"
                          value={pt.periodInMonth}
                          onChange={(e) => handleArrayChange('solarInstallationPoints', idx, 'periodInMonth', Number(e.target.value))}
                          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full focus:outline-blue-500 bg-white"
                        />
                      </div>
                      <div className="w-full md:w-1/3 pr-6">
                        <div className="flex items-center text-xs text-gray-500 mb-1 mt-5 md:mt-0">Claim (in Month)</div>
                        <input
                          type="number"
                          value={pt.claimInMonth}
                          onChange={(e) => handleArrayChange('solarInstallationPoints', idx, 'claimInMonth', Number(e.target.value))}
                          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full focus:outline-blue-500 bg-white"
                        />
                      </div>
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            solarInstallationPoints: prev.solarInstallationPoints.filter((_, i) => i !== idx)
                          }))
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.solarInstallationPoints.length === 0 && <p className="text-sm text-gray-400 p-4 text-center">No points configured</p>}
                </div>
              </section>

              {/* Solar Installation Charges */}
              <section ref={sectionRefs.charges} className="scroll-mt-6">
                <h4 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex justify-between items-center">
                  Solar Installation Charges
                  <button
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        solarInstallationCharges: [
                          ...prev.solarInstallationCharges,
                          { typeLabel: 'New Type', charges: 0 }
                        ]
                      }))
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </h4>
                <div className="space-y-3">
                  {formData.solarInstallationCharges.map((pt, idx) => (
                    <div key={idx} className="bg-gray-50/80 rounded-lg p-4 border border-gray-100 relative group">
                      <div className="w-full md:w-1/2 pr-6">
                        <input
                          type="text"
                          value={pt.typeLabel}
                          onChange={(e) => handleArrayChange('solarInstallationCharges', idx, 'typeLabel', e.target.value)}
                          className="block text-sm font-bold text-gray-800 mb-1 w-full bg-transparent border-none outline-none border-b border-transparent focus:border-blue-300 px-0 focus:ring-0"
                        />
                        <div className="flex items-center text-xs text-gray-500 mb-1">₹ charges</div>
                        <input
                          type="number"
                          value={pt.charges}
                          onChange={(e) => handleArrayChange('solarInstallationCharges', idx, 'charges', Number(e.target.value))}
                          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full focus:outline-blue-500 bg-white"
                        />
                      </div>
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            solarInstallationCharges: prev.solarInstallationCharges.filter((_, i) => i !== idx)
                          }))
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.solarInstallationCharges.length === 0 && <p className="text-sm text-gray-400 p-4 text-center">No charges configured</p>}
                </div>
              </section>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 accent-blue-600"
                  />
                  Plan is {formData.isActive ? 'Active' : 'Inactive'}
                </label>
                <button
                  onClick={handleSave}
                  className="bg-[#0070cc] hover:bg-blue-700 text-white text-sm font-bold px-6 py-2.5 rounded-md shadow-sm transition flex items-center gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  {isNew ? 'Create Plan' : 'Save Changes'}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Right Sidebar (Summary Card) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100 sticky top-4">
            {/* Header */}
            <div className="text-white p-5 text-center transition-colors relative" style={{ backgroundColor: formData.planColor || '#1264a3' }}>
              <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
              <h3 className="text-xl font-bold tracking-wide uppercase relative z-10">{formData.name || 'PLAN'}</h3>
              <p className="text-xs font-medium text-white/80 mt-1 relative z-10">Summary View</p>
            </div>

            <div className="p-5 pb-8 relative pt-8">
              {/* Badge break time */}
              <div className="absolute right-0 top-[85px] z-10 mr-1">
                <div className="bg-gray-900 text-white text-[9px] px-2 py-1 rounded-full flex items-center gap-1 font-bold shadow-sm whitespace-nowrap">
                  🕒 Break Time
                </div>
              </div>

              {/* Price */}
              <div className="text-center mb-6 relative">
                <div className="flex items-baseline justify-center">
                  <span className="text-2xl font-bold text-gray-600 mr-1">₹</span>
                  <input
                    type="number"
                    name="signupFees"
                    value={formData.signupFees || ''}
                    onChange={handleInputChange}
                    className="text-4xl font-extrabold text-[#2d3748] w-32 text-center bg-transparent border-none p-0 outline-none hover:bg-gray-50 focus:ring-1 focus:ring-blue-300 rounded"
                  />
                </div>
                <p className="text-sm text-gray-500 font-medium mt-1">signup fees</p>
              </div>

              {/* Target Box */}
              <div className="bg-[#00aaff] rounded-xl text-white p-4 shadow-md relative overflow-hidden transition-colors" style={{ backgroundColor: formData.planColor ? `${formData.planColor}dd` : '#00aaff' }}>
                <div className="flex items-center gap-3 mb-2 px-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center border-2 border-white text-[10px] font-bold">↑</div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-white/80">Yearly Target:</span>
                    <div className="flex items-center gap-1 font-semibold text-sm">
                      <input
                        type="number"
                        name="yearlyTargetKw"
                        value={formData.yearlyTargetKw || ''}
                        onChange={handleInputChange}
                        className="bg-transparent border-b border-white/30 font-bold text-white px-1 w-16 outline-none focus:border-white"
                      /> kw
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center border-2 border-white text-[10px] text-gray-800 font-bold">$</div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-white/80">Incentive:</span>
                    <div className="flex items-center gap-1 font-semibold text-sm">
                      ₹ <input
                        type="number"
                        name="incentive"
                        value={formData.incentive || ''}
                        onChange={handleInputChange}
                        className="bg-transparent border-b border-white/30 font-bold text-white px-1 w-16 outline-none focus:border-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4 overflow-hidden mb-6">
                <div className="h-2.5 rounded-full" style={{ width: '60%', backgroundColor: formData.planColor || '#22c55e' }}></div>
              </div>

              {/* User / Cashback info */}
              <div className="flex items-center gap-4 py-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600" style={{ color: formData.planColor, backgroundColor: `${formData.planColor}15` }}>
                  <CircleUserRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-[15px]">Single User</h4>
                  <p className="text-xs text-gray-500">{formData.userLimits} user account{formData.userLimits !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${formData.planColor}15` }}>
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: `${formData.planColor}30` }}></div>
                  </div>
                  <h4 className="font-bold text-gray-600 text-[15px]">Total <br /> Cashback</h4>
                </div>
                <Eye className="w-5 h-5 mr-2" style={{ color: formData.planColor || '#0070cc' }} />
              </div>

              {/* Project Types */}
              <div className="mt-5">
                <h4 className="text-[13px] font-bold text-gray-800 mb-3">Project Types:</h4>
                <div className="space-y-3 pl-1">
                  {Array.from(new Set(formData.assignedProjectTypes.filter(r => r.active).map(r => r.subCategory))).map((subType, i) => (
                    <div key={i} className="flex items-center gap-2 font-bold text-[14px] text-gray-700">
                      {subType === 'Residential' ? <House className="w-4 h-4 text-gray-600" /> : <Building2 className="w-4 h-4 text-gray-600" />}
                      {subType}
                    </div>
                  ))}
                  {formData.assignedProjectTypes.filter(r => r.active).length === 0 && (
                    <span className="text-xs text-gray-400 font-normal">None active</span>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="mt-6">
                <h4 className="text-[13px] font-bold text-gray-800 mb-3">Features:</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="border border-gray-200 text-xs font-semibold text-gray-600 px-3 py-1 rounded-md bg-white">Leads</span>
                  <span className="border border-gray-200 text-xs font-semibold text-gray-600 px-3 py-1 rounded-md bg-white">Quotes</span>
                  <span className="border border-gray-200 text-xs font-semibold text-gray-600 px-3 py-1 rounded-md bg-white">Survey</span>
                  <span className="border border-gray-200 text-xs font-semibold text-gray-600 px-3 py-1 rounded-md bg-white">Project Signup</span>
                </div>
              </div>

              {/* Required Documents */}
              <div className="mt-6">
                <h4 className="text-[13px] font-bold text-gray-800 mb-3">Required Documents:</h4>
                <div className="space-y-2 pl-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                    <CheckCircle2 className={`w-4 h-4 ${formData.eligibility.kyc ? 'text-green-500 fill-green-50' : 'text-gray-300 fill-gray-50'}`} /> ID Proof
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                    <CheckCircle2 className={`w-4 h-4 ${formData.eligibility.kyc ? 'text-green-500 fill-green-50' : 'text-gray-300 fill-gray-50'}`} /> Address Proof
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                    <CheckCircle2 className={`w-4 h-4 ${formData.eligibility.agreement ? 'text-green-500 fill-green-50' : 'text-gray-300 fill-gray-50'}`} /> Business RAM
                  </div>
                </div>
              </div>

              {/* Deposit Fees */}
              <div className="mt-6 bg-gray-50 p-3 rounded-lg text-center border border-gray-100 flex flex-col items-center justify-center">
                <h4 className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">Deposit Fees <Edit className="w-3 h-3 text-gray-400" /></h4>
                <div className="flex items-center">
                  <span className="text-lg font-bold text-gray-800 mr-0.5">₹</span>
                  <input
                    type="number"
                    name="depositFees"
                    value={formData.depositFees || ''}
                    onChange={handleInputChange}
                    className="text-lg font-bold text-gray-800 bg-transparent outline-none w-20 text-center border-b border-transparent hover:border-gray-300 focus:border-blue-400 p-0 transition-colors"
                  />
                </div>
              </div>

              {/* Upgrade Plan button */}
              <div className="mt-6">
                <button
                  className="w-full text-white py-3 rounded-full font-bold shadow-md transition-all flex items-center justify-center gap-1 group hover:opacity-90"
                  style={{ backgroundColor: formData.planColor || '#0070cc' }}
                >
                  UPGRADE PLAN <ChevronUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs font-medium text-gray-500 mt-12 pb-4">
        Copyright © 2025 Solarkits. All Rights Reserved.
      </div>
    </div>
  );
};

export default SolarInstaller;