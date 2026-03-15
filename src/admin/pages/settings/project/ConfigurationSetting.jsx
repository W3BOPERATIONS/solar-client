import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Eye,
  EyeOff,
  Save,
  Plus,
  Trash2,
  Edit2,
  List,
  ArrowDown,
  GripVertical,
  X,
  Check,
  Cog,
  ChevronDown
} from 'lucide-react';
import { projectApi } from '../../../../services/project/projectApi';
import { getProjectTypes } from '../../../../services/core/masterApi';
import { getCountries, getStates, getClustersHierarchy, getDistrictsHierarchy } from '../../../../services/core/locationApi';

const ConfigurationSetting = () => {
  // State for location selection
  // State for location selection
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedClusters, setSelectedClusters] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedDiscoms, setSelectedDiscoms] = useState([]);

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [locationCardsVisible, setLocationCardsVisible] = useState(true);
  const [stateSectionVisible, setStateSectionVisible] = useState(false);
  const [clusterSectionVisible, setClusterSectionVisible] = useState(false);
  const [districtSectionVisible, setDistrictSectionVisible] = useState(false);
  const [discomSectionVisible, setDiscomSectionVisible] = useState(false);

  // State for project type
  const [selectedProjectType, setSelectedProjectType] = useState('');
  const [projectTypes, setProjectTypes] = useState([]);
  const [selectedRow, setSelectedRow] = useState('');

  // State for step configuration
  const [allSteps, setAllSteps] = useState([]);
  const [selectedSteps, setSelectedSteps] = useState([]);
  const [draggedStep, setDraggedStep] = useState(null);

  // Discoms (Static for now)
  const discoms = [
    { code: "PGVCL", name: "Paschim Gujarat Vij Company Limited" },
    { code: "UGVCL", name: "Uttar Gujarat Vij Company Limited" },
    { code: "DGVCL", name: "Dakshin Gujarat Vij Company Limited" },
    { code: "MGVCL", name: "Madhya Gujarat Vij Company Limited" }
  ];

  // Initialize data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [fetchedCountries, fetchedProjectTypes, fetchedStages] = await Promise.all([
        getCountries(),
        getProjectTypes(),
        projectApi.getJourneyStages()
      ]);

      setCountries(fetchedCountries || []);
      setProjectTypes(Array.isArray(fetchedProjectTypes) ? fetchedProjectTypes : []);
      setAllSteps(fetchedStages.map(s => s.name) || []);

      // Load saved config
      const savedConfig = await projectApi.getConfigurationByKey('projectConfiguration');
      if (savedConfig) {
        restoreConfiguration(savedConfig);
      }
    } catch (error) {
      console.error("Error loading initial data", error);
    }
  };

  const restoreConfiguration = (config) => {
    if (config.selectedSteps) {
      setSelectedSteps(config.selectedSteps);
    } else {
      setSelectedSteps([]);
    }
  };

  // Fetch config for specific type
  const fetchConfigForType = async (type) => {
    if (!type) return;
    try {
      const configKey = `projectConfig_${type.replace(/\s+/g, '_')}`;
      const config = await projectApi.getConfigurationByKey(configKey);
      if (config) {
        restoreConfiguration(config);
      } else {
        setSelectedSteps([]);
      }
    } catch (e) {
      console.error(e);
      setSelectedSteps([]);
    }
  };

  // Handle country selection
  const handleCountrySelect = async (country) => {
    const name = country.name || country;
    const countryId = country._id || country;

    let newSelected = [];
    if (selectedCountries.includes(name)) {
      newSelected = selectedCountries.filter(c => c !== name);
    } else {
      newSelected = [...selectedCountries, name];
    }

    setSelectedCountries(newSelected);
    setSelectedStates([]);
    setSelectedClusters([]);
    setSelectedDistricts([]);
    setSelectedDiscoms([]);
    
    if (newSelected.length > 0) {
      setStateSectionVisible(true);
      // Fetch states for all selected countries
      try {
        const countryIds = countries.filter(c => newSelected.includes(c.name)).map(c => c._id);
        const statesData = await Promise.all(countryIds.map(id => getStates(id)));
        setStates(statesData.flat());
      } catch (e) { console.error(e); }
    } else {
      setStateSectionVisible(false);
    }
    setClusterSectionVisible(false);
    setDistrictSectionVisible(false);
    setDiscomSectionVisible(false);
  };

  const toggleAllCountries = async () => {
    if (selectedCountries.length === countries.length) {
      setSelectedCountries([]);
      setStateSectionVisible(false);
    } else {
      const allNames = countries.map(c => c.name);
      setSelectedCountries(allNames);
      setStateSectionVisible(true);
      try {
        const statesData = await Promise.all(countries.map(c => getStates(c._id)));
        setStates(statesData.flat());
      } catch (e) { console.error(e); }
    }
  };

  // Handle state selection
  const handleStateSelect = async (state) => {
    const name = state.name || state;
    const stateId = state._id || state;

    let newSelected = [];
    if (selectedStates.includes(name)) {
      newSelected = selectedStates.filter(s => s !== name);
    } else {
      newSelected = [...selectedStates, name];
    }

    setSelectedStates(newSelected);
    setSelectedClusters([]);
    setSelectedDistricts([]);
    setSelectedDiscoms([]);

    if (newSelected.length > 0) {
      setClusterSectionVisible(true);
      try {
        const stateIds = states.filter(s => newSelected.includes(s.name)).map(s => s._id);
        const clustersData = await Promise.all(stateIds.map(id => getClustersHierarchy(id)));
        setClusters(clustersData.flat());
      } catch (e) { console.error(e); }
    } else {
      setClusterSectionVisible(false);
    }
    setDistrictSectionVisible(false);
    setDiscomSectionVisible(false);
  };

  const toggleAllStates = async () => {
    if (selectedStates.length === states.length) {
      setSelectedStates([]);
      setClusterSectionVisible(false);
    } else {
      const allNames = states.map(s => s.name);
      setSelectedStates(allNames);
      setClusterSectionVisible(true);
      try {
        const clustersData = await Promise.all(states.map(s => getClustersHierarchy(s._id)));
        setClusters(clustersData.flat());
      } catch (e) { console.error(e); }
    }
  };

  // Handle cluster selection
  const handleClusterSelect = async (cluster) => {
    const name = cluster.name || cluster;
    const clusterId = cluster._id || cluster;

    let newSelected = [];
    if (selectedClusters.includes(name)) {
      newSelected = selectedClusters.filter(c => c !== name);
    } else {
      newSelected = [...selectedClusters, name];
    }

    setSelectedClusters(newSelected);
    setSelectedDistricts([]);
    setSelectedDiscoms([]);

    if (newSelected.length > 0) {
      setDistrictSectionVisible(true);
      try {
        const clusterIds = clusters.filter(c => newSelected.includes(c.name)).map(c => c._id);
        const districtsData = await Promise.all(clusterIds.map(id => getDistrictsHierarchy(id)));
        setDistricts(districtsData.flat());
      } catch (e) { console.error(e); }
    } else {
      setDistrictSectionVisible(false);
    }
    setDiscomSectionVisible(false);
  };

  const toggleAllClusters = async () => {
    if (selectedClusters.length === clusters.length) {
      setSelectedClusters([]);
      setDistrictSectionVisible(false);
    } else {
      const allNames = clusters.map(c => c.name);
      setSelectedClusters(allNames);
      setDistrictSectionVisible(true);
      try {
        const districtsData = await Promise.all(clusters.map(c => getDistrictsHierarchy(c._id)));
        setDistricts(districtsData.flat());
      } catch (e) { console.error(e); }
    }
  };

  // Handle district selection
  const handleDistrictSelect = (district) => {
    const name = district.name || district;
    let newSelected = [];
    if (selectedDistricts.includes(name)) {
      newSelected = selectedDistricts.filter(d => d !== name);
    } else {
      newSelected = [...selectedDistricts, name];
    }
    setSelectedDistricts(newSelected);
    setDiscomSectionVisible(newSelected.length > 0);
    onLocationSelected(selectedStates, selectedClusters, newSelected);
  };

  const toggleAllDistricts = () => {
    if (selectedDistricts.length === districts.length) {
      setSelectedDistricts([]);
      setDiscomSectionVisible(false);
    } else {
      const allNames = districts.map(d => d.name);
      setSelectedDistricts(allNames);
      setDiscomSectionVisible(true);
      onLocationSelected(selectedStates, selectedClusters, allNames);
    }
  };

  // Handle DISCOM selection
  const handleDiscomSelect = (discom) => {
    if (selectedDiscoms.includes(discom)) {
      setSelectedDiscoms(selectedDiscoms.filter(d => d !== discom));
    } else {
      setSelectedDiscoms([...selectedDiscoms, discom]);
    }
  };

  const toggleAllDiscoms = () => {
    if (selectedDiscoms.length === discoms.length) {
      setSelectedDiscoms([]);
    } else {
      setSelectedDiscoms(discoms.map(d => d.code));
    }
  };

  // Toggle step selection
  const toggleStepSelection = (step) => {
    if (selectedSteps.includes(step)) {
      setSelectedSteps(selectedSteps.filter(s => s !== step));
    } else {
      setSelectedSteps([...selectedSteps, step]);
    }
  };

  // Remove step from selection
  const removeStep = (step) => {
    setSelectedSteps(selectedSteps.filter(s => s !== step));
  };

  // Add custom step
  const addCustomStep = () => {
    const stepName = prompt('Enter the name of the new step:');
    if (stepName && stepName.trim() !== '') {
      setAllSteps([...allSteps, stepName]);
    }
  };

  // Save configuration
  const saveConfiguration = async () => {
    if (!selectedProjectType) {
      alert('Please select a project type before saving');
      return;
    }

    const configuration = {
      currentCountry: selectedCountries,
      currentState: selectedStates,
      currentCluster: selectedClusters,
      currentDistrict: selectedDistricts,
      currentDiscom: selectedDiscoms,
      currentProjectType: selectedProjectType,
      selectedSteps,
      allSteps
    };

    try {
      const configKey = `projectConfig_${selectedProjectType.replace(/\s+/g, '_')}`;
      await projectApi.saveConfiguration(configKey, configuration);
      alert(`Configuration for ${selectedProjectType} saved successfully!`);
    } catch (error) {
      console.error(error);
      alert('Failed to save configuration');
    }
  };

  // Handle drag start
  const handleDragStart = (e, step) => {
    setDraggedStep(step);
    e.currentTarget.classList.add('opacity-50', 'scale-105');
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    setDraggedStep(null);
    e.currentTarget.classList.remove('opacity-50', 'scale-105');
    updateStepPriorities();
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = (e, step) => {
    e.preventDefault();
    if (!draggedStep) return;

    const newSteps = [...selectedSteps];
    const draggedIndex = newSteps.indexOf(draggedStep);
    const targetIndex = newSteps.indexOf(step);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove dragged step
      newSteps.splice(draggedIndex, 1);
      // Insert at target position
      newSteps.splice(targetIndex, 0, draggedStep);
      setSelectedSteps(newSteps);
    }
  };

  // Update step priorities based on order
  const updateStepPriorities = () => {
    // The order in the array already represents priority
    saveConfiguration();
  };

  // When location is selected
  const onLocationSelected = (state, cluster, district) => {
    console.log('Location selected:', { state, cluster, district });
    saveConfiguration();
  };

  // Handle project type change
  const handleProjectTypeChange = (type) => {
    setSelectedProjectType(type);
    fetchConfigForType(type);
  };

  // Handle row selection
  const handleRowSelect = (rowId, category, subcategory, type) => {
    setSelectedRow(rowId);
    setSelectedProjectType(type);
  };

  // Get location summary text
  const getLocationSummary = () => {
    if (selectedCountries.length === 0) return 'Not selected';

    let summary = '';
    if (selectedCountries.length === countries.length && countries.length > 1) {
      summary = 'All Countries';
    } else {
      summary = selectedCountries.join(', ');
    }

    if (selectedStates.length > 0) {
      summary += ' > ' + (selectedStates.length === states.length && states.length > 1 ? 'All States' : `${selectedStates.length} States`);
    }
    if (selectedClusters.length > 0) {
      summary += ' > ' + (selectedClusters.length === clusters.length && clusters.length > 1 ? 'All Clusters' : `${selectedClusters.length} Clusters`);
    }
    if (selectedDistricts.length > 0) {
      summary += ' > ' + (selectedDistricts.length === districts.length && districts.length > 1 ? 'All Districts' : `${selectedDistricts.length} Districts`);
    }
    if (selectedDiscoms.length > 0) {
      summary += ' > ' + (selectedDiscoms.length === discoms.length && discoms.length > 1 ? 'All DISCOMs' : `${selectedDiscoms.length} DISCOMs`);
    }
    return summary;
  };

  // Get project type label
  const getProjectTypeLabel = () => {
    const type = projectTypes.find(pt => pt.value === selectedProjectType);
    return type ? type.label : 'Not selected';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <header className="bg-blue-600 text-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
        <div className="flex items-center">
          <Cpu className="w-8 h-8 mr-4" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1">Project Management Configuration</h1>
            <p className="text-blue-100 text-sm md:text-base">Configure project settings, types, and workflow steps</p>
          </div>
        </div>
      </header>

      {/* Location Toggle Header */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Project Configuration</h2>
            <button
              onClick={() => setLocationCardsVisible(!locationCardsVisible)}
              className="flex items-center px-4 py-2 text-sm border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {locationCardsVisible ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Location Cards
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show Location Cards
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Location Selection Section */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${locationCardsVisible ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        {/* Country Selection */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">Select Country</h3>
            <button
              onClick={toggleAllCountries}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              {selectedCountries.length === countries.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {countries.map((country) => {
                const name = country.name || country;
                return (
                  <div
                    key={country._id || country}
                    onClick={() => handleCountrySelect(country)}
                    className={`bg-white border rounded-xl p-4 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedCountries.includes(name)
                      ? 'border-blue-500 border-2 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    <h4 className={`font-bold ${selectedCountries.includes(name) ? 'text-blue-700' : 'text-gray-800'}`}>{name}</h4>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* State Selection */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${stateSectionVisible ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Select State</h3>
              <button
                onClick={toggleAllStates}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {selectedStates.length === states.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {states.map((state) => {
                  const name = state.name || state;
                  return (
                    <div
                      key={state._id || state}
                      onClick={() => handleStateSelect(state)}
                      className={`bg-white border rounded-xl p-4 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedStates.includes(name)
                        ? 'border-blue-500 border-2 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                      <h4 className={`font-bold ${selectedStates.includes(name) ? 'text-blue-700' : 'text-gray-800'}`}>{name}</h4>
                      <p className="text-gray-500 text-sm mt-1">
                        {selectedCountries.length > 2 ? `${selectedCountries.length} Countries` : selectedCountries.join(', ')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Cluster Selection */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${clusterSectionVisible ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Select Cluster</h3>
              <button
                onClick={toggleAllClusters}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {selectedClusters.length === clusters.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {clusters.map((cluster) => {
                  const name = cluster.name || cluster;
                  return (
                    <div
                      key={cluster._id || cluster}
                      onClick={() => handleClusterSelect(cluster)}
                      className={`bg-white border rounded-xl p-4 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedClusters.includes(name)
                        ? 'border-blue-500 border-2 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                      <h4 className={`font-bold ${selectedClusters.includes(name) ? 'text-blue-700' : 'text-gray-800'}`}>{name}</h4>
                      <p className="text-gray-500 text-sm mt-1">
                        {selectedStates.length > 2 ? `${selectedStates.length} States` : selectedStates.join(', ')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* District Selection */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${districtSectionVisible ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Select District</h3>
              <button
                onClick={toggleAllDistricts}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {selectedDistricts.length === districts.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {districts.map((district) => {
                  const name = district.name || district;
                  return (
                    <div
                      key={district._id || district}
                      onClick={() => handleDistrictSelect(district)}
                      className={`bg-white border rounded-xl p-4 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedDistricts.includes(name)
                        ? 'border-blue-500 border-2 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                      <h4 className={`font-bold ${selectedDistricts.includes(name) ? 'text-blue-700' : 'text-gray-800'}`}>{name}</h4>
                      <p className="text-gray-500 text-sm mt-1">
                        {selectedClusters.length > 2 ? `${selectedClusters.length} Clusters` : selectedClusters.join(', ')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* DISCOM Selection */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${discomSectionVisible ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Select DISCOM</h3>
              <button
                onClick={toggleAllDiscoms}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {selectedDiscoms.length === discoms.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {discoms.map((discom) => (
                  <div
                    key={discom.code}
                    onClick={() => handleDiscomSelect(discom.code)}
                    className={`bg-white border rounded-xl p-4 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedDiscoms.includes(discom.code)
                      ? 'border-blue-500 border-2 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    <h4 className={`font-bold ${selectedDiscoms.includes(discom.code) ? 'text-blue-700' : 'text-gray-800'}`}>{discom.code}</h4>
                    <p className="text-gray-500 text-sm mt-1">{discom.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Type Configuration */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Project Type Configuration</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Category</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Subcategory</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Project Type</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Sub Project Type</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projectTypes.map((row) => (
                <tr
                  key={row._id}
                  className={`border-b hover:bg-gray-50 transition-colors ${selectedRow === row._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                >
                  <td className="p-4">{row.category || '-'}</td>
                  <td className="p-4">{row.subCategory || '-'}</td>
                  <td className="p-4">{row.projectType}</td>
                  <td className="p-4">{row.subProjectType || '-'}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {row.status || 'Active'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRowSelect(row._id, row.category, row.subCategory, row.projectType)}
                        className="px-3 py-1 text-sm border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors">
                        <Edit2 className="w-4 h-4 inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleRowSelect(row._id, row.category, row.subCategory, row.projectType)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors flex items-center ${selectedRow === row._id
                          ? 'bg-green-500 text-white'
                          : 'border border-yellow-500 text-yellow-500 hover:bg-yellow-50'
                          }`}
                      >
                        {selectedRow === row._id ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Selected
                          </>
                        ) : (
                          'Select'
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step Configuration */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Project Step Configuration</h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {getProjectTypeLabel()}
          </span>
        </div>
        <div className="p-4 md:p-6">
          {/* Project Type Selection */}
          <div className="mb-6">
            <label htmlFor="project-type" className="block text-sm font-medium text-gray-700 mb-2">
              Select Project Type
            </label>
            <select
              id="project-type"
              value={selectedProjectType}
              onChange={(e) => handleProjectTypeChange(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select Project Type --</option>
              {projectTypes.map((type) => (
                <option key={type._id} value={type.projectType || type.name}>
                  {/* Adjust display logic based on actual API data structure */}
                  {type.projectType || type.name} {type.subProjectType ? `- ${type.subProjectType}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Available Steps */}
          <h4 className="text-md font-semibold mb-3">Available Project Steps</h4>
          <p className="text-gray-500 text-sm mb-4">
            Click on steps to select them for the current project type.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {allSteps.map((step, index) => (
              <div
                key={step}
                onClick={() => toggleStepSelection(step)}
                className={`bg-white border rounded-xl p-4 cursor-pointer transition-all duration-300 ${selectedSteps.includes(step)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-3">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-800">{step}</h5>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStepSelection(step);
                    }}
                    className={`p-2 rounded-lg ${selectedSteps.includes(step)
                      ? 'text-red-500 hover:bg-red-50'
                      : 'text-blue-500 hover:bg-blue-50'
                      }`}
                  >
                    {selectedSteps.includes(step) ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Step Flow Indicator */}
          <div className="flex items-center justify-center my-6">
            <ChevronDown className="w-4 h-4 text-blue-500 mx-2" />
            <span className="text-gray-500 text-sm">Drag steps below to change priority</span>
            <ChevronDown className="w-4 h-4 text-blue-500 mx-2" />
          </div>

          {/* Selected Steps */}
          <h4 className="text-md font-semibold mb-3">Selected Steps for this Project Type</h4>
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 md:p-6 min-h-[200px]">
            {selectedSteps.length === 0 ? (
              <div className="text-center py-10">
                <List className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h5 className="text-lg font-medium text-gray-500 mb-2">No Steps Selected</h5>
                <p className="text-gray-400">Select steps from above to build your project workflow</p>
              </div>
            ) : (
              selectedSteps.map((step, index) => (
                <div
                  key={step}
                  draggable
                  onDragStart={(e) => handleDragStart(e, step)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, step)}
                  className="bg-white border border-gray-200 rounded-lg p-3 mb-3 flex items-center transition-all duration-300 hover:border-blue-300 hover:shadow-sm"
                >
                  <div className="cursor-grab mr-3 text-gray-400">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-blue-600 w-8">{index + 1}</div>
                  <div className="flex-1">
                    <h6 className="font-medium text-gray-800">{step}</h6>
                  </div>
                  <button
                    onClick={() => removeStep(step)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={addCustomStep}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Step
            </button>
            <button
              onClick={saveConfiguration}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Configuration Summary</h2>
        </div>
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between py-3 border-b">
                <span className="font-semibold">Selected Location:</span>
                <span>{getLocationSummary()}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="font-semibold">Selected Project Type:</span>
                <span>{getProjectTypeLabel()}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between py-3 border-b">
                <span className="font-semibold">Total Selected Steps:</span>
                <span>{selectedSteps.length}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="font-semibold">Status:</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Active
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="font-semibold mb-2">Selected Steps:</div>
            <div className="text-gray-500">
              {selectedSteps.length > 0 ? selectedSteps.join(', ') : 'None'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationSetting;