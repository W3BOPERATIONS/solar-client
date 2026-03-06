import React, { useState, useEffect } from 'react';
import {
  Eye,
  Pencil,
  Plus,
  Trash2,
  MapPin,
  Calendar,
  BarChart3,
  Clock,
  Loader,
  Save,
  X,
  Users
} from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import toast from 'react-hot-toast';
import { getPartnerGoals, createPartnerGoal, deletePartnerGoal, getPartners, getPartnerProfessions } from '../../../../services/partner/partnerApi';

export default function PartnerOnboardingGoals() {
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState([]);
  const [selectedPartnerType, setSelectedPartnerType] = useState('');
  const [existingGoals, setExistingGoals] = useState([]);
  const [availableProfessions, setAvailableProfessions] = useState([]); // Fetched based on partnerType & state

  // State management
  const [goalName, setGoalName] = useState('Partner Goal');
  const [formData, setFormData] = useState({
    state: '',
    cluster: '',
    targetCount: '',
    dueDate: '',
    managerType: '',
    district: ''
  });
  const [professions, setProfessions] = useState([
    { type: '', goal: '' }
  ]);
  const [showGoalNameModal, setShowGoalNameModal] = useState(false);

  const { states, districts, clusters, fetchDistricts, fetchClusters } = useLocations();
  const selectedState = states.find((s) => s._id === formData.state) || null;
  const selectedDistrict = districts.find((d) => d._id === formData.district) || null;
  const selectedCluster = clusters.find((c) => c._id === formData.cluster) || null;

  // Initial Fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const partnersData = await getPartners();
      setPartners(partnersData);
      if (partnersData.length > 0) {
        setSelectedPartnerType(partnersData[0].name);
      }
    } catch (error) {
      toast.error('Failed to load partner types');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Goals when Partner Type changes
  useEffect(() => {
    if (selectedPartnerType) {
      fetchGoals();
      setGoalName(`${selectedPartnerType} Goal`);
    } else {
      setExistingGoals([]);
    }
  }, [selectedPartnerType]);

  // Fetch professions for dropdown when State or Partner Type changes
  useEffect(() => {
    if (selectedPartnerType && formData.state) {
      fetchAvailableProfessions();
    } else {
      setAvailableProfessions([]);
    }
  }, [selectedPartnerType, formData.state]);


  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await getPartnerGoals(selectedPartnerType);
      setExistingGoals(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  }

  const fetchAvailableProfessions = async () => {
    try {
      const data = await getPartnerProfessions(selectedPartnerType, formData.state);
      setAvailableProfessions(data.map(p => p.name));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load professions for this state');
    }
  }

  // Handle state selection
  const handleStateSelect = (stateId) => {
    setFormData((prev) => ({ ...prev, state: stateId, district: '', cluster: '' }));
  };

  useEffect(() => {
    if (formData.state) {
      fetchDistricts({ stateId: formData.state });
    }
  }, [formData.state]);

  useEffect(() => {
    if (formData.district) {
      fetchClusters({ districtId: formData.district });
    }
  }, [formData.district]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Add new profession field
  const addProfession = () => {
    setProfessions([...professions, { type: '', goal: '' }]);
  };

  // Update profession field
  const updateProfession = (index, field, value) => {
    const updatedProfessions = [...professions];
    updatedProfessions[index][field] = value;
    setProfessions(updatedProfessions);
  };

  // Remove profession field
  const removeProfession = (index) => {
    if (professions.length > 1) {
      const updatedProfessions = professions.filter((_, i) => i !== index);
      setProfessions(updatedProfessions);
    }
  };

  // Calculate totals
  const totalTargetGoal = professions.reduce((sum, prof) => sum + (parseInt(prof.goal) || 0), 0);
  const professionTypesCount = professions.length;

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPartnerType) {
      toast.error('Please select a Partner Type');
      return;
    }
    if (!formData.state || !formData.district) {
      toast.error('Please select State and District');
      return;
    }

    try {
      const payload = {
        partnerType: selectedPartnerType,
        name: goalName,
        state: formData.state,
        district: formData.district,
        cluster: formData.cluster || undefined,
        targetCount: formData.targetCount,
        dueDate: formData.dueDate,
        managerType: formData.managerType,
        professions: professions.map(p => ({
          type: p.type,
          goal: parseInt(p.goal) || 0
        }))
      };

      await createPartnerGoal(payload);
      toast.success('Goal created successfully');
      fetchGoals();
      // Reset form partially
      setFormData({ ...formData, targetCount: '', dueDate: '', managerType: '' });
      setProfessions([{ type: '', goal: '' }]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save goal');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await deletePartnerGoal(id);
        toast.success('Goal deleted');
        fetchGoals();
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete goal');
      }
    }
  }


  if (loading && partners.length === 0) {
    return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin text-blue-600 w-8 h-8" /></div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header & Configuration Selectors */}
      <div className="mb-6 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Partner Onboarding Goals Setting</h1>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Partner Type</label>
          <select
            value={selectedPartnerType}
            onChange={(e) => setSelectedPartnerType(e.target.value)}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          >
            <option value="">-- Select Partner Type --</option>
            {partners.map(partner => (
              <option key={partner._id} value={partner.name}>{partner.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedPartnerType ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm border border-dashed flex flex-col items-center">
          <Users className="w-12 h-12 text-gray-300 mb-4" />
          Please select a Partner Type to configure onboarding goals.
        </div>
      ) : (
        <>
          {/* State Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 my-6">
            {states.length > 0 ? states.map((state) => (
              <div
                key={state._id}
                className={`card bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border ${formData.state === state._id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-transparent'}`}
                onClick={() => handleStateSelect(state._id)}
              >
                <div className="p-4 text-center">
                  <h3 className="font-bold text-gray-800 truncate">{state.name}</h3>
                </div>
              </div>
            )) : (
              <div className="col-span-full bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                No states available. Please add them in Settings → Location Management.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Goal Form Section */}
            <div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
                {/* Card Header */}
                <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Set {selectedPartnerType} Goal</h2>
                  <button
                    type="button"
                    className="bg-white text-blue-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    onClick={() => setShowGoalNameModal(true)}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Name
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <form id="goalForm" onSubmit={handleSubmit}>
                    {/* Goal Name Display */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Name: <span className="text-blue-600">{goalName}</span>
                      </h3>
                    </div>

                    {/* Form Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {/* State */}
                      <div className="">
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          value={selectedState?.name || 'Please select from above'}
                          readOnly
                        />
                      </div>

                      {/* District */}
                      <div className="">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select District</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          name="district"
                          value={formData.district}
                          onChange={(e) => setFormData((p) => ({ ...p, district: e.target.value, cluster: '' }))}
                          required={!!formData.state}
                          disabled={!formData.state || districts.length === 0}
                        >
                          <option value="">{districts.length === 0 ? 'No districts available' : '-- Select District --'}</option>
                          {districts.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                      </div>

                      {/* Cluster */}
                      <div className="">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Cluster</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
                          name="cluster"
                          value={formData.cluster}
                          onChange={handleInputChange}
                          disabled={!formData.district || clusters.length === 0}
                        >
                          <option value="">{clusters.length === 0 ? 'No clusters available' : '-- Select Cluster --'}</option>
                          {clusters.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      </div>

                      {/* Manager/Type */}
                      <div className="">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Manager/Level Type</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          name="managerType"
                          value={formData.managerType}
                          onChange={handleInputChange}
                          placeholder="e.g. Cluster CPRM, Area Manager"
                          required
                        />
                      </div>

                      {/* Target Count */}
                      <div className="">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Count</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
                          name="targetCount"
                          value={formData.targetCount}
                          onChange={handleInputChange}
                          placeholder="e.g. 5"
                          required
                        />
                      </div>

                      {/* Due Date */}
                      <div className="">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Days)</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
                          name="dueDate"
                          value={formData.dueDate}
                          onChange={handleInputChange}
                          placeholder="e.g. 90 Days"
                          required
                        />
                      </div>
                    </div>

                    {/* Profession Types Section */}
                    {formData.state && (
                      <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">Targeted Professions</h3>
                          <button
                            type="button"
                            className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-green-600 transition-colors"
                            onClick={addProfession}
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          {professions.map((profession, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
                              <div className="flex flex-col sm:flex-row gap-3 items-end">
                                {/* Profession Type */}
                                <div className="flex-1 w-full">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Profession Type</label>
                                  <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 text-sm"
                                    value={profession.type}
                                    onChange={(e) => updateProfession(index, 'type', e.target.value)}
                                    required
                                  >
                                    <option value="">Select Profession</option>
                                    {availableProfessions.length > 0 ? (
                                      availableProfessions.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                      ))
                                    ) : (
                                      <option value="Custom" disabled>No professions added for state yet</option>
                                    )}
                                  </select>
                                </div>

                                {/* Goal */}
                                <div className="flex-1 w-full sm:w-1/3">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Target</label>
                                  <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 text-sm"
                                    value={profession.goal}
                                    onChange={(e) => updateProfession(index, 'goal', e.target.value)}
                                    placeholder="e.g. 10"
                                    min="1"
                                    required
                                  />
                                </div>

                                {/* Remove Button */}
                                <div>
                                  <button
                                    type="button"
                                    className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors w-full sm:w-auto"
                                    onClick={() => removeProfession(index)}
                                    disabled={professions.length <= 1}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Totals Summary */}
                        <div className="mt-4 bg-gray-50 text-sm rounded-lg p-3 border grid grid-cols-2 gap-4">
                          <div className="font-semibold text-gray-700">Total Proff Target: <span className="text-green-600 ml-1">{totalTargetGoal}</span></div>
                          <div className="text-right text-gray-600">Types Listed: <span className="font-semibold">{professionTypesCount}</span></div>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="mt-6 border-t pt-4 text-right">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 w-full md:w-auto ml-auto"
                      >
                       <Save className="w-4 h-4" /> Save Onboarding Goal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Existing Goals List */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">Existing Goals</h2>
              {existingGoals.length === 0 ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-dashed text-center text-gray-500">
                  No {selectedPartnerType} goals found. Create one to get started.
                </div>
              ) : (
                existingGoals.map(goal => (
                  <div key={goal._id} className="bg-white rounded-xl shadow-sm border p-6 relative hover:shadow-md transition-shadow">
                    <button
                      onClick={() => handleDeleteGoal(goal._id)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <h3 className="font-bold text-lg text-blue-600 mb-2">{goal.name}</h3>
                    <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-700 mb-4">
                      <p><span className="text-gray-500">State:</span> <span className="font-medium">{goal.state?.name}</span></p>
                      <p><span className="text-gray-500">District:</span> <span className="font-medium">{goal.district?.name || '-'}</span></p>
                      <p><span className="text-gray-500">Cluster:</span> <span className="font-medium">{goal.cluster?.name || '-'}</span></p>
                      <p><span className="text-gray-500">Type:</span> <span className="font-medium">{goal.managerType}</span></p>
                      <p><span className="text-gray-500">Count Target:</span> <span className="font-medium">{goal.targetCount}</span></p>
                      <p><span className="text-gray-500">Timeline:</span> <span className="font-medium">{goal.dueDate}</span></p>
                    </div>
                    {goal.professions && goal.professions.length > 0 && (
                      <div className="border border-gray-100 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 uppercase">Target Professions</div>
                        <div className="divide-y divide-gray-100">
                          {goal.professions.map((p, i) => (
                            <div key={i} className="flex justify-between px-3 py-2 text-sm">
                              <span className="text-gray-800">{p.type}</span>
                              <span className="font-semibold text-blue-600">{p.goal}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Goal Name Modal */}
      {showGoalNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Set Goal Name</h3>
              <button onClick={() => setShowGoalNameModal(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium" onClick={() => setShowGoalNameModal(false)}>Cancel</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium" onClick={() => setShowGoalNameModal(false)}>Apply Name</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
