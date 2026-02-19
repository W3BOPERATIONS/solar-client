import React, { useState, useEffect } from 'react';
import {
  MapPin, Building, Users, Package, Filter,
  Plus, Edit, Trash2, Eye, Check, X,
  ChevronDown, ChevronUp, Search, Settings,
  Loader
} from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import {
  getBundlePlans,
  createBundlePlan,
  updateBundlePlan
} from '../../../../services/combokit/combokitApi';
import { locationAPI } from '../../../../api/api';
import toast from 'react-hot-toast';

const CP_TYPES = ['Startup', 'Basic', 'Enterprise', 'Solar Business'];

const BundlePlans = () => {
  const { countries, states, fetchCountries, fetchStates, fetchClusters, fetchDistricts, fetchCities, loading: locationLoading } = useLocations();

  // Selections
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedStates, setSelectedStates] = useState(new Set());
  const [selectedClusters, setSelectedClusters] = useState(new Set());
  const [selectedDistricts, setSelectedDistricts] = useState(new Set());
  const [selectedCities, setSelectedCities] = useState(new Set());
  const [selectedCpTypes, setSelectedCpTypes] = useState(new Set());

  // Dynamic Options
  const [stateOptions, setStateOptions] = useState([]);
  const [clusterOptions, setClusterOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);

  // Data
  const [bundlePlans, setBundlePlans] = useState({});
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState({});

  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalContent, setModalContent] = useState({});

  // Initial Data
  useEffect(() => {
    fetchCountries();
    loadBundlePlans();
  }, []);

  // Set default country if available
  useEffect(() => {
    if (countries.length > 0 && !selectedCountry) {
      // Default to 'India' if found, else first
      const india = countries.find(c => c.name === 'India');
      if (india) setSelectedCountry(india._id);
      else setSelectedCountry(countries[0]._id);
    }
  }, [countries]);

  // Fetch States when Country Selected
  useEffect(() => {
    if (selectedCountry) {
      fetchStates({ country: selectedCountry });
    } else {
      setStateOptions([]);
    }
  }, [selectedCountry]);

  // Use 'states' from hook as options

  // Fetch Clusters when States change
  useEffect(() => {
    const fetchClustersForStates = async () => {
      if (selectedStates.size === 0) {
        setClusterOptions([]);
        return;
      }
      try {
        const uniqueClusters = [];
        const promises = Array.from(selectedStates).map(stateId =>
          locationAPI.getAllClusters({ state: stateId, isActive: 'true' })
        );
        const responses = await Promise.all(promises);
        responses.forEach(res => {
          if (res.data && res.data.data) {
            uniqueClusters.push(...res.data.data);
          }
        });
        setClusterOptions(uniqueClusters);
      } catch (error) {
        console.error("Error fetching clusters", error);
      }
    };
    fetchClustersForStates();
  }, [selectedStates]);

  // Fetch Districts when Clusters change
  useEffect(() => {
    const fetchDistrictsForClusters = async () => {
      if (selectedClusters.size === 0) {
        setDistrictOptions([]);
        return;
      }
      try {
        const uniqueDistricts = [];
        const promises = Array.from(selectedClusters).map(clusterId =>
          locationAPI.getAllDistricts({ cluster: clusterId, isActive: 'true' })
        );
        const responses = await Promise.all(promises);
        responses.forEach(res => {
          if (res.data && res.data.data) {
            uniqueDistricts.push(...res.data.data);
          }
        });
        setDistrictOptions(uniqueDistricts);
      } catch (error) {
        console.error("Error fetching districts", error);
      }
    };
    fetchDistrictsForClusters();
  }, [selectedClusters]);

  // Fetch Cities when Districts change
  useEffect(() => {
    const fetchCitiesForDistricts = async () => {
      if (selectedDistricts.size === 0) {
        setCityOptions([]);
        return;
      }
      try {
        const uniqueCities = [];
        const promises = Array.from(selectedDistricts).map(districtId =>
          locationAPI.getAllCities({ district: districtId, isActive: 'true' })
        );
        const responses = await Promise.all(promises);
        responses.forEach(res => {
          if (res.data && res.data.data) {
            uniqueCities.push(...res.data.data);
          }
        });
        setCityOptions(uniqueCities);
      } catch (error) {
        console.error("Error fetching cities", error);
      }
    };
    fetchCitiesForDistricts();
  }, [selectedDistricts]);

  // Load Bundle Plans
  const loadBundlePlans = async () => {
    try {
      setLoading(true);
      const data = await getBundlePlans();
      const planMap = {};
      data.forEach(plan => {
        if (plan.state) {
          planMap[plan.state._id] = plan;
        }
      });
      setBundlePlans(planMap);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Failed to load bundle plans');
    } finally {
      setLoading(false);
    }
  };

  // Toggles
  const toggleState = (stateId) => {
    const newSelected = new Set(selectedStates);
    if (newSelected.has(stateId)) newSelected.delete(stateId);
    else {
      newSelected.add(stateId);
      // Auto-select based on existing plan
      const plan = bundlePlans[stateId];
      if (plan) {
        // Clusters
        const newClusters = new Set(selectedClusters);
        (plan.clusters || []).forEach(c => newClusters.add(typeof c === 'object' ? c._id : c));
        setSelectedClusters(newClusters);

        // Districts
        const newDistricts = new Set(selectedDistricts);
        (plan.districts || []).forEach(d => newDistricts.add(typeof d === 'object' ? d._id : d));
        setSelectedDistricts(newDistricts);

        // Cities
        const newCities = new Set(selectedCities);
        (plan.cities || []).forEach(city => newCities.add(typeof city === 'object' ? city._id : city));
        setSelectedCities(newCities);

        // CP Types
        const newCpTypes = new Set(selectedCpTypes);
        (plan.cpTypes || []).forEach(t => newCpTypes.add(t));
        setSelectedCpTypes(newCpTypes);
      }
    }
    setSelectedStates(newSelected);
  };

  const toggleCluster = (id) => {
    const newSelected = new Set(selectedClusters);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedClusters(newSelected);
  };

  const toggleDistrict = (id) => {
    const newSelected = new Set(selectedDistricts);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedDistricts(newSelected);
  };

  const toggleCity = (id) => {
    const newSelected = new Set(selectedCities);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedCities(newSelected);
  };

  const toggleCpType = (type) => {
    const newSelected = new Set(selectedCpTypes);
    if (newSelected.has(type)) newSelected.delete(type);
    else newSelected.add(type);
    setSelectedCpTypes(newSelected);
  };

  // Bulk Selects
  const selectAllStates = () => setSelectedStates(new Set(states.map(s => s._id)));
  const clearAllStates = () => {
    setSelectedStates(new Set());
    setSelectedClusters(new Set());
    setSelectedDistricts(new Set());
    setSelectedCities(new Set());
    setSelectedCpTypes(new Set());
  };

  const selectAllClusters = () => setSelectedClusters(new Set(clusterOptions.map(c => c._id)));
  const clearAllClusters = () => {
    setSelectedClusters(new Set());
    setSelectedDistricts(new Set());
    setSelectedCities(new Set());
  };

  const selectAllDistricts = () => setSelectedDistricts(new Set(districtOptions.map(d => d._id)));
  const clearAllDistricts = () => {
    setSelectedDistricts(new Set());
    setSelectedCities(new Set());
  };

  const selectAllCities = () => setSelectedCities(new Set(cityOptions.map(c => c._id)));
  const clearAllCities = () => setSelectedCities(new Set());

  const selectAllCpTypes = () => setSelectedCpTypes(new Set(CP_TYPES));
  const clearAllCpTypes = () => setSelectedCpTypes(new Set());

  // Edit Mode & Saving
  const enableEditMode = (stateId) => {
    setEditMode(prev => ({ ...prev, [stateId]: true }));
    if (!bundlePlans[stateId]) {
      setBundlePlans(prev => ({
        ...prev,
        [stateId]: { state: stateId, bundleName: '', clusters: [], districts: [], cities: [], cpTypes: [], panelBrands: [], technologyType: [], wattage: [], kw: '', cashback: '', timeDuration: [] }
      }));
    }
  };

  const disableEditMode = (stateId) => {
    setEditMode(prev => ({ ...prev, [stateId]: false }));
    loadBundlePlans();
  };

  const updateBundleData = (stateId, field, value) => {
    setBundlePlans(prev => ({ ...prev, [stateId]: { ...prev[stateId], [field]: value } }));
  };

  const saveBundle = async (stateId) => {
    const plan = bundlePlans[stateId];

    // Validate hierarchy selections
    const currentClusters = clusterOptions.filter(c => selectedClusters.has(c._id) && c.state?._id === stateId).map(c => c._id);

    // Get districts that belong to selected clusters
    const currentDistricts = districtOptions.filter(d => {
      const cId = typeof d.cluster === 'object' ? d.cluster._id : d.cluster;
      return selectedDistricts.has(d._id) && currentClusters.includes(cId);
    }).map(d => d._id);

    // Get cities that belong to selected districts
    const currentCities = cityOptions.filter(c => {
      const dId = typeof c.district === 'object' ? c.district._id : c.district;
      return selectedCities.has(c._id) && currentDistricts.includes(dId);
    }).map(c => c._id);

    const payload = {
      state: stateId,
      Country: selectedCountry,
      bundleName: plan.bundleName,
      panelBrands: plan.panelBrands || [],
      technologyType: plan.technologyType || [],
      wattage: plan.wattage || [],
      kw: plan.kw,
      cashback: plan.cashback,
      timeDuration: plan.timeDuration || [],
      clusters: currentClusters,
      districts: currentDistricts,
      cities: currentCities,
      cpTypes: Array.from(selectedCpTypes)
    };

    try {
      if (plan._id) {
        await updateBundlePlan(plan._id, payload);
        toast.success('Bundle Plan updated');
      } else {
        await createBundlePlan(payload);
        toast.success('Bundle Plan created');
      }
      setEditMode(prev => ({ ...prev, [stateId]: false }));
      loadBundlePlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save plan');
    }
  };

  // Details
  const openDetailsModal = (stateId) => {
    const plan = bundlePlans[stateId];
    if (!plan) return;
    setModalContent({
      title: `${plan.bundleName || 'Unnamed'} Bundle Details`,
      cpTypes: plan.cpTypes || [],
      clusters: (plan.clusters || []).map(c => typeof c === 'object' ? c.name : 'Unknown'),
      districts: (plan.districts || []).map(d => typeof d === 'object' ? d.name : 'Unknown'),
      cities: (plan.cities || []).map(c => typeof c === 'object' ? c.name : 'Unknown'),
      panelBrands: plan.panelBrands || [],
      technologyType: plan.technologyType || [],
      wattage: plan.wattage || [],
      kw: plan.kw,
      cashback: plan.cashback,
      timeDuration: plan.timeDuration || []
    });
    setShowDetailsModal(true);
  };

  // Helpers for Count Display
  const getSelectedClustersForState = (stateId) => clusterOptions.filter(c => selectedClusters.has(c._id) && c.state?._id === stateId);
  const getSelectedDistrictsForState = (stateId) => {
    const validClusters = getSelectedClustersForState(stateId).map(c => c._id);
    return districtOptions.filter(d => selectedDistricts.has(d._id) && validClusters.includes(typeof d.cluster === 'object' ? d.cluster._id : d.cluster));
  };
  const getSelectedCitiesForState = (stateId) => {
    const validDistricts = getSelectedDistrictsForState(stateId).map(d => d._id);
    return cityOptions.filter(c => selectedCities.has(c._id) && validDistricts.includes(typeof c.district === 'object' ? c.district._id : c.district));
  };

  return (
    <div className="container-fluid mt-4">
      {/* Country Selection */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="border-l-4 border-primary pl-3 mb-3">Select Country</h5>
          <select
            className="form-control w-1/3"
            value={selectedCountry}
            onChange={(e) => {
              setSelectedCountry(e.target.value);
              clearAllStates();
            }}
          >
            <option value="">Select Country</option>
            {countries.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* State Selection */}
      {selectedCountry && (
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="border-l-4 border-primary pl-3 mt-5 mb-3">Select States</h5>
            <div className="mb-3">
              <button className="btn btn-sm btn-outline-primary mb-3 mr-2" onClick={selectAllStates}>Select All</button>
              <button className="btn btn-sm btn-outline-secondary mb-3" onClick={clearAllStates}>Clear</button>
            </div>
            <div className="row">
              {states.map((state) => (
                <div key={state._id} className="col-md-3 mb-3">
                  <div
                    className={`card border cursor-pointer hover:shadow-md transition-all ${selectedStates.has(state._id) ? 'bg-primary text-white border-primary' : 'border-gray-200'}`}
                    onClick={() => toggleState(state._id)}
                  >
                    <div className="card-body text-center p-3">
                      <p className="font-bold mb-0">{state.name}</p>
                      {bundlePlans[state._id] && <span className="text-xs badge bg-green-500 text-white mt-1">Configured</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cluster Selection */}
      {selectedStates.size > 0 && (
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="border-l-4 border-primary pl-3 mt-5 mb-3">Select Clusters</h5>
            <div className="mb-3">
              <button className="btn btn-sm btn-outline-primary mb-3 mr-2" onClick={selectAllClusters}>Select All</button>
              <button className="btn btn-sm btn-outline-secondary mb-3" onClick={clearAllClusters}>Clear</button>
            </div>
            {clusterOptions.length === 0 ? (
              <p className="text-muted">No clusters found for selected states.</p>
            ) : (
              <div className="row max-h-60 overflow-y-auto">
                {clusterOptions.map(cluster => (
                  <div key={cluster._id} className="col-md-3 mb-3">
                    <div
                      className={`p-2 border rounded text-center cursor-pointer text-sm ${selectedClusters.has(cluster._id) ? 'bg-purple-600 text-white' : 'hover:bg-gray-50'}`}
                      onClick={() => toggleCluster(cluster._id)}
                    >
                      {cluster.name}
                      <div className="text-xs opacity-75">({cluster.state?.name})</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* District Selection */}
      {selectedClusters.size > 0 && (
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="border-l-4 border-primary pl-3 mt-5 mb-3">Select Districts</h5>
            <div className="mb-3">
              <button className="btn btn-sm btn-outline-primary mb-3 mr-2" onClick={selectAllDistricts}>Select All</button>
              <button className="btn btn-sm btn-outline-secondary mb-3" onClick={clearAllDistricts}>Clear</button>
            </div>
            {districtOptions.length === 0 ? (
              <p className="text-muted">No districts found for selected clusters.</p>
            ) : (
              <div className="row max-h-60 overflow-y-auto">
                {districtOptions.map(district => (
                  <div key={district._id} className="col-md-2 mb-3">
                    <div
                      className={`p-2 border rounded text-center cursor-pointer text-sm ${selectedDistricts.has(district._id) ? 'bg-green-600 text-white' : 'hover:bg-gray-50'}`}
                      onClick={() => toggleDistrict(district._id)}
                    >
                      {district.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* City Selection */}
      {selectedDistricts.size > 0 && (
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="border-l-4 border-primary pl-3 mt-5 mb-3">Select Cities</h5>
            <div className="mb-3">
              <button className="btn btn-sm btn-outline-primary mb-3 mr-2" onClick={selectAllCities}>Select All</button>
              <button className="btn btn-sm btn-outline-secondary mb-3" onClick={clearAllCities}>Clear</button>
            </div>
            {cityOptions.length === 0 ? (
              <p className="text-muted">No cities found for selected districts.</p>
            ) : (
              <div className="row max-h-60 overflow-y-auto">
                {cityOptions.map(city => (
                  <div key={city._id} className="col-md-2 mb-3">
                    <div
                      className={`p-2 border rounded text-center cursor-pointer text-sm ${selectedCities.has(city._id) ? 'bg-orange-600 text-white' : 'hover:bg-gray-50'}`}
                      onClick={() => toggleCity(city._id)}
                    >
                      {city.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CP Types */}
      {selectedCities.size > 0 && (
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="border-l-4 border-primary pl-3 mt-5 mb-3">Select CP Types</h5>
            <div className="mb-3">
              <button className="btn btn-sm btn-outline-primary mb-3 mr-2" onClick={selectAllCpTypes}>Select All</button>
              <button className="btn btn-sm btn-outline-secondary mb-3" onClick={clearAllCpTypes}>Clear</button>
            </div>
            <div className="row">
              {CP_TYPES.map(type => (
                <div key={type} className="col-md-3 mb-3">
                  <div
                    className={`p-3 border rounded text-center cursor-pointer font-medium ${selectedCpTypes.has(type) ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50'}`}
                    onClick={() => toggleCpType(type)}
                  >
                    {type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      {selectedStates.size > 0 && selectedClusters.size > 0 && selectedDistricts.size > 0 && selectedCities.size > 0 && (
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="border-l-4 border-primary pl-3 mt-5 mb-3">Bundle Plans Configuration</h5>
            <div className="table-responsive">
              <table className="table table-bordered table-hover w-full">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3">Config</th>
                    <th className="px-4 py-3">Bundle Name</th>
                    <th className="px-4 py-3">Panel Brands</th>
                    <th className="px-4 py-3">Technology</th>
                    <th className="px-4 py-3">Wattage</th>
                    <th className="px-4 py-3">KW</th>
                    <th className="px-4 py-3">CashBack</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(selectedStates).map(stateId => {
                    const stateObj = states.find(s => s._id === stateId);
                    const plan = bundlePlans[stateId] || {};
                    const isEditing = editMode[stateId];
                    const activeClusters = getSelectedClustersForState(stateId);
                    const activeDistricts = getSelectedDistrictsForState(stateId);
                    const activeCities = getSelectedCitiesForState(stateId);

                    return (
                      <tr key={stateId}>
                        <td className="px-4 py-3 font-bold">{stateObj?.name}</td>
                        <td className="px-4 py-3 text-sm">
                          <div><span className="font-semibold">{selectedCpTypes.size}</span> CP Types</div>
                          <div><span className="font-semibold">{activeClusters.length}</span> Clusters</div>
                          <div><span className="font-semibold">{activeDistricts.length}</span> Districts</div>
                          <div><span className="font-semibold">{activeCities.length}</span> Cities</div>
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input type="text" className="form-control" value={plan.bundleName || ''} onChange={(e) => updateBundleData(stateId, 'bundleName', e.target.value)} placeholder="Bundle Name" />
                          ) : (
                            <span className="font-medium">{plan.bundleName || 'Not Set'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <select multiple className="form-control h-20" value={plan.panelBrands || []} onChange={(e) => updateBundleData(stateId, 'panelBrands', Array.from(e.target.selectedOptions, o => o.value))}>
                              <option value="Adani">Adani</option><option value="Tata">Tata</option><option value="Waree">Waree</option><option value="Vikram">Vikram</option><option value="Renew">Renew</option>
                            </select>
                          ) : (<span className="text-sm">{plan.panelBrands?.join(', ') || '-'}</span>)}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <select multiple className="form-control h-20" value={plan.technologyType || []} onChange={(e) => updateBundleData(stateId, 'technologyType', Array.from(e.target.selectedOptions, o => o.value))}>
                              <option value="Mono Perc">Mono Perc</option><option value="Bi Facial">Bi Facial</option><option value="Topcon">Topcon</option><option value="HJT">HJT</option>
                            </select>
                          ) : (<span className="text-sm">{plan.technologyType?.join(', ') || '-'}</span>)}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <select multiple className="form-control h-20" value={plan.wattage || []} onChange={(e) => updateBundleData(stateId, 'wattage', Array.from(e.target.selectedOptions, o => o.value))}>
                              {['330W', '400W', '450W', '500W', '550W'].map(w => <option key={w} value={w}>{w}</option>)}
                            </select>
                          ) : (<span className="text-sm">{plan.wattage?.join(', ') || '-'}</span>)}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input type="number" className="form-control w-20" value={plan.kw || ''} onChange={(e) => updateBundleData(stateId, 'kw', e.target.value)} />
                          ) : (<span>{plan.kw || '-'}</span>)}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input type="number" className="form-control w-20" value={plan.cashback || ''} onChange={(e) => updateBundleData(stateId, 'cashback', e.target.value)} />
                          ) : (<span>{plan.cashback || '-'}</span>)}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <select multiple className="form-control h-20" value={plan.timeDuration || []} onChange={(e) => updateBundleData(stateId, 'timeDuration', Array.from(e.target.selectedOptions, o => o.value))}>
                              {['30', '60', '90', '120'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          ) : (<span className="text-sm">{plan.timeDuration?.join(', ') || '-'}</span>)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button className="btn btn-sm btn-info text-white" onClick={() => openDetailsModal(stateId)}><Eye size={16} /></button>
                            {isEditing ? (
                              <>
                                <button className="btn btn-sm btn-success text-white" onClick={() => saveBundle(stateId)}><Check size={16} /></button>
                                <button className="btn btn-sm btn-secondary text-white" onClick={() => disableEditMode(stateId)}><X size={16} /></button>
                              </>
                            ) : (
                              <button className="btn btn-sm btn-primary text-white" onClick={() => enableEditMode(stateId)}><Edit size={16} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="bg-primary text-white p-4 rounded-t-md flex justify-between items-center">
              <h3 className="text-lg font-semibold">Bundle Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-white text-xl">&times;</button>
            </div>
            <div className="p-6">
              <h4 className="text-xl font-bold mb-4">{modalContent.title}</h4>
              <table className="table table-bordered w-full">
                <tbody>
                  <tr><th className="bg-gray-50 w-1/4">CP Types</th><td>{modalContent.cpTypes.join(', ')}</td></tr>
                  <tr><th className="bg-gray-50">Clusters</th><td>{modalContent.clusters.join(', ')}</td></tr>
                  <tr><th className="bg-gray-50">Districts</th><td>{modalContent.districts.join(', ')}</td></tr>
                  <tr><th className="bg-gray-50">Cities</th><td>{modalContent.cities.join(', ')}</td></tr>
                  <tr><th className="bg-gray-50">Compatible Brands</th><td>{modalContent.panelBrands.join(', ')}</td></tr>
                  <tr><th className="bg-gray-50">Technology</th><td>{modalContent.technologyType.join(', ')}</td></tr>
                  <tr><th className="bg-gray-50">Wattage</th><td>{modalContent.wattage.join(', ')}</td></tr>
                  <tr><th className="bg-gray-50">Min KW</th><td>{modalContent.kw}</td></tr>
                  <tr><th className="bg-gray-50">Cashback</th><td>{modalContent.cashback}</td></tr>
                  <tr><th className="bg-gray-50">Duration (Days)</th><td>{modalContent.timeDuration.join(', ')}</td></tr>
                </tbody>
              </table>
              <div className="mt-4 text-right">
                <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BundlePlans;