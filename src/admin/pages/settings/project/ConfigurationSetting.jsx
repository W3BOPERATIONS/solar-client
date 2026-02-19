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
import { getProjectTypes } from '../../../../services/masterApi';
import { getStates, getCities, getDistricts } from '../../../../services/locationApi';

const ConfigurationSetting = () => {
  // State for location selection
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState(''); // Was selectedCluster
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedDiscom, setSelectedDiscom] = useState('');

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [locationCardsVisible, setLocationCardsVisible] = useState(true);
  const [citySectionVisible, setCitySectionVisible] = useState(false); // Was clusterSectionVisible
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
      const [fetchedStates, fetchedProjectTypes, fetchedStages] = await Promise.all([
        getStates(),
        getProjectTypes(),
        projectApi.getJourneyStages()
      ]);

      setStates(fetchedStates || []);
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

  const restoreConfiguration = async (config) => {
    setSelectedState(config.currentState || '');
    setSelectedCity(config.currentCity || '');
    setSelectedDistrict(config.currentDistrict || '');
    setSelectedDiscom(config.currentDiscom || '');
    setSelectedProjectType(config.currentProjectType || '');

    if (config.selectedSteps) {
      setSelectedSteps(config.selectedSteps);
    }

    // Trigger cascade fetches if values exist
    if (config.currentState) {
      try {
        // Find state object to get ID
        const allStates = await getStates();
        const stateObj = allStates.find(s => s.name === config.currentState || s._id === config.currentState);

        if (stateObj) {
          const fetchedCities = await getCities(stateObj._id);
          setCities(fetchedCities);
          setCitySectionVisible(true);

          if (config.currentCity) {
            const cityObj = fetchedCities.find(c => c.name === config.currentCity || c._id === config.currentCity);
            if (cityObj) {
              const fetchedDistricts = await getDistricts(cityObj._id);
              setDistricts(fetchedDistricts);
              setDistrictSectionVisible(true);
            }
          }
        }
      } catch (e) { console.error(e); }
    }
  };

  // Handle state selection
  const handleStateSelect = async (state) => {
    // state is likely the state object or ID now
    const stateId = state._id || state;
    setSelectedState(state.name || state);
    setSelectedCity('');
    setSelectedDistrict('');
    setSelectedDiscom('');
    setCitySectionVisible(true);
    setDistrictSectionVisible(false);
    setDiscomSectionVisible(false);

    try {
      const fetchedCities = await getCities(stateId);
      setCities(fetchedCities);
    } catch (e) { console.error(e); }
  };

  // Handle city selection (formerly cluster)
  const handleCitySelect = async (city) => {
    const cityId = city._id || city;
    setSelectedCity(city.name || city);
    setSelectedDistrict('');
    setSelectedDiscom('');
    setDistrictSectionVisible(true);
    setDiscomSectionVisible(false);

    try {
      const fetchedDistricts = await getDistricts(cityId);
      setDistricts(fetchedDistricts);
    } catch (e) { console.error(e); }
  };

  // Handle district selection
  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district.name || district);
    setDiscomSectionVisible(true);
    onLocationSelected(selectedState, selectedCity, district.name || district);
  };

  // Handle DISCOM selection
  const handleDiscomSelect = (discom) => {
    setSelectedDiscom(discom);
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
    const configuration = {
      currentState: selectedState,
      currentCity: selectedCity,
      currentDistrict: selectedDistrict,
      currentDiscom: selectedDiscom,
      currentProjectType: selectedProjectType,
      selectedSteps,
      allSteps
    };

    try {
      await projectApi.saveConfiguration('projectConfiguration', configuration);
      alert('Configuration saved successfully!');
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
  const onLocationSelected = (state, city, district) => {
    console.log('Location selected:', { state, city, district });
    saveConfiguration();
  };

  // Handle project type change
  const handleProjectTypeChange = (type) => {
    setSelectedProjectType(type);
    setSelectedSteps([]);
  };

  // Handle row selection
  const handleRowSelect = (rowId, category, subcategory, type) => {
    setSelectedRow(rowId);
    setSelectedProjectType(type);
  };

  // Get location summary text
  const getLocationSummary = () => {
    if (!selectedState) return 'Not selected';

    let summary = selectedState;
    if (selectedCity) summary += ` > ${selectedCity}`;
    if (selectedDistrict) summary += ` > ${selectedDistrict}`;
    if (selectedDiscom) summary += ` > ${selectedDiscom}`;
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
        {/* State Selection */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Select State</h3>
          </div>
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {states.map((state) => (
                <div
                  key={state._id || state}
                  onClick={() => handleStateSelect(state)}
                  className={`bg-white border rounded-xl p-4 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedState === (state.name || state)
                    ? 'border-blue-500 border-2'
                    : 'border-gray-200 hover:border-blue-300'
                    }`}
                >
                  <h4 className="font-bold text-gray-800">{state.name || state}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* City Selection */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${citySectionVisible ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Select City</h3>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cities.map((city) => (
                  <div
                    key={city._id || city}
                    onClick={() => handleCitySelect(city)}
                    className={`bg-white border rounded-xl p-4 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedCity === (city.name || city)
                      ? 'border-blue-500 border-2'
                      : 'border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    <h4 className="font-bold text-gray-800">{city.name || city}</h4>
                    <p className="text-gray-500 text-sm mt-1">{selectedState}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* District Selection */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${districtSectionVisible ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Select District</h3>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {districts.map((district) => (
                  <div
                    key={district._id || district}
                    onClick={() => handleDistrictSelect(district)}
                    className={`bg-white border rounded-xl p-4 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedDistrict === (district.name || district)
                      ? 'border-blue-500 border-2'
                      : 'border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    <h4 className="font-bold text-gray-800">{district.name || district}</h4>
                    <p className="text-gray-500 text-sm mt-1">{selectedCity}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DISCOM Selection - Keep as is but update visibility check */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${discomSectionVisible ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Select DISCOM</h3>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {discoms.map((discom) => (
                  <div
                    key={discom.code}
                    onClick={() => handleDiscomSelect(discom.code)}
                    className={`bg-white border rounded-xl p-4 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedDiscom === discom.code
                      ? 'border-blue-500 border-2'
                      : 'border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    <h4 className="font-bold text-gray-800">{discom.code}</h4>
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