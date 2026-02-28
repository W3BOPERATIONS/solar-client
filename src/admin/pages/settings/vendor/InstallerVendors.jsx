import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, Trash2, X, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocations } from '../../../../hooks/useLocations';
import {
  getInstallerVendorPlans,
  saveInstallerVendorPlan,
  deleteInstallerVendorPlan
} from '../../../../services/vendor/vendorApi';

const LocationCard = ({ title, subtitle, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`p-6 rounded-md border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center h-28 shadow-sm hover:shadow-md ${isSelected
      ? 'border-[#007bff] bg-white'
      : 'border-transparent bg-white'
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
  const [plans, setPlans] = useState(["Starter Plan", "Basic Plan", "Gold Plan", "Diamond Plan"]);

  const {
    states,
    clusters,
    districts,
    selectedState,
    setSelectedState,
    selectedCluster,
    setSelectedCluster,
    selectedDistrict,
    setSelectedDistrict
  } = useLocations();

  // Initialize state for a plan
  const getDefaultPlanState = () => ({
    requirements: [],
    coverage: "1 District",
    projectTypes: [],
    subscription: "0",
    paymentMethods: [],
    teams: { residential: 0, commercial: 0 },
    rates: {
      resOnGrid: "0", resOffGrid: "0",
      comOnGrid: "0", comOffGrid: "0"
    },
    weeklyKWAssign: { residential: "0", commercial: "0" }
  });

  const [planSettings, setPlanSettings] = useState({});

  // Fetch plans from DB when district changes
  useEffect(() => {
    if (selectedDistrict) {
      fetchPlans();
    } else {
      setPlans(["Starter Plan", "Basic Plan", "Gold Plan", "Diamond Plan"]);
      setPlanSettings({});
      setActivePlan('Starter Plan');
    }
  }, [selectedDistrict]);

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await getInstallerVendorPlans(selectedDistrict);
      if (response.success && response.data.length > 0) {
        const dbPlans = response.data;
        const planNames = dbPlans.map(p => p.name);

        const defaultNames = ["Starter Plan", "Basic Plan", "Gold Plan", "Diamond Plan"];
        const combinedNames = Array.from(new Set([...defaultNames, ...planNames]));

        setPlans(combinedNames);

        const settings = {};
        combinedNames.forEach(name => {
          const dbPlan = dbPlans.find(p => p.name === name);
          settings[name] = dbPlan ? { ...dbPlan } : getDefaultPlanState();
        });
        setPlanSettings(settings);
      } else {
        const defaultNames = ["Starter Plan", "Basic Plan", "Gold Plan", "Diamond Plan"];
        setPlans(defaultNames);
        setPlanSettings(defaultNames.reduce((acc, name) => ({ ...acc, [name]: getDefaultPlanState() }), {}));
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
        stateId: selectedState,
        clusterId: selectedCluster,
        districtId: selectedDistrict
      };

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

  const handleAddPlan = () => {
    if (!newPlanName.trim()) {
      toast.error('Plan name is required');
      return;
    }
    if (plans.includes(newPlanName.trim())) {
      toast.error('Plan already exists');
      return;
    }

    const name = newPlanName.trim();
    setPlans(prev => [...prev, name]);
    setPlanSettings(prev => ({ ...prev, [name]: getDefaultPlanState() }));
    setActivePlan(name);
    setNewPlanName('');
    setIsAddPlanModalOpen(false);
    toast.success(`Plan "${name}" added.`);
  };

  const handleDeletePlan = async (planName) => {
    if (["Starter Plan", "Basic Plan", "Gold Plan", "Diamond Plan"].includes(planName)) {
      toast.error('Default plans cannot be deleted');
      return;
    }

    try {
      const planId = planSettings[planName]?._id;
      if (planId) {
        await deleteInstallerVendorPlan(planId);
      }
      setPlans(prev => prev.filter(p => p !== planName));
      if (activePlan === planName) setActivePlan('Starter Plan');
      toast.success('Plan deleted');
    } catch (error) {
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
            {/* States */}
            <div>
              <h2 className="text-xl font-bold text-[#333] mb-6">Select State</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {states.map(s => (
                  <LocationCard
                    key={s._id}
                    title={s.name}
                    subtitle={s.code || s.name.substring(0, 2)}
                    isSelected={selectedState === s._id}
                    onClick={() => setSelectedState(s._id)}
                  />
                ))}
              </div>
            </div>

            {/* Clusters */}
            {selectedState && (
              <div>
                <h2 className="text-xl font-bold text-[#333] mb-6">Select Cluster</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {clusters.map(c => (
                    <LocationCard
                      key={c._id}
                      title={c.name}
                      subtitle={states.find(s => s._id === selectedState)?.name || 'CL'}
                      isSelected={selectedCluster === c._id}
                      onClick={() => setSelectedCluster(c._id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Districts */}
            {selectedCluster && (
              <div>
                <h2 className="text-xl font-bold text-[#333] mb-6">Select District</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {districts.map(d => (
                    <LocationCard
                      key={d._id}
                      title={d.name}
                      subtitle={clusters.find(c => c._id === selectedCluster)?.name || 'DT'}
                      isSelected={selectedDistrict === d._id}
                      onClick={() => setSelectedDistrict(d._id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Plan Configuration Area */}
        {selectedDistrict && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            {/* Plan Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
              {plans.map(plan => (
                <div key={plan} className="relative group">
                  <button
                    onClick={() => setActivePlan(plan)}
                    className={`px-8 py-2.5 rounded-md text-sm font-bold transition-all shadow-sm tracking-wide ${activePlan === plan
                      ? 'bg-[#0d6efd] text-white scale-105'
                      : 'bg-[#2c3e50] text-gray-200 hover:bg-gray-700'
                      }`}
                  >
                    {plan}
                  </button>
                  {!["Starter Plan", "Basic Plan", "Gold Plan", "Diamond Plan"].includes(plan) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setIsAddPlanModalOpen(true)}
                className="px-8 py-2.5 rounded-md text-sm font-bold transition-all shadow-sm tracking-wide border-2 border-dashed border-[#2c3e50] text-[#2c3e50] hover:bg-gray-100 flex items-center gap-2"
              >
                <Plus size={16} /> Add Other Plan
              </button>
            </div>

            {loadingPlans ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : planSettings[activePlan] ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 max-w-6xl mx-auto overflow-hidden mb-16 px-8 py-10">
                <div className="grid grid-cols-3 gap-x-12 gap-y-10">
                  {/* Row 1 */}
                  <div>
                    <h5 className="font-bold text-gray-800 mb-4 text-base">Signup Requirements</h5>
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
                    <div className="relative">
                      <select
                        value={planSettings[activePlan].coverage}
                        onChange={(e) => handleInputChange('coverage', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                      >
                        <option>1 District</option>
                        <option>2 Districts</option>
                        <option>3 Districts</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                  </div>

                  <div>
                    <h5 className="font-bold text-gray-800 mb-4 text-base">Project Types</h5>
                    <div className="space-y-3">
                      {["Residential", "Commercial", "Street Light", "Solar Pump"].map(item => (
                        <label key={item} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={planSettings[activePlan].projectTypes.includes(item)}
                            onChange={() => handleCheckboxToggle('projectTypes', item)}
                            className="w-4 h-4 accent-green-600 rounded"
                          />
                          <span className="text-gray-700 text-sm">{item}</span>
                        </label>
                      ))}
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

                  <div>
                    <h5 className="font-bold text-gray-800 mb-4 text-base">Team Allocation</h5>
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600 text-sm">Residential</span>
                        <input
                          type="number"
                          value={planSettings[activePlan].teams.residential}
                          onChange={(e) => handleInputChange('teams', parseInt(e.target.value) || 0, 'residential')}
                          className="w-16 px-2 py-2 border border-blue-200 rounded text-center text-sm font-medium"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600 text-sm">Commercial</span>
                        <input
                          type="number"
                          value={planSettings[activePlan].teams.commercial}
                          onChange={(e) => handleInputChange('teams', parseInt(e.target.value) || 0, 'commercial')}
                          className="w-16 px-2 py-2 border border-blue-200 rounded text-center text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="col-span-1">
                    <h5 className="font-bold text-gray-800 mb-3 text-base">Rate Setting</h5>
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
                    <h5 className="font-bold text-gray-800 mb-6 text-base">Weekly KW Assign</h5>
                    <div className="space-y-8 pl-4">
                      <div className="flex items-center gap-4">
                        <span className="w-56 text-gray-600 text-sm">Residential(25Kw * 1Team)</span>
                        <input
                          type="text"
                          value={planSettings[activePlan].weeklyKWAssign.residential}
                          onChange={(e) => handleInputChange('weeklyKWAssign', e.target.value, 'residential')}
                          className="w-24 px-4 py-3 border border-gray-300 rounded-xl text-center text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="w-56 text-gray-600 text-sm">Commercial(25Kw * 1Team)</span>
                        <div className="relative w-24">
                          <input
                            type="number"
                            value={planSettings[activePlan].weeklyKWAssign.commercial}
                            onChange={(e) => handleInputChange('weeklyKWAssign', e.target.value, 'commercial')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                          />
                        </div>
                      </div>
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
