import React, { useState, useEffect } from 'react';
import {
  Eye, Edit, Save, X,
  CheckSquare, XCircle,
  Download, Filter
} from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import { locationAPI } from '../../../../api/api';
import toast from 'react-hot-toast';

const CustomizeCombokit = () => {
  const { countries, states: allStates, fetchCountries, fetchStates } = useLocations();

  // Default options
  const panelOptions = ['Adani', 'Waree', 'Tata'];
  const inverterOptions = ['Sungrow', 'ABB', 'Fronius'];
  const boskitOptions = ['Boskit A', 'Boskit B', 'Boskit C'];

  // State management
  const [selectedStates, setSelectedStates] = useState(new Set());
  const [selectedClusters, setSelectedClusters] = useState(new Set());
  const [selectedDistricts, setSelectedDistricts] = useState(new Set());

  // Data Cache (ID -> Data)
  const [availableClusters, setAvailableClusters] = useState({}); // stateId -> [clusters]
  const [availableDistricts, setAvailableDistricts] = useState({}); // clusterId -> [districts]

  const [combokitData, setCombokitData] = useState({});
  const [editMode, setEditMode] = useState({});
  const [modalContent, setModalContent] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view', 'cluster', 'district'

  // Initial Data
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch States for India (default)
  useEffect(() => {
    if (countries.length > 0) {
      const india = countries.find(c => c.name === 'India');
      if (india) fetchStates({ country: india._id });
      else fetchStates({ country: countries[0]._id });
    }
  }, [countries]);

  // Initialize combokit data for states when states are loaded
  useEffect(() => {
    if (allStates.length > 0) {
      const initialData = {};
      allStates.forEach(state => {
        initialData[state._id] = {
          solarkitName: "Solarkit Name",
          panel: [],
          inverter: [],
          boskit: [],
          category: "Rooftop Solar",
          subCategory: "Residential",
          projectType: "1KW - 10KW",
          subProjectType: "On-grid"
        };
      });
      setCombokitData(prev => ({ ...prev, ...initialData }));
    }
  }, [allStates]);

  // Handle state selection
  const handleStateClick = async (stateId) => {
    const newSelectedStates = new Set(selectedStates);
    if (newSelectedStates.has(stateId)) {
      newSelectedStates.delete(stateId);
      // Logic to remove dependent clusters? 
      // For now, we just keep the cache `availableClusters` but update logic will filter dependent selections if needed.
    } else {
      newSelectedStates.add(stateId);
      // Fetch clusters for this state if not available
      if (!availableClusters[stateId]) {
        try {
          const res = await locationAPI.getAllClusters({ state: stateId, isActive: 'true' });
          if (res.data && res.data.data) {
            setAvailableClusters(prev => ({ ...prev, [stateId]: res.data.data }));
          }
        } catch (error) {
          console.error("Failed to fetch clusters", error);
          toast.error("Failed to fetch clusters");
        }
      }
    }
    setSelectedStates(newSelectedStates);
  };

  const selectAllStates = async () => {
    const allIds = allStates.map(s => s._id);
    setSelectedStates(new Set(allIds));

    // Fetch clusters for all states that don't have them
    for (const stateId of allIds) {
      if (!availableClusters[stateId]) {
        try {
          const res = await locationAPI.getAllClusters({ state: stateId, isActive: 'true' });
          if (res.data && res.data.data) {
            setAvailableClusters(prev => ({ ...prev, [stateId]: res.data.data }));
          }
        } catch (error) {
          console.error("Failed to fetch clusters", error);
        }
      }
    }
  };

  const clearAllStates = () => {
    setSelectedStates(new Set());
    setSelectedClusters(new Set());
    setSelectedDistricts(new Set());
  };

  // Get displayed clusters based on selected states
  const getDisplayedClusters = () => {
    let clusters = [];
    selectedStates.forEach(stateId => {
      if (availableClusters[stateId]) {
        clusters = [...clusters, ...availableClusters[stateId]];
      }
    });
    return clusters;
  };

  // Handle cluster selection
  const handleClusterClick = async (clusterId) => {
    const newSelectedClusters = new Set(selectedClusters);
    if (newSelectedClusters.has(clusterId)) {
      newSelectedClusters.delete(clusterId);
    } else {
      newSelectedClusters.add(clusterId);
      // Fetch districts
      if (!availableDistricts[clusterId]) {
        try {
          const res = await locationAPI.getAllDistricts({ cluster: clusterId, isActive: 'true' });
          if (res.data && res.data.data) {
            setAvailableDistricts(prev => ({ ...prev, [clusterId]: res.data.data }));
          }
        } catch (error) {
          console.error("Failed to fetch districts", error);
          toast.error("Failed to fetch districts");
        }
      }
    }
    setSelectedClusters(newSelectedClusters);
  };

  const selectAllClusters = async () => {
    const displayedClusters = getDisplayedClusters();
    const allIds = displayedClusters.map(c => c._id);
    setSelectedClusters(new Set(allIds));

    // Fetch districts
    for (const clusterId of allIds) {
      if (!availableDistricts[clusterId]) {
        try {
          const res = await locationAPI.getAllDistricts({ cluster: clusterId, isActive: 'true' });
          if (res.data && res.data.data) {
            setAvailableDistricts(prev => ({ ...prev, [clusterId]: res.data.data }));
          }
        } catch (error) {
          console.error("Error fetching districts", error);
        }
      }
    }
  };

  const clearAllClusters = () => {
    setSelectedClusters(new Set());
    setSelectedDistricts(new Set());
  };

  // Get displayed districts based on selected clusters
  const getDisplayedDistricts = () => {
    let districts = [];
    selectedClusters.forEach(clusterId => {
      if (availableDistricts[clusterId]) {
        districts = [...districts, ...availableDistricts[clusterId]];
      }
    });
    return districts;
  };

  // Handle district selection
  const handleDistrictClick = (districtId) => {
    const newSelectedDistricts = new Set(selectedDistricts);
    if (newSelectedDistricts.has(districtId)) {
      newSelectedDistricts.delete(districtId);
    } else {
      newSelectedDistricts.add(districtId);
    }
    setSelectedDistricts(newSelectedDistricts);
  };

  const selectAllDistricts = () => {
    const displayedDistricts = getDisplayedDistricts();
    const allIds = displayedDistricts.map(d => d._id);
    setSelectedDistricts(new Set(allIds));
  };

  const clearAllDistricts = () => {
    setSelectedDistricts(new Set());
  };

  // Helpers to get counts
  const getSelectedClustersForStateCount = (stateId) => {
    if (!availableClusters[stateId]) return 0;
    return availableClusters[stateId].filter(c => selectedClusters.has(c._id)).length;
  };

  const getSelectedDistrictsForStateCount = (stateId) => {
    if (!availableClusters[stateId]) return 0;
    // Clusters in this state that are selected
    const selectedClustersInState = availableClusters[stateId].filter(c => selectedClusters.has(c._id));
    let count = 0;
    selectedClustersInState.forEach(c => {
      if (availableDistricts[c._id]) {
        count += availableDistricts[c._id].filter(d => selectedDistricts.has(d._id)).length;
      }
    });
    return count;
  };

  // Handle edit mode
  const handleEditClick = (stateId) => {
    setEditMode(prev => ({ ...prev, [stateId]: true }));
  };

  const handleSaveClick = (stateId) => {
    setEditMode(prev => ({ ...prev, [stateId]: false }));
  };

  const handleCancelClick = (stateId) => {
    setEditMode(prev => ({ ...prev, [stateId]: false }));
  };

  // Handle dropdown changes
  const handlePanelChange = (stateId, selectedOptions) => {
    setCombokitData(prev => ({
      ...prev,
      [stateId]: {
        ...prev[stateId],
        panel: selectedOptions
      }
    }));
  };

  const handleInverterChange = (stateId, selectedOptions) => {
    setCombokitData(prev => ({
      ...prev,
      [stateId]: {
        ...prev[stateId],
        inverter: selectedOptions
      }
    }));
  };

  const handleBoskitChange = (stateId, selectedOptions) => {
    setCombokitData(prev => ({
      ...prev,
      [stateId]: {
        ...prev[stateId],
        boskit: selectedOptions
      }
    }));
  };

  // Modal handlers
  const showCombokitDetails = (stateId) => {
    const state = allStates.find(s => s._id === stateId);
    const data = combokitData[stateId] || {};

    // Get clusters names
    const clusterNames = [];
    if (availableClusters[stateId]) {
      availableClusters[stateId].forEach(c => {
        if (selectedClusters.has(c._id)) clusterNames.push(c.name);
      });
    }

    // Get district names
    const districtNames = [];
    if (availableClusters[stateId]) {
      availableClusters[stateId].forEach(c => {
        if (selectedClusters.has(c._id) && availableDistricts[c._id]) {
          availableDistricts[c._id].forEach(d => {
            if (selectedDistricts.has(d._id)) districtNames.push(d.name);
          });
        }
      });
    }

    setModalContent({
      title: "Combokit Details",
      content: (
        <div>
          <h4 className="text-lg font-semibold mb-4">{state?.name} Combokit Details</h4>
          <table className="min-w-full divide-y divide-gray-200 mt-3">
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Solarkit Name:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{data.solarkitName}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Panel:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {data.panel?.length ? data.panel.join(", ") : "Not Selected"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Inverter:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {data.inverter?.length ? data.inverter.join(", ") : "Not Selected"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Boskit:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {data.boskit?.length ? data.boskit.join(", ") : "Not Selected"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">State:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{state?.name}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Clusters:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{clusterNames.join(', ') || 'None'}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Districts:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{districtNames.join(', ') || 'None'}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Category:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{data.category}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Sub Category:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{data.subCategory}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Project Type:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{data.projectType}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Sub Project Type:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{data.subProjectType}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    });
    setModalType('view');
  };

  const showClusterDetails = (stateId) => {
    const state = allStates.find(s => s._id === stateId);
    let clusters = [];
    if (availableClusters[stateId]) {
      clusters = availableClusters[stateId].filter(c => selectedClusters.has(c._id));
    }

    setModalContent({
      title: "Cluster Details",
      content: (
        <div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cluster Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clusters.map((cluster, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{cluster.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{state?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm"><strong>Total:</strong> {clusters.length} cluster{clusters.length !== 1 ? 's' : ''}</p>
        </div>
      )
    });
    setModalType('cluster');
  };

  const showDistrictDetails = (stateId) => {
    const state = allStates.find(s => s._id === stateId);
    let districts = [];
    if (availableClusters[stateId]) {
      availableClusters[stateId].forEach(c => {
        if (selectedClusters.has(c._id) && availableDistricts[c._id]) {
          const ds = availableDistricts[c._id].filter(d => selectedDistricts.has(d._id));
          districts = [...districts, ...ds];
        }
      });
    }

    setModalContent({
      title: "District Details",
      content: (
        <div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {districts.map((district, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{district.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{state?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm"><strong>Total:</strong> {districts.length} district{districts.length !== 1 ? 's' : ''}</p>
        </div>
      )
    });
    setModalType('district');
  };

  const closeModal = () => {
    setModalContent(null);
    setModalType(null);
  };

  // Check if result table should be shown
  const shouldShowResultTable = () => {
    return selectedStates.size > 0 && selectedClusters.size > 0 && selectedDistricts.size > 0;
  };

  // Get modal header color based on type
  const getModalHeaderColor = () => {
    switch (modalType) {
      case 'view': return 'bg-blue-600';
      case 'cluster': return 'bg-cyan-600';
      case 'district': return 'bg-green-600';
      default: return 'bg-blue-600';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header Card */}
      <div className="card mb-6 shadow-lg rounded-lg bg-white">
        <div className="card-header px-6 py-4 bg-white border-b border-gray-200">
          <h2 className="text-2xl font-bold text-blue-600 mb-0">Customize Combokit</h2>
        </div>
      </div>

      {/* State Selection */}
      <div className="card mb-6 shadow-lg rounded-lg bg-white">
        <div className="card-body p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pl-3 border-l-4 border-blue-600">Select States</h3>

          <div className="mb-4">
            <button
              onClick={selectAllStates}
              className="btn btn-sm btn-outline-primary mr-2 px-3 py-1.5 text-sm rounded border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <CheckSquare className="inline-block w-4 h-4 mr-1" />
              Select All States
            </button>
            <button
              onClick={clearAllStates}
              className="btn btn-sm btn-outline-secondary px-3 py-1.5 text-sm rounded border border-gray-400 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <XCircle className="inline-block w-4 h-4 mr-1" />
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {allStates.map(state => (
              <div
                key={state._id}
                onClick={() => handleStateClick(state._id)}
                className={`card border rounded-lg p-4 text-center cursor-pointer transition-transform duration-200 hover:scale-105 ${selectedStates.has(state._id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-blue-400 hover:border-blue-600'
                  }`}
              >
                <p className="font-medium">{state.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cluster Selection */}
      {selectedStates.size > 0 && (
        <div className="card mb-6 shadow-lg rounded-lg bg-white">
          <div className="card-body p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pl-3 border-l-4 border-blue-600">Select Clusters</h3>

            <div className="mb-4">
              <button
                onClick={selectAllClusters}
                className="btn btn-sm btn-outline-primary mr-2 px-3 py-1.5 text-sm rounded border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <CheckSquare className="inline-block w-4 h-4 mr-1" />
                Select All Clusters
              </button>
              <button
                onClick={clearAllClusters}
                className="btn btn-sm btn-outline-secondary px-3 py-1.5 text-sm rounded border border-gray-400 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <XCircle className="inline-block w-4 h-4 mr-1" />
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getDisplayedClusters().map(cluster => (
                <div
                  key={cluster._id}
                  onClick={() => handleClusterClick(cluster._id)}
                  className={`card border rounded-lg p-4 text-center cursor-pointer transition-transform duration-200 hover:scale-105 ${selectedClusters.has(cluster._id)
                      ? 'bg-purple-700 text-white border-purple-700'
                      : 'border-gray-300 hover:border-purple-500'
                    }`}
                >
                  {cluster.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* District Selection */}
      {selectedClusters.size > 0 && (
        <div className="card mb-6 shadow-lg rounded-lg bg-white">
          <div className="card-body p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pl-3 border-l-4 border-blue-600">Select Districts</h3>

            <div className="mb-4">
              <button
                onClick={selectAllDistricts}
                className="btn btn-sm btn-outline-primary mr-2 px-3 py-1.5 text-sm rounded border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <CheckSquare className="inline-block w-4 h-4 mr-1" />
                Select All Districts
              </button>
              <button
                onClick={clearAllDistricts}
                className="btn btn-sm btn-outline-secondary px-3 py-1.5 text-sm rounded border border-gray-400 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <XCircle className="inline-block w-4 h-4 mr-1" />
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getDisplayedDistricts().map(district => (
                <div
                  key={district._id}
                  onClick={() => handleDistrictClick(district._id)}
                  className={`card border rounded-lg p-4 text-center cursor-pointer transition-transform duration-200 hover:scale-105 ${selectedDistricts.has(district._id)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-gray-300 hover:border-green-500'
                    }`}
                >
                  {district.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Result Table */}
      {shouldShowResultTable() && (
        <div className="mt-6">
          <div className="card shadow-lg rounded-lg bg-white">
            <div className="card-body p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pl-3 border-l-4 border-blue-600">Customize Combokit Details</h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Solarkit Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Panel</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Inverter</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Boskit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">State</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Clusters</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Districts</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sub Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Project Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sub Project Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from(selectedStates).map(stateId => {
                      const state = allStates.find(s => s._id === stateId);
                      const data = combokitData[stateId] || {};
                      const isEditing = editMode[stateId];
                      const clusterCount = getSelectedClustersForStateCount(stateId);
                      const districtCount = getSelectedDistrictsForStateCount(stateId);

                      if (clusterCount === 0 || districtCount === 0) return null;

                      return (
                        <tr key={stateId}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{data.solarkitName}</td>

                          {/* Panel Column */}
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {!isEditing ? (
                              <div className="view-mode bg-gray-50 p-2 rounded">
                                {data.panel?.length ? data.panel.join(", ") : "Not Selected"}
                              </div>
                            ) : (
                              <div className="edit-mode border border-gray-300 p-2 rounded">
                                <select
                                  multiple
                                  className="w-full border rounded p-1"
                                  value={data.panel || []}
                                  onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                    handlePanelChange(stateId, selected);
                                  }}
                                >
                                  {panelOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                              </div>
                            )}
                          </td>

                          {/* Inverter Column */}
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {!isEditing ? (
                              <div className="view-mode bg-gray-50 p-2 rounded">
                                {data.inverter?.length ? data.inverter.join(", ") : "Not Selected"}
                              </div>
                            ) : (
                              <div className="edit-mode border border-gray-300 p-2 rounded">
                                <select
                                  multiple
                                  className="w-full border rounded p-1"
                                  value={data.inverter || []}
                                  onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                    handleInverterChange(stateId, selected);
                                  }}
                                >
                                  {inverterOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                              </div>
                            )}
                          </td>

                          {/* Boskit Column */}
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {!isEditing ? (
                              <div className="view-mode bg-gray-50 p-2 rounded">
                                {data.boskit?.length ? data.boskit.join(", ") : "Not Selected"}
                              </div>
                            ) : (
                              <div className="edit-mode border border-gray-300 p-2 rounded">
                                <select
                                  multiple
                                  className="w-full border rounded p-1"
                                  value={data.boskit || []}
                                  onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                    handleBoskitChange(stateId, selected);
                                  }}
                                >
                                  {boskitOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{state?.name}</td>

                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <span
                              onClick={() => showClusterDetails(stateId)}
                              className="count-badge cursor-pointer text-blue-600 font-semibold underline"
                            >
                              {clusterCount} cluster{clusterCount !== 1 ? 's' : ''}
                            </span>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <span
                              onClick={() => showDistrictDetails(stateId)}
                              className="count-badge cursor-pointer text-blue-600 font-semibold underline"
                            >
                              {districtCount} district{districtCount !== 1 ? 's' : ''}
                            </span>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{data.category}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{data.subCategory}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{data.projectType}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{data.subProjectType}</td>

                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-2">
                              {!isEditing && (
                                <>
                                  <button
                                    onClick={() => showCombokitDetails(stateId)}
                                    className="btn btn-sm btn-info p-1.5 rounded bg-gray-600 text-white hover:bg-gray-700"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEditClick(stateId)}
                                    className="btn btn-sm btn-primary p-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                                    title="Edit"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {isEditing && (
                                <>
                                  <button
                                    onClick={() => handleSaveClick(stateId)}
                                    className="btn btn-sm btn-success p-1.5 rounded bg-green-600 text-white hover:bg-green-700"
                                    title="Save"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelClick(stateId)}
                                    className="btn btn-sm btn-secondary p-1.5 rounded bg-gray-500 text-white hover:bg-gray-600"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
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
        </div>
      )}

      {/* Modal */}
      {modalContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className={`modal-header px-6 py-4 text-white ${getModalHeaderColor()}`}>
              <h3 className="text-lg font-semibold">{modalContent.title}</h3>
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-white hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body p-6 overflow-y-auto">
              {modalContent.content}
            </div>
            <div className="modal-footer px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="btn btn-secondary px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
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

export default CustomizeCombokit;