import React, { useState, useEffect, useRef } from 'react';
import {
  getInstallerAgencyPlans,
  createInstallerAgencyPlan,
  updateInstallerAgencyPlan,
  deleteInstallerAgencyPlan
} from '../../../../services/installer/installerApi';
import { getStates } from '../../../../services/core/locationApi';
import toast from 'react-hot-toast';
import { Plus, ChevronRight, Search, Check, X, Trash2 } from 'lucide-react';
import { productApi } from '../../../../api/productApi';

const AgencyPlan = () => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedDistricts, setSelectedDistricts] = useState([]);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePlanId, setActivePlanId] = useState(null);
  const [districtSearch, setDistrictSearch] = useState('');
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Mappings and levels state
  const [allPlansForCount, setAllPlansForCount] = useState([]);
  const [allMappings, setAllMappings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allSubCategories, setAllSubCategories] = useState([]);
  const [allProjectTypes, setAllProjectTypes] = useState([]);
  const [allSubProjectTypes, setAllSubProjectTypes] = useState([]);

  // Default empty form data structure
  const defaultFormData = {
    name: '',
    eligibility: { aadharCard: true, panCard: true, agreement: true },
    coverage: '1 District',
    solarInstallationCharges: [
      { category: '', subCategory: '', projectType: '', subProjectType: '', chargesPerKw: 0 }
    ],
    isActive: true
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    fetchCountries();
    fetchHierarchyData();
  }, []);

  const fetchHierarchyData = async () => {
    try {
      const [catRes, subRes, typeRes, subTypeRes, mappingsRes, plansRes] = await Promise.all([
        productApi.getCategories(),
        productApi.getSubCategories(),
        productApi.getProjectTypes(),
        productApi.getSubProjectTypes(),
        productApi.getProjectCategoryMappings(),
        getInstallerAgencyPlans()
      ]);

      setCategories(catRes.data.data || catRes.data || []);
      setAllSubCategories(subRes.data.data || subRes.data || []);
      setAllProjectTypes(typeRes.data.data || typeRes.data || []);
      setAllSubProjectTypes(subTypeRes.data.data || subTypeRes.data || []);
      setAllMappings(mappingsRes.data.data || mappingsRes.data || []);
      setAllPlansForCount(plansRes || []);
    } catch (err) {
      console.error("Failed to fetch hierarchy data", err);
    }
  };

  // Helper to count plans for a location
  const getPlanCount = (type, id) => {
    return allPlansForCount.filter(p => {
      if (type === 'country') return (p.country?._id || p.country) === id;
      if (type === 'state') return (p.state?._id || p.state) === id;
      if (type === 'cluster') return (p.cluster?._id || p.cluster) === id;
      if (type === 'district') return p.districts?.some(d => (d._id || d) === id);
      return false;
    }).length;
  };

  useEffect(() => {
    if (selectedCountry) fetchStates(selectedCountry);
    else { setStates([]); setSelectedState(null); }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedState) fetchClusters(selectedState);
    else { setClusters([]); setSelectedCluster(null); }
  }, [selectedState]);

  useEffect(() => {
    if (selectedCluster) fetchDistricts(selectedCluster);
    else { setDistricts([]); setSelectedDistricts([]); }
  }, [selectedCluster]);

  const [isSelectionFinal, setIsSelectionFinal] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDistrictDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedDistricts.length > 0 && isSelectionFinal) {
      fetchPlans({ districtIds: selectedDistricts.join(',') });
    } else {
      setPlans([]);
      setActivePlanId(null);
    }
  }, [selectedDistricts, isSelectionFinal]);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const { getCountries } = await import('../../../../services/core/locationApi');
      const data = await getCountries();
      setCountries(data);
    } catch (error) { toast.error('Failed to load countries'); }
    finally { setLoading(false); }
  };

  const fetchStates = async (countryId) => {
    try {
      setLoading(true);
      const data = await getStates({ countryId });
      setStates(data);
    } catch (error) { toast.error('Failed to load states'); }
    finally { setLoading(false); }
  };

  const fetchClusters = async (stateId) => {
    try {
      setLoading(true);
      const { getClustersHierarchy } = await import('../../../../services/core/locationApi');
      const data = await getClustersHierarchy(stateId);
      setClusters(data);
    } catch (error) { toast.error('Failed to load clusters'); }
    finally { setLoading(false); }
  };

  const fetchDistricts = async (clusterId) => {
    try {
      setLoading(true);
      const { getDistrictsHierarchy } = await import('../../../../services/core/locationApi');
      const data = await getDistrictsHierarchy(clusterId);
      setDistricts(data);
    } catch (error) { toast.error('Failed to load districts'); }
    finally { setLoading(false); }
  };

  const fetchPlans = async (params) => {
    try {
      setLoading(true);
      const data = await getInstallerAgencyPlans(params);
      setPlans(data);
      if (data.length > 0) {
        if (!activePlanId || !data.find(p => p._id === activePlanId)) {
          const firstPlan = data[0];
          setActivePlanId(firstPlan._id);
          // Normalize districts to IDs if populated
          const normalizedDistricts = firstPlan.districts?.map(d => typeof d === 'object' ? d._id : d) || [];
          setFormData({ ...firstPlan, districts: normalizedDistricts });
        }
      } else {
        setActivePlanId(null);
        setFormData({ ...defaultFormData });
      }
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (plan) => {
    setActivePlanId(plan._id);
    // Normalize districts to IDs if populated
    const normalizedDistricts = plan.districts?.map(d => typeof d === 'object' ? d._id : d) || [];
    setFormData({ ...plan, districts: normalizedDistricts });
  };

  const handleAddNewClick = async () => {
    if (selectedDistricts.length === 0) {
      toast.error('Please complete the location hierarchy (District level) first');
      return;
    }
    try {
      setLoading(true);
      const newName = `Plan ${plans.length + 1}`;
      const payload = { 
        ...defaultFormData, 
        name: newName, 
        country: selectedCountry,
        state: selectedState,
        cluster: selectedCluster,
        districts: selectedDistricts 
      };
      const created = await createInstallerAgencyPlan(payload);
      toast.success(`${newName} added successfully`);

      setPlans((prev) => [...prev, created]);
      setActivePlanId(created._id);
      setFormData(created);
    } catch (error) {
      toast.error('Failed to add plan');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (section, field) => {
    setFormData((prev) => {
      const sectionData = prev[section] || {};
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: !sectionData[field]
        }
      };
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };



  const handleToggleDistrictInPlan = (districtId) => {
    setFormData(prev => {
      const current = prev.districts || [];
      const updated = current.includes(districtId) 
        ? current.filter(id => id !== districtId) 
        : [...current, districtId];
      return { ...prev, districts: updated };
    });
  };

  const handleConfigChange = (index, field, value) => {
    setFormData(prev => {
      const newConfigs = [...prev.projectConfigurations];
      
      // Check for duplicates before updating
      if (field === 'subProjectType' && value) {
        const current = newConfigs[index];
        const isDuplicate = prev.projectConfigurations.some((c, i) => 
          i !== index && 
          c.category === current.category && 
          c.subCategory === current.subCategory && 
          c.projectType === current.projectType && 
          c.subProjectType === value
        );
        if (isDuplicate) {
          toast.error("This combination already exists!");
          return prev;
        }
      }

      newConfigs[index] = { ...newConfigs[index], [field]: value };

      // Reset dependent fields
      if (field === 'category') {
        newConfigs[index].subCategory = '';
        newConfigs[index].projectType = '';
        newConfigs[index].subProjectType = '';
      } else if (field === 'subCategory') {
        newConfigs[index].projectType = '';
        newConfigs[index].subProjectType = '';
      } else if (field === 'projectType') {
        newConfigs[index].subProjectType = '';
      }

      return { ...prev, projectConfigurations: newConfigs };
    });
  };

  const addConfigRow = () => {
    setFormData(prev => ({
      ...prev,
      projectConfigurations: [
        ...prev.projectConfigurations,
        { category: '', subCategory: '', projectType: '', subProjectType: '' }
      ]
    }));
  };

  const removeConfigRow = (index) => {
    setFormData(prev => ({
      ...prev,
      projectConfigurations: prev.projectConfigurations.filter((_, i) => i !== index)
    }));
  };

  const handleChargesRowChange = (index, field, value) => {
    setFormData(prev => {
      const newCharges = [...prev.solarInstallationCharges];
      
      // Duplicate check for subProjectType
      if (field === 'subProjectType' && value) {
        const current = newCharges[index];
        const isDuplicate = prev.solarInstallationCharges.some((c, i) => 
          i !== index && 
          c.category === current.category && 
          c.subCategory === current.subCategory && 
          c.projectType === current.projectType && 
          c.subProjectType === value
        );
        if (isDuplicate) {
          toast.error("This combination already exists in charges!");
          return prev;
        }
      }

      newCharges[index] = { ...newCharges[index], [field]: value };

      // Reset dependent fields
      if (field === 'category') {
        newCharges[index].subCategory = '';
        newCharges[index].projectType = '';
        newCharges[index].subProjectType = '';
      } else if (field === 'subCategory') {
        newCharges[index].projectType = '';
        newCharges[index].subProjectType = '';
      } else if (field === 'projectType') {
        newCharges[index].subProjectType = '';
      }

      return { ...prev, solarInstallationCharges: newCharges };
    });
  };

  const addChargesRow = () => {
    setFormData(prev => ({
      ...prev,
      solarInstallationCharges: [
        ...prev.solarInstallationCharges,
        { category: '', subCategory: '', projectType: '', subProjectType: '', chargesPerKw: 0 }
      ]
    }));
  };

  const removeChargesRow = (index) => {
    setFormData(prev => ({
      ...prev,
      solarInstallationCharges: prev.solarInstallationCharges.filter((_, i) => i !== index)
    }));
  };

  // Helper to get options for dependent dropdowns
  const getSubCatOptions = (catId) => {
    if (!catId) return [];
    const validSubCatIds = allMappings
      .filter(m => (m.categoryId?._id || m.categoryId) === catId)
      .map(m => m.subCategoryId?._id || m.subCategoryId);
    return allSubCategories.filter(sc => validSubCatIds.includes(sc._id));
  };

  const getProjectTypeOptions = (catId, subCatId) => {
    if (!catId || !subCatId) return [];
    const validMappings = allMappings.filter(m => 
      (m.categoryId?._id || m.categoryId) === catId && 
      (m.subCategoryId?._id || m.subCategoryId) === subCatId
    );
    
    // In some systems projectType is a separate master, in others it's kW ranges in the mapping
    // This implementation assumes project types are based on the mapping's from/to kW if no master is used,
    // but the request asks for "Project Type" dropdown. We'll use the unique combinations from mappings.
    const projectTypes = validMappings.map(m => {
      if (m.projectTypeFrom !== undefined && m.projectTypeTo !== undefined) {
          return `${m.projectTypeFrom}-${m.projectTypeTo} kW`;
      }
      return m.projectType;
    });
    return [...new Set(projectTypes)];
  };

  const getSubProjectTypeOptions = (catId, subCatId, projectType) => {
    if (!catId || !subCatId || !projectType) return [];
    const validMappings = allMappings.filter(m => {
       const mCatId = m.categoryId?._id || m.categoryId;
       const mSubCatId = m.subCategoryId?._id || m.subCategoryId;
       const mPType = (m.projectTypeFrom !== undefined && m.projectTypeTo !== undefined) 
          ? `${m.projectTypeFrom}-${m.projectTypeTo} kW` 
          : m.projectType;
       
       return mCatId === catId && mSubCatId === subCatId && mPType === projectType;
    });

    const subTypeIds = validMappings.map(m => m.subProjectTypeId?._id || m.subProjectTypeId);
    return allSubProjectTypes.filter(st => subTypeIds.includes(st._id));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (selectedDistricts.length === 0) {
      toast.error('Location is incomplete');
      return;
    }
    try {
      const payload = { 
        ...formData, 
        country: selectedCountry,
        state: selectedState,
        cluster: selectedCluster,
        districts: selectedDistricts 
      };
      
      if (!activePlanId) {
        const created = await createInstallerAgencyPlan(payload);
        toast.success('Saved Successfully!');
        fetchPlans({ districtIds: selectedDistricts.join(',') });
      } else {
        await updateInstallerAgencyPlan(activePlanId, payload);
        toast.success('Saved Successfully!');
        fetchPlans({ districtIds: selectedDistricts.join(',') });
      }
    } catch (error) {
      toast.error('Failed to save plan');
    }
  };

  // Helper component for checkboxes
  const CheckboxField = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
      />
      {label}
    </label>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Setup Location Selection Hierarchy */}
        {(!isSelectionFinal) ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800 tracking-tight">Select Setup Location</h2>
            
            <div className="flex items-center gap-3 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100 max-w-4xl mx-auto overflow-x-auto scrollbar-hide">
               <div className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!selectedCountry ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-700'}`}>1. Country</div>
               <div className="w-4 h-px bg-gray-300"></div>
               <div className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedCountry && !selectedState ? 'bg-blue-600 text-white' : (selectedState ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-400')}`}>2. State</div>
               <div className="w-4 h-px bg-gray-300"></div>
               <div className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedState && !selectedCluster ? 'bg-blue-600 text-white' : (selectedCluster ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-400')}`}>3. Cluster</div>
               <div className="w-4 h-px bg-gray-300"></div>
               <div className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedCluster && selectedDistricts.length === 0 ? 'bg-blue-600 text-white' : (selectedDistricts.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-400')}`}>4. Districts ({selectedDistricts.length})</div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium">Loading details...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {/* Level 1: Country */}
                {!selectedCountry && countries.map((c) => {
                  const count = getPlanCount('country', c._id);
                  return (
                    <div key={c._id} onClick={() => setSelectedCountry(c._id)} className="group bg-white border-2 border-gray-100 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 hover:shadow-xl transition-all duration-300 active:scale-95">
                      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-colors">
                         <span className="text-2xl group-hover:scale-125 transition-transform">🌍</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">{c.name}</h3>
                      {count > 0 && <p className="text-xs text-blue-600 font-bold mt-2 bg-blue-50 py-1 px-3 rounded-full inline-block">{count} Plans Active</p>}
                    </div>
                  );
                })}

                {/* Level 2: State */}
                {selectedCountry && !selectedState && (
                  <>
                    <button onClick={() => setSelectedCountry(null)} className="col-span-full text-sm text-blue-600 font-bold mb-4 flex items-center hover:underline">← Back to Countries</button>
                    {states.map((s) => {
                      const count = getPlanCount('state', s._id);
                      return (
                        <div key={s._id} onClick={() => setSelectedState(s._id)} className="group bg-white border-2 border-gray-100 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 hover:shadow-xl transition-all duration-300 active:scale-95">
                          <h3 className="text-lg font-bold text-gray-800">{s.name}</h3>
                          <p className="text-xs text-gray-400 mt-1 uppercase font-black">{s.abbreviation}</p>
                          {count > 0 && <p className="text-xs text-blue-600 font-bold mt-3 bg-blue-50 py-1 px-3 rounded-full inline-block">{count} Plans Available</p>}
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Level 3: Cluster */}
                {selectedState && !selectedCluster && (
                  <>
                    <button onClick={() => setSelectedState(null)} className="col-span-full text-sm text-blue-600 font-bold mb-4 flex items-center hover:underline">← Back to States</button>
                    {clusters.map((cl) => {
                      const count = getPlanCount('cluster', cl._id);
                      return (
                        <div key={cl._id} onClick={() => setSelectedCluster(cl._id)} className="group bg-white border-2 border-gray-100 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 hover:shadow-xl transition-all duration-300 active:scale-95">
                          <h3 className="text-lg font-bold text-gray-800">{cl.name}</h3>
                          <p className="text-xs text-blue-500 mt-2 font-bold">{cl.districts?.length || 0} Districts included</p>
                          {count > 0 && <p className="text-xs text-green-600 font-bold mt-3 bg-green-50 py-1 px-3 rounded-full inline-block">{count} Existing Plans</p>}
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Level 4: District Multi-Select */}
                {selectedCluster && (
                  <>
                    <button onClick={() => setSelectedCluster(null)} className="col-span-full text-sm text-blue-600 font-bold mb-4 flex items-center hover:underline">← Back to Clusters</button>
                    {districts.map((d) => {
                      const isSelected = selectedDistricts.includes(d._id);
                      const count = getPlanCount('district', d._id);
                      return (
                        <div 
                          key={d._id} 
                          onClick={() => {
                            setSelectedDistricts(prev => 
                               prev.includes(d._id) ? prev.filter(id => id !== d._id) : [...prev, d._id]
                            );
                          }} 
                          className={`group relative bg-white border-2 rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 active:scale-95 ${
                            isSelected ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100 hover:border-blue-500 hover:shadow-xl'
                          }`}
                        >
                          <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                             isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-200'
                          }`}>
                            {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                          </div>
                          <h3 className={`text-base font-bold transition-colors mb-1 ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>{d.name}</h3>
                          {count > 0 && <p className="text-[10px] text-blue-500 font-black uppercase tracking-tighter bg-blue-50/50 py-0.5 px-2 rounded-md inline-block">{count} Plans Setup</p>}
                        </div>
                      );
                    })}
                    
                    {selectedDistricts.length > 0 && (
                      <div className="col-span-full mt-12 flex justify-center">
                        <button 
                          onClick={() => setIsSelectionFinal(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3 rounded-full font-bold shadow-xl transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                        >
                          Proceed to Plans ({selectedDistricts.length} Districts) →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setIsSelectionFinal(false)}
                className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-blue-600 hover:bg-gray-50 flex items-center font-bold shadow-sm transition-all"
              >
                <span className="mr-2">←</span> Change Districts
              </button>
              
              <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
                <span>{selectedCountry && countries.find(c => c._id === selectedCountry)?.name}</span>
                <span className="text-gray-300">/</span>
                <span>{selectedState && states.find(s => s._id === selectedState)?.name}</span>
                <span className="text-gray-300">/</span>
                <span>{selectedCluster && clusters.find(cl => cl._id === selectedCluster)?.name}</span>
                <span className="text-gray-300">/</span>
                <span className="text-blue-600">{selectedDistricts.length} Districts Selected</span>
              </div>
            </div>

            {/* Location List (Selected Preview) */}
            <div className="flex flex-wrap gap-4 mb-8 justify-center">
              {districts.filter(d => selectedDistricts.includes(d._id)).map((d) => (
                <div
                  key={d._id}
                  className="bg-blue-600 border border-blue-700 rounded-xl px-10 py-5 text-center shadow-lg transform scale-105"
                >
                  <h3 className="text-lg font-bold text-white">{d.name}</h3>
                </div>
              ))}
            </div>

            {/* Add More Plan Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={handleAddNewClick}
                disabled={loading}
                className="px-6 py-2 text-sm font-semibold rounded-md flex items-center gap-1 transition-all bg-[#1a2332] text-white hover:bg-gray-800 shadow-md"
              >
                Add More Plan
              </button>
            </div>

            {/* Tabs */}
            {plans.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 justify-center">
                {plans.map((plan) => (
                  <button
                    key={plan._id}
                    onClick={() => handleTabClick(plan)}
                    className={`px-6 py-2 text-sm font-semibold rounded-md transition-all ${activePlanId === plan._id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-500 hover:text-gray-800 border-b-2 border-transparent'
                      }`}
                  >
                    {plan.name}
                  </button>
                ))}
              </div>
            )}

            {loading && plans.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Loading plan...</div>
            ) : plans.length > 0 && formData ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                <div className="mb-6 pb-2 inline-block">
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    className="text-2xl font-bold text-blue-600 bg-transparent outline-none placeholder-blue-300 border-b border-dashed border-blue-400 min-w-[200px]"
                    placeholder="Enter Plan Name"
                  />
                </div>

                {/* Safe object definitions to prevent undefined errors from older plans */}
                {(() => {
                  const safeEligibility = formData.eligibility || {};
                  const safeSubUser = formData.subUser || {};
                  const safeCategoryType = formData.categoryType || {};
                  const safeSubCategoryType = formData.subCategoryType || {};
                  const safeAssignedProjectTypes = formData.assignedProjectTypes || {};
                  const safeProjectType = formData.projectType || {};
                  const safeSubProjectType = formData.subProjectType || {};

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {/* Column 1 */}
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Eligibility Requirements</h4>
                            <div className="space-y-1">
                              <CheckboxField
                                label="Aadhar Card"
                                checked={safeEligibility.aadharCard || false}
                                onChange={() => handleCheckboxChange('eligibility', 'aadharCard')}
                              />
                              <CheckboxField
                                label="PAN Card"
                                checked={safeEligibility.panCard || false}
                                onChange={() => handleCheckboxChange('eligibility', 'panCard')}
                              />
                              <CheckboxField
                                label="Agreement"
                                checked={safeEligibility.agreement || false}
                                onChange={() => handleCheckboxChange('eligibility', 'agreement')}
                              />
                            </div>
                          </div>

                          <div className="pt-2">
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Sub User Module</h4>
                            <div className="space-y-1">
                              <CheckboxField
                                label="Sales"
                                checked={safeSubUser.sales || false}
                                onChange={() => handleCheckboxChange('subUser', 'sales')}
                              />
                              <CheckboxField
                                label="Dealer"
                                checked={safeSubUser.dealer || false}
                                onChange={() => handleCheckboxChange('subUser', 'dealer')}
                              />
                              <CheckboxField
                                label="Lead Partner"
                                checked={safeSubUser.leadPartner || false}
                                onChange={() => handleCheckboxChange('subUser', 'leadPartner')}
                              />
                              <CheckboxField
                                label="Service"
                                checked={safeSubUser.service || false}
                                onChange={() => handleCheckboxChange('subUser', 'service')}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-6">
                          <div className="flex flex-col gap-4">
                            <div className="w-full">
                              <h4 className="text-[10px] uppercase font-black text-gray-400 mb-1.5 ml-1">Setup Coverage</h4>
                              <select
                                name="coverage"
                                value={formData.coverage || '1 District'}
                                onChange={handleInputChange}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-sm transition-all appearance-none cursor-pointer"
                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                              >
                                <option value="1 District">1 District</option>
                                <option value="Multiple Districts">Multiple Districts</option>
                                <option value="Cluster">Cluster</option>
                                <option value="State">State</option>
                              </select>
                            </div>

                            {formData.coverage === 'Multiple Districts' && (
                              <div className="w-full">
                                <h4 className="text-[10px] uppercase font-black text-gray-400 mb-1.5 ml-1">Select Active Districts ({formData.districts?.length || 0})</h4>
                                <div className="relative" ref={dropdownRef}>
                                  <div 
                                    onClick={() => setShowDistrictDropdown(!showDistrictDropdown)}
                                    className="min-h-[46px] w-full border border-gray-200 rounded-xl px-3 py-2 flex flex-wrap gap-1.5 bg-white shadow-sm hover:border-blue-400 transition-all cursor-pointer"
                                  >
                                    {formData.districts?.length === 0 ? (
                                      <span className="text-gray-400 text-xs py-2 px-1 italic">Assign districts to this plan...</span>
                                    ) : (
                                      formData.districts?.map(idOrObj => {
                                        const id = typeof idOrObj === 'string' ? idOrObj : idOrObj._id;
                                        const displayName = typeof idOrObj === 'object' ? idOrObj.name : (districts.find(d => d._id === id)?.name || id);
                                        return (
                                          <span 
                                            key={id} 
                                            onClick={(e) => { e.stopPropagation(); handleToggleDistrictInPlan(id); }} 
                                            className="bg-blue-50 text-blue-700 text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-2 hover:bg-red-50 hover:text-red-700 transition-all border border-blue-100 group/tag"
                                          >
                                            {displayName} 
                                            <X size={10} className="text-blue-400 group-hover/tag:text-red-400" />
                                          </span>
                                        );
                                      })
                                    )}
                                  </div>
                                  
                                  {showDistrictDropdown && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden transform origin-top transition-all duration-200">
                                      <div className="p-3 bg-gray-50/50 border-b border-gray-100 sticky top-0">
                                        <div className="relative">
                                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                          <input 
                                            type="text"
                                            placeholder="Search districts..."
                                            value={districtSearch}
                                            onChange={(e) => setDistrictSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                          />
                                        </div>
                                      </div>
                                      <div className="max-h-56 overflow-y-auto py-2">
                                        {districts
                                          .filter(d => d.name.toLowerCase().includes(districtSearch.toLowerCase()))
                                          .map(d => {
                                            const isSelected = formData.districts?.includes(d._id);
                                            return (
                                              <div 
                                                key={d._id} 
                                                onClick={(e) => { e.stopPropagation(); handleToggleDistrictInPlan(d._id); }} 
                                                className={`px-4 py-2.5 text-xs flex items-center justify-between cursor-pointer transition-all ${isSelected ? 'bg-blue-50/50 text-blue-700 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                                              >
                                                <div className="flex items-center gap-3">
                                                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                                    {isSelected && <Check size={10} className="text-white" />}
                                                  </div>
                                                  {d.name}
                                                </div>
                                              </div>
                                            );
                                          })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="pt-2">
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Sub Users Limit</h4>
                            <input
                              type="number"
                              name="userLimits"
                              value={formData.userLimits || ''}
                              onChange={handleInputChange}
                              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
                              placeholder="e.g. 10"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mb-8 overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                           <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Project Category Configurations</h4>
                           <button 
                             onClick={addConfigRow}
                             className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-4 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-2 active:scale-95"
                           >
                             <Plus size={14} /> Add New Row
                           </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left border-collapse">
                            <thead>
                              <tr className="bg-white border-b border-gray-100">
                                <th className="px-6 py-4 font-black text-[10px] text-gray-400 uppercase tracking-widest text-center w-12">#</th>
                                <th className="px-4 py-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">Category</th>
                                <th className="px-4 py-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">Sub Category</th>
                                <th className="px-4 py-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">Project Type</th>
                                <th className="px-4 py-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">Sub Project Type</th>
                                <th className="px-6 py-4 font-black text-[10px] text-gray-400 uppercase tracking-widest text-center w-16">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {formData.projectConfigurations?.map((config, idx) => {
                                const subCatOptions = getSubCatOptions(config.category);
                                const projectTypeOptions = getProjectTypeOptions(config.category, config.subCategory);
                                const subProjectOptions = getSubProjectTypeOptions(config.category, config.subCategory, config.projectType);

                                return (
                                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-center font-bold text-gray-300">{idx + 1}</td>
                                    
                                    <td className="px-2 py-4">
                                      <select 
                                        value={config.category} 
                                        onChange={(e) => handleConfigChange(idx, 'category', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                                      >
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                      </select>
                                    </td>

                                    <td className="px-2 py-4">
                                      <select 
                                        value={config.subCategory} 
                                        onChange={(e) => handleConfigChange(idx, 'subCategory', e.target.value)}
                                        disabled={!config.category}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                                      >
                                        <option value="">Select Sub Category</option>
                                        {subCatOptions.map(sc => <option key={sc._id} value={sc._id}>{sc.name}</option>)}
                                      </select>
                                    </td>

                                    <td className="px-2 py-4">
                                      <select 
                                        value={config.projectType} 
                                        onChange={(e) => handleConfigChange(idx, 'projectType', e.target.value)}
                                        disabled={!config.subCategory}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                                      >
                                        <option value="">Select Project Type</option>
                                        {projectTypeOptions.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                                      </select>
                                    </td>

                                    <td className="px-2 py-4">
                                      <select 
                                        value={config.subProjectType} 
                                        onChange={(e) => handleConfigChange(idx, 'subProjectType', e.target.value)}
                                        disabled={!config.projectType}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                                      >
                                        <option value="">Select Sub Type</option>
                                        {subProjectOptions.map(st => <option key={st._id} value={st._id}>{st.name}</option>)}
                                      </select>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                      <button 
                                        onClick={() => removeConfigRow(idx)}
                                        className="text-red-300 hover:text-red-500 transition-colors p-1"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {(!formData.projectConfigurations || formData.projectConfigurations.length === 0) && (
                            <div className="p-12 text-center text-gray-400 bg-white">
                               No configurations added. Click "Add New Row" to start.
                            </div>
                          )}
                        </div>
                      </div>


                    </>
                  );
                })()}


                {/* New Solar Installation Charges Table */}
                <div className="mb-8 overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
                  <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Solar Installation Charges</h4>
                    <button 
                      onClick={addChargesRow}
                      className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold px-4 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-2 active:scale-95"
                    >
                      <Plus size={14} /> Add Charge Row
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-gray-100">
                          <th className="px-6 py-4 font-black text-[10px] text-gray-400 uppercase tracking-widest text-center w-12">#</th>
                          <th className="px-4 py-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">Category</th>
                          <th className="px-4 py-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">Sub Category</th>
                          <th className="px-4 py-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">Project Type</th>
                          <th className="px-4 py-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">Sub Project Type</th>
                          <th className="px-4 py-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">Charges /kW (₹)</th>
                          <th className="px-6 py-4 font-black text-[10px] text-gray-400 uppercase tracking-widest text-center w-16">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {formData.solarInstallationCharges?.map((charge, idx) => {
                          const subCatOptions = getSubCatOptions(charge.category);
                          const projectTypeOptions = getProjectTypeOptions(charge.category, charge.subCategory);
                          const subProjectOptions = getSubProjectTypeOptions(charge.category, charge.subCategory, charge.projectType);

                          return (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 text-center font-bold text-gray-300">{idx + 1}</td>
                              
                              <td className="px-2 py-4">
                                <select 
                                  value={charge.category} 
                                  onChange={(e) => handleChargesRowChange(idx, 'category', e.target.value)}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                                >
                                  <option value="">Select Category</option>
                                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                              </td>

                              <td className="px-2 py-4">
                                <select 
                                  value={charge.subCategory} 
                                  onChange={(e) => handleChargesRowChange(idx, 'subCategory', e.target.value)}
                                  disabled={!charge.category}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                                >
                                  <option value="">Select Sub Category</option>
                                  {subCatOptions.map(sc => <option key={sc._id} value={sc._id}>{sc.name}</option>)}
                                </select>
                              </td>

                              <td className="px-2 py-4">
                                <select 
                                  value={charge.projectType} 
                                  onChange={(e) => handleChargesRowChange(idx, 'projectType', e.target.value)}
                                  disabled={!charge.subCategory}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                                >
                                  <option value="">Select Project Type</option>
                                  {projectTypeOptions.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                                </select>
                              </td>

                              <td className="px-2 py-4">
                                <select 
                                  value={charge.subProjectType} 
                                  onChange={(e) => handleChargesRowChange(idx, 'subProjectType', e.target.value)}
                                  disabled={!charge.projectType}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                                >
                                  <option value="">Select Sub Type</option>
                                  {subProjectOptions.map(st => <option key={st._id} value={st._id}>{st.name}</option>)}
                                </select>
                              </td>

                              <td className="px-2 py-4">
                                <input 
                                  type="number" 
                                  value={charge.chargesPerKw || ''} 
                                  onChange={(e) => handleChargesRowChange(idx, 'chargesPerKw', e.target.value)}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  placeholder="e.g. 1000"
                                />
                              </td>

                              <td className="px-6 py-4 text-center">
                                <button 
                                  onClick={() => removeChargesRow(idx)}
                                  className="text-red-300 hover:text-red-500 transition-colors p-1"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {(!formData.solarInstallationCharges || formData.solarInstallationCharges.length === 0) && (
                      <div className="p-12 text-center text-gray-400 bg-white">
                         No charges added. Click "Add Charge Row" to start.
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-[#1B57A6] hover:bg-blue-800 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                No plans available for this location. Click "Add More Plan" to create one.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AgencyPlan;
