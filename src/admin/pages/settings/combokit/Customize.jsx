import React, { useState, useEffect } from 'react';
import {
  Eye, Edit, Save, X,
  CheckSquare, XCircle,
  Download, Filter
} from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import { locationAPI } from '../../../../api/api';
import { getAssignments, updateAssignment } from '../../../../services/combokit/combokitApi';
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

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
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

  // Fetch Assignments
  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await getAssignments();
      setAssignments(res || []);
    } catch (error) {
      console.error("Failed to fetch assignments", error);
      toast.error("Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

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



  // Handle edit mode
  const handleEditClick = (assignmentId) => {
    setEditMode(prev => ({ ...prev, [assignmentId]: true }));
  };

  const handleSaveClick = async (assignmentId) => {
    try {
      const assignment = assignments.find(a => a._id === assignmentId);
      if (!assignment) return;

      const payload = {
        panels: assignment.panels,
        inverters: assignment.inverters,
        boskits: assignment.boskits
      };

      await updateAssignment(assignmentId, payload);
      toast.success("Details updated successfully");
      setEditMode(prev => ({ ...prev, [assignmentId]: false }));
    } catch (error) {
      console.error("Failed to update assignment", error);
      toast.error("Failed to update details");
    }
  };

  const handleCancelClick = (assignmentId) => {
    setEditMode(prev => ({ ...prev, [assignmentId]: false }));
    // Optionally revert changes by re-fetching or keeping a backup
    fetchAssignments();
  };

  // Handle dropdown changes
  const handlePanelChange = (assignmentId, selectedOptions) => {
    setAssignments(prev => prev.map(a =>
      a._id === assignmentId ? { ...a, panels: selectedOptions } : a
    ));
  };

  const handleInverterChange = (assignmentId, selectedOptions) => {
    setAssignments(prev => prev.map(a =>
      a._id === assignmentId ? { ...a, inverters: selectedOptions } : a
    ));
  };

  const handleBoskitChange = (assignmentId, selectedOptions) => {
    setAssignments(prev => prev.map(a =>
      a._id === assignmentId ? { ...a, boskits: selectedOptions } : a
    ));
  };

  // Modal handlers
  const showCombokitDetails = (assignment) => {
    const data = assignment;
    const stateName = assignment.state?.name || "Unknown State";
    const clusterName = assignment.cluster?.name || "Unknown Cluster";
    const districtNames = assignment.districts?.map(d => d.name).join(", ") || "None";

    setModalContent({
      title: "Combokit Details",
      content: (
        <div>
          <h4 className="text-lg font-semibold mb-4">{stateName} Combokit Details</h4>
          <table className="min-w-full divide-y divide-gray-200 mt-3">
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Solarkit Name:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{data.solarkitName}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Panel:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {data.panels?.length ? data.panels.join(", ") : "Not Selected"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Inverter:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {data.inverters?.length ? data.inverters.join(", ") : "Not Selected"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Boskit:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {data.boskits?.length ? data.boskits.join(", ") : "Not Selected"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">State:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{stateName}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Clusters:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{clusterName}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Districts:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{districtNames}</td>
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

  const closeModal = () => {
    setModalContent(null);
    setModalType(null);
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
      <div className="mt-6">
        <div className="card shadow-lg rounded-lg bg-white">
          <div className="card-body p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pl-3 border-l-4 border-blue-600">Customize Combokit Details</h3>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-4">Loading assignments...</div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-4">No assignments found.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Solarkit Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Panel</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Inverter</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Boskit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">State</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Cluster</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Districts</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sub Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Project Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sub Project Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments
                      .filter(assignment => {
                        // Filter Logic
                        if (selectedStates.size > 0 && !selectedStates.has(assignment.state?._id)) return false;
                        if (selectedClusters.size > 0 && !selectedClusters.has(assignment.cluster?._id)) return false;
                        // For districts, check if any of the assignment's districts are selected
                        if (selectedDistricts.size > 0) {
                          const hasSelectedDistrict = assignment.districts?.some(d => selectedDistricts.has(d._id));
                          if (!hasSelectedDistrict) return false;
                        }
                        return true;
                      })
                      .map(assignment => {
                        const isEditing = editMode[assignment._id];
                        const districtNames = assignment.districts?.map(d => d.name).join(", ") || "None";
                        // Truncate district names if too long
                        const districtsDisplay = districtNames.length > 50 ? districtNames.substring(0, 50) + "..." : districtNames;

                        return (
                          <tr key={assignment._id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{assignment.solarkitName}</td>

                            {/* Panel Column */}
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {!isEditing ? (
                                <div className="view-mode bg-gray-50 p-2 rounded">
                                  {assignment.panels?.length ? assignment.panels.join(", ") : "Not Selected"}
                                </div>
                              ) : (
                                <div className="edit-mode border border-gray-300 p-2 rounded">
                                  <select
                                    multiple
                                    className="w-full border rounded p-1"
                                    value={assignment.panels || []}
                                    onChange={(e) => {
                                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                                      handlePanelChange(assignment._id, selected);
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
                                  {assignment.inverters?.length ? assignment.inverters.join(", ") : "Not Selected"}
                                </div>
                              ) : (
                                <div className="edit-mode border border-gray-300 p-2 rounded">
                                  <select
                                    multiple
                                    className="w-full border rounded p-1"
                                    value={assignment.inverters || []}
                                    onChange={(e) => {
                                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                                      handleInverterChange(assignment._id, selected);
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
                                  {assignment.boskits?.length ? assignment.boskits.join(", ") : "Not Selected"}
                                </div>
                              ) : (
                                <div className="edit-mode border border-gray-300 p-2 rounded">
                                  <select
                                    multiple
                                    className="w-full border rounded p-1"
                                    value={assignment.boskits || []}
                                    onChange={(e) => {
                                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                                      handleBoskitChange(assignment._id, selected);
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

                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{assignment.state?.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{assignment.cluster?.name}</td>

                            <td className="px-4 py-3 text-sm text-gray-900">
                              <span title={districtNames}>{districtsDisplay}</span>
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{assignment.category}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{assignment.subCategory}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{assignment.projectType}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{assignment.subProjectType}</td>

                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex space-x-2">
                                {!isEditing && (
                                  <>
                                    <button
                                      onClick={() => showCombokitDetails(assignment)}
                                      className="btn btn-sm btn-info p-1.5 rounded bg-gray-600 text-white hover:bg-gray-700"
                                      title="View Details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleEditClick(assignment._id)}
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
                                      onClick={() => handleSaveClick(assignment._id)}
                                      className="btn btn-sm btn-success p-1.5 rounded bg-green-600 text-white hover:bg-green-700"
                                      title="Save"
                                    >
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleCancelClick(assignment._id)}
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
              )}
            </div>
          </div>
        </div>
      </div>

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